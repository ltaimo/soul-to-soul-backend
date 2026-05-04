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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const roles_decorator_1 = require("../auth/roles.decorator");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async receiveGoods(productId, quantity, landedCost, supplierId) {
        return this.inventoryService.receiveGoods(Number(productId), Number(quantity), Number(landedCost), supplierId ? Number(supplierId) : undefined);
    }
    async adjustStock(productId, quantity, reference) {
        return this.inventoryService.adjustStock(Number(productId), Number(quantity), reference);
    }
    async getProducts() {
        return this.inventoryService.getAllProducts();
    }
    async getSuppliers() {
        return this.inventoryService.getAllSuppliers();
    }
    async createSupplier(data) {
        return this.inventoryService.createSupplier(data);
    }
    async updateSupplier(id, data) {
        return this.inventoryService.updateSupplier(Number(id), data);
    }
    async updateSupplierStatus(id, status) {
        return this.inventoryService.updateSupplierStatus(Number(id), status);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('receive'),
    (0, roles_decorator_1.Roles)('manager', 'stock_manager'),
    __param(0, (0, common_1.Body)('productId')),
    __param(1, (0, common_1.Body)('quantity')),
    __param(2, (0, common_1.Body)('landedCost')),
    __param(3, (0, common_1.Body)('supplierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "receiveGoods", null);
__decorate([
    (0, common_1.Post)('adjust'),
    (0, roles_decorator_1.Roles)('manager', 'stock_manager'),
    __param(0, (0, common_1.Body)('productId')),
    __param(1, (0, common_1.Body)('quantity')),
    __param(2, (0, common_1.Body)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)('products'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getSuppliers", null);
__decorate([
    (0, common_1.Post)('suppliers'),
    (0, roles_decorator_1.Roles)('manager', 'stock_manager'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Put)('suppliers/:id'),
    (0, roles_decorator_1.Roles)('manager', 'stock_manager'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateSupplier", null);
__decorate([
    (0, common_1.Patch)('suppliers/:id/status'),
    (0, roles_decorator_1.Roles)('manager', 'stock_manager'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateSupplierStatus", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('api/inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map