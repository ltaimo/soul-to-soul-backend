import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/analytics')
@UseInterceptors(CacheInterceptor)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  @Roles('manager', 'stock_manager', 'production_manager', 'viewer')
  async getKPIs() {
    return this.analyticsService.getFinancialKPIs();
  }

  @Get('alerts')
  @Roles('manager', 'stock_manager', 'production_manager', 'viewer')
  async getAlerts() {
    return this.analyticsService.getOperationalAlerts();
  }
}
