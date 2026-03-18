"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
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
        dir: path_1.default.resolve(process.env.UPLOAD_DIR || './uploads'),
        maxFileSize: 100 * 1024 * 1024, // 100MB per file
    },
};
//# sourceMappingURL=index.js.map