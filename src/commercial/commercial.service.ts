import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const partnerTypes = ['Seller', 'Reseller'];
const partnerStatuses = ['Active', 'Inactive'];
const agreementTypes = ['Direct Sale', 'Consignment', 'Hybrid'];
const pricePolicies = [
  'Standard',
  'Discount Percent',
  'Fixed Margin',
  'Fixed Price',
];
const settlementCycles = ['On Sale', 'Weekly', 'Monthly', 'On Delivery'];
const saleChannels = ['Store', 'Online', 'Order', 'Reseller'];

@Injectable()
export class CommercialService {
  constructor(private prisma: PrismaService) {}

  async getPartners() {
    return this.prisma.commercialPartner.findMany({
      orderBy: [{ status: 'asc' }, { type: 'asc' }, { name: 'asc' }],
      include: {
        warehouse: true,
        _count: { select: { sales: true } },
      },
    });
  }

  async createPartner(data: any) {
    const partner = await this.prisma.commercialPartner.create({
      data: await this.toPartnerData(data),
      include: { warehouse: true, _count: { select: { sales: true } } },
    });
    return { success: true, partner };
  }

  async updatePartner(id: number, data: any) {
    const partner = await this.prisma.commercialPartner.update({
      where: { id },
      data: await this.toPartnerData(data),
      include: { warehouse: true, _count: { select: { sales: true } } },
    });
    return { success: true, partner };
  }

  async updatePartnerStatus(id: number, status: string) {
    if (!partnerStatuses.includes(status)) {
      throw new BadRequestException('Invalid partner status');
    }

    const partner = await this.prisma.commercialPartner.update({
      where: { id },
      data: { status },
    });
    return { success: true, partner };
  }

  private async toPartnerData(data: any) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Seller or reseller name is required');
    }

    const commissionRate = Number(data.commissionRate) || 0;
    if (commissionRate < 0 || commissionRate > 100) {
      throw new BadRequestException(
        'Commission rate must be between 0 and 100',
      );
    }

    const priceAdjustment = Number(data.priceAdjustment) || 0;
    if (priceAdjustment < 0) {
      throw new BadRequestException('Price adjustment cannot be negative');
    }

    const creditLimit = Number(data.creditLimit) || 0;
    if (creditLimit < 0) {
      throw new BadRequestException('Credit limit cannot be negative');
    }

    const warehouseId = data.warehouseId ? Number(data.warehouseId) : null;
    if (warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });
      if (!warehouse)
        throw new BadRequestException('Assigned warehouse not found');
      if (warehouse.status === 'Inactive')
        throw new BadRequestException('Assigned warehouse is inactive');
    }

    return {
      name: data.name.trim(),
      type: partnerTypes.includes(data.type) ? data.type : 'Seller',
      warehouseId,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      commissionRate,
      agreementType: agreementTypes.includes(data.agreementType)
        ? data.agreementType
        : 'Direct Sale',
      pricePolicy: pricePolicies.includes(data.pricePolicy)
        ? data.pricePolicy
        : 'Standard',
      priceAdjustment,
      paymentTerms: data.paymentTerms?.trim() || null,
      settlementCycle: settlementCycles.includes(data.settlementCycle)
        ? data.settlementCycle
        : 'On Sale',
      creditLimit,
      defaultSaleChannel: saleChannels.includes(data.defaultSaleChannel)
        ? data.defaultSaleChannel
        : 'Store',
      trackingEnabled: Boolean(data.trackingEnabled),
      notes: data.notes?.trim() || null,
      status: partnerStatuses.includes(data.status) ? data.status : 'Active',
    };
  }
}
