import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async processSale(data: {
    customerId?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    saveCustomer?: boolean;
    paymentMethod?: string;
    amountPaid?: number;
    sellerId?: number;
    sellerName?: string;
    items: { productId: number; quantity: number }[];
  }) {
    const items = data.items;
    if (!items || items.length === 0) {
      throw new BadRequestException('A sale must contain at least one item.');
    }

    // Atomic transaction for the entire sale
    return this.prisma.$transaction(async (tx) => {
      let totalRevenue = 0;
      let totalCogs = 0;
      let customer: any = null;

      if (data.customerId) {
        customer = await tx.customer.findUnique({ where: { id: data.customerId } });
        if (!customer) throw new BadRequestException('Customer not found.');
      } else if (data.saveCustomer && data.customerName && data.customerName !== 'Retail Customer') {
        const existingCustomer = data.customerEmail
          ? await tx.customer.findFirst({ where: { email: data.customerEmail } })
          : data.customerPhone
            ? await tx.customer.findFirst({ where: { phone: data.customerPhone } })
            : null;

        customer = existingCustomer || await tx.customer.create({
          data: {
            fullName: data.customerName,
            email: data.customerEmail || null,
            phone: data.customerPhone || null,
          }
        });
      }
      
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
        const discountRate = customer?.discountPercent ? customer.discountPercent / 100 : 0;
        const unitSellingPrice = product.sellingPrice * (1 - discountRate);
        const lineRevenue = item.quantity * unitSellingPrice;
        const lineCogs = item.quantity * product.costPrice;

        totalRevenue += lineRevenue;
        totalCogs += lineCogs;

        saleItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitSellingPrice,
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

      const paymentMethod = data.paymentMethod || 'Cash';
      const amountPaid = Number(data.amountPaid ?? totalRevenue);
      if (amountPaid < totalRevenue) {
        throw new BadRequestException('Amount paid cannot be lower than the sale total.');
      }
      const changeGiven = amountPaid - totalRevenue;
      const seller = data.sellerId
        ? await tx.user.findUnique({ where: { id: data.sellerId }, select: { fullName: true, email: true } })
        : null;

      // 3. Create Sale Header and Items
      const sale = await tx.sale.create({
        data: {
          customerId: customer?.id || null,
          customerName: customer?.fullName || data.customerName || 'Retail Customer',
          customerEmail: customer?.email || data.customerEmail || null,
          sellerId: data.sellerId || null,
          sellerName: seller?.fullName || data.sellerName || seller?.email || null,
          paymentMethod,
          amountPaid,
          changeGiven,
          totalRevenue,
          totalCogs,
          items: {
            create: saleItemsToCreate
          }
        },
        include: { items: { include: { product: true } } }
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
