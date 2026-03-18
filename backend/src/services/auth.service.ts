import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { JwtPayload } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class AuthService {
  static async login(username: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status === 'BANNED') {
      throw new Error('Your account has been suspended. Please contact the administrator.');
    }

    if (user.status === 'DELETED') {
      throw new Error('Account not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = this.generateRefreshToken({ userId: user.id, role: user.role });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        storageQuota: user.storageQuota.toString(),
        storageUsed: user.storageUsed.toString(),
        status: user.status,
      },
    };
  }

  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: Pick<JwtPayload, 'userId' | 'role'>): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Current password is incorrect');
    if (newPassword.length < 8) throw new Error('New password must be at least 8 characters');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  static async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        storageQuota: true,
        storageUsed: true,
        status: true,
        createdAt: true,
        maxUploadSize: true,
        maxFilesPerUpload: true,
        allowedExtensions: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      storageQuota: user.storageQuota.toString(),
      storageUsed: user.storageUsed.toString(),
      maxUploadSize: user.maxUploadSize?.toString() || null,
    };
  }
}
