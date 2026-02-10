import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error("SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD missing");
    }

    const exists = await prisma.user.findUnique({
        where: { email },
    });

    if (exists) {
        console.log("⚠️ Super Admin already exists");
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
        data: {
            firstName: "Super",
            lastName: "Admin",
            email,
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
            isVerified: true,
            isActive: true,
        },
    });

    console.log("✅ Super Admin seeded successfully");
}

main()
    .catch((err) => {
        console.error("❌ Seed failed", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
