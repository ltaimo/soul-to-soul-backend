import { Controller, Post, Body, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('receive')
  async receiveGoods(
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
    @Body('landedCost') landedCost: number,
    @Body('supplierId') supplierId?: number,
  ) {
    return this.inventoryService.receiveGoods(productId, quantity, landedCost, supplierId);
  }

  @Post('adjust')
  async adjustStock(
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
    @Body('reference') reference?: string,
  ) {
    return this.inventoryService.adjustStock(productId, quantity, reference);
  }

  @Get('products')
  async getProducts() {
    return this.inventoryService.getAllProducts();
  }

  @Get('suppliers')
  async getSuppliers() {
    return this.inventoryService.getAllSuppliers();
  }
}
