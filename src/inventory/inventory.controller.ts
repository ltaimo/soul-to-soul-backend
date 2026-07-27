import { Controller, Post, Body, Get, Put, Patch, Param, Query, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('receive')
  @Roles('manager', 'stock_manager')
  async receiveGoods(
    @Req() req: any,
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
    @Body('landedCost') landedCost: number,
    @Body('supplierId') supplierId?: number,
    @Body('warehouseId') warehouseId?: number,
  ) {
    return this.inventoryService.receiveGoods(
      Number(productId),
      Number(quantity),
      Number(landedCost),
      supplierId ? Number(supplierId) : undefined,
      warehouseId ? Number(warehouseId) : undefined,
      req.user,
    );
  }

  @Post('adjust')
  @Roles('manager', 'stock_manager')
  async adjustStock(
    @Req() req: any,
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
    @Body('reference') reference?: string,
    @Body('warehouseId') warehouseId?: number,
  ) {
    return this.inventoryService.adjustStock(
      Number(productId),
      Number(quantity),
      reference,
      warehouseId ? Number(warehouseId) : undefined,
      req.user,
    );
  }

  @Get('products')
  async getProducts() {
    return this.inventoryService.getAllProducts();
  }

  @Get('warehouses')
  async getWarehouses() {
    return this.inventoryService.getWarehouses();
  }

  @Post('warehouses')
  @Roles('manager', 'stock_manager')
  async createWarehouse(@Body() data: any) {
    return this.inventoryService.createWarehouse(data);
  }

  @Put('warehouses/:id')
  @Roles('manager', 'stock_manager')
  async updateWarehouse(@Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateWarehouse(Number(id), data);
  }

  @Patch('warehouses/:id/status')
  @Roles('manager', 'stock_manager')
  async updateWarehouseStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.inventoryService.updateWarehouseStatus(Number(id), status);
  }

  @Get('warehouse-stock')
  async getWarehouseStock(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getWarehouseStock(warehouseId ? Number(warehouseId) : undefined);
  }

  @Get('warehouses/:id/stock')
  async getSingleWarehouseStock(@Param('id') id: string) {
    return this.inventoryService.getWarehouseStock(Number(id));
  }

  @Patch('warehouses/:warehouseId/products/:productId/min-stock')
  @Roles('manager', 'stock_manager')
  async setWarehouseMinStock(
    @Param('warehouseId') warehouseId: string,
    @Param('productId') productId: string,
    @Body('minStock') minStock: number,
  ) {
    return this.inventoryService.setWarehouseMinStock(Number(warehouseId), Number(productId), Number(minStock));
  }

  @Get('transfers')
  async getTransfers() {
    return this.inventoryService.getTransfers();
  }

  @Post('transfers')
  @Roles('manager', 'stock_manager')
  async createTransfer(@Req() req: any, @Body() data: any) {
    return this.inventoryService.createTransfer(data, req.user);
  }

  @Patch('transfers/:id/receive')
  @Roles('manager', 'stock_manager')
  async confirmTransfer(@Req() req: any, @Param('id') id: string) {
    return this.inventoryService.confirmTransfer(Number(id), req.user);
  }

  @Patch('transfers/:id/cancel')
  @Roles('manager', 'stock_manager')
  async cancelTransfer(@Req() req: any, @Param('id') id: string) {
    return this.inventoryService.cancelTransfer(Number(id), req.user);
  }

  @Get('movements')
  async getMovements() {
    return this.inventoryService.getMovements();
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
