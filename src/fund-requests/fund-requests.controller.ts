import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { FundRequestsService } from './fund-requests.service';

@Controller('api/fund-requests')
export class FundRequestsController {
  constructor(private readonly fundRequestsService: FundRequestsService) {}

  @Get()
  async getFundRequests(@Req() req: any) {
    return this.fundRequestsService.getFundRequests(req.user);
  }

  @Post()
  async createFundRequest(@Req() req: any, @Body() data: any) {
    return this.fundRequestsService.createFundRequest(req.user, data);
  }

  @Patch(':id/status')
  @Roles('manager')
  async updateFundRequestStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.fundRequestsService.updateFundRequestStatus(
      req.user,
      Number(id),
      data,
    );
  }

  @Patch(':id/cancel')
  async cancelFundRequest(@Req() req: any, @Param('id') id: string) {
    return this.fundRequestsService.cancelFundRequest(req.user, Number(id));
  }
}
