import bcrypt from "bcrypt";
import { type JwtPayload } from "jsonwebtoken";
import prisma from "../../../lib/prisma.js";
import { jwtHelper } from "../../helper/jwtHelper.js";
import envConfig from "../../config/env.config.js";



const registerAsGuest = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}) => {
    // 🔐 Check email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (existingUser) {
        throw new Error("Email already registered");
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(payload.password, Number(envConfig.Salt_rounds));

    // ✅ Create user securely
    const result = await prisma.user.create({
        data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: hashedPassword,
            role: "GUEST",
        },
    });

    // ❌ Never return password
    const { password, ...safeUser } = result;
    return safeUser;
};

const login = async (payload: { email: string; password: string }) => {
    // 1️⃣ Find user
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (!user) {
        throw new Error("Account not found");
    }

    // 2️⃣ Check account status
    if (!user.isActive) {
        throw new Error("Account is disabled");
    }

    // 3️⃣ Compare password
    const isPasswordMatch = await bcrypt.compare(
        payload.password,
        user.password
    );

    if (!isPasswordMatch) {
        throw new Error("Invalid password");
    }

    // 4️⃣ JWT payload (✅ MUST MATCH auth middleware)
    const jwtPayload = {
        id: user.id,          // ✅ FIXED
        email: user.email,
        role: user.role,
    };

    const accessToken = jwtHelper.generateToken(
        jwtPayload,
        envConfig.JWT.JWT_ACCESS_SECRET,
        envConfig.JWT.JWT_ACCESS_EXPIRES_IN as string
    );

    const refreshToken = jwtHelper.generateToken(
        jwtPayload,
        envConfig.JWT.JWT_REFRESH_SECRET,
        envConfig.JWT.JWT_REFRESH_EXPIRES_IN as string
    );

    // 5️⃣ Remove sensitive fields
    const { password, ...safeUser } = user;

    // 6️⃣ Return response
    return {
        user: safeUser,
        accessToken,
        refreshToken,
    };
};


export const AuthService = {
    login,
    registerAsGuest
};
