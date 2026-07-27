import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private async ensureDefaultWarehouse(tx: any) {
    let warehouse = await tx.warehouse.findFirst({
      where: { isDefault: true },
      orderBy: { id: 'asc' },
    });

    if (!warehouse) {
      warehouse = await tx.warehouse.upsert({
        where: { code: 'MAIN' },
        update: { isDefault: true, status: 'Active' },
        create: {
          code: 'MAIN',
          name: 'Soul2Soul Baia Mall',
          type: 'Shop',
          status: 'Active',
          isDefault: true,
        },
      });
    }

    return warehouse;
  }

  private async getWarehouse(tx: any, warehouseId?: number) {
    if (!warehouseId) return this.ensureDefaultWarehouse(tx);
    const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new BadRequestException('Warehouse not found.');
    if (warehouse.status === 'Inactive') throw new BadRequestException('Warehouse is inactive.');
    return warehouse;
  }

  private async ensureWarehouseStock(tx: any, warehouseId: number, product: any) {
    return tx.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId, productId: product.id } },
      update: {},
      create: {
        warehouseId,
        productId: product.id,
        quantity: product.stock || 0,
        minStock: product.minStock || 0,
      },
    });
  }

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
    warehouseId?: number;
    customerCode?: string;
    redeemPoints?: boolean;
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
      const warehouse = await this.getWarehouse(tx, data.warehouseId);

      if (data.customerCode && !data.customerId) {
        customer = await tx.customer.findFirst({
          where: {
            OR: [
              { customerCode: data.customerCode.trim() },
              { phone: data.customerCode.trim() },
              { email: data.customerCode.trim() },
            ],
          },
        });
        if (!customer) throw new BadRequestException('Customer code not found.');
      } else if (data.customerId) {
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

        if (!customer.customerCode) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { customerCode: `CUST-${String(customer.id).padStart(5, '0')}` },
          });
        }
      }
      
      const saleItemsToCreate: any[] = [];
      let pointsEarned = 0;
      let pointsRedeemed = 0;

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

        const warehouseStock = await this.ensureWarehouseStock(tx, warehouse.id, product);

        if (warehouseStock.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name} in ${warehouse.name}. Needed: ${item.quantity}, Available: ${warehouseStock.quantity}`,
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient consolidated stock for ${product.name}. Needed: ${item.quantity}, Available: ${product.stock}`);
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
          unitCogs: product.costPrice,
          loyaltyPointsEarned: product.loyaltyPointsEarned * item.quantity,
          redemptionPointsCost: product.redemptionPointsCost * item.quantity,
        });

        pointsEarned += product.loyaltyPointsEarned * item.quantity;
        pointsRedeemed += product.redemptionPointsCost * item.quantity;

        // 1. Deduct Product Stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } }
        });

        await tx.warehouseStock.update({
          where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } },
          data: { quantity: { decrement: item.quantity } },
        });

        // 2. Log StockMovement
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: -item.quantity,
            movementType: 'SALE_OUTBOUND',
            unitCost: product.costPrice,
            responsibleId: data.sellerId || null,
            responsibleName: data.sellerName || null,
            reference: `Sale from ${warehouse.name}`,
          }
        });
      }

      const paymentMethod = data.paymentMethod || 'Cash';
      const payingWithPoints = data.redeemPoints || paymentMethod === 'Points';
      if (payingWithPoints) {
        if (!customer) throw new BadRequestException('A loyal customer is required to pay with points.');
        if (pointsRedeemed <= 0) throw new BadRequestException('One or more products do not have redemption points configured.');
        if ((customer.loyaltyPoints || 0) < pointsRedeemed) {
          throw new BadRequestException(`Insufficient loyalty points. Needed: ${pointsRedeemed}, Available: ${customer.loyaltyPoints || 0}`);
        }
        totalRevenue = 0;
        pointsEarned = 0;
      }

      const amountPaid = payingWithPoints ? 0 : Number(data.amountPaid ?? totalRevenue);
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
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          sellerId: data.sellerId || null,
          sellerName: seller?.fullName || data.sellerName || seller?.email || null,
          paymentMethod,
          amountPaid,
          changeGiven,
          pointsEarned,
          pointsRedeemed: payingWithPoints ? pointsRedeemed : 0,
          totalRevenue,
          totalCogs,
          items: {
            create: saleItemsToCreate
          }
        },
        include: { warehouse: true, items: { include: { product: true } } }
      });

      if (customer) {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            loyaltyPoints: payingWithPoints
              ? { decrement: pointsRedeemed }
              : { increment: pointsEarned },
          },
        });
      }

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
      include: { warehouse: true, items: { include: { product: true } } }
    });
  }
}
