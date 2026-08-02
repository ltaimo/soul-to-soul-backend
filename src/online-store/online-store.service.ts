import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SalesService } from '../sales/sales.service';

type StoreCheckoutItem = {
  productId: number;
  quantity: number;
};

type StoreCheckoutContext = {
  orderReference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  notes: string;
  paymentMethod: string;
  amount: number;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
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

  private buildProductImage(product: any) {
    if (product.imageUrl) return product.imageUrl;
    const token = encodeURIComponent(
      `${product.category || 'Soul2Soul'} ${product.name || 'natural product'}`,
    );
    return `https://placehold.co/900x900/f8f1df/2f3b25?text=${token}`;
  }

  private isMpesaConfigured() {
    return Boolean(process.env.MPESA_C2B_URL && process.env.MPESA_API_KEY);
  }

  private async initiateMpesaPayment(context: StoreCheckoutContext) {
    if (context.paymentMethod !== 'M-Pesa') {
      return {
        status: 'Manual Review',
        reference: context.orderReference,
        message: 'Payment will be confirmed by the Soul2Soul team.',
      };
    }

    if (!this.isMpesaConfigured()) {
      return {
        status: 'Pending',
        reference: context.orderReference,
        message:
          'M-Pesa automatic collection is not active yet. Please pay by M-Pesa and share the confirmation on WhatsApp.',
      };
    }

    try {
      const response = await fetch(process.env.MPESA_C2B_URL as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MPESA_API_KEY}`,
        },
        body: JSON.stringify({
          amount: context.amount,
          currency: 'MZN',
          phone: context.customerPhone,
          reference: context.orderReference,
          description: `Soul2Soul order ${context.orderReference}`,
          callbackUrl: process.env.MPESA_CALLBACK_URL,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          status: 'Manual Review',
          reference: context.orderReference,
          providerData: JSON.stringify(payload),
          message:
            'M-Pesa request could not be started automatically. The order was saved for manual follow-up.',
        };
      }

      return {
        status: 'Pending',
        reference:
          payload.transactionReference ||
          payload.conversationId ||
          payload.reference ||
          context.orderReference,
        providerData: JSON.stringify(payload),
        message:
          payload.message ||
          'M-Pesa payment request sent. Please confirm the prompt on your phone.',
      };
    } catch (error) {
      return {
        status: 'Manual Review',
        reference: context.orderReference,
        providerData: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
        message:
          'M-Pesa request could not be started automatically. The order was saved for manual follow-up.',
      };
    }
  }

  private async postJson(url: string | undefined, payload: any) {
    if (!url) return { skipped: true };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { ok: response.ok, status: response.status };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async notifyOrder(context: StoreCheckoutContext, payment: any) {
    const lines = context.items
      .map(
        (item) =>
          `${item.quantity}x ${item.name} (${item.sku}) - ${item.unitPrice}`,
      )
      .join('\n');
    const message = [
      `Nova encomenda Soul2Soul: ${context.orderReference}`,
      `Cliente: ${context.customerName}`,
      `Telefone: ${context.customerPhone || '-'}`,
      `Email: ${context.customerEmail || '-'}`,
      `Total: ${context.amount} MZN`,
      `Pagamento: ${context.paymentMethod} (${payment.status})`,
      `Entrega: ${context.deliveryAddress || '-'}`,
      `Produtos:\n${lines}`,
      context.notes ? `Notas: ${context.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const [siteHook, emailHook, whatsappHook] = await Promise.all([
      this.postJson(process.env.STORE_NOTIFICATION_WEBHOOK_URL, {
        type: 'online-order',
        ...context,
        payment,
      }),
      this.postJson(process.env.STORE_EMAIL_WEBHOOK_URL, {
        to: process.env.STORE_NOTIFICATION_EMAIL_TO,
        subject: `Nova encomenda ${context.orderReference}`,
        message,
        order: context,
        payment,
      }),
      this.postJson(process.env.STORE_WHATSAPP_WEBHOOK_URL, {
        to: process.env.STORE_NOTIFICATION_WHATSAPP_TO,
        message,
        order: context,
        payment,
      }),
    ]);

    return { siteHook, emailHook, whatsappHook };
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
        imageUrl: this.buildProductImage(row.product),
        storeFeatured: row.product.storeFeatured,
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
    const products = await this.prisma.product.findMany({
      where: { id: { in: cleanItems.map((item) => item.productId) } },
    });
    const storeItems = cleanItems.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ID ${item.productId} not found.`);
      }
      return {
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
      };
    });
    const amount = storeItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const checkoutContext: StoreCheckoutContext = {
      orderReference,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      notes,
      paymentMethod,
      amount,
      items: storeItems,
    };
    const payment = await this.initiateMpesaPayment(checkoutContext);
    const saleResult = await this.salesService.processSale({
      customerName,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      deliveryAddress: deliveryAddress || undefined,
      customerCode: customerCode || undefined,
      allowUnknownCustomerCode: true,
      saveCustomer: true,
      paymentMethod: paymentMethod,
      paymentStatus: payment.status,
      paymentReference: payment.reference,
      paymentProviderData: payment.providerData,
      notificationStatus: 'Pending',
      amountPaid: 0,
      warehouseId: warehouse.id,
      channel: 'Online',
      orderReference,
      fulfillmentStatus: 'Pending Payment',
      items: cleanItems,
    });

    const notificationResult = await this.notifyOrder(checkoutContext, payment);
    const notificationStatus = Object.values(notificationResult).some(
      (result: any) => result?.ok,
    )
      ? 'Sent'
      : 'Pending';
    await this.prisma.sale.update({
      where: { id: saleResult.saleId },
      data: { notificationStatus },
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
          payment,
          notificationResult,
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
      payment,
      message: payment.message,
    };
  }

  async handleMpesaCallback(data: any) {
    const reference = this.cleanText(
      data?.reference ||
        data?.orderReference ||
        data?.transactionReference ||
        data?.input_ThirdPartyReference,
    );
    if (!reference) {
      throw new BadRequestException('Payment reference is required.');
    }

    const success =
      data?.success === true ||
      ['success', 'completed', 'paid', '0'].includes(
        String(data?.status || data?.resultCode || data?.code || '').toLowerCase(),
      );
    const sale = await this.prisma.sale.findFirst({
      where: {
        OR: [{ orderReference: reference }, { paymentReference: reference }],
      },
    });

    if (!sale) {
      throw new BadRequestException('Order not found for payment callback.');
    }

    const updated = await this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        paymentStatus: success ? 'Paid' : 'Failed',
        amountPaid: success ? sale.totalRevenue : sale.amountPaid,
        paymentReference: reference,
        paymentProviderData: JSON.stringify(data),
        fulfillmentStatus: success ? 'Pending' : sale.fulfillmentStatus,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: success ? 'MPESA_PAYMENT_CONFIRMED' : 'MPESA_PAYMENT_FAILED',
        entityType: 'sale',
        entityId: String(sale.id),
        method: 'POST',
        path: '/api/store/mpesa/callback',
        metadata: JSON.stringify(data),
        statusCode: 200,
      },
    });

    return { success: true, saleId: updated.id, paymentStatus: updated.paymentStatus };
  }
}
