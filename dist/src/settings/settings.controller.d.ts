import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
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
