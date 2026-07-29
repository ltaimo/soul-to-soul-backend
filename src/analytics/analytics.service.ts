import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

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
}
