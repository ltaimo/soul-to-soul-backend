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
    @Body('customerName') customerName: string,
    @Body('customerEmail') customerEmail: string,
    @Body('paymentMethod') paymentMethod: string,
    @Body('amountPaid') amountPaid: number,
    @Body('items') items: { productId: number; quantity: number }[]
  ) {
    return this.salesService.processSale({
      customerName,
      customerEmail,
      paymentMethod,
      amountPaid,
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
