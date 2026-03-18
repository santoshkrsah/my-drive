import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class PublicLinkService {
  static async createLink(fileId: number, userId: number, options: {
    password?: string;
    expiresAt?: Date;
    maxDownloads?: number;
  }) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });
    if (!file) throw new Error('File not found');

    const data: any = { fileId };
    if (options.password) {
      data.password = await bcrypt.hash(options.password, 10);
    }
    if (options.expiresAt) {
      data.expiresAt = options.expiresAt;
    }
    if (options.maxDownloads) {
      data.maxDownloads = options.maxDownloads;
    }

    const link = await prisma.publicLink.create({ data });
    return {
      ...link,
      hasPassword: !!link.password,
      password: undefined,
    };
  }

  static async getLinksForFile(fileId: number, userId: number) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });
    if (!file) throw new Error('File not found');

    const links = await prisma.publicLink.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });

    return links.map(link => ({
      ...link,
      hasPassword: !!link.password,
      password: undefined,
    }));
  }

  static async revokeLink(linkId: number, userId: number) {
    const link = await prisma.publicLink.findUnique({
      where: { id: linkId },
      include: { file: { select: { userId: true } } },
    });
    if (!link || link.file.userId !== userId) throw new Error('Link not found');

    await prisma.publicLink.delete({ where: { id: linkId } });
    return { success: true };
  }

  static async getPublicFile(token: string) {
    const link = await prisma.publicLink.findUnique({
      where: { token },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
    });

    if (!link) throw new Error('Link not found');

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new Error('Link has expired');
    }

    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      throw new Error('Download limit reached');
    }

    return {
      fileName: link.file.originalName,
      fileSize: link.file.fileSize.toString(),
      mimeType: link.file.mimeType,
      hasPassword: !!link.password,
      expiresAt: link.expiresAt,
    };
  }

  static async downloadPublicFile(token: string, password?: string) {
    const link = await prisma.publicLink.findUnique({
      where: { token },
      include: { file: true },
    });

    if (!link) throw new Error('Link not found');

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new Error('Link has expired');
    }

    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      throw new Error('Download limit reached');
    }

    if (link.password) {
      if (!password) throw new Error('Password required');
      const valid = await bcrypt.compare(password, link.password);
      if (!valid) throw new Error('Invalid password');
    }

    await prisma.publicLink.update({
      where: { id: link.id },
      data: { downloadCount: { increment: 1 } },
    });

    return link.file;
  }
}
