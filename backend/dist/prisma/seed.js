"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const existingAdmin = await prisma.user.findFirst({
        where: { role: client_1.Role.SYSADMIN },
    });
    if (existingAdmin) {
        console.log('SysAdmin already exists, skipping seed.');
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash('admin123', 12);
    const admin = await prisma.user.create({
        data: {
            name: 'System Administrator',
            email: 'admin@mydrive.com',
            username: 'admin',
            passwordHash,
            role: client_1.Role.SYSADMIN,
            storageQuota: BigInt(10737418240), // 10GB
            storageUsed: BigInt(0),
            status: client_1.UserStatus.ACTIVE,
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
//# sourceMappingURL=seed.js.map