"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    cache = new Map();
    CACHE_TTL_MS = 30000;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFinancialKPIs() {
        if (this.cache.has('kpis')) {
            const entry = this.cache.get('kpis');
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
                if (p.type === 'Raw')
                    invBreakdown.Raw += value;
                else if (p.type === 'Packaging')
                    invBreakdown.Packaging += value;
                else if (p.type === 'Finished')
                    invBreakdown.Finished += value;
                else
                    invBreakdown.Unknown += value;
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
        const salesOverTime = sales.reduce((acc, sale) => {
            const d = new Date(sale.date).toISOString().split('T')[0];
            if (!acc[d])
                acc[d] = { date: d, revenue: 0, cogs: 0, profit: 0 };
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
            salesTrend: Object.values(salesOverTime).sort((a, b) => a.date.localeCompare(b.date))
        };
        this.cache.set('kpis', { timestamp: Date.now(), data: result });
        return result;
    }
    async getOperationalAlerts() {
        if (this.cache.has('alerts')) {
            const entry = this.cache.get('alerts');
            if (Date.now() - entry.timestamp < this.CACHE_TTL_MS) {
                return entry.data;
            }
        }
        const products = await this.prisma.product.findMany({
            orderBy: { stock: 'asc' }
        });
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map