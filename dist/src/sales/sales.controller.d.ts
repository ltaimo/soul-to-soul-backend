import { SalesService } from './sales.service';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    confirmSale(customerName: string, customerEmail: string, paymentMethod: string, amountPaid: number, items: {
        productId: number;
        quantity: number;
    }[]): Promise<{
        success: boolean;
        saleId: number;
        marginGiven: string | number;
        sale: {
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
                    brand: string | null;
                    description: string | null;
                    barcode: string | null;
                    unit: string;
                    minStock: number;
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
            customerEmail: string | null;
            channel: string;
            paymentMethod: string;
            amountPaid: number;
            changeGiven: number;
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
                brand: string | null;
                description: string | null;
                barcode: string | null;
                unit: string;
                minStock: number;
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
        customerEmail: string | null;
        channel: string;
        paymentMethod: string;
        amountPaid: number;
        changeGiven: number;
        totalRevenue: number;
        totalCogs: number;
    })[]>;
}
