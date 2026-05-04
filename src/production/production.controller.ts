import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { ProductionService } from './production.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('run')
  @Roles('manager', 'stock_manager', 'production_manager')
  async runProductionBatch(
    @Body('finishedGoodId') finishedGoodId: number,
    @Body('targetQuantity') targetQuantity: number
  ) {
    return this.productionService.runProductionBatch(Number(finishedGoodId), Number(targetQuantity));
  }

  @Get('bom/:id')
  async getBOM(@Param('id') id: string) {
    return this.productionService.getProductBOM(Number(id));
  }

  @Post('bom')
  @Roles('manager', 'stock_manager', 'production_manager')
  async setBOMItem(
    @Body('finishedGoodId') finishedGoodId: number,
    @Body('componentId') componentId: number,
    @Body('quantityRequired') quantityRequired: number,
  ) {
    return this.productionService.setBOMItem(Number(finishedGoodId), Number(componentId), Number(quantityRequired));
  }

  @Delete('bom/:id')
  @Roles('manager', 'stock_manager', 'production_manager')
  async deleteBOMItem(@Param('id') id: string) {
    return this.productionService.deleteBOMItem(Number(id));
  }
}
