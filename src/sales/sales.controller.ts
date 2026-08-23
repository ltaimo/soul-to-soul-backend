import { Controller, Post, Body, Get, Req, Param, Patch, Query, Header } from '@nestjs/common';
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
    @Body('deliveryAddress') deliveryAddress: string,
    @Body('customerCode') customerCode: string,
    @Body('saveCustomer') saveCustomer: boolean,
    @Body('paymentMethod') paymentMethod: string,
    @Body('paymentStatus') paymentStatus: string,
    @Body('paymentReference') paymentReference: string,
    @Body('amountPaid') amountPaid: number,
    @Body('deliveryFee') deliveryFee: number,
    @Body('payments') payments: { method: string; amount: number; reference?: string }[],
    @Body('pointsToRedeem') pointsToRedeem: number,
    @Body('idempotencyKey') idempotencyKey: string,
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
      deliveryAddress,
      customerCode,
      saveCustomer,
      paymentMethod,
      paymentStatus,
      paymentReference,
      amountPaid,
      deliveryFee,
      payments,
      pointsToRedeem: pointsToRedeem ? Number(pointsToRedeem) : undefined,
      idempotencyKey,
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
      user: req.user,
      items,
    });
  }

  @Get()
  @Roles('manager', 'cashier', 'salesperson', 'staff')
  async getSales() {
    return this.salesService.getRecentSales();
  }

  @Get('report')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Roles('manager')
  async getSalesReport(
    @Query('period') period: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.salesService.getSalesReport({ period, start, end });
  }

  @Patch(':id/cancel')
  @Roles('manager')
  async cancelSale(@Req() req: any, @Param('id') id: string) {
    return this.salesService.cancelSale(Number(id), req.user);
  }
}
