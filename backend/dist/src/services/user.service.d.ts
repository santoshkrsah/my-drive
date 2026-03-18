import { Role } from '@prisma/client';
export interface CreateUserInput {
    name: string;
    email: string;
    username: string;
    password: string;
    role?: Role;
    storageQuota?: bigint;
    maxUploadSize?: bigint;
    maxFilesPerUpload?: number;
    allowedExtensions?: string;
}
export interface UpdateUserInput {
    name?: string;
    email?: string;
    role?: Role;
    storageQuota?: bigint;
    password?: string;
    maxUploadSize?: bigint | null;
    maxFilesPerUpload?: number | null;
    allowedExtensions?: string | null;
}
export declare class UserService {
    static createUser(input: CreateUserInput): Promise<{
        id: number;
        name: string;
        email: string;
        username: string;
        role: import(".prisma/client").$Enums.Role;
        storageQuota: string;
        storageUsed: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        maxUploadSize: string | null;
        maxFilesPerUpload: number | null;
        allowedExtensions: string | null;
    }>;
    static updateUser(id: number, input: UpdateUserInput): Promise<{
        id: number;
        name: string;
        email: string;
        username: string;
        role: import(".prisma/client").$Enums.Role;
        storageQuota: string;
        storageUsed: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        maxUploadSize: string | null;
        maxFilesPerUpload: number | null;
        allowedExtensions: string | null;
    }>;
    static deleteUser(id: number, permanent?: boolean, delayMinutes?: number): Promise<{
        deleted: boolean;
        permanent: boolean;
    }>;
    static banUser(id: number): Promise<{
        id: number;
        email: string;
        username: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        storageQuota: bigint;
        storageUsed: bigint;
        status: import(".prisma/client").$Enums.UserStatus;
        maxUploadSize: bigint | null;
        maxFilesPerUpload: number | null;
        allowedExtensions: string | null;
        createdAt: Date;
        updatedAt: Date;
        scheduledDeletionAt: Date | null;
    }>;
    static unbanUser(id: number): Promise<{
        id: number;
        email: string;
        username: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        storageQuota: bigint;
        storageUsed: bigint;
        status: import(".prisma/client").$Enums.UserStatus;
        maxUploadSize: bigint | null;
        maxFilesPerUpload: number | null;
        allowedExtensions: string | null;
        createdAt: Date;
        updatedAt: Date;
        scheduledDeletionAt: Date | null;
    }>;
    static getAllUsers(page?: number, limit?: number, search?: string): Promise<{
        users: {
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
            scheduledDeletionAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
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
//# sourceMappingURL=user.service.d.ts.map