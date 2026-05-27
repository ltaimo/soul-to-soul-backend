import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
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
    updateCustomer(id: string, data: any): Promise<{
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
    updateCustomerStatus(id: string, status: string): Promise<{
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
}
