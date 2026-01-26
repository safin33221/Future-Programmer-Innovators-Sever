import { UserRole } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import envConfig from "../config/env.config.js";

const seedSuperAdmin = async (): Promise<void> => {
    try {
        const isExistSuperAdmin = await prisma.user.findFirst({
            where: {
                email: envConfig.SUPER_ADMIN.SUPER_ADMIN_EMAIL,
            },
        });

        if (isExistSuperAdmin) {
            console.log("Super admin already exists!");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            envConfig.SUPER_ADMIN.SUPER_ADMIN_PASSWORD,
            Number(envConfig.Salt_rounds)
        );

        const superAdmin = await prisma.user.create({
            data: {
                firstName: "Super",
                lastName: "Admin",
                email: envConfig.SUPER_ADMIN.SUPER_ADMIN_EMAIL,
                password: hashedPassword,
                role: UserRole.ADMIN,
                admin: {
                    create: {
                        adminLevel: "SUPER",
                    },
                },
            },
        });

        console.log("Super Admin Created Successfully!", superAdmin);
    } catch (err) {
        console.error("Seed Super Admin Error:", err);
    } finally {
        await prisma.$disconnect();
    }
};

export default seedSuperAdmin;
