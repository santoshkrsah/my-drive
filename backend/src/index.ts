import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
import adminRoutes from './routes/admin.routes';
import folderRoutes from './routes/folder.routes';
import shareRoutes from './routes/share.routes';
import versionRoutes from './routes/version.routes';
import publicLinkRoutes from './routes/public-link.routes';
import publicRoutes from './routes/public.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import tagRoutes from './routes/tag.routes';
import { TrashCleanupService } from './services/trash-cleanup.service';
import { UserCleanupService } from './services/user-cleanup.service';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Ensure uploads directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

// Middleware
app.use(helmet({
  // Allow inline scripts/styles needed by React in production
  contentSecurityPolicy: isProd ? undefined : false,
}));

// CORS — in production the frontend is served by Express itself (same-origin),
// so no CORS header is needed. In development allow the Vite dev server.
if (!isProd) {
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/public-links', publicLinkRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tags', tagRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Production: serve the built React app ────────────────────────────────────
if (isProd) {
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    // Serve static assets (JS, CSS, images …)
    app.use(express.static(publicDir));
    // React Router — return index.html for every non-API path so client-side
    // navigation works after a hard refresh
    app.get('*', (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(config.port, () => {
  console.log(`My Drive server running on port ${config.port} [${isProd ? 'production' : 'development'}]`);

  // Run trash cleanup on startup and every 6 hours
  TrashCleanupService.cleanupExpiredTrash().catch(console.error);
  setInterval(() => {
    TrashCleanupService.cleanupExpiredTrash().catch(console.error);
  }, 6 * 60 * 60 * 1000);

  // Run user cleanup on startup and every 2 minutes
  UserCleanupService.cleanupScheduledDeletions().catch(console.error);
  setInterval(() => {
    UserCleanupService.cleanupScheduledDeletions().catch(console.error);
  }, 2 * 60 * 1000);
});

export default app;
