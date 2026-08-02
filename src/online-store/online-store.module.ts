import { Module } from '@nestjs/common';
import { OnlineStoreController } from './online-store.controller';
import { OnlineStoreService } from './online-store.service';
import { PrismaService } from '../prisma.service';
import { SalesService } from '../sales/sales.service';

@Module({
  controllers: [OnlineStoreController],
  providers: [OnlineStoreService, SalesService, PrismaService],
})
export class OnlineStoreModule {}
