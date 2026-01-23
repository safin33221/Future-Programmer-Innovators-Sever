import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import envConfig from "../config/env.config.js";

/* =========================
   Types
========================= */
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

interface AccessTokenPayload {
    id: string;
    email: string;
    role: string;
}

/* =========================
   Verify Access Token
========================= */
export const auth =
    (...requiredRoles: string[]) =>
        async (req: AuthRequest, res: Response, next: NextFunction) => {
            try {
                const token = req.cookies.accessToken;

                if (!token) {
                    return res.status(401).json({
                        success: false,
                        message: "Unauthorized access",
                    });
                }

                const decoded = jwt.verify(
                    token,
                    envConfig.JWT.JWT_ACCESS_SECRET as string
                ) as AccessTokenPayload;

                // ✅ EXPLICIT assignment (THIS FIXES EVERYTHING)
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                };

                if (
                    requiredRoles.length &&
                    !requiredRoles.includes(decoded.role)
                ) {
                    return res.status(403).json({
                        success: false,
                        message: "Forbidden access",
                    });
                }

                next();
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }
        };
