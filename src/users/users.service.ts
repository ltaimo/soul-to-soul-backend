import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly allowedRoles = [
    'admin',
    'manager',
    'cashier',
    'salesperson',
    'stock_manager',
    'production_manager',
    'viewer',
    'staff',
  ];

  private validateRole(role?: string) {
    if (role && !this.allowedRoles.includes(role)) {
      throw new BadRequestException('Invalid user role.');
    }
  }

  private normalizePhone(value?: string) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 9 && digits.startsWith('8')) return `258${digits}`;
    return digits;
  }

  private normalizeUsername(value?: string) {
    return String(value || '').trim().toLowerCase() || null;
  }

  private normalizeEmail(value?: string) {
    return String(value || '').trim().toLowerCase() || null;
  }

  private async assertUniqueIdentifiers(
    data: { email?: string | null; username?: string | null; phone?: string | null },
    ignoreId?: number,
  ) {
    const conditions = [
      data.email ? { email: data.email } : undefined,
      data.username ? { username: data.username } : undefined,
      data.phone ? { phone: data.phone } : undefined,
    ].filter(Boolean) as any[];

    if (!conditions.length) return;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: conditions,
        ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
      },
    });

    if (!existing) return;
    if (data.email && existing.email === data.email) {
      throw new ConflictException('Email is already registered.');
    }
    if (data.username && existing.username === data.username) {
      throw new ConflictException('Username is already registered.');
    }
    if (data.phone && existing.phone === data.phone) {
      throw new ConflictException('Phone number is already registered.');
    }
  }

  private async hydrateFromEmployee(data: any) {
    if (!data.employeeId) return data;
    const employee = await this.prisma.employee.findUnique({
      where: { id: Number(data.employeeId) },
    });
    if (!employee) {
      throw new BadRequestException('Selected worker was not found.');
    }
    return {
      ...data,
      fullName: data.fullName || employee.fullName,
      email: data.email || employee.email,
      phone: data.phone || employee.phone,
    };
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
          status: 'active',
        },
      });
      console.log(
        'Seeded default admin user: admin@soultosoul.local / Admin@123',
      );
    }
  }

  async createUser(data: any) {
    this.validateRole(data.role);
    data = await this.hydrateFromEmployee(data);

    if (!data.password || data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }
    if (!data.fullName || !data.fullName.trim()) {
      throw new BadRequestException('Full name is required.');
    }

    const identifiers = {
      email: this.normalizeEmail(data.email),
      username: this.normalizeUsername(data.username),
      phone: this.normalizePhone(data.phone),
    };
    if (!identifiers.email && !identifiers.username && !identifiers.phone) {
      throw new BadRequestException(
        'Provide at least one login identifier: email, username, or phone.',
      );
    }
    await this.assertUniqueIdentifiers(identifiers);

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: data.fullName?.trim(),
        email: identifiers.email,
        username: identifiers.username,
        phone: identifiers.phone,
        employeeId: data.employeeId ? Number(data.employeeId) : null,
        passwordHash,
        mustChangePassword: Boolean(data.mustChangePassword),
        role: data.role || 'staff',
        status: data.status || 'active',
        createdBy: data.createdBy,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async updateUser(id: number, data: any) {
    data = await this.hydrateFromEmployee(data);
    if (!data.fullName || !data.fullName.trim()) {
      throw new BadRequestException('Full name is required.');
    }
    const identifiers = {
      email: this.normalizeEmail(data.email),
      username: this.normalizeUsername(data.username),
      phone: this.normalizePhone(data.phone),
    };
    if (!identifiers.email && !identifiers.username && !identifiers.phone) {
      throw new BadRequestException(
        'Provide at least one login identifier: email, username, or phone.',
      );
    }
    await this.assertUniqueIdentifiers(identifiers, id);

    const patch: any = {
      fullName: data.fullName?.trim(),
      email: identifiers.email,
      username: identifiers.username,
      phone: identifiers.phone,
      employeeId: data.employeeId ? Number(data.employeeId) : null,
      mustChangePassword: Boolean(data.mustChangePassword),
      updatedBy: data.updatedBy,
    };

    if (data.password && data.password.length >= 6) {
      patch.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: patch,
    });

    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async resetPassword(
    id: number,
    password: string,
    mustChangePassword = true,
    updatedBy?: number,
  ) {
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        mustChangePassword,
        updatedBy,
      },
    });
    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async changeStatus(id: number, status: string, updatedBy?: number) {
    if (status === 'inactive') {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (user?.role === 'admin') {
        const activeAdmins = await this.prisma.user.count({
          where: { role: 'admin', status: 'active' },
        });
        if (activeAdmins <= 1) {
          throw new BadRequestException(
            'Cannot deactivate the last active administrator.',
          );
        }
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { status, updatedBy },
    });

    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async changeRole(id: number, role: string, updatedBy?: number) {
    this.validateRole(role);

    const userTarget = await this.prisma.user.findUnique({ where: { id } });
    if (userTarget?.role === 'admin' && role !== 'admin') {
      const activeAdmins = await this.prisma.user.count({
        where: { role: 'admin', status: 'active' },
      });
      if (activeAdmins <= 1) {
        throw new BadRequestException(
          'Cannot demote the last active administrator.',
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { role, updatedBy },
    });

    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }
}
