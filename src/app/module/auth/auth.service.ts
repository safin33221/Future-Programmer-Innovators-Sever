import bcrypt from "bcrypt";
import { type JwtPayload } from "jsonwebtoken";
import prisma from "../../../lib/prisma.js";
import { jwtHelper } from "../../helper/jwtHelper.js";
import envConfig from "../../config/env.config.js";

const login = async (payload: { email: string; password: string }) => {
    // 1️⃣ Find user
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (!user) {
        throw new Error("Account Not found");
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
        throw new Error("Invalid Your password");
    }




    const JwtPayload = {
        userID: user.id,
        email: user.email,
        role: user.role

    } as JwtPayload
    const accessToken = jwtHelper.generateToken(JwtPayload, envConfig.JWT.JWT_ACCESS_SECRET, envConfig.JWT.JWT_ACCESS_EXPIRES_IN as string)
    const refreshToken = jwtHelper.generateToken(JwtPayload, envConfig.JWT.JWT_REFRESH_SECRET, envConfig.JWT.JWT_REFRESH_EXPIRES_IN as string)

    // 5️⃣ Remove sensitive fields


    const { password, ...safeUser } = user;

    // 6️⃣ Return response
    return {
        user: safeUser,
        accessToken,
        refreshToken

    };
};

export const AuthService = {
    login,
};
