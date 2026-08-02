import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SalesService } from '../sales/sales.service';

type StoreCheckoutItem = {
  productId: number;
  quantity: number;
};

@Injectable()
export class OnlineStoreService {
  constructor(
    private prisma: PrismaService,
    private salesService: SalesService,
  ) {}

  private cleanText(value: unknown, fallback = '') {
    return String(value ?? fallback).trim();
  }

  private async getStoreWarehouse() {
    return (
      (await this.prisma.warehouse.findFirst({
        where: { isDefault: true, status: 'Active' },
        orderBy: { id: 'asc' },
      })) ||
      (await this.prisma.warehouse.findFirst({
        where: { status: 'Active' },
        orderBy: { id: 'asc' },
      }))
    );
  }

  async getCatalog() {
    const [settings, warehouse] = await Promise.all([
      this.prisma.systemSetting.findUnique({ where: { id: 1 } }),
      this.getStoreWarehouse(),
    ]);

    if (!warehouse) {
      return {
        settings,
        warehouse: null,
        products: [],
      };
    }

    const stockRows = await this.prisma.warehouseStock.findMany({
      where: {
        warehouseId: warehouse.id,
        quantity: { gt: 0 },
        product: {
          status: 'Active',
          sellingPrice: { gt: 0 },
        },
      },
      include: { product: true },
      orderBy: [{ product: { category: 'asc' } }, { product: { name: 'asc' } }],
    });

    return {
      settings,
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
      },
      products: stockRows.map((row) => ({
        id: row.product.id,
        sku: row.product.sku,
        name: row.product.name,
        category: row.product.category,
        description: row.product.description,
        unit: row.product.unit,
        sellingPrice: row.product.sellingPrice,
        availableStock: row.quantity,
        loyaltyPointsEarned: row.product.loyaltyPointsEarned,
        redemptionPointsCost: row.product.redemptionPointsCost,
      })),
    };
  }

  async checkout(data: any) {
    const customerName = this.cleanText(data?.customerName);
    const customerPhone = this.cleanText(data?.customerPhone);
    const customerEmail = this.cleanText(data?.customerEmail);
    const deliveryAddress = this.cleanText(data?.deliveryAddress);
    const notes = this.cleanText(data?.notes);
    const paymentMethod = this.cleanText(data?.paymentMethod, 'M-Pesa');
    const customerCode = this.cleanText(data?.customerCode);
    const items = Array.isArray(data?.items) ? data.items : [];

    if (customerName.length < 2) {
      throw new BadRequestException('Customer name is required.');
    }

    if (customerPhone.length < 7 && !customerEmail) {
      throw new BadRequestException('Phone or email is required.');
    }

    const cleanItems: StoreCheckoutItem[] = items
      .map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      }))
      .filter((item) => item.productId && item.quantity > 0);

    if (!cleanItems.length) {
      throw new BadRequestException('Cart must contain at least one product.');
    }

    const warehouse = await this.getStoreWarehouse();
    if (!warehouse) {
      throw new BadRequestException('No active warehouse is available.');
    }

    const orderReference = `WEB-${Date.now().toString(36).toUpperCase()}`;
    const saleResult = await this.salesService.processSale({
      customerName,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      customerCode: customerCode || undefined,
      saveCustomer: true,
      paymentMethod: `${paymentMethod} - Pending Confirmation`,
      amountPaid: 0,
      warehouseId: warehouse.id,
      channel: 'Online',
      orderReference,
      fulfillmentStatus: 'Pending Payment',
      items: cleanItems,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'ONLINE_ORDER_CREATED',
        entityType: 'online-store',
        entityId: String(saleResult.saleId),
        method: 'POST',
        path: '/api/store/checkout',
        metadata: JSON.stringify({
          orderReference,
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress,
          notes,
          paymentMethod,
          itemCount: cleanItems.length,
        }),
        statusCode: 201,
      },
    });

    return {
      success: true,
      orderReference,
      saleId: saleResult.saleId,
      status: 'Pending Payment',
      message:
        'Order received. Soul2Soul will confirm payment and delivery by phone or WhatsApp.',
    };
  }
}
