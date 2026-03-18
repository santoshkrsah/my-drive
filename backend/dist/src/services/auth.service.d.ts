import { JwtPayload } from '../middleware/auth.middleware';
export declare class AuthService {
    static login(username: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            name: string;
            email: string;
            username: string;
            role: import(".prisma/client").$Enums.Role;
            storageQuota: string;
            storageUsed: string;
            status: "ACTIVE";
        };
    }>;
    static generateAccessToken(payload: JwtPayload): string;
    static generateRefreshToken(payload: Pick<JwtPayload, 'userId' | 'role'>): string;
    static verifyRefreshToken(token: string): JwtPayload;
    static changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    static getUserById(id: number): Promise<{
        storageQuota: string;
        storageUsed: string;
        maxUploadSize: string | null;
        id: number;
        email: string;
        username: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        maxFilesPerUpload: number | null;
        allowedExtensions: string | null;
        createdAt: Date;
    } | null>;
}
//# sourceMappingURL=auth.service.d.ts.map