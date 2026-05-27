import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getAllCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { fullName: 'asc' },
      include: {
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

    const customer = await this.prisma.customer.create({
      data: this.toCustomerData(data),
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

  private toCustomerData(data: any) {
    const discountPercent = Number(data.discountPercent) || 0;
    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException('Discount must be between 0 and 100');
    }

    return {
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      loyaltyTier: data.loyaltyTier || 'Standard',
      discountPercent,
      notes: data.notes?.trim() || null,
      status: data.status || 'Active',
    };
  }
}
