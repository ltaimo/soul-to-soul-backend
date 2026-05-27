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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async createCustomer(data) {
        if (!data.fullName || !data.fullName.trim()) {
            throw new common_1.BadRequestException('Customer name is required');
        }
        const customer = await this.prisma.customer.create({
            data: this.toCustomerData(data),
        });
        return { success: true, customer };
    }
    async updateCustomer(id, data) {
        if (!data.fullName || !data.fullName.trim()) {
            throw new common_1.BadRequestException('Customer name is required');
        }
        const customer = await this.prisma.customer.update({
            where: { id },
            data: this.toCustomerData(data),
        });
        return { success: true, customer };
    }
    async updateCustomerStatus(id, status) {
        if (!['Active', 'Inactive'].includes(status)) {
            throw new common_1.BadRequestException('Invalid customer status');
        }
        const customer = await this.prisma.customer.update({
            where: { id },
            data: { status },
        });
        return { success: true, customer };
    }
    toCustomerData(data) {
        const discountPercent = Number(data.discountPercent) || 0;
        if (discountPercent < 0 || discountPercent > 100) {
            throw new common_1.BadRequestException('Discount must be between 0 and 100');
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
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map