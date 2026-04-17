import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getKPIs(): Promise<any>;
    getAlerts(): Promise<any>;
}
