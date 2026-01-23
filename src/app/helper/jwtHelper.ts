import jwt, { type JwtPayload, type Secret, type SignOptions } from 'jsonwebtoken';
const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
    const token = jwt.sign(payload, secret, {
        algorithm: "HS256",
        expiresIn: expiresIn
    } as SignOptions

    )
    return token
}

const verifyToken = (token: string, secret: string) => {
    return jwt.verify(token, secret) as JwtPayload
}

export const jwtHelper = {
    generateToken,
    verifyToken
}