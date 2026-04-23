import { PrismaService } from '../prisma.service';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
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
    getAllProducts(): Promise<{
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
    getAllSuppliers(): Promise<{
        id: number;
        name: string;
        category: string;
        status: string;
        leadTime: string;
    }[]>;
}
