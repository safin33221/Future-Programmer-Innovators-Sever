import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { statusCode } from "../../shared/statusCode.js";
import pick from "../../helper/pick.js";
import { LearningTrackService } from "./learningTrack.service.js";
import { learningTrackFilterableFields } from "./learningTrack.constant.js";

/* =========================
   Create Learning Track
========================= */
const createLearningTrack = catchAsync(
    async (req: Request, res: Response) => {
        const result = await LearningTrackService.createLearningTrack(req.body);

        sendResponse(res, {
            status: statusCode.CREATED,
            success: true,
            message: "Learning track created successfully",
            data: result,
        });
    }
);

/* =========================
   Get All Learning Tracks
========================= */
const getAllLearningTracks = catchAsync(
    async (req: Request, res: Response) => {
        const filters = pick(req.query, learningTrackFilterableFields);
        const options = pick(req.query, [
            "page",
            "limit",
            "sortBy",
            "sortOrder",
        ]);

        const result = await LearningTrackService.getAllLearningTracks(
            filters,
            options
        );

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Learning tracks retrieved successfully 111",
            data: {
                data: result.data,
                meta: result.meta
            },

        });
    }
);

/* =========================
   Get Single Track
========================= */
const getSingleLearningTrack = catchAsync(
    async (req: Request, res: Response) => {
        const { slug } = req.params;
        const result = await LearningTrackService.getSingleLearningTrack(slug as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Learning track retrieved successfully",
            data: result,
        });
    }
);

/* =========================
   Update Track
========================= */
const updateLearningTrack = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const result = await LearningTrackService.updateLearningTrack(
            id as string,
            req.body
        );

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Learning track updated successfully",
            data: result,
        });
    }
);

/* =========================
   Soft Delete Track
========================= */
const softDeleteLearningTrack = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const result = await LearningTrackService.softDeleteLearningTrack(id as string);

        sendResponse(res, {
            status: statusCode.OK,
            success: true,
            message: "Learning track deleted successfully",
            data: result,
        });
    }
);

export const learningTrackController = {
    createLearningTrack,
    getAllLearningTracks,
    getSingleLearningTrack,
    updateLearningTrack,
    softDeleteLearningTrack,
};
