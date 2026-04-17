import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async processSale(customerName: string, items: { productId: number; quantity: number }[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('A sale must contain at least one item.');
    }

    // Atomic transaction for the entire sale
    return this.prisma.$transaction(async (tx) => {
      let totalRevenue = 0;
      let totalCogs = 0;
      
      const saleItemsToCreate: any[] = [];

      for (const item of items) {
        if (item.quantity <= 0) {
          throw new BadRequestException(`Quantity for product ${item.productId} must be positive.`);
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new BadRequestException(`Product ID ${item.productId} not found.`);
        }

        // STRICT ZERO-BOUND CONSTRAINT: reject if stock drops below 0
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}. Needed: ${item.quantity}, Available: ${product.stock}`);
        }

        // Calculate line financial metrics based on LOCKED selling and cost price
        const lineRevenue = item.quantity * product.sellingPrice;
        const lineCogs = item.quantity * product.costPrice;

        totalRevenue += lineRevenue;
        totalCogs += lineCogs;

        saleItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitSellingPrice: product.sellingPrice,
          unitCogs: product.costPrice // COGS statically locked at time of sale!
        });

        // 1. Deduct Product Stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } }
        });

        // 2. Log StockMovement
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: -item.quantity,
            movementType: 'SALE_OUTBOUND',
            unitCost: product.costPrice
          }
        });
      }

      // 3. Create Sale Header and Items
      const sale = await tx.sale.create({
        data: {
          customerName: customerName || 'Retail Customer',
          totalRevenue,
          totalCogs,
          items: {
            create: saleItemsToCreate
          }
        },
        include: { items: true }
      });

      return {
        success: true,
        saleId: sale.id,
        marginGiven: totalRevenue > 0 ? (((totalRevenue - totalCogs) / totalRevenue) * 100).toFixed(1) : 0,
        sale
      };
    });
  }

  async getRecentSales() {
    return this.prisma.sale.findMany({
      orderBy: { date: 'desc' },
      take: 50,
      include: { items: { include: { product: true } } }
    });
  }
}
