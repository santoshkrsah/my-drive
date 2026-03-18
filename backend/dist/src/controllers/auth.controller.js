"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                res.status(400).json({ error: 'Username and password are required' });
                return;
            }
            const result = await auth_service_1.AuthService.login(username, password);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.json({
                accessToken: result.accessToken,
                user: result.user,
            });
        }
        catch (error) {
            const status = error.message.includes('suspended') ? 403 : 401;
            res.status(status).json({ error: error.message });
        }
    }
    static async logout(_req, res) {
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    }
    static async me(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const user = await auth_service_1.AuthService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.json({
                user,
                impersonatedBy: req.user.impersonatedBy || null,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({ error: 'Current and new password are required' });
                return;
            }
            await auth_service_1.AuthService.changePassword(req.user.id, currentPassword, newPassword);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async refresh(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                res.status(401).json({ error: 'Refresh token required' });
                return;
            }
            const decoded = auth_service_1.AuthService.verifyRefreshToken(refreshToken);
            const user = await auth_service_1.AuthService.getUserById(decoded.userId);
            if (!user) {
                res.status(401).json({ error: 'User not found' });
                return;
            }
            const accessToken = auth_service_1.AuthService.generateAccessToken({
                userId: decoded.userId,
                role: decoded.role,
                impersonatedBy: decoded.impersonatedBy,
            });
            res.json({ accessToken });
        }
        catch (error) {
            res.status(401).json({ error: 'Invalid refresh token' });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map