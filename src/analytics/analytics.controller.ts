import { Controller, Get, Header } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Roles('manager')
  async getKPIs() {
    return this.analyticsService.getFinancialKPIs();
  }

  @Get('alerts')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Roles('manager', 'stock_manager', 'production_manager', 'viewer')
  async getAlerts() {
    return this.analyticsService.getOperationalAlerts();
  }
}
