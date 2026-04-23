"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDefaultAdmin() {
        const userCount = await this.prisma.user.count();
        if (userCount === 0) {
            const passwordHash = await bcrypt.hash('SoulAdmin#2026!', 10);
            await this.prisma.user.create({
                data: {
                    fullName: 'System Administrator',
                    email: 'admin@soultosoul.local',
                    passwordHash,
                    role: 'admin',
                    status: 'active'
                }
            });
            console.log('Seeded default admin user: admin@soultosoul.local / Admin@123');
        }
    }
    async createUser(data) {
        if (!data.password || data.password.length < 6) {
            throw new common_1.BadRequestException('Password must be at least 6 characters.');
        }
        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new common_1.ConflictException('Email is already registered.');
        }
        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash,
                role: data.role || 'staff',
                status: data.status || 'active',
                createdBy: data.createdBy
            }
        });
        const { passwordHash: _, ...safeUser } = user;
        return { success: true, user: safeUser };
    }
    async updateUser(id, data) {
        const patch = {
            fullName: data.fullName,
            email: data.email,
            updatedBy: data.updatedBy
        };
        if (data.password && data.password.length >= 6) {
            patch.passwordHash = await bcrypt.hash(data.password, 10);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: patch
        });
        const { passwordHash: _, ...safeUser } = user;
        return { success: true, user: safeUser };
    }
    async changeStatus(id, status, updatedBy) {
        if (status === 'inactive') {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (user?.role === 'admin') {
                const activeAdmins = await this.prisma.user.count({ where: { role: 'admin', status: 'active' } });
                if (activeAdmins <= 1) {
                    throw new common_1.BadRequestException('Cannot deactivate the last active administrator.');
                }
            }
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: { status, updatedBy }
        });
        const { passwordHash: _, ...safeUser } = user;
        return { success: true, user: safeUser };
    }
    async changeRole(id, role, updatedBy) {
        const userTarget = await this.prisma.user.findUnique({ where: { id } });
        if (userTarget?.role === 'admin' && role !== 'admin') {
            const activeAdmins = await this.prisma.user.count({ where: { role: 'admin', status: 'active' } });
            if (activeAdmins <= 1) {
                throw new common_1.BadRequestException('Cannot demote the last active administrator.');
            }
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: { role, updatedBy }
        });
        const { passwordHash: _, ...safeUser } = user;
        return { success: true, user: safeUser };
    }
    async getAllUsers() {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return users.map(user => {
            const { passwordHash, ...safeUser } = user;
            return safeUser;
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map