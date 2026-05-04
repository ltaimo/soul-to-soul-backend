import { Controller, Post, Body, Get, Put, Patch, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('receive')
  @Roles('manager', 'stock_manager')
  async receiveGoods(
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
    @Body('landedCost') landedCost: number,
    @Body('supplierId') supplierId?: number,
  ) {
    return this.inventoryService.receiveGoods(Number(productId), Number(quantity), Number(landedCost), supplierId ? Number(supplierId) : undefined);
  }

  @Post('adjust')
  @Roles('manager', 'stock_manager')
  async adjustStock(
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
    @Body('reference') reference?: string,
  ) {
    return this.inventoryService.adjustStock(Number(productId), Number(quantity), reference);
  }

  @Get('products')
  async getProducts() {
    return this.inventoryService.getAllProducts();
  }

  @Get('suppliers')
  async getSuppliers() {
    return this.inventoryService.getAllSuppliers();
  }

  @Post('suppliers')
  @Roles('manager', 'stock_manager')
  async createSupplier(@Body() data: any) {
    return this.inventoryService.createSupplier(data);
  }

  @Put('suppliers/:id')
  @Roles('manager', 'stock_manager')
  async updateSupplier(@Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateSupplier(Number(id), data);
  }

  @Patch('suppliers/:id/status')
  @Roles('manager', 'stock_manager')
  async updateSupplierStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.inventoryService.updateSupplierStatus(Number(id), status);
  }
}
