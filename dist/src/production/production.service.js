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
exports.ProductionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const crypto_1 = require("crypto");
let ProductionService = class ProductionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async runProductionBatch(finishedGoodId, targetQuantity) {
        if (targetQuantity <= 0)
            throw new common_1.BadRequestException('Quantity must be positive');
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: finishedGoodId },
                include: { bomAsFinishedGood: { include: { component: true } } }
            });
            if (!product)
                throw new common_1.BadRequestException('Product not found');
            if (product.bomAsFinishedGood.length === 0)
                throw new common_1.BadRequestException('No Bill of Materials found for this product');
            let totalRawMaterialCost = 0;
            for (const bomItem of product.bomAsFinishedGood) {
                const requiredQty = bomItem.quantityRequired * targetQuantity;
                const component = bomItem.component;
                if (component.stock < requiredQty) {
                    throw new common_1.BadRequestException(`Insufficient stock of ${component.name}. Required: ${requiredQty}, Available: ${component.stock}`);
                }
                await tx.product.update({
                    where: { id: component.id },
                    data: { stock: { decrement: requiredQty } }
                });
                await tx.stockMovement.create({
                    data: {
                        productId: component.id,
                        quantity: -requiredQty,
                        movementType: 'MANUFACTURING_CONSUMPTION',
                        unitCost: component.costPrice
                    }
                });
                totalRawMaterialCost += (requiredQty * component.costPrice);
            }
            const baseLaborCost = product.laborCostPerUnit * targetQuantity;
            const baseOverheadCost = product.overheadCostPerUnit * targetQuantity;
            const totalBatchCost = totalRawMaterialCost + baseLaborCost + baseOverheadCost;
            const calculatedUnitCost = totalBatchCost / targetQuantity;
            const batchNumber = `MFG-${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
            await tx.inventoryBatch.create({
                data: {
                    productId: finishedGoodId,
                    batchNumber,
                    quantity: targetQuantity,
                    unitCost: calculatedUnitCost,
                    mfgDate: new Date(),
                }
            });
            await tx.stockMovement.create({
                data: {
                    productId: finishedGoodId,
                    quantity: targetQuantity,
                    movementType: 'MANUFACTURING_OUTPUT',
                    unitCost: calculatedUnitCost,
                }
            });
            const currentQty = product.stock;
            const currentCost = product.costPrice;
            const newStock = currentQty + targetQuantity;
            const newWAC = ((currentQty * currentCost) + (targetQuantity * calculatedUnitCost)) / newStock;
            const updatedProduct = await tx.product.update({
                where: { id: finishedGoodId },
                data: {
                    stock: newStock,
                    costPrice: newWAC
                }
            });
            return {
                success: true,
                batchNumber,
                manufacturedQuantity: targetQuantity,
                totalCalculatedCOGS: totalBatchCost,
                unitCost: calculatedUnitCost,
                product: updatedProduct
            };
        });
    }
    async getProductBOM(productId) {
        return this.prisma.billOfMaterial.findMany({
            where: { finishedGoodId: productId },
            include: { component: true }
        });
    }
};
exports.ProductionService = ProductionService;
exports.ProductionService = ProductionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductionService);
//# sourceMappingURL=production.service.js.map