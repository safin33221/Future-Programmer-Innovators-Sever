import type { NextFunction, Request, Response } from "express";

import { AuthService } from "./auth.service.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { statusCode } from "../../shared/statusCode.js";

const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body)
    const { accessToken, refreshToken, user } = result
    res.cookie("accessToken", accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60
    })
    res.cookie("refreshToken", refreshToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 90
    })
    sendResponse(res, {
        status: statusCode.OK,
        success: true,
        message: "login successful",
        data: user
    })
})

export const authController = {
    login
}