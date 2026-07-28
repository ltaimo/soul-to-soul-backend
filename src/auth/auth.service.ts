import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private normalizePhone(value: string) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 9 && digits.startsWith('8')) return `258${digits}`;
    return digits;
  }

  async validateUser(identifier: string, pass: string): Promise<any> {
    const lookup = String(identifier || '').trim();
    const phone = this.normalizePhone(lookup);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: lookup },
          { username: lookup },
          phone ? { phone } : undefined,
        ].filter(Boolean) as any[],
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid login or password');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const passwordValid = await bcrypt.compare(pass, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid login or password');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      username: user.username,
      sub: user.id,
      role: user.role,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
