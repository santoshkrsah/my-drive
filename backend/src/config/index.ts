import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    url: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/mydrive',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'mydrive-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'mydrive-jwt-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  upload: {
    dir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    maxFileSize: 100 * 1024 * 1024, // 100MB per file
  },
};
