import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
@UseInterceptors(CacheInterceptor)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  async getKPIs() {
    return this.analyticsService.getFinancialKPIs();
  }

  @Get('alerts')
  async getAlerts() {
    return this.analyticsService.getOperationalAlerts();
  }
}
