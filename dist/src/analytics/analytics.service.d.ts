import { PrismaService } from '../prisma.service';
export declare class AnalyticsService {
    private prisma;
    private cache;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    getFinancialKPIs(): Promise<any>;
    getOperationalAlerts(): Promise<any>;
}
