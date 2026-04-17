import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
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
