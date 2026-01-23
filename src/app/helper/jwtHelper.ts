import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";

export interface IJwtPayload {
    id: string;
    email: string;
    role: string;
}

const generateToken = (
    payload: IJwtPayload,
    secret: Secret,
    expiresIn: string
): string => {
    return jwt.sign(payload, secret, {
        algorithm: "HS256",
        expiresIn,
    } as SignOptions);
};

const verifyToken = (token: string, secret: Secret): IJwtPayload => {
    return jwt.verify(token, secret) as IJwtPayload;
};

export const jwtHelper = {
    generateToken,
    verifyToken,
};
