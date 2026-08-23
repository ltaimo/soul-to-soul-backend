import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getAllCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { fullName: 'asc' },
      include: {
        loyaltyMovements: {
          orderBy: { createdAt: 'desc' },
          take: 8,
        },
        _count: {
          select: { sales: true },
        },
      },
    });
  }

  async createCustomer(data: any) {
    if (!data.fullName || !data.fullName.trim()) {
      throw new BadRequestException('Customer name is required');
    }

    const customer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: this.toCustomerData(data),
      });

      return tx.customer.update({
        where: { id: created.id },
        data: {
          customerCode:
            data.customerCode?.trim() ||
            `CUST-${String(created.id).padStart(5, '0')}`,
        },
      });
    });

    return { success: true, customer };
  }

  async updateCustomer(id: number, data: any) {
    if (!data.fullName || !data.fullName.trim()) {
      throw new BadRequestException('Customer name is required');
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: this.toCustomerData(data),
    });

    return { success: true, customer };
  }

  async updateCustomerStatus(id: number, status: string) {
    if (!['Active', 'Inactive'].includes(status)) {
      throw new BadRequestException('Invalid customer status');
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: { status },
    });

    return { success: true, customer };
  }

  async getPointHistory(id: number) {
    return this.prisma.loyaltyPointMovement.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async adjustPoints(
    id: number,
    data: { points: number; reason: string; idempotencyKey?: string },
    user?: any,
  ) {
    const points = Number(data.points) || 0;
    if (!points) throw new BadRequestException('Point adjustment cannot be zero.');
    if (!data.reason || !data.reason.trim()) {
      throw new BadRequestException('Adjustment reason is required.');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id } });
      if (!customer) throw new BadRequestException('Customer not found');

      const balanceBefore = customer.loyaltyPoints || 0;
      const balanceAfter = balanceBefore + points;
      if (balanceAfter < 0) {
        throw new BadRequestException('Loyalty balance cannot become negative.');
      }

      const key =
        data.idempotencyKey ||
        `customer-${id}:admin-adjustment:${Date.now()}:${Math.random().toString(16).slice(2)}`;

      const existing = await tx.loyaltyPointMovement.findUnique({
        where: { idempotencyKey: key },
      });
      if (existing) return { success: true, movement: existing, idempotent: true };

      const movement = await tx.loyaltyPointMovement.create({
        data: {
          customerId: id,
          movementType: 'ADMIN_ADJUSTMENT',
          points,
          balanceBefore,
          balanceAfter,
          reason: data.reason.trim(),
          userId: user?.id || null,
          userName: user?.fullName || user?.email || null,
          idempotencyKey: key,
        },
      });

      const customerUpdate = await tx.customer.update({
        where: { id },
        data: {
          loyaltyPoints: balanceAfter,
          loyaltyPointsAdjustedTotal: { increment: Math.abs(points) },
        },
      });

      return { success: true, movement, customer: customerUpdate };
    });
  }

  private toCustomerData(data: any) {
    const discountPercent = Number(data.discountPercent) || 0;
    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException('Discount must be between 0 and 100');
    }

    const customerData: any = {
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      loyaltyTier: data.loyaltyTier || 'Standard',
      discountPercent,
      notes: data.notes?.trim() || null,
      status: data.status || 'Active',
    };

    if (data.customerCode !== undefined) {
      customerData.customerCode = data.customerCode?.trim() || null;
    }

    return customerData;
  }
}
