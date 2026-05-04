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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const crypto_1 = require("crypto");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProduct(data) {
        if (data.initialStock > 0 && (!data.costPrice || data.costPrice <= 0)) {
            throw new common_1.BadRequestException('Cost is required when Initial Stock is provided.');
        }
        if (data.type === 'Finished Good' && (!data.sellingPrice || data.sellingPrice <= 0)) {
            throw new common_1.BadRequestException('Selling price is strictly required for finished goods.');
        }
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: data.name,
                    sku: data.sku,
                    category: data.category,
                    type: data.type,
                    unit: data.unit || 'pcs',
                    brand: data.brand || null,
                    description: data.description || null,
                    barcode: data.barcode || null,
                    costPrice: Number(data.costPrice) || 0,
                    sellingPrice: Number(data.sellingPrice) || 0,
                    minStock: Number(data.minStock) || 0,
                    supplierId: data.supplierId ? Number(data.supplierId) : null,
                    status: data.status || 'Active',
                    stock: Number(data.initialStock) || 0
                }
            });
            if (data.initialStock > 0) {
                const batchNumber = `INIT-${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
                await tx.inventoryBatch.create({
                    data: {
                        productId: product.id,
                        batchNumber,
                        quantity: Number(data.initialStock),
                        unitCost: Number(data.costPrice),
                        mfgDate: new Date()
                    }
                });
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        quantity: Number(data.initialStock),
                        movementType: 'INITIAL_ADJUSTMENT',
                        unitCost: Number(data.costPrice),
                        reference: 'Initial stock at product creation'
                    }
                });
            }
            return { success: true, product };
        });
    }
    async updateProduct(id, data) {
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                sku: data.sku,
                category: data.category,
                type: data.type,
                unit: data.unit,
                brand: data.brand,
                description: data.description,
                barcode: data.barcode,
                costPrice: Number(data.costPrice),
                sellingPrice: Number(data.sellingPrice),
                minStock: Number(data.minStock),
                supplierId: data.supplierId ? Number(data.supplierId) : null,
                status: data.status
            }
        });
        return { success: true, product };
    }
    async setStatus(id, status) {
        const product = await this.prisma.product.update({
            where: { id },
            data: { status }
        });
        return { success: true, product };
    }
    async getAllProducts() {
        return this.prisma.product.findMany();
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map