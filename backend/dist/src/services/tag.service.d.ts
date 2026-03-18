export declare class TagService {
    static listTags(userId?: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        userId: number | null;
        color: string;
    }[]>;
    static createTag(name: string, color: string, userId?: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        userId: number | null;
        color: string;
    }>;
    static updateTag(id: number, name: string, color: string, requestingUserId: number, role: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        userId: number | null;
        color: string;
    }>;
    static deleteTag(id: number, requestingUserId: number, role: string): Promise<{
        success: boolean;
    }>;
    static addTagToFile(fileId: number, tagId: number, userId: number): Promise<{
        success: boolean;
    }>;
    static removeTagFromFile(fileId: number, tagId: number, userId: number): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=tag.service.d.ts.map