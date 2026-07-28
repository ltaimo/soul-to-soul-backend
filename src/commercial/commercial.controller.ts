import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CommercialService } from './commercial.service';

@Controller('api/commercial-partners')
export class CommercialController {
  constructor(private readonly commercialService: CommercialService) {}

  @Get()
  @Roles(
    'manager',
    'cashier',
    'salesperson',
    'stock_manager',
    'production_manager',
    'viewer',
    'staff',
  )
  async getPartners() {
    return this.commercialService.getPartners();
  }

  @Post()
  @Roles('manager')
  async createPartner(@Body() data: any) {
    return this.commercialService.createPartner(data);
  }

  @Put(':id')
  @Roles('manager')
  async updatePartner(@Param('id') id: string, @Body() data: any) {
    return this.commercialService.updatePartner(Number(id), data);
  }

  @Patch(':id/status')
  @Roles('manager')
  async updatePartnerStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.commercialService.updatePartnerStatus(Number(id), status);
  }
}
