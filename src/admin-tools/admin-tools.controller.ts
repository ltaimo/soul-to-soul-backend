import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AdminToolsService } from './admin-tools.service';

@Roles('admin')
@Controller('api/admin-tools')
export class AdminToolsController {
  constructor(private readonly adminToolsService: AdminToolsService) {}

  @Get('reset-preview')
  async getResetPreview() {
    return this.adminToolsService.getResetPreview();
  }

  @Post('security-code')
  async generateSecurityCode(@Req() req: any, @Body() data: any) {
    return this.adminToolsService.generateSecurityCode(req.user, data);
  }

  @Post('reset')
  async executeReset(@Req() req: any, @Body() data: any) {
    return this.adminToolsService.executeReset(req.user, data);
  }
}
