import { PrismaService } from '../prisma.service';
export declare class SalesService {
    private prisma;
    constructor(prisma: PrismaService);
    processSale(data: {
        customerId?: number;
        customerName?: string;
        customerEmail?: string;
        customerPhone?: string;
        saveCustomer?: boolean;
        paymentMethod?: string;
        amountPaid?: number;
        sellerId?: number;
        sellerName?: string;
        items: {
            productId: number;
            quantity: number;
        }[];
    }): Promise<{
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
            sellerId: number | null;
            sellerName: string | null;
            channel: string;
            paymentMethod: string;
            amountPaid: number;
            changeGiven: number;
            totalRevenue: number;
            totalCogs: number;
            customerId: number | null;
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
        sellerId: number | null;
        sellerName: string | null;
        channel: string;
        paymentMethod: string;
        amountPaid: number;
        changeGiven: number;
        totalRevenue: number;
        totalCogs: number;
        customerId: number | null;
    })[]>;
}
