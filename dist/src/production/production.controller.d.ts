import { ProductionService } from './production.service';
export declare class ProductionController {
    private readonly productionService;
    constructor(productionService: ProductionService);
    runProductionBatch(finishedGoodId: number, targetQuantity: number): Promise<{
        success: boolean;
        batchNumber: string;
        manufacturedQuantity: number;
        totalCalculatedCOGS: number;
        unitCost: number;
        product: {
            id: number;
            name: string;
            category: string;
            status: string;
            supplierId: number | null;
            laborCostPerUnit: number;
            sku: string;
            type: string;
            costPrice: number;
            sellingPrice: number;
            overheadCostPerUnit: number;
            stock: number;
        };
    }>;
    getBOM(id: string): Promise<({
        component: {
            id: number;
            name: string;
            category: string;
            status: string;
            supplierId: number | null;
            laborCostPerUnit: number;
            sku: string;
            type: string;
            costPrice: number;
            sellingPrice: number;
            overheadCostPerUnit: number;
            stock: number;
        };
    } & {
        id: number;
        finishedGoodId: number;
        componentId: number;
        quantityRequired: number;
    })[]>;
}
