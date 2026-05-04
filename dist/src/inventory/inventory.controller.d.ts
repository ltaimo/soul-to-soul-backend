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
            brand: string | null;
            description: string | null;
            barcode: string | null;
            unit: string;
            minStock: number;
        };
        batchNumber: string;
    }>;
    adjustStock(productId: number, quantity: number, reference?: string): Promise<{
        success: boolean;
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
            brand: string | null;
            description: string | null;
            barcode: string | null;
            unit: string;
            minStock: number;
        };
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
        brand: string | null;
        description: string | null;
        barcode: string | null;
        unit: string;
        minStock: number;
    }[]>;
    getSuppliers(): Promise<({
        _count: {
            products: number;
            purchases: number;
        };
    } & {
        id: number;
        name: string;
        category: string;
        status: string;
        leadTime: string;
    })[]>;
    createSupplier(data: any): Promise<{
        success: boolean;
        supplier: {
            id: number;
            name: string;
            category: string;
            status: string;
            leadTime: string;
        };
    }>;
    updateSupplier(id: string, data: any): Promise<{
        success: boolean;
        supplier: {
            id: number;
            name: string;
            category: string;
            status: string;
            leadTime: string;
        };
    }>;
    updateSupplierStatus(id: string, status: string): Promise<{
        success: boolean;
        supplier: {
            id: number;
            name: string;
            category: string;
            status: string;
            leadTime: string;
        };
    }>;
}
