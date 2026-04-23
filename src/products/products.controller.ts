import { Controller, Get, Post, Put, Patch, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Post()
  async createProduct(@Body() data: any) {
    return this.productsService.createProduct(data);
  }

  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() data: any) {
    return this.productsService.updateProduct(Number(id), data);
  }

  @Patch(':id/deactivate')
  async deactivateProduct(@Param('id') id: string) {
    return this.productsService.setStatus(Number(id), 'Inactive');
  }
}
