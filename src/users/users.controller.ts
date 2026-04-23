import { Controller, Get, Post, Put, Patch, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';

@Roles('admin')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post()
  async createUser(@Body() data: any) {
    return this.usersService.createUser(data);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.usersService.updateUser(Number(id), data);
  }

  @Patch(':id/status')
  async changeStatus(@Param('id') id: string, @Body('status') status: string, @Body('updatedBy') updatedBy?: number) {
    return this.usersService.changeStatus(Number(id), status, Number(updatedBy) || undefined);
  }

  @Patch(':id/role')
  async changeRole(@Param('id') id: string, @Body('role') role: string, @Body('updatedBy') updatedBy?: number) {
    return this.usersService.changeRole(Number(id), role, Number(updatedBy) || undefined);
  }
}
