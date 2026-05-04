import { PrismaService } from '../prisma.service';
export declare class ProductionService {
    private prisma;
    constructor(prisma: PrismaService);
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
            brand: string | null;
            description: string | null;
            barcode: string | null;
            unit: string;
            minStock: number;
        };
    }>;
    getProductBOM(productId: number): Promise<({
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
            brand: string | null;
            description: string | null;
            barcode: string | null;
            unit: string;
            minStock: number;
        };
    } & {
        id: number;
        finishedGoodId: number;
        componentId: number;
        quantityRequired: number;
    })[]>;
    setBOMItem(finishedGoodId: number, componentId: number, quantityRequired: number): Promise<{
        success: boolean;
        bomItem: {
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
                brand: string | null;
                description: string | null;
                barcode: string | null;
                unit: string;
                minStock: number;
            };
        } & {
            id: number;
            finishedGoodId: number;
            componentId: number;
            quantityRequired: number;
        };
    }>;
    deleteBOMItem(id: number): Promise<{
        success: boolean;
    }>;
}
