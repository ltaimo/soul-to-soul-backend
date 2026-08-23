import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { calculateEarnedPoints } from './loyalty-calculator';

const toCents = (value: any) => Math.max(0, Math.round((Number(value) || 0) * 100));
const fromCents = (value: number) => Number((value / 100).toFixed(2));

const resolvePaymentStatus = (
  channel?: string,
  fulfillmentStatus?: string,
  paymentMethod = 'Cash',
) => {
  if (channel === 'Online') return 'Pending';
  if (fulfillmentStatus === 'Pending Payment') return 'Pending';
  if (paymentMethod.toLowerCase().includes('pending')) return 'Pending';
  return 'Paid';
};

const saleStatusFromPayment = (paymentStatus: string, fulfillmentStatus: string) => {
  if (paymentStatus === 'Paid') return fulfillmentStatus === 'Delivered' ? 'DELIVERED' : 'PAID';
  if (paymentStatus === 'Partial') return 'PARTIALLY_PAID';
  return 'PENDING';
};

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private getPeriodRange(period = 'today', start?: string, end?: string) {
    if (period === 'all') return null;

    const maputoOffsetMs = 2 * 60 * 60 * 1000;
    const now = new Date(Date.now() + maputoOffsetMs);
    const local = new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z');
    const day = local.getUTCDay() || 7;
    let from = new Date(local);
    let to = new Date(local);
    to.setUTCDate(to.getUTCDate() + 1);

    if (period === 'yesterday') {
      from.setUTCDate(from.getUTCDate() - 1);
      to.setUTCDate(to.getUTCDate() - 1);
    } else if (period === 'this_week') {
      from.setUTCDate(from.getUTCDate() - day + 1);
      to = new Date(from);
      to.setUTCDate(to.getUTCDate() + 7);
    } else if (period === 'last_week') {
      from.setUTCDate(from.getUTCDate() - day - 6);
      to = new Date(from);
      to.setUTCDate(to.getUTCDate() + 7);
    } else if (period === 'this_month') {
      from = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1));
      to = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1));
    } else if (period === 'last_month') {
      from = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - 1, 1));
      to = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1));
    } else if (period === 'this_year') {
      from = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
      to = new Date(Date.UTC(local.getUTCFullYear() + 1, 0, 1));
    } else if (period === 'last_year') {
      from = new Date(Date.UTC(local.getUTCFullYear() - 1, 0, 1));
      to = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
    } else if (period === 'custom' && start && end) {
      from = new Date(`${start}T00:00:00.000Z`);
      to = new Date(`${end}T00:00:00.000Z`);
      to.setUTCDate(to.getUTCDate() + 1);
    }

    return {
      from: new Date(from.getTime() - maputoOffsetMs),
      to: new Date(to.getTime() - maputoOffsetMs),
    };
  }

  private async getLoyaltyConfig(tx: any) {
    return tx.loyaltyProgramConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        earnRateCents: 20000,
        redeemRateCents: 1000,
        allowPointsCash: true,
        roundingMode: 'FLOOR',
        weekStartsOn: 'MONDAY',
      },
    });
  }

  private rewardCost(product: any, config: any, now = new Date()) {
    const promoApplies =
      product.rewardPromoPoints &&
      (!product.rewardPromoStart || product.rewardPromoStart <= now) &&
      (!product.rewardPromoEnd || product.rewardPromoEnd >= now);

    if (promoApplies) return Math.max(0, Number(product.rewardPromoPoints));
    if (product.redemptionPointsCost > 0)
      return Math.max(0, Number(product.redemptionPointsCost));

    return Math.ceil(toCents(product.sellingPrice) / config.redeemRateCents);
  }

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
    if (warehouse.status === 'Inactive')
      throw new BadRequestException('Warehouse is inactive.');
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

  private async addMovement(
    tx: any,
    customer: any,
    data: {
      saleId?: number;
      movementType: string;
      points: number;
      reason: string;
      idempotencyKey: string;
      user?: any;
      metadata?: any;
    },
  ) {
    const existing = await tx.loyaltyPointMovement.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) return existing;

    const balanceBefore = customer.loyaltyPoints || 0;
    const balanceAfter = balanceBefore + data.points;
    if (balanceAfter < 0) {
      throw new BadRequestException('Loyalty balance cannot become negative.');
    }

    const totals: any = {};
    if (data.movementType === 'EARN' || data.movementType === 'BONUS') {
      totals.loyaltyPointsEarnedTotal = { increment: Math.max(0, data.points) };
    }
    if (data.movementType === 'REDEEM') {
      totals.loyaltyPointsRedeemedTotal = { increment: Math.abs(data.points) };
    }
    if (data.movementType === 'EXPIRATION') {
      totals.loyaltyPointsExpiredTotal = { increment: Math.abs(data.points) };
    }
    if (data.movementType === 'ADMIN_ADJUSTMENT') {
      totals.loyaltyPointsAdjustedTotal = { increment: Math.abs(data.points) };
    }

    const movement = await tx.loyaltyPointMovement.create({
      data: {
        customerId: customer.id,
        saleId: data.saleId || null,
        movementType: data.movementType,
        points: data.points,
        balanceBefore,
        balanceAfter,
        reason: data.reason,
        userId: data.user?.id || null,
        userName: data.user?.fullName || data.user?.email || null,
        idempotencyKey: data.idempotencyKey,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    await tx.customer.update({
      where: { id: customer.id },
      data: { loyaltyPoints: balanceAfter, ...totals },
    });

    return movement;
  }

  async processSale(data: {
    customerId?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    saveCustomer?: boolean;
    paymentMethod?: string;
    paymentStatus?: string;
    paymentReference?: string;
    paymentProviderData?: string;
    notificationStatus?: string;
    amountPaid?: number;
    deliveryFee?: number;
    payments?: { method: string; amount: number; reference?: string }[];
    pointsToRedeem?: number;
    sellerId?: number;
    sellerName?: string;
    commercialPartnerId?: number;
    warehouseId?: number;
    channel?: string;
    orderReference?: string;
    fulfillmentStatus?: string;
    customerCode?: string;
    allowUnknownCustomerCode?: boolean;
    redeemPoints?: boolean;
    idempotencyKey?: string;
    user?: any;
    items: { productId: number; quantity: number }[];
  }) {
    const items = data.items;
    if (!items || items.length === 0) {
      throw new BadRequestException('A sale must contain at least one item.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.idempotencyKey) {
        const existingSale = await tx.sale.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
          include: { items: { include: { product: true } }, payments: true },
        });
        if (existingSale) {
          return { success: true, saleId: existingSale.id, sale: existingSale, idempotent: true };
        }
      }

      const config = await this.getLoyaltyConfig(tx);
      let grossTotalCents = 0;
      let netTotalCents = 0;
      let totalCogs = 0;
      let customer: any = null;
      let commercialPartner: any = null;

      if (data.commercialPartnerId) {
        commercialPartner = await tx.commercialPartner.findUnique({
          where: { id: data.commercialPartnerId },
        });
        if (!commercialPartner)
          throw new BadRequestException('Seller or reseller not found.');
        if (commercialPartner.status === 'Inactive')
          throw new BadRequestException('Seller or reseller is inactive.');
      }

      const saleChannel: string = ['Store', 'Online', 'Order', 'Reseller', 'WhatsApp', 'Website', 'Manual'].includes(
        data.channel || '',
      )
        ? String(data.channel)
        : commercialPartner?.defaultSaleChannel || 'Store';
      const fulfillmentStatus: string = [
        'Delivered',
        'Pending',
        'Pending Payment',
        'In Transit',
        'Pickup',
      ].includes(data.fulfillmentStatus || '')
        ? String(data.fulfillmentStatus)
        : ['Online', 'Order', 'Website', 'WhatsApp'].includes(saleChannel || '')
          ? 'Pending'
          : 'Delivered';
      const warehouse = await this.getWarehouse(
        tx,
        data.warehouseId || commercialPartner?.warehouseId,
      );

      const identity = data.customerCode?.trim();
      if (identity && !data.customerId) {
        customer = await tx.customer.findFirst({
          where: {
            OR: [{ customerCode: identity }, { phone: identity }, { email: identity }],
          },
        });
        if (!customer && !data.allowUnknownCustomerCode)
          throw new BadRequestException('Customer code not found.');
      }

      if (!customer && data.customerId) {
        customer = await tx.customer.findUnique({ where: { id: data.customerId } });
        if (!customer) throw new BadRequestException('Customer not found.');
      }

      if (
        !customer &&
        data.saveCustomer &&
        data.customerName &&
        data.customerName !== 'Retail Customer'
      ) {
        const existingCustomer = data.customerEmail
          ? await tx.customer.findFirst({ where: { email: data.customerEmail } })
          : data.customerPhone
            ? await tx.customer.findFirst({ where: { phone: data.customerPhone } })
            : null;

        customer =
          existingCustomer ||
          (await tx.customer.create({
            data: {
              fullName: data.customerName,
              email: data.customerEmail || null,
              phone: data.customerPhone || null,
            },
          }));

        if (!customer.customerCode) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { customerCode: `CUST-${String(customer.id).padStart(5, '0')}` },
          });
        }
      }

      const saleItemsToCreate: any[] = [];
      const rewardLines: Array<{ index: number; maxPoints: number; netLineCents: number }> = [];

      for (const [index, item] of items.entries()) {
        if (item.quantity <= 0) {
          throw new BadRequestException(
            `Quantity for product ${item.productId} must be positive.`,
          );
        }

        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new BadRequestException(`Product ID ${item.productId} not found.`);

        const warehouseStock = await this.ensureWarehouseStock(tx, warehouse.id, product);
        if (warehouseStock.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name} in ${warehouse.name}. Needed: ${item.quantity}, Available: ${warehouseStock.quantity}`,
          );
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient consolidated stock for ${product.name}. Needed: ${item.quantity}, Available: ${product.stock}`,
          );
        }

        const discountRate = customer?.discountPercent ? customer.discountPercent / 100 : 0;
        const grossLineCents = toCents(product.sellingPrice * item.quantity);
        const discountCents = Math.round(grossLineCents * discountRate);
        const netLineCents = Math.max(0, grossLineCents - discountCents);
        const lineCogs = item.quantity * product.costPrice;
        const lineRewardCost =
          product.rewardEligible !== false && product.rewardActive !== false
            ? this.rewardCost(product, config) * item.quantity
            : 0;

        grossTotalCents += grossLineCents;
        netTotalCents += netLineCents;
        totalCogs += lineCogs;

        saleItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitSellingPrice: fromCents(Math.round(netLineCents / item.quantity)),
          unitCogs: product.costPrice,
          loyaltyPointsEarned: 0,
          redemptionPointsCost: lineRewardCost,
          grossLineCents,
          discountCents,
          netLineCents,
          pointsRedeemed: 0,
          pointsValueCents: 0,
          eligiblePaidCents: netLineCents,
        });
        rewardLines.push({ index, maxPoints: lineRewardCost, netLineCents });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.warehouseStock.update({
          where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } },
          data: { quantity: { decrement: item.quantity } },
        });
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
          },
        });
      }

      const requestedPoints = Math.max(0, Number(data.pointsToRedeem) || 0);
      const paymentMethod = data.paymentMethod || (requestedPoints > 0 ? 'Mixed' : 'Cash');
      const wantsPoints = Boolean(data.redeemPoints || requestedPoints > 0 || paymentMethod === 'Points');
      let pointsRedeemed = 0;
      let pointsValueCents = 0;
      if (wantsPoints) {
        if (!customer) {
          throw new BadRequestException('A loyal customer is required to redeem points.');
        }
        const maxConfiguredPoints = rewardLines.reduce((sum, line) => sum + line.maxPoints, 0);
        if (maxConfiguredPoints <= 0) {
          throw new BadRequestException('No selected products are eligible for point redemption.');
        }
        const desiredPoints =
          requestedPoints > 0
            ? requestedPoints
            : paymentMethod === 'Points'
              ? maxConfiguredPoints
              : Math.min(customer.loyaltyPoints || 0, maxConfiguredPoints);
        pointsRedeemed = Math.min(desiredPoints, maxConfiguredPoints, customer.loyaltyPoints || 0);
        pointsValueCents = Math.min(netTotalCents, pointsRedeemed * config.redeemRateCents);
        if (pointsRedeemed <= 0) {
          throw new BadRequestException('Customer does not have points available for redemption.');
        }
        if (paymentMethod === 'Points' && pointsValueCents < netTotalCents && !config.allowPointsCash) {
          throw new BadRequestException('Points plus cash is disabled.');
        }
      }

      let remainingPointValue = pointsValueCents;
      for (const line of rewardLines) {
        if (remainingPointValue <= 0) break;
        const linePoints = Math.min(
          saleItemsToCreate[line.index].redemptionPointsCost,
          Math.floor(Math.min(remainingPointValue, line.netLineCents) / config.redeemRateCents),
        );
        const lineValue = linePoints * config.redeemRateCents;
        saleItemsToCreate[line.index].pointsRedeemed = linePoints;
        saleItemsToCreate[line.index].pointsValueCents = lineValue;
        saleItemsToCreate[line.index].eligiblePaidCents = Math.max(0, line.netLineCents - lineValue);
        remainingPointValue -= lineValue;
      }

      const deliveryFeeCents = toCents(data.deliveryFee);
      const payableCents = Math.max(0, netTotalCents - pointsValueCents + deliveryFeeCents);
      const cashPayments =
        Array.isArray(data.payments) && data.payments.length
          ? data.payments.map((payment) => ({
              method: payment.method || 'Cash',
              amountCents: toCents(payment.amount),
              reference: payment.reference || null,
            }))
          : [
              {
                method: paymentMethod === 'Points' ? 'Cash' : paymentMethod,
                amountCents: toCents(data.amountPaid ?? payableCents / 100),
                reference: data.paymentReference || null,
              },
            ];
      const amountPaidCents = cashPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
      const paymentStatus: string = ['Paid', 'Pending', 'Failed', 'Manual Review', 'Partial'].includes(
        data.paymentStatus || '',
      )
        ? String(data.paymentStatus)
        : resolvePaymentStatus(saleChannel, fulfillmentStatus, paymentMethod);
      const allowsPendingPayment =
        paymentStatus !== 'Paid' ||
        (saleChannel === 'Online' &&
          (fulfillmentStatus === 'Pending Payment' || paymentMethod.toLowerCase().includes('pending')));
      if (!allowsPendingPayment && amountPaidCents < payableCents) {
        throw new BadRequestException('Amount paid cannot be lower than the sale total.');
      }
      const changeGivenCents = Math.max(0, amountPaidCents - payableCents);
      const eligiblePaidCents = paymentStatus === 'Paid' ? Math.max(0, netTotalCents - pointsValueCents) : 0;
      const priorResidual = customer?.loyaltyResidualCents || 0;
      const earned = calculateEarnedPoints(
        customer ? eligiblePaidCents : 0,
        priorResidual,
        config.earnRateCents,
      );
      const pointsEarned = customer ? earned.pointsEarned : 0;
      const newResidual = customer ? earned.newResidualCents : priorResidual;

      const seller = data.sellerId
        ? await tx.user.findUnique({
            where: { id: data.sellerId },
            select: { fullName: true, email: true },
          })
        : null;
      const commissionRate = Number(commercialPartner?.commissionRate) || 0;
      const totalRevenue = fromCents(netTotalCents - pointsValueCents);
      const commissionAmount = totalRevenue * (commissionRate / 100);
      const status = saleStatusFromPayment(paymentStatus, fulfillmentStatus);

      const sale = await tx.sale.create({
        data: {
          customerId: customer?.id || null,
          customerName: customer?.fullName || data.customerName || 'Retail Customer',
          customerEmail: customer?.email || data.customerEmail || null,
          customerPhone: customer?.phone || data.customerPhone || null,
          deliveryAddress: data.deliveryAddress?.trim() || null,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          commercialPartnerId: commercialPartner?.id || null,
          sellerId: data.sellerId || null,
          sellerName:
            commercialPartner?.name ||
            seller?.fullName ||
            data.sellerName ||
            seller?.email ||
            null,
          sellerType: commercialPartner?.type || null,
          commissionRate,
          commissionAmount,
          channel: saleChannel,
          orderReference: data.orderReference?.trim() || null,
          fulfillmentStatus,
          paymentMethod,
          paymentStatus,
          paymentReference: data.paymentReference?.trim() || null,
          paymentProviderData: data.paymentProviderData || null,
          notificationStatus: data.notificationStatus || 'Not Required',
          amountPaid: fromCents(amountPaidCents),
          amountPaidCents,
          changeGiven: fromCents(changeGivenCents),
          changeGivenCents,
          discountCents: grossTotalCents - netTotalCents,
          deliveryFeeCents,
          grossTotalCents,
          netTotalCents,
          eligiblePaidCents,
          pointsValueCents,
          idempotencyKey: data.idempotencyKey || null,
          status,
          pointsEarned,
          pointsRedeemed,
          totalRevenue,
          totalCogs,
          items: { create: saleItemsToCreate },
          payments: {
            create: cashPayments
              .filter((payment) => payment.amountCents > 0)
              .map((payment, index) => ({
                method: payment.method,
                amountCents: payment.amountCents,
                reference: payment.reference,
                providerData: index === 0 ? data.paymentProviderData || null : null,
                status: paymentStatus === 'Paid' ? 'PAID' : paymentStatus.toUpperCase(),
                idempotencyKey: data.idempotencyKey ? `${data.idempotencyKey}:payment:${index}` : null,
              })),
          },
        },
        include: {
          warehouse: true,
          commercialPartner: true,
          items: { include: { product: true } },
          payments: true,
        },
      });

      if (customer) {
        let currentCustomer = customer;
        if (pointsRedeemed > 0) {
          const updated = await tx.customer.updateMany({
            where: { id: customer.id, loyaltyPoints: { gte: pointsRedeemed } },
            data: { loyaltyPoints: { decrement: pointsRedeemed } },
          });
          if (updated.count !== 1) {
            throw new BadRequestException('Insufficient loyalty points.');
          }
          currentCustomer = await tx.customer.findUnique({ where: { id: customer.id } });
          await tx.loyaltyPointMovement.create({
            data: {
              customerId: customer.id,
              saleId: sale.id,
              movementType: 'REDEEM',
              points: -pointsRedeemed,
              balanceBefore: customer.loyaltyPoints || 0,
              balanceAfter: currentCustomer.loyaltyPoints || 0,
              reason: `Sale #${sale.id} redemption`,
              userId: data.user?.id || null,
              userName: data.user?.fullName || data.user?.email || null,
              idempotencyKey: `${data.idempotencyKey || `sale-${sale.id}`}:redeem`,
              metadata: JSON.stringify({ pointsValueCents }),
            },
          });
          await tx.customer.update({
            where: { id: customer.id },
            data: { loyaltyPointsRedeemedTotal: { increment: pointsRedeemed } },
          });
        }

        currentCustomer = await tx.customer.findUnique({ where: { id: customer.id } });
        if (pointsEarned > 0) {
          await this.addMovement(tx, currentCustomer, {
            saleId: sale.id,
            movementType: 'EARN',
            points: pointsEarned,
            reason: `Sale #${sale.id} eligible paid value`,
            idempotencyKey: `${data.idempotencyKey || `sale-${sale.id}`}:earn`,
            user: data.user,
            metadata: { eligiblePaidCents, priorResidual, newResidual },
          });
        }
        await tx.customer.update({
          where: { id: customer.id },
          data: { loyaltyResidualCents: newResidual },
        });
      }

      return {
        success: true,
        saleId: sale.id,
        pointsEarned,
        pointsRedeemed,
        loyaltyResidualCents: newResidual,
        marginGiven:
          totalRevenue > 0
            ? (((totalRevenue - totalCogs) / totalRevenue) * 100).toFixed(1)
            : 0,
        sale,
      };
    });
  }

  async cancelSale(id: number, user?: any) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id }, include: { customer: true } });
      if (!sale) throw new NotFoundException('Sale not found.');
      if (sale.status === 'CANCELLED' || sale.loyaltyReversedAt) {
        return { success: true, sale, idempotent: true };
      }

      if (sale.customer) {
        let customer = sale.customer;
        if (sale.pointsEarned > 0) {
          const updated = await tx.customer.updateMany({
            where: { id: customer.id, loyaltyPoints: { gte: sale.pointsEarned } },
            data: { loyaltyPoints: { decrement: sale.pointsEarned } },
          });
          if (updated.count !== 1) {
            throw new BadRequestException('Cannot reverse earned points without making the balance negative.');
          }
          const after = await tx.customer.findUnique({ where: { id: customer.id } });
          if (!after) throw new BadRequestException('Customer not found after reversal.');
          await tx.loyaltyPointMovement.create({
            data: {
              customerId: customer.id,
              saleId: sale.id,
              movementType: 'REVERSAL',
              points: -sale.pointsEarned,
              balanceBefore: customer.loyaltyPoints || 0,
              balanceAfter: after.loyaltyPoints || 0,
              reason: `Cancellation of sale #${sale.id}`,
              userId: user?.id || null,
              userName: user?.fullName || user?.email || null,
              idempotencyKey: `sale-${sale.id}:cancel-earned`,
            },
          });
          customer = after;
        }
        if (sale.pointsRedeemed > 0) {
          await this.addMovement(tx, customer, {
            saleId: sale.id,
            movementType: 'REFUND',
            points: sale.pointsRedeemed,
            reason: `Refund points from cancelled sale #${sale.id}`,
            idempotencyKey: `sale-${sale.id}:cancel-redeemed`,
            user,
          });
        }
      }

      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          fulfillmentStatus: 'Cancelled',
          paymentStatus: 'Cancelled',
          loyaltyReversedAt: new Date(),
        },
      });

      return { success: true, sale: updatedSale };
    });
  }

  async getRecentSales() {
    return this.prisma.sale.findMany({
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        warehouse: true,
        commercialPartner: true,
        payments: true,
        items: { include: { product: true } },
      },
    });
  }

  async getSalesReport(filters: { period?: string; start?: string; end?: string }) {
    const range = this.getPeriodRange(filters.period || 'today', filters.start, filters.end);
    const sales = await this.prisma.sale.findMany({
      where: range ? { date: { gte: range.from, lt: range.to } } : {},
      orderBy: { date: 'asc' },
      include: {
        warehouse: true,
        commercialPartner: true,
        payments: true,
        items: { include: { product: true } },
      },
    });

    const summary = sales.reduce(
      (acc, sale: any) => {
        const revenue = Number(sale.totalRevenue) || 0;
        const cogs = Number(sale.totalCogs) || 0;
        const delivery = ((sale.deliveryFeeCents || 0) / 100) || 0;
        const paid = Number(sale.amountPaid) || 0;

        acc.saleCount += 1;
        acc.units += sale.items.reduce((sum, item) => sum + item.quantity, 0);
        acc.totalRevenue += revenue;
        acc.totalCogs += cogs;
        acc.grossProfit += revenue - cogs;
        acc.deliveryFees += delivery;
        acc.amountPaid += paid;
        acc.pointsEarned += sale.pointsEarned || 0;
        acc.pointsRedeemed += sale.pointsRedeemed || 0;
        if (['PAID', 'DELIVERED'].includes(sale.status || '')) acc.paidSaleCount += 1;
        if (sale.status === 'PENDING') acc.pendingSaleCount += 1;
        if (sale.status === 'CANCELLED') acc.cancelledSaleCount += 1;
        return acc;
      },
      {
        saleCount: 0,
        paidSaleCount: 0,
        pendingSaleCount: 0,
        cancelledSaleCount: 0,
        units: 0,
        totalRevenue: 0,
        totalCogs: 0,
        grossProfit: 0,
        deliveryFees: 0,
        amountPaid: 0,
        pointsEarned: 0,
        pointsRedeemed: 0,
      },
    );

    return {
      period: {
        key: filters.period || 'today',
        from: range?.from || null,
        to: range?.to || null,
        timezone: 'Africa/Maputo',
      },
      summary: {
        ...summary,
        averageTicket: summary.saleCount ? summary.totalRevenue / summary.saleCount : 0,
        grossMargin: summary.totalRevenue ? (summary.grossProfit / summary.totalRevenue) * 100 : 0,
      },
      sales,
    };
  }
}
