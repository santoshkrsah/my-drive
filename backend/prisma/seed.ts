import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.SYSADMIN },
  });

  if (existingAdmin) {
    console.log('SysAdmin already exists, skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@mydrive.com',
      username: 'admin',
      passwordHash,
      role: Role.SYSADMIN,
      storageQuota: BigInt(10737418240), // 10GB
      storageUsed: BigInt(0),
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`SysAdmin created: ${admin.username} (${admin.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
