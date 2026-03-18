export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'USER' | 'SYSADMIN';
  storageQuota: string;
  storageUsed: string;
  status: 'ACTIVE' | 'BANNED' | 'DELETED';
  createdAt: string;
  maxUploadSize: string | null;
  maxFilesPerUpload: number | null;
  allowedExtensions: string | null;
  scheduledDeletionAt?: string | null;
}

export interface FileItem {
  id: number;
  userId: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: string;
  mimeType: string;
  uploadDate: string;
  isDeleted: boolean;
  deletedAt: string | null;
  folderId: number | null;
  isStarred: boolean;
  lastAccessedAt: string | null;
  fileHash?: string | null;
  fileTags?: FileTag[];
}

export interface StorageUsage {
  storageQuota: string;
  storageUsed: string;
  storageRemaining: string;
  percentUsed: number;
}

export interface ActivityLog {
  id: number;
  adminId: number;
  actionType: string;
  targetUserId: number | null;
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
  admin: { id: number; name: string; username: string };
  targetUser: { id: number; name: string; username: string } | null;
}

export interface PaginatedResponse {
  total: number;
  page: number;
  totalPages: number;
  [key: string]: any;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalFiles: number;
  duplicateCount: number;
  totalStorageUsed: string;
  totalStorageAllocated: string;
}

export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  size?: string;
}

export interface FileShareItem {
  id: number;
  fileId: number;
  sharedByUserId: number;
  sharedWithUserId: number;
  permission: 'VIEW' | 'DOWNLOAD';
  createdAt: string;
  file: FileItem & { user?: { id: number; name: string; username: string; email: string } };
  sharedBy: { id: number; name: string; username: string; email: string };
  sharedWith: { id: number; name: string; username: string; email: string };
}

export interface FileVersionItem {
  id: number;
  fileId: number;
  versionNumber: number;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

export interface FolderShareItem {
  id: number;
  folderId: number;
  sharedByUserId: number;
  sharedWithUserId: number;
  permission: 'VIEW' | 'DOWNLOAD';
  createdAt: string;
  folder: Folder;
  sharedBy: { id: number; name: string; username: string; email: string };
  sharedWith: { id: number; name: string; username: string; email: string };
}

export interface PublicLinkItem {
  id: number;
  fileId: number;
  token: string;
  hasPassword: boolean;
  expiresAt: string | null;
  downloadCount: number;
  maxDownloads: number | null;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  userId?: number | null;
}

export interface FileTag {
  fileId: number;
  tagId: number;
  tag: Tag;
}
