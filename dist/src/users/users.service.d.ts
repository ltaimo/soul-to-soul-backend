import { PrismaService } from '../prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    seedDefaultAdmin(): Promise<void>;
    createUser(data: any): Promise<{
        success: boolean;
        user: {
            id: number;
            status: string;
            updatedAt: Date;
            fullName: string;
            email: string;
            role: string;
            createdAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
        };
    }>;
    updateUser(id: number, data: any): Promise<{
        success: boolean;
        user: {
            id: number;
            status: string;
            updatedAt: Date;
            fullName: string;
            email: string;
            role: string;
            createdAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
        };
    }>;
    changeStatus(id: number, status: string, updatedBy?: number): Promise<{
        success: boolean;
        user: {
            id: number;
            status: string;
            updatedAt: Date;
            fullName: string;
            email: string;
            role: string;
            createdAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
        };
    }>;
    changeRole(id: number, role: string, updatedBy?: number): Promise<{
        success: boolean;
        user: {
            id: number;
            status: string;
            updatedAt: Date;
            fullName: string;
            email: string;
            role: string;
            createdAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
        };
    }>;
    getAllUsers(): Promise<{
        id: number;
        status: string;
        updatedAt: Date;
        fullName: string;
        email: string;
        role: string;
        createdAt: Date;
        createdBy: number | null;
        updatedBy: number | null;
    }[]>;
}
