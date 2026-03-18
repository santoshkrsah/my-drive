import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
export declare const upload: multer.Multer;
export declare function validateUploadLimits(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=upload.middleware.d.ts.map