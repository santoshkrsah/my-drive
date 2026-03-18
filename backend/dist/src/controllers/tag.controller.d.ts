import { Request, Response } from 'express';
export declare class TagController {
    static listTags(req: Request, res: Response): Promise<void>;
    static createTag(req: Request, res: Response): Promise<void>;
    static updateTag(req: Request, res: Response): Promise<void>;
    static deleteTag(req: Request, res: Response): Promise<void>;
    static addTagToFile(req: Request, res: Response): Promise<void>;
    static removeTagFromFile(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=tag.controller.d.ts.map