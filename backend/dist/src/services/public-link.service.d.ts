export declare class PublicLinkService {
    static createLink(fileId: number, userId: number, options: {
        password?: string;
        expiresAt?: Date;
        maxDownloads?: number;
    }): Promise<{
        hasPassword: boolean;
        password: undefined;
        id: number;
        createdAt: Date;
        fileId: number;
        token: string;
        expiresAt: Date | null;
        downloadCount: number;
        maxDownloads: number | null;
    }>;
    static getLinksForFile(fileId: number, userId: number): Promise<{
        hasPassword: boolean;
        password: undefined;
        id: number;
        createdAt: Date;
        fileId: number;
        token: string;
        expiresAt: Date | null;
        downloadCount: number;
        maxDownloads: number | null;
    }[]>;
    static revokeLink(linkId: number, userId: number): Promise<{
        success: boolean;
    }>;
    static getPublicFile(token: string): Promise<{
        fileName: string;
        fileSize: string;
        mimeType: string;
        hasPassword: boolean;
        expiresAt: Date | null;
    }>;
    static downloadPublicFile(token: string, password?: string): Promise<{
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
    }>;
}
//# sourceMappingURL=public-link.service.d.ts.map