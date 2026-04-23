import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.systemSetting.findUnique({
      where: { id: 1 }
    });

    if (!settings) {
      settings = await this.prisma.systemSetting.create({
        data: { id: 1 }
      });
    }

    return settings;
  }

  async updateSettings(data: any) {
    const settings = await this.prisma.systemSetting.upsert({
      where: { id: 1 },
      update: {
        companyName: data.companyName,
        companyLogo: data.companyLogo,
        defaultCurrency: data.defaultCurrency,
        currencySymbol: data.currencySymbol,
        decimalFormatting: Number(data.decimalFormatting)
      },
      create: {
        id: 1,
        companyName: data.companyName || "Soul to Soul ERP",
        companyLogo: data.companyLogo,
        defaultCurrency: data.defaultCurrency || "MZN",
        currencySymbol: data.currencySymbol || "MT",
        decimalFormatting: Number(data.decimalFormatting) || 2
      }
    });

    return { success: true, settings };
  }
}
