import { Controller, Get, Post, Put, Patch, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('manager', 'cashier', 'salesperson', 'stock_manager', 'viewer')
  async getAllCustomers() {
    return this.customersService.getAllCustomers();
  }

  @Post()
  @Roles('manager', 'cashier', 'salesperson')
  async createCustomer(@Body() data: any) {
    return this.customersService.createCustomer(data);
  }

  @Put(':id')
  @Roles('manager')
  async updateCustomer(@Param('id') id: string, @Body() data: any) {
    return this.customersService.updateCustomer(Number(id), data);
  }

  @Patch(':id/status')
  @Roles('manager')
  async updateCustomerStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.customersService.updateCustomerStatus(Number(id), status);
  }
}
