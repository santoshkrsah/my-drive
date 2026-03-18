import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Request interceptor to attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never try to refresh when the login endpoint itself returns 401/403 —
    // those are credential errors that must surface to the caller as-is.
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                           originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// File API
export const fileApi = {
  list: (page = 1, limit = 20, folderId?: number, sortBy?: string, sortDir?: string) =>
    api.get('/files', { params: { page, limit, folderId, sortBy, sortDir } }),
  upload: (files: FormData, onProgress?: (progress: number) => void) =>
    api.post('/files/upload', files, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }),
  uploadFolder: (formData: FormData, onProgress?: (progress: number) => void) =>
    api.post('/files/upload-folder', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }),
  download: (id: number) =>
    api.get(`/files/${id}/download`, { responseType: 'blob' }),
  previewUrl: (id: number) => `/api/files/${id}/preview`,
  officePreview: (id: number) => api.get(`/files/${id}/office-preview`, { responseType: 'text' }),
  softDelete: (id: number) => api.delete(`/files/${id}`),
  permanentDelete: (id: number) => api.delete(`/files/${id}/permanent`),
  restore: (id: number) => api.post(`/files/${id}/restore`),
  trash: (page = 1, limit = 20) =>
    api.get('/files/trash', { params: { page, limit } }),
  storage: () => api.get('/files/storage'),
  search: (q: string, fileType?: string, dateFrom?: string, dateTo?: string, sizeMin?: string, sizeMax?: string, tagIds?: number[]) =>
    api.get('/files/search', { params: { q, fileType, dateFrom, dateTo, sizeMin, sizeMax, tagIds: tagIds?.join(',') } }),
  accessLog: (id: number, page = 1, limit = 20) =>
    api.get(`/files/${id}/access-log`, { params: { page, limit } }),
  rename: (id: number, name: string) => api.put(`/files/${id}/rename`, { name }),
  move: (id: number, folderId: number | null) => api.put(`/files/${id}/move`, { folderId }),
  bulkDelete: (fileIds: number[]) => api.post('/files/bulk-delete', { fileIds }),
  bulkMove: (fileIds: number[], folderId: number | null) =>
    api.post('/files/bulk-move', { fileIds, folderId }),
  bulkDownload: (fileIds: number[]) =>
    api.post('/files/bulk-download', { fileIds }, { responseType: 'blob' }),
  checkDuplicate: (hash: string) =>
    api.get('/files/check-duplicate', { params: { hash } }),
  getDuplicates: (page = 1, limit = 50) =>
    api.get('/files/duplicates', { params: { page, limit } }),
  deleteAll: (folderId?: number) =>
    api.post('/files/delete-all', { folderId }),
  emptyTrash: () =>
    api.post('/files/empty-trash'),
  recent: (limit?: number) =>
    api.get('/files/recent', { params: { limit } }),
  starred: (page = 1, limit = 20) =>
    api.get('/files/starred', { params: { page, limit } }),
  toggleStar: (id: number) =>
    api.put(`/files/${id}/star`),
  dashboard: () =>
    api.get('/files/dashboard'),
};

// Folder API
export const folderApi = {
  create: (name: string, parentId?: number | null) =>
    api.post('/folders', { name, parentId }),
  list: (parentId?: number | null) =>
    api.get('/folders', { params: { parentId } }),
  breadcrumb: (id: number) => api.get(`/folders/${id}/breadcrumb`),
  rename: (id: number, name: string) => api.put(`/folders/${id}`, { name }),
  delete: (id: number) => api.delete(`/folders/${id}`),
  move: (id: number, parentId: number | null) => api.put(`/folders/${id}/move`, { parentId }),
  allFolders: () => api.get('/folders/all'),
  trash: (page = 1, limit = 20) =>
    api.get('/folders/trash', { params: { page, limit } }),
  restore: (id: number) => api.post(`/folders/${id}/restore`),
  permanentDelete: (id: number) => api.delete(`/folders/${id}/permanent`),
  bulkDelete: (folderIds: number[]) => api.post('/folders/bulk-delete', { folderIds }),
  trashContents: (id: number) => api.get(`/folders/${id}/trash-contents`),
};

// Share API
export const shareApi = {
  share: (fileId: number, username: string, permission: string = 'VIEW') =>
    api.post('/shares', { fileId, username, permission }),
  sharedWithMe: (page = 1, limit = 20) =>
    api.get('/shares/with-me', { params: { page, limit } }),
  sharedByMe: (page = 1, limit = 20) =>
    api.get('/shares/by-me', { params: { page, limit } }),
  fileShares: (fileId: number) => api.get(`/shares/file/${fileId}`),
  remove: (id: number) => api.delete(`/shares/${id}`),
  shareFolder: (folderId: number, username: string, permission: string = 'VIEW') =>
    api.post('/shares/folder', { folderId, username, permission }),
  folderShares: (folderId: number) => api.get(`/shares/folder/${folderId}`),
  removeFolderShare: (id: number) => api.delete(`/shares/folder/${id}`),
};

// Version API
export const versionApi = {
  upload: (fileId: number, file: FormData) =>
    api.post(`/versions/${fileId}/upload`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  history: (fileId: number) => api.get(`/versions/${fileId}`),
  restore: (fileId: number, versionId: number) =>
    api.post(`/versions/${fileId}/restore/${versionId}`),
  delete: (versionId: number) => api.delete(`/versions/${versionId}`),
};

// Admin API
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  listUsers: (page = 1, limit = 20, search?: string) =>
    api.get('/admin/users', { params: { page, limit, search } }),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number, permanent = false, delayMinutes?: number) =>
    api.delete(`/admin/users/${id}`, { params: { permanent, ...(delayMinutes !== undefined && { delayMinutes }) } }),
  banUser: (id: number) => api.post(`/admin/users/${id}/ban`),
  unbanUser: (id: number) => api.post(`/admin/users/${id}/unban`),
  impersonate: (id: number) => api.post(`/admin/users/${id}/impersonate`),
  stopImpersonation: () => api.post('/admin/stop-impersonation'),
  getUserFiles: (id: number, page = 1, limit = 20) =>
    api.get(`/admin/users/${id}/files`, { params: { page, limit } }),
  getLogs: (page = 1, limit = 50, actionType?: string) =>
    api.get('/admin/logs', { params: { page, limit, actionType } }),
  clearLogs: () => api.delete('/admin/logs'),
  sendNotification: (data: { title: string; message: string; userIds?: number[]; sendToAll?: boolean }) =>
    api.post('/admin/notifications', data),
  recoverableFiles: () => api.get('/admin/recoverable-files'),
  recoverFile: (id: number) => api.post(`/admin/recoverable-files/${id}/recover`),
  purgeFile: (id: number) => api.delete(`/admin/recoverable-files/${id}`),
  recoverFolder: (id: number) => api.post(`/admin/recoverable-files/folders/${id}/recover`),
  purgeFolder: (id: number) => api.delete(`/admin/recoverable-files/folders/${id}`),
  bulkRecover: (fileIds: number[], folderIds: number[]) => api.post('/admin/recoverable-files/bulk-recover', { fileIds, folderIds }),
  bulkPurge: (fileIds: number[], folderIds: number[]) => api.post('/admin/recoverable-files/bulk-purge', { fileIds, folderIds }),
  recoverableUnviewedCount: () => api.get('/admin/recoverable-files/unviewed-count'),
  markRecoverableViewed: () => api.post('/admin/recoverable-files/mark-viewed'),
};

// Public Link API
export const publicLinkApi = {
  create: (fileId: number, options?: { password?: string; expiresAt?: string; maxDownloads?: number }) =>
    api.post('/public-links', { fileId, ...options }),
  listForFile: (fileId: number) => api.get(`/public-links/file/${fileId}`),
  revoke: (id: number) => api.delete(`/public-links/${id}`),
  getPublicFile: (token: string) => axios.get(`/api/public/${token}`),
  downloadPublicFile: (token: string, password?: string) =>
    axios.get(`/api/public/${token}/download`, { params: { password }, responseType: 'blob' }),
};

// Activity API
export const activityApi = {
  myActivity: (page = 1, limit = 50, actionType?: string) =>
    api.get('/activity/me', { params: { page, limit, actionType } }),
  clearMyActivity: () => api.delete('/activity/me'),
};

// Notification API
export const notificationApi = {
  list: (page = 1, limit = 20) =>
    api.get('/notifications', { params: { page, limit } }),
  unreadCount: () =>
    api.get('/notifications/unread-count'),
  markAsRead: (id: number) =>
    api.put(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  deleteOne: (id: number) =>
    api.delete(`/notifications/${id}`),
  deleteAll: () =>
    api.delete('/notifications/delete-all'),
};

// Tag API
export const tagApi = {
  list: () => api.get('/tags'),
  create: (name: string, color: string) => api.post('/tags', { name, color }),
  update: (id: number, name: string, color: string) => api.put(`/tags/${id}`, { name, color }),
  delete: (id: number) => api.delete(`/tags/${id}`),
  addToFile: (fileId: number, tagId: number) => api.post(`/tags/files/${fileId}/tags`, { tagId }),
  removeFromFile: (fileId: number, tagId: number) => api.delete(`/tags/files/${fileId}/tags/${tagId}`),
};

export default api;
