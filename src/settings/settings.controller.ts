import { Controller, Get, Put, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Get('loyalty')
  @Roles('admin', 'manager')
  async getLoyaltyConfig() {
    return this.settingsService.getLoyaltyConfig();
  }

  @Roles('admin', 'manager')
  @Put()
  async updateSettings(@Body() data: any) {
    return this.settingsService.updateSettings(data);
  }

  @Roles('admin', 'manager')
  @Put('loyalty')
  async updateLoyaltyConfig(@Body() data: any) {
    return this.settingsService.updateLoyaltyConfig(data);
  }
}
