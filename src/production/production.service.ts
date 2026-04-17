import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  async runProductionBatch(finishedGoodId: number, targetQuantity: number) {
    if (targetQuantity <= 0) throw new BadRequestException('Quantity must be positive');

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: finishedGoodId },
        include: { bomAsFinishedGood: { include: { component: true } } }
      });

      if (!product) throw new BadRequestException('Product not found');
      if (product.bomAsFinishedGood.length === 0) throw new BadRequestException('No Bill of Materials found for this product');

      // 1. Verify enough stock exists for all raw materials
      let totalRawMaterialCost = 0;

      for (const bomItem of product.bomAsFinishedGood) {
        const requiredQty = bomItem.quantityRequired * targetQuantity;
        const component = bomItem.component;

        if (component.stock < requiredQty) {
          throw new BadRequestException(`Insufficient stock of ${component.name}. Required: ${requiredQty}, Available: ${component.stock}`);
        }

        // Deduct raw material stock
        await tx.product.update({
          where: { id: component.id },
          data: { stock: { decrement: requiredQty } }
        });

        // Log StockMovement (outbound consumption)
        await tx.stockMovement.create({
          data: {
            productId: component.id,
            quantity: -requiredQty,
            movementType: 'MANUFACTURING_CONSUMPTION',
            unitCost: component.costPrice // Using current WAC of this raw material
          }
        });

        // Add to total component cost calculation
        totalRawMaterialCost += (requiredQty * component.costPrice);
      }

      // 2. Calculate Final COGS
      const baseLaborCost = product.laborCostPerUnit * targetQuantity;
      const baseOverheadCost = product.overheadCostPerUnit * targetQuantity;
      
      const totalBatchCost = totalRawMaterialCost + baseLaborCost + baseOverheadCost;
      const calculatedUnitCost = totalBatchCost / targetQuantity;

      // 3. Create Finished Goods Batch
      const batchNumber = `MFG-${randomBytes(4).toString('hex').toUpperCase()}`;
      await tx.inventoryBatch.create({
        data: {
          productId: finishedGoodId,
          batchNumber,
          quantity: targetQuantity,
          unitCost: calculatedUnitCost,
          mfgDate: new Date(),
        }
      });

      // 4. Log StockMovement (inbound finished goods)
      await tx.stockMovement.create({
        data: {
          productId: finishedGoodId,
          quantity: targetQuantity,
          movementType: 'MANUFACTURING_OUTPUT',
          unitCost: calculatedUnitCost,
        }
      });

      // 5. Update Finished Good Stock and globally recalculate WAC
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

  async getProductBOM(productId: number) {
    return this.prisma.billOfMaterial.findMany({
      where: { finishedGoodId: productId },
      include: { component: true }
    });
  }
}
