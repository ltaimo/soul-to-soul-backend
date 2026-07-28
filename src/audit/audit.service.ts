import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const sensitiveKeys = [
  'password',
  'passwordHash',
  'token',
  'access_token',
  'authorization',
  'secret',
  'DATABASE_URL',
];

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getLogs(filters: {
    take?: number;
    entityType?: string;
    action?: string;
    userId?: number;
  }) {
    const take = Math.max(1, Math.min(filters.take || 200, 500));
    return this.prisma.auditLog.findMany({
      where: {
        entityType: filters.entityType || undefined,
        action: filters.action ? { contains: filters.action } : undefined,
        userId: filters.userId || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async record(data: {
    user?: any;
    action: string;
    entityType?: string;
    entityId?: string;
    method: string;
    path: string;
    ipAddress?: string;
    userAgent?: string;
    machine?: string;
    metadata?: any;
    statusCode?: number;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.user?.id || data.user?.sub || null,
          userName: data.user?.fullName || null,
          userEmail: data.user?.email || null,
          userRole: data.user?.role || null,
          action: data.action,
          entityType: data.entityType || null,
          entityId: data.entityId || null,
          method: data.method,
          path: data.path,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          machine: data.machine || null,
          metadata: data.metadata
            ? JSON.stringify(this.redact(data.metadata)).slice(0, 8000)
            : null,
          statusCode: data.statusCode || null,
        },
      });
    } catch (error) {
      console.warn(`Audit log skipped: ${error?.message || error}`);
    }
  }

  redact(value: any): any {
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    if (!value || typeof value !== 'object') return value;
    return Object.entries(value).reduce((acc, [key, item]) => {
      acc[key] = sensitiveKeys.some((sensitive) =>
        key.toLowerCase().includes(sensitive.toLowerCase()),
      )
        ? '[REDACTED]'
        : this.redact(item);
      return acc;
    }, {});
  }
}
