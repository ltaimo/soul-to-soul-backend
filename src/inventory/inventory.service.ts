import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomBytes } from 'crypto';

type Actor = {
  id?: number;
  fullName?: string;
  email?: string;
};

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private actorName(user?: Actor) {
    return user?.fullName || user?.email || null;
  }

  private async ensureDefaultWarehouse(tx: any = this.prisma) {
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

    await this.seedMissingWarehouseStock(tx, warehouse.id);
    return warehouse;
  }

  private async seedMissingWarehouseStock(tx: any, warehouseId: number) {
    const products = await tx.product.findMany({
      select: { id: true, stock: true, minStock: true },
    });

    for (const product of products) {
      await tx.warehouseStock.upsert({
        where: { warehouseId_productId: { warehouseId, productId: product.id } },
        update: {},
        create: {
          warehouseId,
          productId: product.id,
          quantity: product.stock || 0,
          minStock: product.minStock || 0,
        },
      });
    }
  }

  private async getWarehouse(tx: any, warehouseId?: number) {
    if (!warehouseId) return this.ensureDefaultWarehouse(tx);

    const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new BadRequestException('Warehouse not found');
    if (warehouse.status === 'Inactive') throw new BadRequestException('Warehouse is inactive');
    return warehouse;
  }

  private async ensureWarehouseStock(tx: any, warehouseId: number, product: any) {
    return tx.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId, productId: product.id } },
      update: {},
      create: {
        warehouseId,
        productId: product.id,
        quantity: 0,
        minStock: product.minStock || 0,
      },
    });
  }

  private async seedAllWarehouseStocks(tx: any = this.prisma) {
    const warehouses = await tx.warehouse.findMany({ select: { id: true } });
    const products = await tx.product.findMany({ select: { id: true, minStock: true } });

    for (const warehouse of warehouses) {
      for (const product of products) {
        await tx.warehouseStock.upsert({
          where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } },
          update: {},
          create: {
            warehouseId: warehouse.id,
            productId: product.id,
            quantity: 0,
            minStock: product.minStock || 0,
          },
        });
      }
    }
  }

  private async applyWarehouseDelta(tx: any, warehouseId: number, product: any, delta: number) {
    const stock = await this.ensureWarehouseStock(tx, warehouseId, product);
    const nextQuantity = stock.quantity + delta;

    if (nextQuantity < 0) {
      throw new BadRequestException(
        `Insufficient stock for ${product.name} in this warehouse. Needed: ${Math.abs(delta)}, Available: ${stock.quantity}`,
      );
    }

    return tx.warehouseStock.update({
      where: { warehouseId_productId: { warehouseId, productId: product.id } },
      data: { quantity: nextQuantity },
    });
  }

  async getWarehouses() {
    await this.ensureDefaultWarehouse();

    return this.prisma.warehouse.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { stocks: true, sales: true, purchases: true } },
      },
    });
  }

  async createWarehouse(data: any) {
    if (!data.name?.trim()) throw new BadRequestException('Warehouse name is required');

    const code = (data.code || data.name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);

    const warehouse = await this.prisma.warehouse.create({
      data: {
        code,
        name: data.name.trim(),
        type: data.type || 'Warehouse',
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        status: data.status || 'Active',
        isDefault: false,
      },
    });

    const products = await this.prisma.product.findMany({ select: { id: true, minStock: true } });
    for (const product of products) {
      await this.prisma.warehouseStock.create({
        data: {
          warehouseId: warehouse.id,
          productId: product.id,
          quantity: 0,
          minStock: product.minStock || 0,
        },
      });
    }

    return { success: true, warehouse };
  }

  async updateWarehouse(id: number, data: any) {
    if (!data.name?.trim()) throw new BadRequestException('Warehouse name is required');

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name.trim(),
        type: data.type || 'Warehouse',
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        status: data.status || 'Active',
      },
    });

    return { success: true, warehouse };
  }

  async updateWarehouseStatus(id: number, status: string) {
    if (!['Active', 'Inactive'].includes(status)) throw new BadRequestException('Invalid warehouse status');

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: { status },
    });

    return { success: true, warehouse };
  }

  async getWarehouseStock(warehouseId?: number) {
    await this.ensureDefaultWarehouse();
    await this.seedAllWarehouseStocks();

    const rows = await this.prisma.warehouseStock.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
      include: {
        warehouse: true,
        product: true,
      },
    });

    return rows.map((row) => ({
      ...row,
      value: row.quantity * row.product.costPrice,
      differenceFromMinimum: row.quantity - row.minStock,
      stockStatus: row.quantity <= 0 ? 'Out of Stock' : row.quantity <= row.minStock ? 'Low Stock' : 'Healthy',
    }));
  }

  async setWarehouseMinStock(warehouseId: number, productId: number, minStock: number) {
    if (minStock < 0) throw new BadRequestException('Minimum stock cannot be negative');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');
    await this.getWarehouse(this.prisma, warehouseId);

    const stock = await this.prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId, productId } },
      update: { minStock },
      create: { warehouseId, productId, quantity: 0, minStock },
    });

    return { success: true, stock };
  }

  async receiveGoods(
    productId: number,
    quantity: number,
    landedCost: number,
    supplierId?: number,
    warehouseId?: number,
    user?: Actor,
  ) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');
    if (!Number.isInteger(quantity)) throw new BadRequestException('Quantity must be a whole number');
    if (landedCost <= 0) throw new BadRequestException('Landed cost must be positive');

    return this.prisma.$transaction(async (tx) => {
      const warehouse = await this.getWarehouse(tx, warehouseId);
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new BadRequestException('Product not found');

      let purchase: any = null;
      if (supplierId) {
        purchase = await tx.purchase.create({
          data: {
            supplierId,
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            totalValue: quantity * landedCost,
            items: {
              create: [{ productId, quantity, unitCost: landedCost }],
            },
          },
        });
      }

      const batchNumber = `BATCH-${randomBytes(4).toString('hex').toUpperCase()}`;
      await tx.inventoryBatch.create({
        data: {
          productId,
          warehouseId: warehouse.id,
          batchNumber,
          quantity,
          unitCost: landedCost,
        },
      });

      await this.applyWarehouseDelta(tx, warehouse.id, product, quantity);

      await tx.stockMovement.create({
        data: {
          productId,
          warehouseId: warehouse.id,
          quantity,
          movementType: 'PO_RECEIVE',
          unitCost: landedCost,
          responsibleId: user?.id || null,
          responsibleName: this.actorName(user),
          reference: `Receipt into ${warehouse.name}`,
        },
      });

      const currentQty = product.stock;
      const currentCost = product.costPrice;
      const newStock = currentQty + quantity;
      const newWAC = ((currentQty * currentCost) + (quantity * landedCost)) / newStock;

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock, costPrice: newWAC },
      });

      return { success: true, purchase, product: updatedProduct, batchNumber, warehouse };
    });
  }

  async adjustStock(productId: number, quantity: number, reference?: string, warehouseId?: number, user?: Actor) {
    if (!quantity || quantity === 0) throw new BadRequestException('Adjustment quantity cannot be zero');
    if (!Number.isInteger(quantity)) throw new BadRequestException('Adjustment quantity must be a whole number');

    return this.prisma.$transaction(async (tx) => {
      const warehouse = await this.getWarehouse(tx, warehouseId);
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new BadRequestException('Product not found');

      await this.applyWarehouseDelta(tx, warehouse.id, product, quantity);

      const newStock = product.stock + quantity;
      if (newStock < 0) throw new BadRequestException(`Adjustment would make consolidated stock negative. Current stock: ${product.stock}`);

      await tx.stockMovement.create({
        data: {
          productId,
          warehouseId: warehouse.id,
          quantity,
          movementType: 'ADJUSTMENT',
          unitCost: product.costPrice,
          responsibleId: user?.id || null,
          responsibleName: this.actorName(user),
          reference: reference || `Manual stock adjustment in ${warehouse.name}`,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      return { success: true, product: updatedProduct, warehouse };
    });
  }

  async createTransfer(data: any, user?: Actor) {
    const sourceWarehouseId = Number(data.sourceWarehouseId);
    const destinationWarehouseId = Number(data.destinationWarehouseId);
    const items = Array.isArray(data.items) ? data.items : [];

    if (!sourceWarehouseId || !destinationWarehouseId) throw new BadRequestException('Source and destination warehouses are required');
    if (sourceWarehouseId === destinationWarehouseId) throw new BadRequestException('Source and destination warehouses must be different');
    if (items.length === 0) throw new BadRequestException('Transfer must contain at least one product');

    return this.prisma.$transaction(async (tx) => {
      const sourceWarehouse = await this.getWarehouse(tx, sourceWarehouseId);
      const destinationWarehouse = await this.getWarehouse(tx, destinationWarehouseId);

      const normalizedItems: Array<{
        product: any;
        productId: number;
        quantity: number;
        unitCost: number;
      }> = [];
      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);
        if (!productId || quantity <= 0 || !Number.isInteger(quantity)) {
          throw new BadRequestException('Transfer quantities must be positive whole numbers');
        }

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Product ID ${productId} not found`);
        await this.applyWarehouseDelta(tx, sourceWarehouse.id, product, -quantity);
        await this.ensureWarehouseStock(tx, destinationWarehouse.id, product);

        normalizedItems.push({
          product,
          productId,
          quantity,
          unitCost: product.costPrice,
        });
      }

      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber: `TRF-${Date.now()}-${randomBytes(2).toString('hex').toUpperCase()}`,
          sourceWarehouseId: sourceWarehouse.id,
          destinationWarehouseId: destinationWarehouse.id,
          status: 'In Transit',
          notes: data.notes?.trim() || null,
          requestedById: user?.id || null,
          requestedByName: this.actorName(user),
          shippedAt: new Date(),
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
            })),
          },
        },
        include: {
          sourceWarehouse: true,
          destinationWarehouse: true,
          items: { include: { product: true } },
        },
      });

      for (const item of normalizedItems) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: sourceWarehouse.id,
            sourceWarehouseId: sourceWarehouse.id,
            destinationWarehouseId: destinationWarehouse.id,
            transferId: transfer.id,
            quantity: -item.quantity,
            movementType: 'TRANSFER_OUT',
            status: 'In Transit',
            unitCost: item.unitCost,
            responsibleId: user?.id || null,
            responsibleName: this.actorName(user),
            reference: transfer.transferNumber,
          },
        });
      }

      return { success: true, transfer };
    });
  }

  async confirmTransfer(id: number, user?: Actor) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: {
          sourceWarehouse: true,
          destinationWarehouse: true,
          items: { include: { product: true } },
        },
      });

      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'In Transit') throw new BadRequestException('Only in-transit transfers can be received');

      for (const item of transfer.items) {
        await this.applyWarehouseDelta(tx, transfer.destinationWarehouseId, item.product, item.quantity);
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.destinationWarehouseId,
            sourceWarehouseId: transfer.sourceWarehouseId,
            destinationWarehouseId: transfer.destinationWarehouseId,
            transferId: transfer.id,
            quantity: item.quantity,
            movementType: 'TRANSFER_IN',
            status: 'Posted',
            unitCost: item.unitCost,
            responsibleId: user?.id || null,
            responsibleName: this.actorName(user),
            reference: transfer.transferNumber,
          },
        });
      }

      const updated = await tx.stockTransfer.update({
        where: { id },
        data: {
          status: 'Received',
          confirmedById: user?.id || null,
          confirmedByName: this.actorName(user),
          receivedAt: new Date(),
        },
        include: {
          sourceWarehouse: true,
          destinationWarehouse: true,
          items: { include: { product: true } },
        },
      });

      return { success: true, transfer: updated };
    });
  }

  async cancelTransfer(id: number, user?: Actor) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: {
          sourceWarehouse: true,
          destinationWarehouse: true,
          items: { include: { product: true } },
        },
      });

      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'In Transit') throw new BadRequestException('Only in-transit transfers can be cancelled');

      for (const item of transfer.items) {
        await this.applyWarehouseDelta(tx, transfer.sourceWarehouseId, item.product, item.quantity);
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.sourceWarehouseId,
            sourceWarehouseId: transfer.sourceWarehouseId,
            destinationWarehouseId: transfer.destinationWarehouseId,
            transferId: transfer.id,
            quantity: item.quantity,
            movementType: 'TRANSFER_CANCELLED',
            status: 'Cancelled',
            unitCost: item.unitCost,
            responsibleId: user?.id || null,
            responsibleName: this.actorName(user),
            reference: transfer.transferNumber,
          },
        });
      }

      const updated = await tx.stockTransfer.update({
        where: { id },
        data: {
          status: 'Cancelled',
          confirmedById: user?.id || null,
          confirmedByName: this.actorName(user),
        },
        include: {
          sourceWarehouse: true,
          destinationWarehouse: true,
          items: { include: { product: true } },
        },
      });

      return { success: true, transfer: updated };
    });
  }

  async getTransfers() {
    return this.prisma.stockTransfer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sourceWarehouse: true,
        destinationWarehouse: true,
        items: { include: { product: true } },
      },
    });
  }

  async getMovements() {
    return this.prisma.stockMovement.findMany({
      orderBy: { date: 'desc' },
      take: 200,
      include: {
        product: true,
        warehouse: true,
        sourceWarehouse: true,
        destinationWarehouse: true,
        transfer: true,
      },
    });
  }

  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        warehouseStocks: {
          include: { warehouse: true },
          orderBy: { warehouse: { name: 'asc' } },
        },
      },
    });
  }

  async getAllSuppliers() {
    return this.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
            purchases: true,
          },
        },
      },
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
      },
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
      },
    });

    return { success: true, supplier };
  }

  async updateSupplierStatus(id: number, status: string) {
    if (!['Active', 'Inactive'].includes(status)) {
      throw new BadRequestException('Invalid supplier status');
    }

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: { status },
    });

    return { success: true, supplier };
  }
}
