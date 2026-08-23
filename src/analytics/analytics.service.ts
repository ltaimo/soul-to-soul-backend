import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private cents(value: number) {
    return Math.round((Number(value) || 0) * 100);
  }

  private getPeriodRange(period = 'today', start?: string, end?: string) {
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

  async getFinancialKPIs() {
    const [
      inventory,
      warehouseStock,
      warehouses,
      transfers,
      customers,
      commercialPartners,
      employees,
      pendingPayments,
      openGoals,
      overdueGoals,
      auditLogs,
    ] = await Promise.all([
      this.prisma.product.findMany({ where: { status: 'Active' } }),
      this.prisma.warehouseStock.findMany({
        where: {
          product: { status: 'Active' },
          warehouse: { status: 'Active' },
        },
        include: { product: true, warehouse: true },
      }),
      this.prisma.warehouse.findMany({}),
      this.prisma.stockTransfer.findMany({ include: { items: true } }),
      this.prisma.customer.findMany({}),
      this.prisma.commercialPartner.findMany({}),
      this.prisma.employee.findMany({}),
      this.prisma.hrPayment.findMany({ where: { status: 'Pending' } }),
      this.prisma.workGoal.count({
        where: { status: { in: ['Pending', 'In Progress'] } },
      }),
      this.prisma.workGoal.count({
        where: {
          status: { in: ['Pending', 'In Progress'] },
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);
    let totalInvValue = 0;
    const invBreakdown = {
      'Raw Material': 0,
      Packaging: 0,
      'Finished Good': 0,
      Other: 0,
    };

    warehouseStock.forEach((row) => {
      const p = row.product;
      if (row.quantity > 0) {
        const value = row.quantity * p.costPrice;
        totalInvValue += value;
        if (p.type === 'Raw Material' || p.type === 'Raw')
          invBreakdown['Raw Material'] += value;
        else if (p.type === 'Packaging') invBreakdown.Packaging += value;
        else if (p.type === 'Finished Good' || p.type === 'Finished')
          invBreakdown['Finished Good'] += value;
        else invBreakdown.Other += value;
      }
    });

    const sales = await this.prisma.sale.findMany();
    let totalRev = 0;
    let totalCogs = 0;
    const channelBreakdown = {};

    sales.forEach((s) => {
      totalRev += s.totalRevenue;
      totalCogs += s.totalCogs;

      const ch = s.channel || 'Store';
      channelBreakdown[ch] = (channelBreakdown[ch] || 0) + s.totalRevenue;
    });

    const totalGrossProfit = totalRev - totalCogs;
    const avgProfitMargin =
      totalRev > 0 ? (totalGrossProfit / totalRev) * 100 : 0;
    const inTransitTransfers = transfers.filter(
      (transfer) => transfer.status === 'In Transit',
    );
    const transferUnitsInTransit = inTransitTransfers.reduce(
      (sum, transfer) =>
        sum +
        transfer.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const pendingPaymentsValue = pendingPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    const activeEmployees = employees.filter(
      (employee) => employee.status === 'Active',
    );
    const activePartners = commercialPartners.filter(
      (partner) => partner.status === 'Active',
    );
    const commissionPayable = sales.reduce(
      (sum, sale: any) => sum + (sale.commissionAmount || 0),
      0,
    );
    const loyaltyPointsIssued = customers.reduce(
      (sum, customer) => sum + (customer.loyaltyPoints || 0),
      0,
    );
    const today = new Date().toISOString().slice(0, 10);
    const auditEventsToday = await this.prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(`${today}T00:00:00.000Z`),
        },
      },
    });

    const warehouseValueMap = warehouseStock.reduce((acc, row) => {
      const name = row.warehouse?.name || 'Unassigned';
      acc[name] = (acc[name] || 0) + row.quantity * row.product.costPrice;
      return acc;
    }, {});

    // Time-series for sales chart
    const salesOverTime = sales.reduce((acc, sale) => {
      const d = new Date(sale.date).toISOString().split('T')[0];
      if (!acc[d]) acc[d] = { date: d, revenue: 0, cogs: 0, profit: 0 };
      acc[d].revenue += sale.totalRevenue;
      acc[d].cogs += sale.totalCogs;
      acc[d].profit += sale.totalRevenue - sale.totalCogs;
      return acc;
    }, {});

    return {
      totalInventoryValue: totalInvValue,
      inventoryBreakdown: invBreakdown,
      totalRevenue: totalRev,
      totalGrossProfit: totalGrossProfit,
      avgProfitMargin: avgProfitMargin,
      productCount: inventory.length,
      warehouseCount: warehouses.length,
      activeWarehouseCount: warehouses.filter(
        (warehouse) => warehouse.status === 'Active',
      ).length,
      totalWarehouseUnits: warehouseStock.reduce(
        (sum, row) => sum + row.quantity,
        0,
      ),
      inTransitTransferCount: inTransitTransfers.length,
      transferUnitsInTransit,
      activeEmployees: activeEmployees.length,
      monthlyPayroll: activeEmployees.reduce(
        (sum, employee) => sum + employee.salary,
        0,
      ),
      pendingPaymentsValue,
      openGoals,
      overdueGoals,
      loyaltyCustomerCount: customers.filter(
        (customer) => customer.status !== 'Inactive',
      ).length,
      loyaltyPointsIssued,
      loyaltyPointsValue: loyaltyPointsIssued * 10,
      activeCommercialPartners: activePartners.length,
      commissionPayable,
      auditEventsToday,
      channelBreakdown,
      warehouseValueBreakdown: Object.entries(warehouseValueMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 6),
      recentActivity: auditLogs,
      salesTrend: Object.values(salesOverTime).sort((a: any, b: any) =>
        a.date.localeCompare(b.date),
      ),
    };
  }

  async getOperationalAlerts() {
    const [products, warehouseRows, inTransitTransfers, pendingPayments, overdueGoals] =
      await Promise.all([
        this.prisma.product.findMany({
          where: { status: 'Active' },
          orderBy: { stock: 'asc' },
        }),
        this.prisma.warehouseStock.findMany({
          where: {
            product: { status: 'Active' },
            warehouse: { status: 'Active' },
          },
          include: { product: true, warehouse: true },
        }),
        this.prisma.stockTransfer.findMany({
          where: { status: 'In Transit' },
          include: {
            items: true,
            sourceWarehouse: true,
            destinationWarehouse: true,
          },
        }),
        this.prisma.hrPayment.findMany({ where: { status: 'Pending' } }),
        this.prisma.workGoal.count({
          where: {
            status: { in: ['Pending', 'In Progress'] },
            dueDate: { lt: new Date() },
          },
        }),
      ]);
    const lowStockAlerts = warehouseRows.filter(
      (row) =>
        row.quantity > 0 && row.minStock > 0 && row.quantity <= row.minStock,
    );
    const stockOutAlerts = products.filter((product) => product.stock === 0);
    const inTransitUnits = inTransitTransfers.reduce(
      (sum, transfer) =>
        sum +
        transfer.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringBatches = await this.prisma.inventoryBatch.findMany({
      where: {
        expiryDate: { lte: thirtyDays, not: null },
        quantity: { gt: 0 },
      },
      include: { product: true },
    });

    return {
      lowStockCount: lowStockAlerts.length,
      stockOutCount: stockOutAlerts.length,
      expiringCount: expiringBatches.length,
      inTransitTransferCount: inTransitTransfers.length,
      inTransitUnits,
      pendingPaymentCount: pendingPayments.length,
      pendingPaymentValue: pendingPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      ),
      overdueGoals,
      lowStockList: lowStockAlerts,
      stockOutList: stockOutAlerts,
      expiringList: expiringBatches,
      inTransitList: inTransitTransfers,
      productCount: products.length,
    };
  }

  async getSalesDashboard(filters: { period?: string; start?: string; end?: string }) {
    const range = this.getPeriodRange(filters.period, filters.start, filters.end);
    const sales = await this.prisma.sale.findMany({
      where: { date: { gte: range.from, lt: range.to } },
      include: { items: { include: { product: true } }, payments: true, customer: true },
    });
    const paidSales = sales.filter((sale) => ['PAID', 'DELIVERED'].includes(sale.status || ''));
    const activeSales = paidSales.filter((sale) => !['CANCELLED', 'RETURNED'].includes(sale.status || ''));
    const units = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const netPaidCents = activeSales.reduce((sum, sale: any) => sum + (sale.eligiblePaidCents || this.cents(sale.totalRevenue)), 0);
    const grossCents = sales.reduce((sum, sale: any) => sum + (sale.grossTotalCents || this.cents(sale.totalRevenue)), 0);
    const discountsCents = sales.reduce((sum, sale: any) => sum + (sale.discountCents || 0), 0);
    const deliveryCents = sales.reduce((sum, sale: any) => sum + (sale.deliveryFeeCents || 0), 0);
    const pointsIssued = sales.reduce((sum, sale) => sum + (sale.pointsEarned || 0), 0);
    const pointsRedeemed = sales.reduce((sum, sale) => sum + (sale.pointsRedeemed || 0), 0);
    const globalPoints = await this.prisma.customer.aggregate({ _sum: { loyaltyPoints: true } });
    const newCustomers = await this.prisma.customer.count({
      where: { createdAt: { gte: range.from, lt: range.to } },
    });
    const newVipCustomers = await this.prisma.customer.count({
      where: {
        createdAt: { gte: range.from, lt: range.to },
        loyaltyTier: { in: ['VIP', 'Gold'] },
      },
    });

    const productRows = new Map<string, any>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = String(item.productId);
        const current = productRows.get(key) || {
          productId: item.productId,
          productName: item.product?.name || `Product #${item.productId}`,
          category: item.product?.category || '-',
          quantity: 0,
          revenueCents: 0,
          pointsRedeemed: 0,
        };
        current.quantity += item.quantity;
        current.revenueCents += (item as any).eligiblePaidCents || this.cents(item.quantity * item.unitSellingPrice);
        current.pointsRedeemed += (item as any).pointsRedeemed || 0;
        productRows.set(key, current);
      }
    }

    return {
      period: { from: range.from, to: range.to, timezone: 'Africa/Maputo' },
      grossSales: grossCents / 100,
      netSales: netPaidCents / 100,
      saleCount: sales.length,
      paidSaleCount: activeSales.length,
      unitsSold: units,
      averageTicket: activeSales.length ? netPaidCents / 100 / activeSales.length : 0,
      discounts: discountsCents / 100,
      returns: sales.filter((sale) => sale.status === 'RETURNED').length,
      cancellations: sales.filter((sale) => sale.status === 'CANCELLED').length,
      deliveryCharged: deliveryCents / 100,
      paymentsReceived: sales.reduce((sum, sale: any) => sum + (sale.amountPaidCents || this.cents(sale.amountPaid)), 0) / 100,
      pointsIssued,
      pointsRedeemed,
      globalPointBalance: globalPoints._sum.loyaltyPoints || 0,
      globalPointValue: ((globalPoints._sum.loyaltyPoints || 0) * 1000) / 100,
      newCustomers,
      newVipCustomers,
      products: Array.from(productRows.values()).sort((a, b) => b.quantity - a.quantity),
    };
  }

  async getSellerRanking(filters: { period?: string; start?: string; end?: string }) {
    const range = this.getPeriodRange(filters.period, filters.start, filters.end);
    const sales = await this.prisma.sale.findMany({
      where: {
        date: { gte: range.from, lt: range.to },
        status: { in: ['PAID', 'DELIVERED'] },
      },
      include: { items: true },
    });
    const rows = new Map<string, any>();
    for (const sale of sales) {
      const key = String(sale.sellerId || sale.sellerName || 'unassigned');
      const current = rows.get(key) || {
        sellerId: sale.sellerId,
        sellerName: sale.sellerName || 'Unassigned',
        sales: 0,
        netPaidCents: 0,
        grossCents: 0,
        units: 0,
        discountsCents: 0,
        cancellations: 0,
        returns: 0,
      };
      current.sales += 1;
      current.netPaidCents += (sale as any).eligiblePaidCents || this.cents(sale.totalRevenue);
      current.grossCents += (sale as any).grossTotalCents || this.cents(sale.totalRevenue);
      current.discountsCents += (sale as any).discountCents || 0;
      current.units += sale.items.reduce((sum, item) => sum + item.quantity, 0);
      rows.set(key, current);
    }
    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        netPaid: row.netPaidCents / 100,
        gross: row.grossCents / 100,
        discounts: row.discountsCents / 100,
        averageTicket: row.sales ? row.netPaidCents / 100 / row.sales : 0,
      }))
      .sort((a, b) => b.netPaidCents - a.netPaidCents || b.sales - a.sales || b.averageTicket - a.averageTicket);
  }

  async createSellerGoal(data: any) {
    const goal = await this.prisma.sellerGoal.create({
      data: {
        sellerId: Number(data.sellerId),
        sellerName: data.sellerName || null,
        period: data.period || 'MONTHLY',
        targetCents: Math.max(0, this.cents(data.target || data.targetMt)),
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        status: data.status || 'Active',
      },
    });
    return { success: true, goal };
  }

  async listSellerGoals() {
    return this.prisma.sellerGoal.findMany({ orderBy: { startsAt: 'desc' } });
  }

  async createBonusRule(data: any) {
    const rule = await this.prisma.bonusRule.create({
      data: {
        name: data.name,
        period: data.period || 'MONTHLY',
        eligiblePosition: data.eligiblePosition ? Number(data.eligiblePosition) : null,
        minimumTargetCents: data.minimumTarget ? this.cents(data.minimumTarget) : null,
        bonusValueCents: this.cents(data.bonusValue),
        bonusType: data.bonusType || 'FIXED',
        criteriaJson: data.criteria ? JSON.stringify(data.criteria) : null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        status: data.status || 'Active',
      },
    });
    return { success: true, rule };
  }

  async listBonusRules() {
    return this.prisma.bonusRule.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
