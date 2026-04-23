import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    updateUser(id: string, data: any): Promise<{
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
    changeStatus(id: string, status: string, updatedBy?: number): Promise<{
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
    changeRole(id: string, role: string, updatedBy?: number): Promise<{
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
}
