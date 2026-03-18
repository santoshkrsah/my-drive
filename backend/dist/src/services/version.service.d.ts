export declare class VersionService {
    static uploadNewVersion(fileId: number, userId: number, file: Express.Multer.File): Promise<{
        id: number;
        fileName: string;
        originalName: string;
        fileSize: string;
        mimeType: string;
        uploadDate: Date;
        versionSaved: number;
    }>;
    static getVersionHistory(fileId: number, userId: number): Promise<{
        id: number;
        fileId: number;
        versionNumber: number;
        fileName: string;
        filePath: string;
        fileSize: string;
        uploadedAt: Date;
    }[]>;
    static restoreVersion(fileId: number, versionId: number, userId: number): Promise<{
        id: number;
        fileName: string;
        fileSize: string;
        restoredFromVersion: number;
        currentVersionSaved: number;
    }>;
    static deleteVersion(versionId: number, userId: number): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=version.service.d.ts.map