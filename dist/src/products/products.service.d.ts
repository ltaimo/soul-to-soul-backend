import { PrismaService } from '../prisma.service';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    createProduct(data: any): Promise<{
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
    updateProduct(id: number, data: any): Promise<{
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
    setStatus(id: number, status: string): Promise<{
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
}
