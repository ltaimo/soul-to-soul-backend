import { PrismaService } from '../prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    seedDefaultAdmin(): Promise<void>;
    createUser(data: any): Promise<{
        success: boolean;
        user: {
            fullName: string;
            email: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
            id: number;
        };
    }>;
    updateUser(id: number, data: any): Promise<{
        success: boolean;
        user: {
            fullName: string;
            email: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
            id: number;
        };
    }>;
    changeStatus(id: number, status: string, updatedBy?: number): Promise<{
        success: boolean;
        user: {
            fullName: string;
            email: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
            id: number;
        };
    }>;
    changeRole(id: number, role: string, updatedBy?: number): Promise<{
        success: boolean;
        user: {
            fullName: string;
            email: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
            id: number;
        };
    }>;
    getAllUsers(): Promise<{
        fullName: string;
        email: string;
        role: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: number | null;
        updatedBy: number | null;
        id: number;
    }[]>;
}
