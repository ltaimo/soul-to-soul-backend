import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
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
