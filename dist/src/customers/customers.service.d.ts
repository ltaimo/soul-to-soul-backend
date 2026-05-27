import { PrismaService } from '../prisma.service';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllCustomers(): Promise<({
        _count: {
            sales: number;
        };
    } & {
        id: number;
        status: string;
        email: string | null;
        fullName: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        loyaltyTier: string;
        discountPercent: number;
        notes: string | null;
    })[]>;
    createCustomer(data: any): Promise<{
        success: boolean;
        customer: {
            id: number;
            status: string;
            email: string | null;
            fullName: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            loyaltyTier: string;
            discountPercent: number;
            notes: string | null;
        };
    }>;
    updateCustomer(id: number, data: any): Promise<{
        success: boolean;
        customer: {
            id: number;
            status: string;
            email: string | null;
            fullName: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            loyaltyTier: string;
            discountPercent: number;
            notes: string | null;
        };
    }>;
    updateCustomerStatus(id: number, status: string): Promise<{
        success: boolean;
        customer: {
            id: number;
            status: string;
            email: string | null;
            fullName: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            loyaltyTier: string;
            discountPercent: number;
            notes: string | null;
        };
    }>;
    private toCustomerData;
}
