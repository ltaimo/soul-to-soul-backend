import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly allowedRoles = ['admin', 'manager', 'cashier', 'salesperson', 'stock_manager', 'production_manager', 'viewer', 'staff'];

  private validateRole(role?: string) {
    if (role && !this.allowedRoles.includes(role)) {
      throw new BadRequestException('Invalid user role.');
    }
  }

  async seedDefaultAdmin() {
    const userCount = await this.prisma.user.count();
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      await this.prisma.user.create({
        data: {
          fullName: 'System Administrator',
          email: 'admin@soultosoul.local',
          passwordHash,
          role: 'admin',
          status: 'active'
        }
      });
      console.log('Seeded default admin user: admin@soultosoul.local / Admin@123');
    }
  }

  async createUser(data: any) {
    this.validateRole(data.role);

    if (!data.password || data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        role: data.role || 'staff',
        status: data.status || 'active',
        createdBy: data.createdBy
      }
    });

    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async updateUser(id: number, data: any) {
    const patch: any = {
      fullName: data.fullName,
      email: data.email,
      updatedBy: data.updatedBy
    };

    if (data.password && data.password.length >= 6) {
      patch.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: patch
    });

    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async changeStatus(id: number, status: string, updatedBy?: number) {
    if (status === 'inactive') {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (user?.role === 'admin') {
        const activeAdmins = await this.prisma.user.count({ where: { role: 'admin', status: 'active' } });
        if (activeAdmins <= 1) {
          throw new BadRequestException('Cannot deactivate the last active administrator.');
        }
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { status, updatedBy }
    });
    
    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async changeRole(id: number, role: string, updatedBy?: number) {
    this.validateRole(role);

    const userTarget = await this.prisma.user.findUnique({ where: { id } });
    if (userTarget?.role === 'admin' && role !== 'admin') {
      const activeAdmins = await this.prisma.user.count({ where: { role: 'admin', status: 'active' } });
      if (activeAdmins <= 1) {
        throw new BadRequestException('Cannot demote the last active administrator.');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { role, updatedBy }
    });

    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }
}
