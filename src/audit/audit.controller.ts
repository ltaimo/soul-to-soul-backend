import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from './audit.service';

@Controller('api/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('manager')
  async getAuditLogs(
    @Query('take') take?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditService.getLogs({
      take: take ? Number(take) : undefined,
      entityType,
      action,
      userId: userId ? Number(userId) : undefined,
    });
  }
}
