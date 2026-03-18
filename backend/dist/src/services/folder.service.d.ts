export declare class FolderService {
    static getOrCreateFolder(userId: number, name: string, parentId?: number): Promise<{
        id: number;
        name: string;
    }>;
    static createFolder(userId: number, name: string, parentId?: number): Promise<{
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
    }>;
    static getFolderContents(userId: number, folderId?: number): Promise<{
        folders: {
            size: string;
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
        }[];
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
    }>;
    private static getFolderSizes;
    static renameFolder(folderId: number, userId: number, newName: string): Promise<{
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
    }>;
    static deleteFolder(folderId: number, userId: number): Promise<{
        success: boolean;
    }>;
    private static softDeleteFolderRecursive;
    static restoreFolder(folderId: number, userId: number): Promise<{
        success: boolean;
    }>;
    private static restoreFolderRecursive;
    static permanentDeleteFolder(folderId: number, userId: number): Promise<{
        success: boolean;
    }>;
    private static permanentDeleteFolderRecursive;
    static getTrashFolders(userId: number, page?: number, limit?: number): Promise<{
        folders: {
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
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getTrashFolderContents(userId: number, folderId: number): Promise<{
        folders: {
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
        }[];
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
    }>;
    static getFolderBreadcrumb(folderId: number): Promise<{
        id: number;
        name: string;
    }[]>;
    static moveFolder(folderId: number, userId: number, targetParentId: number | null): Promise<{
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
    }>;
    static getAllFolders(userId: number): Promise<{
        id: number;
        name: string;
        parentId: number | null;
    }[]>;
    static bulkDelete(folderIds: number[], userId: number): Promise<{
        deleted: number;
    }>;
    static emptyTrash(userId: number): Promise<{
        deleted: number;
    }>;
}
//# sourceMappingURL=folder.service.d.ts.map