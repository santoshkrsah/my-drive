-- =============================================================================
-- My Drive — MySQL Database Schema
-- Database : u638211070_lmx_md
-- =============================================================================
-- HOW TO IMPORT:
--   1. Log in to Hostinger hPanel
--   2. Go to Databases → phpMyAdmin
--   3. Select database: u638211070_lmx_md
--   4. Click "Import" tab → Choose this file → Click "Go"
--
-- AFTER IMPORT:
--   Run this command from your backend/ folder on the server:
--     node -e "require('./dist/src/seed')" OR  npm run seed
--   This creates the initial admin account:
--     Username : admin
--     Password : admin123
--     Email    : admin@mydrive.com
--   IMPORTANT: Change the admin password immediately after first login!
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =============================================================================
-- TABLE: users
-- =============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`                  INT           NOT NULL AUTO_INCREMENT,
  `name`                VARCHAR(191)  NOT NULL,
  `email`               VARCHAR(191)  NOT NULL,
  `username`            VARCHAR(191)  NOT NULL,
  `passwordHash`        VARCHAR(191)  NOT NULL,
  `role`                ENUM('USER','SYSADMIN') NOT NULL DEFAULT 'USER',
  `storageQuota`        BIGINT        NOT NULL DEFAULT 5368709120,
  `storageUsed`         BIGINT        NOT NULL DEFAULT 0,
  `status`              ENUM('ACTIVE','BANNED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  `maxUploadSize`       BIGINT        NULL,
  `maxFilesPerUpload`   INT           NULL,
  `allowedExtensions`   TEXT          NULL,
  `createdAt`           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `scheduledDeletionAt` DATETIME(3)   NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key`    (`email`),
  UNIQUE INDEX `users_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: folders
-- =============================================================================
CREATE TABLE IF NOT EXISTS `folders` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `userId`      INT           NOT NULL,
  `name`        VARCHAR(191)  NOT NULL,
  `parentId`    INT           NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `isDeleted`   TINYINT(1)    NOT NULL DEFAULT 0,
  `deletedAt`   DATETIME(3)   NULL,
  `pendingPurge` TINYINT(1)   NOT NULL DEFAULT 0,
  `purgeAfter`  DATETIME(3)   NULL,
  `adminViewed` TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `folders_userId_idx`   (`userId`),
  INDEX `folders_parentId_idx` (`parentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: files
-- =============================================================================
CREATE TABLE IF NOT EXISTS `files` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `userId`         INT           NOT NULL,
  `fileName`       VARCHAR(191)  NOT NULL,
  `originalName`   VARCHAR(191)  NOT NULL,
  `filePath`       VARCHAR(191)  NOT NULL,
  `fileSize`       BIGINT        NOT NULL,
  `mimeType`       VARCHAR(191)  NOT NULL,
  `uploadDate`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isDeleted`      TINYINT(1)    NOT NULL DEFAULT 0,
  `deletedAt`      DATETIME(3)   NULL,
  `folderId`       INT           NULL,
  `fileHash`       VARCHAR(191)  NULL,
  `isStarred`      TINYINT(1)    NOT NULL DEFAULT 0,
  `lastAccessedAt` DATETIME(3)   NULL,
  `pendingPurge`   TINYINT(1)    NOT NULL DEFAULT 0,
  `purgeAfter`     DATETIME(3)   NULL,
  `adminViewed`    TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `files_userId_idx`   (`userId`),
  INDEX `files_folderId_idx` (`folderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: file_shares
-- =============================================================================
CREATE TABLE IF NOT EXISTS `file_shares` (
  `id`               INT           NOT NULL AUTO_INCREMENT,
  `fileId`           INT           NOT NULL,
  `sharedByUserId`   INT           NOT NULL,
  `sharedWithUserId` INT           NOT NULL,
  `permission`       VARCHAR(191)  NOT NULL DEFAULT 'VIEW',
  `createdAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `file_shares_fileId_sharedWithUserId_key` (`fileId`, `sharedWithUserId`),
  INDEX `file_shares_sharedWithUserId_idx` (`sharedWithUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: file_versions
-- =============================================================================
CREATE TABLE IF NOT EXISTS `file_versions` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `fileId`        INT          NOT NULL,
  `versionNumber` INT          NOT NULL,
  `fileName`      VARCHAR(191) NOT NULL,
  `filePath`      VARCHAR(191) NOT NULL,
  `fileSize`      BIGINT       NOT NULL,
  `uploadedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `file_versions_fileId_idx` (`fileId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: activity_logs
-- =============================================================================
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `adminId`      INT           NOT NULL,
  `actionType`   VARCHAR(191)  NOT NULL,
  `targetUserId` INT           NULL,
  `details`      TEXT          NULL,
  `ipAddress`    VARCHAR(191)  NULL,
  `timestamp`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `activity_logs_adminId_idx`      (`adminId`),
  INDEX `activity_logs_targetUserId_idx` (`targetUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: user_activities
-- =============================================================================
CREATE TABLE IF NOT EXISTS `user_activities` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `userId`       INT           NOT NULL,
  `actionType`   VARCHAR(191)  NOT NULL,
  `resourceType` VARCHAR(191)  NOT NULL,
  `resourceId`   INT           NULL,
  `resourceName` VARCHAR(191)  NULL,
  `details`      TEXT          NULL,
  `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `user_activities_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: public_links
-- =============================================================================
CREATE TABLE IF NOT EXISTS `public_links` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `fileId`        INT           NOT NULL,
  `token`         VARCHAR(191)  NOT NULL,
  `password`      VARCHAR(191)  NULL,
  `expiresAt`     DATETIME(3)   NULL,
  `downloadCount` INT           NOT NULL DEFAULT 0,
  `maxDownloads`  INT           NULL,
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `public_links_token_key`  (`token`),
  INDEX `public_links_fileId_idx` (`fileId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: folder_shares
-- =============================================================================
CREATE TABLE IF NOT EXISTS `folder_shares` (
  `id`               INT           NOT NULL AUTO_INCREMENT,
  `folderId`         INT           NOT NULL,
  `sharedByUserId`   INT           NOT NULL,
  `sharedWithUserId` INT           NOT NULL,
  `permission`       VARCHAR(191)  NOT NULL DEFAULT 'VIEW',
  `createdAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `folder_shares_folderId_sharedWithUserId_key` (`folderId`, `sharedWithUserId`),
  INDEX `folder_shares_sharedWithUserId_idx` (`sharedWithUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `userId`    INT          NOT NULL,
  `title`     VARCHAR(191) NOT NULL,
  `message`   TEXT         NOT NULL,
  `isRead`    TINYINT(1)   NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `notifications_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: tags
-- =============================================================================
CREATE TABLE IF NOT EXISTS `tags` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `color`     VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId`    INT          NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tags_name_userId_key` (`name`, `userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: file_tags
-- =============================================================================
CREATE TABLE IF NOT EXISTS `file_tags` (
  `fileId` INT NOT NULL,
  `tagId`  INT NOT NULL,
  PRIMARY KEY (`fileId`, `tagId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================================================

ALTER TABLE `folders`
  ADD CONSTRAINT `folders_userId_fkey`   FOREIGN KEY (`userId`)   REFERENCES `users`   (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `folders_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `folders` (`id`) ON DELETE SET NULL;

ALTER TABLE `files`
  ADD CONSTRAINT `files_userId_fkey`   FOREIGN KEY (`userId`)   REFERENCES `users`   (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `files_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders` (`id`) ON DELETE SET NULL;

ALTER TABLE `file_shares`
  ADD CONSTRAINT `file_shares_fileId_fkey`           FOREIGN KEY (`fileId`)           REFERENCES `files` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `file_shares_sharedByUserId_fkey`   FOREIGN KEY (`sharedByUserId`)   REFERENCES `users` (`id`),
  ADD CONSTRAINT `file_shares_sharedWithUserId_fkey` FOREIGN KEY (`sharedWithUserId`) REFERENCES `users` (`id`);

ALTER TABLE `file_versions`
  ADD CONSTRAINT `file_versions_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files` (`id`) ON DELETE CASCADE;

ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_adminId_fkey`      FOREIGN KEY (`adminId`)      REFERENCES `users` (`id`),
  ADD CONSTRAINT `activity_logs_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `users` (`id`);

ALTER TABLE `user_activities`
  ADD CONSTRAINT `user_activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `public_links`
  ADD CONSTRAINT `public_links_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files` (`id`) ON DELETE CASCADE;

ALTER TABLE `folder_shares`
  ADD CONSTRAINT `folder_shares_folderId_fkey`         FOREIGN KEY (`folderId`)         REFERENCES `folders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `folder_shares_sharedByUserId_fkey`   FOREIGN KEY (`sharedByUserId`)   REFERENCES `users`   (`id`),
  ADD CONSTRAINT `folder_shares_sharedWithUserId_fkey` FOREIGN KEY (`sharedWithUserId`) REFERENCES `users`   (`id`);

ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `tags`
  ADD CONSTRAINT `tags_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `file_tags`
  ADD CONSTRAINT `file_tags_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `file_tags_tagId_fkey`  FOREIGN KEY (`tagId`)  REFERENCES `tags`  (`id`) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- NEXT STEP: Seed the initial admin user
-- =============================================================================
-- After importing this schema, SSH into your Hostinger server and run:
--
--   cd ~/domains/yourdomain.com/public_html   (or wherever you uploaded backend/)
--   npm run seed
--
-- This will create:
--   Username : admin
--   Password : admin123
--   Email    : admin@mydrive.com
--
-- IMPORTANT: Log in and change the admin password immediately!
-- =============================================================================
