import { OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';
export declare class UsersModule implements OnModuleInit {
    private usersService;
    constructor(usersService: UsersService);
    onModuleInit(): Promise<void>;
}
