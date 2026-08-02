import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { OnlineStoreService } from './online-store.service';

@Public()
@Controller('api/store')
export class OnlineStoreController {
  constructor(private readonly onlineStoreService: OnlineStoreService) {}

  @Get('catalog')
  async getCatalog() {
    return this.onlineStoreService.getCatalog();
  }

  @Post('checkout')
  async checkout(@Body() data: any) {
    return this.onlineStoreService.checkout(data);
  }
}
