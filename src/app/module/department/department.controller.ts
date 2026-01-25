import type { NextFunction, Request, Response } from "express";
import { DepartmentService } from "./department.service.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { statusCode } from "../../shared/statusCode.js";

/* =========================
   Create Department
========================= */
const createDepartment = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await DepartmentService.createDepartment(req.body);

        sendResponse(res, {
            status: statusCode.CREATED,
            success: true,
            message: "Department created successfully",
            data: result,
        });
    }
);

/* =========================
   Get All Departments
========================= */
const getDepartments = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await DepartmentService.getAllDepartments();

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Departments retrieved successfully",
            data: result,
        });
    }
);

/* =========================
   Get Department By ID
========================= */
const getDepartmentById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await DepartmentService.getDepartmentById(req.params.id as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Department retrieved successfully",
            data: result,
        });
    }
);

/* =========================
   Delete Department
========================= */
const softDeleteDepartment = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        await DepartmentService.softDeleteDepartment(req.params.id as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Department deleted successfully",
        });
    }
);

export const DepartmentController = {
    createDepartment,
    getDepartments,
    getDepartmentById,
    softDeleteDepartment,
};
