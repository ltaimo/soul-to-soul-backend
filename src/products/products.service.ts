import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(data: any) {
    if (data.initialStock > 0 && (!data.costPrice || data.costPrice <= 0)) {
      throw new BadRequestException('Cost is required when Initial Stock is provided.');
    }
    
    // Selling price required for finished goods
    if (data.type === 'Finished Good' && (!data.sellingPrice || data.sellingPrice <= 0)) {
       throw new BadRequestException('Selling price is strictly required for finished goods.');
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
          status: data.status || 'Active',
          stock: Number(data.initialStock) || 0
        }
      });

      // 2. If Initial Stock is provided, inject batch and physical ledger movement
      if (data.initialStock > 0) {
        const batchNumber = `INIT-${randomBytes(4).toString('hex').toUpperCase()}`;
        
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

  async updateProduct(id: number, data: any) {
    // Note: Do not update current stock via scalar update, use adjustments in inventory!
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
        status: data.status
      }
    });

    return { success: true, product };
  }

  async setStatus(id: number, status: string) {
    const product = await this.prisma.product.update({
      where: { id },
      data: { status }
    });
    return { success: true, product };
  }

  async getAllProducts() {
    return this.prisma.product.findMany();
  }
}
