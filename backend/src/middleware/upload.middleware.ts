import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// Use a high hard limit (5 GB) so per-user limits enforced in validateUploadLimits take effect
const HARD_FILE_SIZE_LIMIT = 5 * 1024 * 1024 * 1024;

export const upload = multer({
  storage,
  limits: {
    fileSize: HARD_FILE_SIZE_LIMIT,
    files: 50, // allow up to 50 files; per-user limit is enforced in validateUploadLimits
  },
});

export async function validateUploadLimits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { maxUploadSize: true, maxFilesPerUpload: true, allowedExtensions: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const errors: string[] = [];

    // Check max files per upload
    const maxFiles = user.maxFilesPerUpload ?? 10;
    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files per upload allowed`);
    }

    // Check individual file size
    const maxSize = user.maxUploadSize ? Number(user.maxUploadSize) : config.upload.maxFileSize;
    for (const file of files) {
      if (file.size > maxSize) {
        errors.push(`File "${file.originalname}" exceeds max upload size of ${Math.round(maxSize / (1024 * 1024))}MB`);
      }
    }

    // Check allowed extensions
    if (user.allowedExtensions) {
      let allowed: string[];
      try {
        allowed = JSON.parse(user.allowedExtensions);
      } catch {
        allowed = user.allowedExtensions.split(',').map(e => e.trim().toLowerCase());
      }
      if (allowed.length > 0) {
        for (const file of files) {
          const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
          if (!allowed.includes(ext)) {
            errors.push(`File type ".${ext}" is not allowed. Allowed: ${allowed.join(', ')}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      // Clean up uploaded files
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
      res.status(400).json({ error: errors.join('. ') });
      return;
    }

    next();
  } catch (error: any) {
    // Clean up uploaded files on error
    const files = req.files as Express.Multer.File[];
    if (files) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    res.status(500).json({ error: error.message });
  }
}
