"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const file_routes_1 = __importDefault(require("./routes/file.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const folder_routes_1 = __importDefault(require("./routes/folder.routes"));
const share_routes_1 = __importDefault(require("./routes/share.routes"));
const version_routes_1 = __importDefault(require("./routes/version.routes"));
const public_link_routes_1 = __importDefault(require("./routes/public-link.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const tag_routes_1 = __importDefault(require("./routes/tag.routes"));
const trash_cleanup_service_1 = require("./services/trash-cleanup.service");
const user_cleanup_service_1 = require("./services/user-cleanup.service");
const app = (0, express_1.default)();
const isProd = process.env.NODE_ENV === 'production';
// Ensure uploads directory exists
if (!fs_1.default.existsSync(config_1.config.upload.dir)) {
    fs_1.default.mkdirSync(config_1.config.upload.dir, { recursive: true });
}
// Middleware
app.use((0, helmet_1.default)({
    // Allow inline scripts/styles needed by React in production
    contentSecurityPolicy: isProd ? undefined : false,
}));
// CORS — in production the frontend is served by Express itself (same-origin),
// so no CORS header is needed. In development allow the Vite dev server.
if (!isProd) {
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }));
}
app.use((0, morgan_1.default)(isProd ? 'combined' : 'dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/files', file_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/folders', folder_routes_1.default);
app.use('/api/shares', share_routes_1.default);
app.use('/api/versions', version_routes_1.default);
app.use('/api/public-links', public_link_routes_1.default);
app.use('/api/public', public_routes_1.default);
app.use('/api/activity', activity_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/tags', tag_routes_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ── Production: serve the built React app ────────────────────────────────────
if (isProd) {
    const publicDir = path_1.default.join(__dirname, '..', 'public');
    if (fs_1.default.existsSync(publicDir)) {
        // Serve static assets (JS, CSS, images …)
        app.use(express_1.default.static(publicDir));
        // React Router — return index.html for every non-API path so client-side
        // navigation works after a hard refresh
        app.get('*', (_req, res) => {
            res.sendFile(path_1.default.join(publicDir, 'index.html'));
        });
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Global error handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});
app.listen(config_1.config.port, () => {
    console.log(`My Drive server running on port ${config_1.config.port} [${isProd ? 'production' : 'development'}]`);
    // Run trash cleanup on startup and every 6 hours
    trash_cleanup_service_1.TrashCleanupService.cleanupExpiredTrash().catch(console.error);
    setInterval(() => {
        trash_cleanup_service_1.TrashCleanupService.cleanupExpiredTrash().catch(console.error);
    }, 6 * 60 * 60 * 1000);
    // Run user cleanup on startup and every 2 minutes
    user_cleanup_service_1.UserCleanupService.cleanupScheduledDeletions().catch(console.error);
    setInterval(() => {
        user_cleanup_service_1.UserCleanupService.cleanupScheduledDeletions().catch(console.error);
    }, 2 * 60 * 1000);
});
exports.default = app;
//# sourceMappingURL=index.js.map