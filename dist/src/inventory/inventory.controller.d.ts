import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    receiveGoods(productId: number, quantity: number, landedCost: number, supplierId?: number): Promise<{
        success: boolean;
        purchase: any;
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
        batchNumber: string;
    }>;
    getProducts(): Promise<{
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
    }[]>;
    getSuppliers(): Promise<{
        id: number;
        name: string;
        category: string;
        status: string;
        leadTime: string;
    }[]>;
}
