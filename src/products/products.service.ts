import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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

  async createProduct(data: any) {
    if (data.initialStock > 0 && (!data.costPrice || data.costPrice <= 0)) {
      throw new BadRequestException(
        'Cost is required when Initial Stock is provided.',
      );
    }

    // Selling price required for finished goods
    if (
      data.type === 'Finished Good' &&
      (!data.sellingPrice || data.sellingPrice <= 0)
    ) {
      throw new BadRequestException(
        'Selling price is strictly required for finished goods.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the basic product
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
          loyaltyPointsEarned: Math.max(
            0,
            Number(data.loyaltyPointsEarned) || 0,
          ),
          redemptionPointsCost: Math.max(
            0,
            Number(data.redemptionPointsCost) || 0,
          ),
          supplierId: data.supplierId ? Number(data.supplierId) : null,
          status: data.status || 'Active',
          stock: Number(data.initialStock) || 0,
        },
      });

      const warehouses = await tx.warehouse.findMany({
        select: { id: true, isDefault: true },
      });
      if (warehouses.length === 0) {
        const defaultWarehouse = await this.ensureDefaultWarehouse(tx);
        warehouses.push({ id: defaultWarehouse.id, isDefault: true });
      }

      for (const warehouse of warehouses) {
        await tx.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: warehouse.id,
              productId: product.id,
            },
          },
          update: {},
          create: {
            warehouseId: warehouse.id,
            productId: product.id,
            quantity: 0,
            minStock: product.minStock,
          },
        });
      }

      // 2. If Initial Stock is provided, inject batch and physical ledger movement
      if (data.initialStock > 0) {
        const warehouse = await this.ensureDefaultWarehouse(tx);
        const batchNumber = `INIT-${randomBytes(4).toString('hex').toUpperCase()}`;

        await tx.inventoryBatch.create({
          data: {
            productId: product.id,
            warehouseId: warehouse.id,
            batchNumber,
            quantity: Number(data.initialStock),
            unitCost: Number(data.costPrice),
            mfgDate: new Date(),
          },
        });

        await tx.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: warehouse.id,
              productId: product.id,
            },
          },
          update: {
            quantity: { increment: Number(data.initialStock) },
            minStock: product.minStock,
          },
          create: {
            warehouseId: warehouse.id,
            productId: product.id,
            quantity: Number(data.initialStock),
            minStock: product.minStock,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: Number(data.initialStock),
            movementType: 'INITIAL_ADJUSTMENT',
            unitCost: Number(data.costPrice),
            reference: `Initial stock at product creation in ${warehouse.name}`,
          },
        });
      }

      return { success: true, product };
    });
  }

  async updateProduct(id: number, data: any) {
    // Note: Do not update current stock via scalar update, use adjustments in inventory!
    const product = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
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
          loyaltyPointsEarned: Math.max(
            0,
            Number(data.loyaltyPointsEarned) || 0,
          ),
          redemptionPointsCost: Math.max(
            0,
            Number(data.redemptionPointsCost) || 0,
          ),
          supplierId: data.supplierId ? Number(data.supplierId) : null,
          status: data.status,
        },
      });

      const defaultWarehouse = await this.ensureDefaultWarehouse(tx);
      await tx.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: defaultWarehouse.id,
            productId: id,
          },
        },
        update: { minStock: Number(data.minStock) || 0 },
        create: {
          warehouseId: defaultWarehouse.id,
          productId: id,
          quantity: updated.stock,
          minStock: Number(data.minStock) || 0,
        },
      });

      return updated;
    });

    return { success: true, product };
  }

  async setStatus(id: number, status: string) {
    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
    });
    return { success: true, product };
  }

  async getAllProducts() {
    return this.prisma.product.findMany();
  }
}
