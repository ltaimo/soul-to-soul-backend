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
exports.ProductionController = void 0;
const common_1 = require("@nestjs/common");
const production_service_1 = require("./production.service");
let ProductionController = class ProductionController {
    productionService;
    constructor(productionService) {
        this.productionService = productionService;
    }
    async runProductionBatch(finishedGoodId, targetQuantity) {
        return this.productionService.runProductionBatch(finishedGoodId, targetQuantity);
    }
    async getBOM(id) {
        return this.productionService.getProductBOM(Number(id));
    }
};
exports.ProductionController = ProductionController;
__decorate([
    (0, common_1.Post)('run'),
    __param(0, (0, common_1.Body)('finishedGoodId')),
    __param(1, (0, common_1.Body)('targetQuantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ProductionController.prototype, "runProductionBatch", null);
__decorate([
    (0, common_1.Get)('bom/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductionController.prototype, "getBOM", null);
exports.ProductionController = ProductionController = __decorate([
    (0, common_1.Controller)('api/production'),
    __metadata("design:paramtypes", [production_service_1.ProductionService])
], ProductionController);
//# sourceMappingURL=production.controller.js.map