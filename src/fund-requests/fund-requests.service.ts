import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const categories = [
  'Stock Purchase',
  'Production',
  'Transport',
  'Marketing',
  'Operations',
  'HR',
  'Rent',
  'Utilities',
  'Other',
];
const priorities = ['Low', 'Normal', 'High', 'Urgent'];
const statuses = ['Pending', 'Approved', 'Rejected', 'Paid', 'Cancelled'];

@Injectable()
export class FundRequestsService {
  constructor(private prisma: PrismaService) {}

  async getFundRequests(user: any) {
    const canSeeAll = ['admin', 'manager'].includes(user?.role);
    return this.prisma.fundRequest.findMany({
      where: canSeeAll ? undefined : { requesterId: user?.id },
      orderBy: [{ status: 'asc' }, { neededBy: 'asc' }, { createdAt: 'desc' }],
      take: 300,
    });
  }

  async createFundRequest(user: any, data: any) {
    const amount = Number(data.amount) || 0;
    if (amount <= 0) {
      throw new BadRequestException(
        'Fund request amount must be greater than zero',
      );
    }
    if (!data.title?.trim()) {
      throw new BadRequestException('Fund request title is required');
    }

    const request = await this.prisma.fundRequest.create({
      data: {
        requestNumber: await this.nextRequestNumber(),
        requesterId: user?.id || null,
        requesterName:
          user?.fullName || user?.username || user?.email || 'User',
        requesterEmail: user?.email || null,
        requesterRole: user?.role || null,
        department: data.department?.trim() || null,
        category: categories.includes(data.category) ? data.category : 'Other',
        title: data.title.trim(),
        description: data.description?.trim() || null,
        amount,
        currency: data.currency?.trim() || 'MZN',
        neededBy: data.neededBy ? new Date(data.neededBy) : null,
        priority: priorities.includes(data.priority) ? data.priority : 'Normal',
        paymentMethod: data.paymentMethod?.trim() || null,
        payeeName: data.payeeName?.trim() || null,
        payeePhone: data.payeePhone?.trim() || null,
        payeeBank: data.payeeBank?.trim() || null,
      },
    });

    return { success: true, request };
  }

  async updateFundRequestStatus(user: any, id: number, data: any) {
    if (!statuses.includes(data.status) || data.status === 'Cancelled') {
      throw new BadRequestException('Invalid fund request status');
    }

    const existing = await this.prisma.fundRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Fund request not found');
    if (existing.status === 'Cancelled') {
      throw new BadRequestException('Cancelled requests cannot be changed');
    }

    const request = await this.prisma.fundRequest.update({
      where: { id },
      data: {
        status: data.status,
        reviewedById: user?.id || null,
        reviewedByName:
          user?.fullName || user?.username || user?.email || 'Manager',
        reviewedAt: new Date(),
        reviewNotes: data.reviewNotes?.trim() || null,
      },
    });
    return { success: true, request };
  }

  async cancelFundRequest(user: any, id: number) {
    const existing = await this.prisma.fundRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Fund request not found');
    if (existing.status !== 'Pending') {
      throw new BadRequestException(
        'Only pending fund requests can be cancelled',
      );
    }
    if (
      existing.requesterId !== user?.id &&
      !['admin', 'manager'].includes(user?.role)
    ) {
      throw new ForbiddenException(
        'You can only cancel your own pending requests',
      );
    }

    const request = await this.prisma.fundRequest.update({
      where: { id },
      data: { status: 'Cancelled' },
    });
    return { success: true, request };
  }

  private async nextRequestNumber() {
    const prefix = `FR-${new Date().getUTCFullYear()}-`;
    const count = await this.prisma.fundRequest.count({
      where: { requestNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
}
