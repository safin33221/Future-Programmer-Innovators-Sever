import express from "express";
import { learningTrackController } from "./learningTrack.controller.js";
import { auth } from "../../middleware/auth.js";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
    "/",
    auth(UserRole.ADMIN),
    learningTrackController.createLearningTrack
);

router.get("/", learningTrackController.getAllLearningTracks);

router.get("/:slug", learningTrackController.getSingleLearningTrack);

router.patch(
    "/:id",
    auth(UserRole.ADMIN),
    learningTrackController.updateLearningTrack
);

router.patch(
    "/soft-delete/:id",
    auth(UserRole.ADMIN),
    learningTrackController.softDeleteLearningTrack
);

export const LearningTrackRoute: any = router;
