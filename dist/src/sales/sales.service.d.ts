import { PrismaService } from '../prisma.service';
export declare class SalesService {
    private prisma;
    constructor(prisma: PrismaService);
    processSale(customerName: string, items: {
        productId: number;
        quantity: number;
    }[]): Promise<{
        success: boolean;
        saleId: number;
        marginGiven: string | number;
        sale: {
            items: {
                id: number;
                quantity: number;
                productId: number;
                saleId: number;
                unitSellingPrice: number;
                unitCogs: number;
            }[];
        } & {
            id: number;
            date: Date;
            customerName: string | null;
            channel: string;
            totalRevenue: number;
            totalCogs: number;
        };
    }>;
    getRecentSales(): Promise<({
        items: ({
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
        } & {
            id: number;
            quantity: number;
            productId: number;
            saleId: number;
            unitSellingPrice: number;
            unitCogs: number;
        })[];
    } & {
        id: number;
        date: Date;
        customerName: string | null;
        channel: string;
        totalRevenue: number;
        totalCogs: number;
    })[]>;
}
