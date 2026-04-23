"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async updateSettings(data) {
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
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map