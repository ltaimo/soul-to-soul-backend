import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommercialController } from './commercial.controller';
import { CommercialService } from './commercial.service';

@Module({
  controllers: [CommercialController],
  providers: [CommercialService, PrismaService],
})
export class CommercialModule {}
