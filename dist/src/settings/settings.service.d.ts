import { PrismaService } from '../prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(): Promise<{
        id: number;
        updatedAt: Date;
        companyName: string;
        companyLogo: string | null;
        defaultCurrency: string;
        currencySymbol: string;
        decimalFormatting: number;
    }>;
    updateSettings(data: any): Promise<{
        success: boolean;
        settings: {
            id: number;
            updatedAt: Date;
            companyName: string;
            companyLogo: string | null;
            defaultCurrency: string;
            currencySymbol: string;
            decimalFormatting: number;
        };
    }>;
}
