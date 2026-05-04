import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async receiveGoods(productId: number, quantity: number, landedCost: number, supplierId?: number) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');
    if (!Number.isInteger(quantity)) throw new BadRequestException('Quantity must be a whole number');
    
    // Begin atomic transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) throw new BadRequestException('Product not found');

      // 1. If we have a supplierId, create a Purchase and PurchaseItem
      let purchase: any = null;
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

      // 2. Create the Inventory Batch
      const batchNumber = `BATCH-${randomBytes(4).toString('hex').toUpperCase()}`;
      await tx.inventoryBatch.create({
        data: {
          productId,
          batchNumber,
          quantity,
          unitCost: landedCost,
        }
      });

      // 3. Create StockMovement entry
      await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          movementType: 'PO_RECEIVE',
          unitCost: landedCost,
        }
      });

      // 4. Calculate WAC and Update Product
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

  async adjustStock(productId: number, quantity: number, reference?: string) {
    if (!quantity || quantity === 0) throw new BadRequestException('Adjustment quantity cannot be zero');

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) throw new BadRequestException('Product not found');

      const newStock = product.stock + quantity;
      if (newStock < 0) {
        throw new BadRequestException(`Adjustment would make stock negative. Current stock: ${product.stock}`);
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

  async createSupplier(data: any) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Supplier name is required');
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

  async updateSupplier(id: number, data: any) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Supplier name is required');
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

  async updateSupplierStatus(id: number, status: string) {
    if (!['Active', 'Inactive'].includes(status)) {
      throw new BadRequestException('Invalid supplier status');
    }

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: { status }
    });

    return { success: true, supplier };
  }
}
