import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ProductionService } from './production.service';

@Controller('api/production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('run')
  async runProductionBatch(
    @Body('finishedGoodId') finishedGoodId: number,
    @Body('targetQuantity') targetQuantity: number
  ) {
    return this.productionService.runProductionBatch(finishedGoodId, targetQuantity);
  }

  @Get('bom/:id')
  async getBOM(@Param('id') id: string) {
    return this.productionService.getProductBOM(Number(id));
  }
}
