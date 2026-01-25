// src/app/modules/session/session.service.ts
import prisma from "../../../lib/prisma.js";
import ApiError from "../../errors/ApiError.js";
import { statusCode } from "../../shared/statusCode.js";


export const isValidSessionName = (value: string): boolean => {
    // Must be exactly "YY-YY"
    const match = value.match(/^(\d{2})-(\d{2})$/);
    if (!match) return false;

    const startYear = Number(match[1]);
    const endYear = Number(match[2]);

    // endYear must be startYear + 1
    return endYear === startYear + 1;
};

const createSession = async (payload: { name: string }) => {

    const exists = await prisma.session.findUnique({
        where: { name: payload.name },
    });

    if (exists) {
        throw new ApiError(statusCode.BAD_REQUEST, "This Session already exists");
    }
    if (!isValidSessionName(payload.name)) {
        throw new Error("Session format must be like 23-24,  24 - 25");
    }


    return prisma.session.create({
        data: {
            name: payload.name
        },
    });
};

const getAllSessions = async () => {
    return prisma.session.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
    });
};

const softDeleteSession = async (id: string) => {
    return prisma.session.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });
};

export const SessionService = {
    createSession,
    getAllSessions,
    softDeleteSession,
};
