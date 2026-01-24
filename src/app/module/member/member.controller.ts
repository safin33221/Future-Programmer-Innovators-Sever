import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { statusCode } from "../../shared/statusCode.js";
import pick from "../../helper/pick.js";
import { AuthRequest } from "../../middleware/auth.js";
import { MemberService } from "./member.service.js";
import { memberApplicationSearchableFields } from "./member.constant.js";


/* =========================
   MEMBER → Apply for Membership
========================= */
const applyForMembership = catchAsync(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;
        const result = await MemberService.createApplication(userId, req.body);

        sendResponse(res, {
            status: statusCode.CREATED,
            success: true,
            message: "Membership application submitted successfully",
            data: result,
        });
    }
);

/* =========================
   ADMIN → Get All Applications
   (Search + Filter + Pagination)
========================= */
const getAllApplications = catchAsync(
    async (req: Request, res: Response) => {
        const filters = pick(req.query, memberApplicationSearchableFields);
        const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

        const result = await MemberService.getAllApplications(filters, options);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Member applications retrieved successfully",
            meta: result.meta,
            data: result.data,
        });
    }
);

/* =========================
   ADMIN → Approve Application
========================= */
const approveApplication = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const result = await MemberService.approveApplication(id as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Application approved successfully",
            data: result,
        });
    }
);

/* =========================
   ADMIN → Reject Application
========================= */
const rejectApplication = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const result = await MemberService.rejectApplication(id as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Application rejected successfully",
            data: result,
        });
    }
);

export const MemberController = {
    applyForMembership,
    getAllApplications,
    approveApplication,
    rejectApplication,
};
