import { Controller, Get, Header, Query, Post, Body } from '@nestjs/common';
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

  @Get('sales-dashboard')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Roles('manager')
  async getSalesDashboard(
    @Query('period') period: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.analyticsService.getSalesDashboard({ period, start, end });
  }

  @Get('seller-ranking')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Roles('manager')
  async getSellerRanking(
    @Query('period') period: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.analyticsService.getSellerRanking({ period, start, end });
  }

  @Get('seller-goals')
  @Roles('manager')
  async listSellerGoals() {
    return this.analyticsService.listSellerGoals();
  }

  @Post('seller-goals')
  @Roles('manager')
  async createSellerGoal(@Body() data: any) {
    return this.analyticsService.createSellerGoal(data);
  }

  @Get('bonus-rules')
  @Roles('manager')
  async listBonusRules() {
    return this.analyticsService.listBonusRules();
  }

  @Post('bonus-rules')
  @Roles('manager')
  async createBonusRule(@Body() data: any) {
    return this.analyticsService.createBonusRule(data);
  }
}
