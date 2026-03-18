export declare class FileService {
    static uploadFile(userId: number, file: Express.Multer.File, folderId?: number): Promise<{
        id: number;
        fileName: string;
        originalName: string;
        fileSize: string;
        mimeType: string;
        uploadDate: Date;
    }>;
    static getUserFiles(userId: number, page?: number, limit?: number, includeDeleted?: boolean, folderId?: number, sortBy?: string, sortDir?: 'asc' | 'desc'): Promise<{
        files: {
            fileSize: string;
            fileTags: ({
                tag: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    userId: number | null;
                    color: string;
                };
            } & {
                fileId: number;
                tagId: number;
            })[];
            id: number;
            userId: number;
            fileName: string;
            originalName: string;
            filePath: string;
            mimeType: string;
            uploadDate: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            folderId: number | null;
            fileHash: string | null;
            isStarred: boolean;
            lastAccessedAt: Date | null;
            pendingPurge: boolean;
            purgeAfter: Date | null;
            adminViewed: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getTrashFiles(userId: number, page?: number, limit?: number): Promise<{
        files: {
            fileSize: string;
            id: number;
            userId: number;
            fileName: string;
            originalName: string;
            filePath: string;
            mimeType: string;
            uploadDate: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            folderId: number | null;
            fileHash: string | null;
            isStarred: boolean;
            lastAccessedAt: Date | null;
            pendingPurge: boolean;
            purgeAfter: Date | null;
            adminViewed: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getFileById(fileId: number): Promise<{
        id: number;
        userId: number;
        fileName: string;
        originalName: string;
        filePath: string;
        fileSize: bigint;
        mimeType: string;
        uploadDate: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        folderId: number | null;
        fileHash: string | null;
        isStarred: boolean;
        lastAccessedAt: Date | null;
        pendingPurge: boolean;
        purgeAfter: Date | null;
        adminViewed: boolean;
    } | null>;
    static softDeleteFile(fileId: number, userId: number): Promise<{
        success: boolean;
    }>;
    static restoreFile(fileId: number, userId: number): Promise<{
        success: boolean;
    }>;
    static permanentDeleteFile(fileId: number, userId: number): Promise<{
        success: boolean;
    }>;
    static emptyTrash(userId: number): Promise<{
        deleted: number;
    }>;
    static getStorageUsage(userId: number): Promise<{
        storageQuota: string;
        storageUsed: string;
        storageRemaining: string;
        percentUsed: number;
    }>;
    static hasSharedAccess(fileId: number, userId: number, requiredPermission?: 'VIEW' | 'DOWNLOAD'): Promise<boolean>;
    static renameFile(fileId: number, userId: number, newName: string, userRole?: string): Promise<{
        fileSize: string;
        id: number;
        userId: number;
        fileName: string;
        originalName: string;
        filePath: string;
        mimeType: string;
        uploadDate: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        folderId: number | null;
        fileHash: string | null;
        isStarred: boolean;
        lastAccessedAt: Date | null;
        pendingPurge: boolean;
        purgeAfter: Date | null;
        adminViewed: boolean;
    }>;
    static moveFile(fileId: number, userId: number, targetFolderId: number | null): Promise<{
        fileSize: string;
        id: number;
        userId: number;
        fileName: string;
        originalName: string;
        filePath: string;
        mimeType: string;
        uploadDate: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        folderId: number | null;
        fileHash: string | null;
        isStarred: boolean;
        lastAccessedAt: Date | null;
        pendingPurge: boolean;
        purgeAfter: Date | null;
        adminViewed: boolean;
    }>;
    static searchFiles(userId: number, query: string, fileType?: string, dateFrom?: string, dateTo?: string, sizeMinMB?: number, sizeMaxMB?: number, tagIds?: number[]): Promise<{
        files: {
            fileSize: string;
            folder: {
                id: number;
                name: string;
            } | null;
            fileTags: ({
                tag: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    userId: number | null;
                    color: string;
                };
            } & {
                fileId: number;
                tagId: number;
            })[];
            id: number;
            userId: number;
            fileName: string;
            originalName: string;
            filePath: string;
            mimeType: string;
            uploadDate: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            folderId: number | null;
            fileHash: string | null;
            isStarred: boolean;
            lastAccessedAt: Date | null;
            pendingPurge: boolean;
            purgeAfter: Date | null;
            adminViewed: boolean;
        }[];
        folders: ({
            parent: {
                id: number;
                name: string;
            } | null;
        } & {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            isDeleted: boolean;
            deletedAt: Date | null;
            pendingPurge: boolean;
            purgeAfter: Date | null;
            adminViewed: boolean;
            parentId: number | null;
        })[];
    }>;
    static bulkDelete(fileIds: number[], userId: number): Promise<{
        deleted: number;
    }>;
    static bulkMove(fileIds: number[], userId: number, targetFolderId: number | null): Promise<{
        moved: number;
    }>;
    static getBulkFiles(fileIds: number[], userId: number): Promise<{
        id: number;
        userId: number;
        fileName: string;
        originalName: string;
        filePath: string;
        fileSize: bigint;
        mimeType: string;
        uploadDate: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        folderId: number | null;
        fileHash: string | null;
        isStarred: boolean;
        lastAccessedAt: Date | null;
        pendingPurge: boolean;
        purgeAfter: Date | null;
        adminViewed: boolean;
    }[]>;
    static computeFileHash(filePath: string): Promise<string>;
    static checkDuplicate(userId: number, fileHash: string): Promise<{
        isDuplicate: boolean;
        existingFile: {
            fileSize: string;
            id: number;
            originalName: string;
            uploadDate: Date;
        };
    } | {
        isDuplicate: boolean;
        existingFile?: undefined;
    }>;
    static deleteAllInFolder(userId: number, folderId?: number): Promise<{
        deleted: number;
    }>;
    static getRecentFiles(userId: number, limit?: number): Promise<{
        files: {
            fileSize: string;
            id: number;
            userId: number;
            fileName: string;
            originalName: string;
            filePath: string;
            mimeType: string;
            uploadDate: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            folderId: number | null;
            fileHash: string | null;
            isStarred: boolean;
            lastAccessedAt: Date | null;
            pendingPurge: boolean;
            purgeAfter: Date | null;
            adminViewed: boolean;
        }[];
        total: number;
    }>;
    static getStarredFiles(userId: number, page?: number, limit?: number): Promise<{
        files: {
            fileSize: string;
            id: number;
            userId: number;
            fileName: string;
            originalName: string;
            filePath: string;
            mimeType: string;
            uploadDate: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            folderId: number | null;
            fileHash: string | null;
            isStarred: boolean;
            lastAccessedAt: Date | null;
            pendingPurge: boolean;
            purgeAfter: Date | null;
            adminViewed: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static toggleStar(fileId: number, userId: number): Promise<{
        fileSize: string;
        id: number;
        userId: number;
        fileName: string;
        originalName: string;
        filePath: string;
        mimeType: string;
        uploadDate: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        folderId: number | null;
        fileHash: string | null;
        isStarred: boolean;
        lastAccessedAt: Date | null;
        pendingPurge: boolean;
        purgeAfter: Date | null;
        adminViewed: boolean;
    }>;
    static updateLastAccessed(fileId: number): Promise<void>;
    static getUserDashboard(userId: number): Promise<{
        storageQuota: string;
        storageUsed: string;
        totalFiles: number;
        recentFiles: {
            fileSize: string;
            id: number;
            originalName: string;
            mimeType: string;
            uploadDate: Date;
        }[];
        fileTypes: {
            mimeType: string;
            count: number;
            totalSize: string;
        }[];
        sharedCount: number;
        starredCount: number;
        duplicateCount: number;
    }>;
    static getDuplicateFiles(userId: number, page?: number, limit?: number): Promise<{
        files: {
            fileSize: string;
            id: number;
            originalName: string;
            mimeType: string;
            uploadDate: Date;
            fileHash: string | null;
            folder: {
                id: number;
                name: string;
            } | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getFileAccessLog(fileId: number, ownerUserId: number, page?: number, limit?: number): Promise<{
        logs: ({
            user: {
                id: number;
                username: string;
                name: string;
            };
        } & {
            id: number;
            createdAt: Date;
            userId: number;
            actionType: string;
            resourceType: string;
            resourceId: number | null;
            resourceName: string | null;
            details: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=file.service.d.ts.map