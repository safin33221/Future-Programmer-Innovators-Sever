import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { statusCode } from "../../shared/statusCode.js";
import pick from "../../helper/pick.js";

import { AuthRequest } from "../../middleware/auth.js";
import { NoticeService } from "./notice.service.js";
import { noticeFilterableFields } from "./notice.constant.js";
import ApiError from "../../errors/ApiError.js";

/* =========================
   Create Notice
========================= */
const createNotice = catchAsync(
    async (req: AuthRequest, res: Response) => {
        console.log(req.body);

        if (!req.user?.id) {
            throw new ApiError(401, "User not authenticated");
        }
        const result = await NoticeService.createNotice(
            req.user.id,
            req.body
        );

        sendResponse(res, {
            status: statusCode.CREATED,
            success: true,
            message: "Notice created successfully",
            data: result,
        });
    }
);


const getAllNoticesForAdmin = catchAsync(
    async (req: AuthRequest, res: Response) => {
        const filters = pick(req.query, noticeFilterableFields);
        const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

        const result = await NoticeService.getAllNoticesForAdmin(filters, options);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "All notices retrieved successfully",
            data: result,
        });
    }
);



/* =========================
   Get All Published Notices (Public)
========================= */
const getPublishedNotices = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const filters = pick(req.query, noticeFilterableFields);
        const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

        const result = await NoticeService.getPublishedNotices(filters, options);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Notices retrieved successfully",
            data: result,
        });
    }
);

/* =========================
   Get Single Notice
========================= */
const getSingleNotice = catchAsync(
    async (req: Request, res: Response) => {
        const id = req.params.id;
        const result = await NoticeService.getSingleNotice(id as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Notice retrieved successfully",
            data: result,
        });
    }
);

/* =========================
   Update Notice
========================= */
const updateNotice = catchAsync(
    async (req: Request, res: Response) => {
        const id = req.params.id;
        const result = await NoticeService.updateNotice(id as string, req.body);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Notice updated successfully",
            data: result,
        });
    }
);

/* =========================
   Publish Notice
========================= */
const publishNotice = catchAsync(
    async (req: Request, res: Response) => {
        const id = req.params.id;
        const result = await NoticeService.publishNotice(id as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Notice published successfully",
            data: result,
        });
    }
);

/* =========================
   Soft Delete Notice
========================= */
const softDeleteNotice = catchAsync(
    async (req: Request, res: Response) => {
        const id = req.params.id;
        const result = await NoticeService.softDeleteNotice(id as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Notice deleted successfully",
            data: result,
        });
    }
);

export const NoticeController = {
    createNotice,
    getPublishedNotices,
    getSingleNotice,
    updateNotice,
    publishNotice,
    softDeleteNotice,
    getAllNoticesForAdmin
};
