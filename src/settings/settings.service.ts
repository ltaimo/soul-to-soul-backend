import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private defaults = {
    hrPaymentTypes:
      'Salary,Rent,Advance,Bonus,Transport,Utilities,Commission,Other',
    paymentMethods: 'Cash,M-Pesa,E-Mola,Card,Bank Transfer',
    warehouseTypes: 'Warehouse,Shop,Storage,Transit',
    productCategories: 'Skincare,Haircare,Beard Care,Raw Material,Packaging',
    productTypes: 'Finished Good,Raw Material,Packaging',
    productUnits: 'pcs,kg,g,l,ml,box',
    attendanceStatuses: 'Present,Absent,Late,Half Day,Leave',
    payFrequencies: 'Monthly,Weekly,Daily,Hourly',
    hrRoles:
      'Manager,Cashier,Salesperson,Stock Manager,Production Assistant,Administrator',
    hrDepartments: 'Sales,Store,Warehouse,Production,Administration,Finance',
  };

  private csvToArray(value?: string) {
    const parsed = this.parseOptions(value);
    if (parsed.length) return parsed.map((item) => item.label);

    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private parseOptions(
    value?: string,
  ): Array<{ label: string; active: boolean }> {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => {
          if (typeof item === 'string')
            return { label: item.trim(), active: true };
          return {
            label: String(item?.label || '').trim(),
            active: item?.active !== false,
          };
        })
        .filter((item) => item.label);
    } catch {
      return [];
    }
  }

  private optionsOrDefault(value: string | undefined, fallback: string) {
    const parsed = this.parseOptions(value);
    if (parsed.length) return parsed;
    return this.csvToArray(fallback).map((label) => ({ label, active: true }));
  }

  private activeListOrDefault(value: string | undefined, fallback: string) {
    return this.optionsOrDefault(value, fallback)
      .filter((item) => item.active)
      .map((item) => item.label);
  }

  private arrayToStorage(value: any, fallback: string) {
    if (Array.isArray(value)) {
      const clean = value
        .map((item) => {
          if (typeof item === 'string')
            return { label: item.trim(), active: true };
          return {
            label: String(item?.label || '').trim(),
            active: item?.active !== false,
          };
        })
        .filter((item) => item.label);

      return clean.length ? JSON.stringify(clean) : fallback;
    }

    const clean = this.csvToArray(value);
    return clean.length ? clean.join(',') : fallback;
  }

  private normalize(settings: any) {
    return {
      ...settings,
      hrPaymentTypesOptions: this.optionsOrDefault(
        settings.hrPaymentTypes,
        this.defaults.hrPaymentTypes,
      ),
      paymentMethodsOptions: this.optionsOrDefault(
        settings.paymentMethods,
        this.defaults.paymentMethods,
      ),
      warehouseTypesOptions: this.optionsOrDefault(
        settings.warehouseTypes,
        this.defaults.warehouseTypes,
      ),
      productCategoriesOptions: this.optionsOrDefault(
        settings.productCategories,
        this.defaults.productCategories,
      ),
      productTypesOptions: this.optionsOrDefault(
        settings.productTypes,
        this.defaults.productTypes,
      ),
      productUnitsOptions: this.optionsOrDefault(
        settings.productUnits,
        this.defaults.productUnits,
      ),
      attendanceStatusesOptions: this.optionsOrDefault(
        settings.attendanceStatuses,
        this.defaults.attendanceStatuses,
      ),
      payFrequenciesOptions: this.optionsOrDefault(
        settings.payFrequencies,
        this.defaults.payFrequencies,
      ),
      hrRolesOptions: this.optionsOrDefault(
        settings.hrRoles,
        this.defaults.hrRoles,
      ),
      hrDepartmentsOptions: this.optionsOrDefault(
        settings.hrDepartments,
        this.defaults.hrDepartments,
      ),
      hrPaymentTypesList: this.activeListOrDefault(
        settings.hrPaymentTypes,
        this.defaults.hrPaymentTypes,
      ),
      paymentMethodsList: this.activeListOrDefault(
        settings.paymentMethods,
        this.defaults.paymentMethods,
      ),
      warehouseTypesList: this.activeListOrDefault(
        settings.warehouseTypes,
        this.defaults.warehouseTypes,
      ),
      productCategoriesList: this.activeListOrDefault(
        settings.productCategories,
        this.defaults.productCategories,
      ),
      productTypesList: this.activeListOrDefault(
        settings.productTypes,
        this.defaults.productTypes,
      ),
      productUnitsList: this.activeListOrDefault(
        settings.productUnits,
        this.defaults.productUnits,
      ),
      attendanceStatusesList: this.activeListOrDefault(
        settings.attendanceStatuses,
        this.defaults.attendanceStatuses,
      ),
      payFrequenciesList: this.activeListOrDefault(
        settings.payFrequencies,
        this.defaults.payFrequencies,
      ),
      hrRolesList: this.activeListOrDefault(
        settings.hrRoles,
        this.defaults.hrRoles,
      ),
      hrDepartmentsList: this.activeListOrDefault(
        settings.hrDepartments,
        this.defaults.hrDepartments,
      ),
    };
  }

  async getSettings() {
    let settings = await this.prisma.systemSetting.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await this.prisma.systemSetting.create({
        data: { id: 1, companyName: 'Soul2Soul' },
      });
    }

    return this.normalize(settings);
  }

  async updateSettings(data: any) {
    const current = await this.prisma.systemSetting.findUnique({
      where: { id: 1 },
    });

    const fieldValue = (field: string, fallback: any = null) =>
      Object.prototype.hasOwnProperty.call(data, field)
        ? data[field] || fallback
        : current?.[field] || fallback;

    const settingData = {
      companyName: fieldValue('companyName', 'Soul2Soul'),
      companyLogo: fieldValue('companyLogo'),
      companyPhone: fieldValue('companyPhone'),
      companyWhatsApp: fieldValue('companyWhatsApp'),
      companyEmail: fieldValue('companyEmail'),
      companyAddress: fieldValue('companyAddress'),
      companyWebsite: fieldValue('companyWebsite'),
      instagramUrl: fieldValue('instagramUrl'),
      facebookUrl: fieldValue('facebookUrl'),
      tiktokUrl: fieldValue('tiktokUrl'),
      defaultCurrency: fieldValue('defaultCurrency', 'MZN'),
      currencySymbol: fieldValue('currencySymbol', 'MT'),
      decimalFormatting: Number(fieldValue('decimalFormatting', 2)) || 2,
      hrPaymentTypes: this.arrayToStorage(
        data.hrPaymentTypesOptions ??
          data.hrPaymentTypes ??
          data.hrPaymentTypesList ??
          current?.hrPaymentTypes,
        this.defaults.hrPaymentTypes,
      ),
      paymentMethods: this.arrayToStorage(
        data.paymentMethodsOptions ??
          data.paymentMethods ??
          data.paymentMethodsList ??
          current?.paymentMethods,
        this.defaults.paymentMethods,
      ),
      warehouseTypes: this.arrayToStorage(
        data.warehouseTypesOptions ??
          data.warehouseTypes ??
          data.warehouseTypesList ??
          current?.warehouseTypes,
        this.defaults.warehouseTypes,
      ),
      productCategories: this.arrayToStorage(
        data.productCategoriesOptions ??
          data.productCategories ??
          data.productCategoriesList ??
          current?.productCategories,
        this.defaults.productCategories,
      ),
      productTypes: this.arrayToStorage(
        data.productTypesOptions ??
          data.productTypes ??
          data.productTypesList ??
          current?.productTypes,
        this.defaults.productTypes,
      ),
      productUnits: this.arrayToStorage(
        data.productUnitsOptions ??
          data.productUnits ??
          data.productUnitsList ??
          current?.productUnits,
        this.defaults.productUnits,
      ),
      attendanceStatuses: this.arrayToStorage(
        data.attendanceStatusesOptions ??
          data.attendanceStatuses ??
          data.attendanceStatusesList ??
          current?.attendanceStatuses,
        this.defaults.attendanceStatuses,
      ),
      payFrequencies: this.arrayToStorage(
        data.payFrequenciesOptions ??
          data.payFrequencies ??
          data.payFrequenciesList ??
          current?.payFrequencies,
        this.defaults.payFrequencies,
      ),
      hrRoles: this.arrayToStorage(
        data.hrRolesOptions ??
          data.hrRoles ??
          data.hrRolesList ??
          current?.hrRoles,
        this.defaults.hrRoles,
      ),
      hrDepartments: this.arrayToStorage(
        data.hrDepartmentsOptions ??
          data.hrDepartments ??
          data.hrDepartmentsList ??
          current?.hrDepartments,
        this.defaults.hrDepartments,
      ),
    };

    const settings = await this.prisma.systemSetting.upsert({
      where: { id: 1 },
      update: settingData,
      create: {
        id: 1,
        ...settingData,
      },
    });

    return { success: true, settings: this.normalize(settings) };
  }

  async getLoyaltyConfig() {
    return this.prisma.loyaltyProgramConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        earnRateCents: 20000,
        redeemRateCents: 1000,
        allowPointsCash: true,
        roundingMode: 'FLOOR',
        weekStartsOn: 'MONDAY',
      },
    });
  }

  async updateLoyaltyConfig(data: any) {
    const earnRateCents = Math.max(1, Math.round((Number(data.earnRate) || Number(data.earnRateMt) || 200) * 100));
    const redeemRateCents = Math.max(1, Math.round((Number(data.redeemRate) || Number(data.redeemRateMt) || 10) * 100));

    const config = await this.prisma.loyaltyProgramConfig.upsert({
      where: { id: 1 },
      update: {
        earnRateCents,
        redeemRateCents,
        allowPointsCash: data.allowPointsCash !== false,
        pointsExpireDays: data.pointsExpireDays ? Number(data.pointsExpireDays) : null,
        roundingMode: data.roundingMode || 'FLOOR',
        weekStartsOn: data.weekStartsOn || 'MONDAY',
      },
      create: {
        id: 1,
        earnRateCents,
        redeemRateCents,
        allowPointsCash: data.allowPointsCash !== false,
        pointsExpireDays: data.pointsExpireDays ? Number(data.pointsExpireDays) : null,
        roundingMode: data.roundingMode || 'FLOOR',
        weekStartsOn: data.weekStartsOn || 'MONDAY',
      },
    });

    return { success: true, config };
  }
}
