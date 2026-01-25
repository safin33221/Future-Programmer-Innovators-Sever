// src/app/modules/session/session.controller.ts
import type { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { statusCode } from "../../shared/statusCode.js";
import { SessionService } from "./session.service.js";

const createSession = catchAsync(async (req: Request, res: Response) => {
    const result = await SessionService.createSession(req.body);

    sendResponse(res, {
        status: statusCode.OK,
        success: true,
        message: "Session created successfully",
        data: result,
    });
});

const getAllSessions = catchAsync(async (_req: Request, res: Response) => {
    const result = await SessionService.getAllSessions();

    sendResponse(res, {
        status: statusCode.OK,
        success: true,
        message: "All session retrieve successful",
        data: result,
    });
});

const softDeleteSession = catchAsync(async (req: Request, res: Response) => {
    const result = await SessionService.softDeleteSession(req.params.id as string);

    sendResponse(res, {
        status: statusCode.OK,
        success: true,
        message: "Session deleted successfully",
        data: result,
    });
});

export const SessionController = {
    createSession,
    getAllSessions,
    softDeleteSession,
};
