import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService, PrismaService],
})
export class ProductionModule {}
