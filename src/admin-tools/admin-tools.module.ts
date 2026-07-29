import { Module } from '@nestjs/common';
import { AdminToolsController } from './admin-tools.controller';
import { AdminToolsService } from './admin-tools.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [AdminToolsController],
  providers: [AdminToolsService, PrismaService, AuditService],
})
export class AdminToolsModule {}
