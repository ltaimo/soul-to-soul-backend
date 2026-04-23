import { PrismaService } from '../prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(): Promise<{
        id: number;
        companyName: string;
        companyLogo: string | null;
        defaultCurrency: string;
        currencySymbol: string;
        decimalFormatting: number;
        updatedAt: Date;
    }>;
    updateSettings(data: any): Promise<{
        success: boolean;
        settings: {
            id: number;
            companyName: string;
            companyLogo: string | null;
            defaultCurrency: string;
            currencySymbol: string;
            decimalFormatting: number;
            updatedAt: Date;
        };
    }>;
}
