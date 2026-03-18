"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const prisma = new client_1.PrismaClient();
class AuthService {
    static async login(username, password) {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email: username }],
            },
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (user.status === 'BANNED') {
            throw new Error('Your account has been suspended. Please contact the administrator.');
        }
        if (user.status === 'DELETED') {
            throw new Error('Account not found');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        const accessToken = this.generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = this.generateRefreshToken({ userId: user.id, role: user.role });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                storageQuota: user.storageQuota.toString(),
                storageUsed: user.storageUsed.toString(),
                status: user.status,
            },
        };
    }
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
        });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
            expiresIn: config_1.config.jwt.refreshExpiresIn,
        });
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
    }
    static async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        const isValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValid)
            throw new Error('Current password is incorrect');
        if (newPassword.length < 8)
            throw new Error('New password must be at least 8 characters');
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        return { success: true };
    }
    static async getUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                storageQuota: true,
                storageUsed: true,
                status: true,
                createdAt: true,
                maxUploadSize: true,
                maxFilesPerUpload: true,
                allowedExtensions: true,
            },
        });
        if (!user)
            return null;
        return {
            ...user,
            storageQuota: user.storageQuota.toString(),
            storageUsed: user.storageUsed.toString(),
            maxUploadSize: user.maxUploadSize?.toString() || null,
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map