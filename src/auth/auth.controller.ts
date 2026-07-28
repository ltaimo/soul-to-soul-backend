import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: any) {
    const identifier = body.identifier || body.email || body.username || body.phone;
    if (!identifier || !body.password) {
      throw new UnauthorizedException('Identifier and password are required');
    }
    const user = await this.authService.validateUser(identifier, body.password);
    return this.authService.login(user);
  }
}
