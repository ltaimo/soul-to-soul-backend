import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('confirm')
  @Roles('manager', 'cashier', 'salesperson', 'staff')
  async confirmSale(
    @Req() req: any,
    @Body('customerId') customerId: number,
    @Body('customerName') customerName: string,
    @Body('customerEmail') customerEmail: string,
    @Body('customerPhone') customerPhone: string,
    @Body('customerCode') customerCode: string,
    @Body('saveCustomer') saveCustomer: boolean,
    @Body('paymentMethod') paymentMethod: string,
    @Body('amountPaid') amountPaid: number,
    @Body('warehouseId') warehouseId: number,
    @Body('commercialPartnerId') commercialPartnerId: number,
    @Body('channel') channel: string,
    @Body('orderReference') orderReference: string,
    @Body('fulfillmentStatus') fulfillmentStatus: string,
    @Body('redeemPoints') redeemPoints: boolean,
    @Body('items') items: { productId: number; quantity: number }[],
  ) {
    return this.salesService.processSale({
      customerId: customerId ? Number(customerId) : undefined,
      customerName,
      customerEmail,
      customerPhone,
      customerCode,
      saveCustomer,
      paymentMethod,
      amountPaid,
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      commercialPartnerId: commercialPartnerId
        ? Number(commercialPartnerId)
        : undefined,
      channel,
      orderReference,
      fulfillmentStatus,
      redeemPoints,
      sellerId: req.user?.id,
      sellerName: req.user?.fullName || req.user?.email,
      items,
    });
  }

  @Get()
  @Roles('manager', 'cashier', 'salesperson', 'staff')
  async getSales() {
    return this.salesService.getRecentSales();
  }
}
