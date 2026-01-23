import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";

import sendResponse from "../../shared/sendResponse";
import { statusCode } from "../../shared/statusCode";
import { UserService } from "./user.service";
import pick from "../../helper/pick";
import { userFilterableFields } from "./user.constant";
import type { AuthRequest } from "../../middleware/auth";


/* =========================
   Register User
========================= */
const registerAsGuest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserService.registerAsGuest(req.body)

    sendResponse(res, {
        status: statusCode.OK,
        success: true,
        message: "registration successful",
        data: result
    })
})


/* =========================
   Get All Users
========================= */

const getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {

        const filters = pick(req.query, userFilterableFields) // searching , filtering
        const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"])
        const result = await UserService.getAllUsers(filters, options);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "users retrieved successfully",
            data: result,
        });
    }
);

const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    console.log(req.user);
    const email = req.user!.email
    const result = await UserService.getMe(email as string);

    sendResponse(res, {
        status: statusCode.OK,
        success: true,
        message: "profile retrieved successfully",
        data: result,
    });
});
const SoftDelete = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id
    const result = await UserService.SoftDelete(id as string);

    sendResponse(res, {
        status: statusCode.OK,
        success: true,
        message: "User Deleted Successful",
        data: result,
    });
});



export const userController = {
    registerAsGuest,
    getAllUsers,
    getMe,
    SoftDelete
};
