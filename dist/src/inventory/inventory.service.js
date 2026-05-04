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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const crypto_1 = require("crypto");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async receiveGoods(productId, quantity, landedCost, supplierId) {
        if (quantity <= 0)
            throw new common_1.BadRequestException('Quantity must be positive');
        if (!Number.isInteger(quantity))
            throw new common_1.BadRequestException('Quantity must be a whole number');
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: productId },
            });
            if (!product)
                throw new common_1.BadRequestException('Product not found');
            let purchase = null;
            if (supplierId) {
                purchase = await tx.purchase.create({
                    data: {
                        supplierId,
                        totalValue: quantity * landedCost,
                        items: {
                            create: [
                                { productId, quantity, unitCost: landedCost }
                            ]
                        }
                    }
                });
            }
            const batchNumber = `BATCH-${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
            await tx.inventoryBatch.create({
                data: {
                    productId,
                    batchNumber,
                    quantity,
                    unitCost: landedCost,
                }
            });
            await tx.stockMovement.create({
                data: {
                    productId,
                    quantity,
                    movementType: 'PO_RECEIVE',
                    unitCost: landedCost,
                }
            });
            const currentQty = product.stock;
            const currentCost = product.costPrice;
            const newStock = currentQty + quantity;
            const newWAC = ((currentQty * currentCost) + (quantity * landedCost)) / newStock;
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: {
                    stock: newStock,
                    costPrice: newWAC,
                }
            });
            return {
                success: true,
                purchase,
                product: updatedProduct,
                batchNumber
            };
        });
    }
    async adjustStock(productId, quantity, reference) {
        if (!quantity || quantity === 0)
            throw new common_1.BadRequestException('Adjustment quantity cannot be zero');
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: productId },
            });
            if (!product)
                throw new common_1.BadRequestException('Product not found');
            const newStock = product.stock + quantity;
            if (newStock < 0) {
                throw new common_1.BadRequestException(`Adjustment would make stock negative. Current stock: ${product.stock}`);
            }
            await tx.stockMovement.create({
                data: {
                    productId,
                    quantity,
                    movementType: 'ADJUSTMENT',
                    unitCost: product.costPrice,
                    reference: reference || 'Manual stock adjustment',
                }
            });
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: { stock: newStock }
            });
            return {
                success: true,
                product: updatedProduct,
            };
        });
    }
    async getAllProducts() {
        return this.prisma.product.findMany();
    }
    async getAllSuppliers() {
        return this.prisma.supplier.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        products: true,
                        purchases: true,
                    }
                }
            }
        });
    }
    async createSupplier(data) {
        if (!data.name || !data.name.trim()) {
            throw new common_1.BadRequestException('Supplier name is required');
        }
        const supplier = await this.prisma.supplier.create({
            data: {
                name: data.name.trim(),
                category: data.category?.trim() || 'General',
                leadTime: data.leadTime?.trim() || 'Not set',
                status: data.status || 'Active',
            }
        });
        return { success: true, supplier };
    }
    async updateSupplier(id, data) {
        if (!data.name || !data.name.trim()) {
            throw new common_1.BadRequestException('Supplier name is required');
        }
        const supplier = await this.prisma.supplier.update({
            where: { id },
            data: {
                name: data.name.trim(),
                category: data.category?.trim() || 'General',
                leadTime: data.leadTime?.trim() || 'Not set',
                status: data.status || 'Active',
            }
        });
        return { success: true, supplier };
    }
    async updateSupplierStatus(id, status) {
        if (!['Active', 'Inactive'].includes(status)) {
            throw new common_1.BadRequestException('Invalid supplier status');
        }
        const supplier = await this.prisma.supplier.update({
            where: { id },
            data: { status }
        });
        return { success: true, supplier };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map