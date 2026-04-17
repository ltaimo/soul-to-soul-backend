import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  private cache = new Map<string, { timestamp: number; data: any }>();
  private readonly CACHE_TTL_MS = 30000; // 30 second cache for high velocity views

  constructor(private prisma: PrismaService) {}

  async getFinancialKPIs() {
    if (this.cache.has('kpis')) {
      const entry = this.cache.get('kpis')!;
      if (Date.now() - entry.timestamp < this.CACHE_TTL_MS) {
        return entry.data;
      }
    }

    const inventory = await this.prisma.product.findMany({});
    let totalInvValue = 0;
    const invBreakdown = { Raw: 0, Packaging: 0, Finished: 0, Unknown: 0 };
    
    inventory.forEach(p => {
      if (p.stock > 0) {
        const value = p.stock * p.costPrice;
        totalInvValue += value;
        if (p.type === 'Raw') invBreakdown.Raw += value;
        else if (p.type === 'Packaging') invBreakdown.Packaging += value;
        else if (p.type === 'Finished') invBreakdown.Finished += value;
        else invBreakdown.Unknown += value;
      }
    });

    const sales = await this.prisma.sale.findMany();
    let totalRev = 0;
    let totalCogs = 0;
    const channelBreakdown = {};

    sales.forEach(s => {
      totalRev += s.totalRevenue;
      totalCogs += s.totalCogs;
      
      const ch = s.channel || 'Store';
      channelBreakdown[ch] = (channelBreakdown[ch] || 0) + s.totalRevenue;
    });

    const totalGrossProfit = totalRev - totalCogs;
    const avgProfitMargin = totalRev > 0 ? (totalGrossProfit / totalRev) * 100 : 0;

    // Time-series for sales chart
    const salesOverTime = sales.reduce((acc, sale) => {
      const d = new Date(sale.date).toISOString().split('T')[0];
      if (!acc[d]) acc[d] = { date: d, revenue: 0, cogs: 0, profit: 0 };
      acc[d].revenue += sale.totalRevenue;
      acc[d].cogs += sale.totalCogs;
      acc[d].profit += (sale.totalRevenue - sale.totalCogs);
      return acc;
    }, {});

    const result = {
      totalInventoryValue: totalInvValue,
      inventoryBreakdown: invBreakdown,
      totalRevenue: totalRev,
      totalGrossProfit: totalGrossProfit,
      avgProfitMargin: avgProfitMargin,
      channelBreakdown,
      salesTrend: Object.values(salesOverTime).sort((a: any, b: any) => a.date.localeCompare(b.date))
    };

    this.cache.set('kpis', { timestamp: Date.now(), data: result });
    return result;
  }

  async getOperationalAlerts() {
    if (this.cache.has('alerts')) {
      const entry = this.cache.get('alerts')!;
      if (Date.now() - entry.timestamp < this.CACHE_TTL_MS) {
        return entry.data;
      }
    }

    const products = await this.prisma.product.findMany({
      orderBy: { stock: 'asc' }
    });
    
    // Arbitrary threshold for prototype
    const lowStockAlerts = products.filter(p => p.stock < 50 && p.stock > 0);
    const stockOutAlerts = products.filter(p => p.stock === 0);

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringBatches = await this.prisma.inventoryBatch.findMany({
      where: { 
        expiryDate: { lte: thirtyDays, not: null },
        quantity: { gt: 0 }
      },
      include: { product: true }
    });

    const result = {
      lowStockCount: lowStockAlerts.length,
      stockOutCount: stockOutAlerts.length,
      expiringCount: expiringBatches.length,
      lowStockList: lowStockAlerts,
      stockOutList: stockOutAlerts,
      expiringList: expiringBatches
    };

    this.cache.set('alerts', { timestamp: Date.now(), data: result });
    return result;
  }
}
