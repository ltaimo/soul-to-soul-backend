import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    updateUser(id: string, data: any): Promise<{
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
    changeStatus(id: string, status: string, updatedBy?: number): Promise<{
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
    changeRole(id: string, role: string, updatedBy?: number): Promise<{
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
}
