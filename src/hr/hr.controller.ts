import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { HrService } from './hr.service';

@Controller('api/hr')
@Roles('manager')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('summary')
  async getSummary() {
    return this.hrService.getSummary();
  }

  @Get('employees')
  async getEmployees() {
    return this.hrService.getEmployees();
  }

  @Post('employees')
  async createEmployee(@Body() data: any) {
    return this.hrService.createEmployee(data);
  }

  @Put('employees/:id')
  async updateEmployee(@Param('id') id: string, @Body() data: any) {
    return this.hrService.updateEmployee(Number(id), data);
  }

  @Patch('employees/:id/status')
  async updateEmployeeStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.hrService.updateEmployeeStatus(Number(id), status);
  }

  @Get('payments')
  async getPayments() {
    return this.hrService.getPayments();
  }

  @Get('payroll')
  async getPayroll(@Query('month') month?: string) {
    return this.hrService.getPayroll(month);
  }

  @Post('payments')
  async createPayment(@Body() data: any) {
    return this.hrService.createPayment(data);
  }

  @Patch('payments/:id/status')
  async updatePaymentStatus(@Param('id') id: string, @Body() data: any) {
    return this.hrService.updatePaymentStatus(Number(id), data);
  }

  @Get('attendance')
  async getAttendance() {
    return this.hrService.getAttendance();
  }

  @Post('attendance')
  async upsertAttendance(@Body() data: any) {
    return this.hrService.upsertAttendance(data);
  }

  @Get('goals')
  async getGoals() {
    return this.hrService.getGoals();
  }

  @Post('goals')
  async createGoal(@Body() data: any) {
    return this.hrService.createGoal(data);
  }

  @Put('goals/:id')
  async updateGoal(@Param('id') id: string, @Body() data: any) {
    return this.hrService.updateGoal(Number(id), data);
  }
}
