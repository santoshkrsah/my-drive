"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const prisma = new client_1.PrismaClient();
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, status: true },
        });
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        if (user.status === 'BANNED') {
            res.status(403).json({ error: 'Your account has been suspended. Please contact the administrator.' });
            return;
        }
        if (user.status === 'DELETED') {
            res.status(401).json({ error: 'Account has been deleted' });
            return;
        }
        req.user = {
            id: decoded.userId,
            role: decoded.role,
            impersonatedBy: decoded.impersonatedBy,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.requireAuth = requireAuth;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // During impersonation, allow admin routes if the impersonator was an admin
        if (req.user.impersonatedBy && roles.includes('SYSADMIN')) {
            next();
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.middleware.js.map