import { SalesService } from './sales.service';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    confirmSale(customerName: string, items: {
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
    getSales(): Promise<({
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
