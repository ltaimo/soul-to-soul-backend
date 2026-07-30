import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FundRequestsController } from './fund-requests.controller';
import { FundRequestsService } from './fund-requests.service';

@Module({
  controllers: [FundRequestsController],
  providers: [FundRequestsService, PrismaService],
})
export class FundRequestsModule {}
