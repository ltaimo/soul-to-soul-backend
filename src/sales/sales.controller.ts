import { Controller, Post, Body, Get } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('api/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('confirm')
  async confirmSale(
    @Body('customerName') customerName: string,
    @Body('items') items: { productId: number; quantity: number }[]
  ) {
    return this.salesService.processSale(customerName, items);
  }

  @Get()
  async getSales() {
    return this.salesService.getRecentSales();
  }
}
