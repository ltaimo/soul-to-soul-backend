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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const customers_service_1 = require("./customers.service");
const roles_decorator_1 = require("../auth/roles.decorator");
let CustomersController = class CustomersController {
    customersService;
    constructor(customersService) {
        this.customersService = customersService;
    }
    async getAllCustomers() {
        return this.customersService.getAllCustomers();
    }
    async createCustomer(data) {
        return this.customersService.createCustomer(data);
    }
    async updateCustomer(id, data) {
        return this.customersService.updateCustomer(Number(id), data);
    }
    async updateCustomerStatus(id, status) {
        return this.customersService.updateCustomerStatus(Number(id), status);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('manager', 'cashier', 'salesperson', 'stock_manager', 'viewer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getAllCustomers", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('manager', 'cashier', 'salesperson'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createCustomer", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('manager'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateCustomer", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('manager'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateCustomerStatus", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('api/customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map