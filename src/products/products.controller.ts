import { Controller, Get, Post, Put, Patch, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Post()
  @Roles('manager', 'stock_manager')
  async createProduct(@Body() data: any) {
    return this.productsService.createProduct(data);
  }

  @Put(':id')
  @Roles('manager', 'stock_manager')
  async updateProduct(@Param('id') id: string, @Body() data: any) {
    return this.productsService.updateProduct(Number(id), data);
  }

  @Patch(':id/deactivate')
  @Roles('manager', 'stock_manager')
  async deactivateProduct(@Param('id') id: string) {
    return this.productsService.setStatus(Number(id), 'Inactive');
  }
}
