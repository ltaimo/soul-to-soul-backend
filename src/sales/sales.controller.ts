import { Controller, Post, Body, Get } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('api/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('confirm')
  async confirmSale(
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
      items,
    });
  }

  @Get()
  async getSales() {
    return this.salesService.getRecentSales();
  }
}
