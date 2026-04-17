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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SalesService = class SalesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processSale(customerName, items) {
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('A sale must contain at least one item.');
        }
        return this.prisma.$transaction(async (tx) => {
            let totalRevenue = 0;
            let totalCogs = 0;
            const saleItemsToCreate = [];
            for (const item of items) {
                if (item.quantity <= 0) {
                    throw new common_1.BadRequestException(`Quantity for product ${item.productId} must be positive.`);
                }
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });
                if (!product) {
                    throw new common_1.BadRequestException(`Product ID ${item.productId} not found.`);
                }
                if (product.stock < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for ${product.name}. Needed: ${item.quantity}, Available: ${product.stock}`);
                }
                const lineRevenue = item.quantity * product.sellingPrice;
                const lineCogs = item.quantity * product.costPrice;
                totalRevenue += lineRevenue;
                totalCogs += lineCogs;
                saleItemsToCreate.push({
                    productId: product.id,
                    quantity: item.quantity,
                    unitSellingPrice: product.sellingPrice,
                    unitCogs: product.costPrice
                });
                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: { decrement: item.quantity } }
                });
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        quantity: -item.quantity,
                        movementType: 'SALE_OUTBOUND',
                        unitCost: product.costPrice
                    }
                });
            }
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
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map