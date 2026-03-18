export declare class ShareService {
    static shareFile(fileId: number, sharedByUserId: number, username: string, permission?: string): Promise<{
        file: {
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
        };
        sharedWith: {
            id: number;
            email: string;
            username: string;
            name: string;
        };
        id: number;
        createdAt: Date;
        fileId: number;
        sharedByUserId: number;
        sharedWithUserId: number;
        permission: string;
    }>;
    static getSharedWithMe(userId: number, page?: number, limit?: number): Promise<{
        shares: {
            file: {
                fileSize: string;
                user: {
                    id: number;
                    email: string;
                    username: string;
                    name: string;
                };
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
            };
            sharedBy: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
            id: number;
            createdAt: Date;
            fileId: number;
            sharedByUserId: number;
            sharedWithUserId: number;
            permission: string;
        }[];
        folderShares: ({
            folder: {
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
            };
            sharedBy: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
            sharedWith: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
        } & {
            id: number;
            createdAt: Date;
            folderId: number;
            sharedByUserId: number;
            sharedWithUserId: number;
            permission: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getSharedByMe(userId: number, page?: number, limit?: number): Promise<{
        shares: {
            file: {
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
            };
            sharedWith: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
            id: number;
            createdAt: Date;
            fileId: number;
            sharedByUserId: number;
            sharedWithUserId: number;
            permission: string;
        }[];
        folderShares: ({
            folder: {
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
            };
            sharedBy: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
            sharedWith: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
        } & {
            id: number;
            createdAt: Date;
            folderId: number;
            sharedByUserId: number;
            sharedWithUserId: number;
            permission: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getFileShares(fileId: number, userId: number): Promise<{
        shares: ({
            sharedWith: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
        } & {
            id: number;
            createdAt: Date;
            fileId: number;
            sharedByUserId: number;
            sharedWithUserId: number;
            permission: string;
        })[];
    }>;
    static removeShare(shareId: number, userId: number): Promise<{
        success: boolean;
    }>;
    static shareFolder(folderId: number, sharedByUserId: number, username: string, permission?: string): Promise<{
        folder: {
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
        };
        sharedWith: {
            id: number;
            email: string;
            username: string;
            name: string;
        };
    } & {
        id: number;
        createdAt: Date;
        folderId: number;
        sharedByUserId: number;
        sharedWithUserId: number;
        permission: string;
    }>;
    static getFolderShares(folderId: number, userId: number): Promise<{
        shares: ({
            sharedWith: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
        } & {
            id: number;
            createdAt: Date;
            folderId: number;
            sharedByUserId: number;
            sharedWithUserId: number;
            permission: string;
        })[];
    }>;
    static removeFolderShare(shareId: number, userId: number): Promise<{
        success: boolean;
    }>;
    static getSharedFolders(userId: number, page?: number, limit?: number): Promise<{
        shares: ({
            folder: {
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
            };
            sharedBy: {
                id: number;
                email: string;
                username: string;
                name: string;
            };
        } & {
            id: number;
            createdAt: Date;
            folderId: number;
            sharedByUserId: number;
            sharedWithUserId: number;
            permission: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=share.service.d.ts.map