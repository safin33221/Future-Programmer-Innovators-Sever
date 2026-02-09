import express from "express";
import { auth } from "../../middleware/auth.js";
import { UserRole } from "@prisma/client";
import { validateRequest } from "../../middleware/validateRequest.js";
import { NoticeValidation } from "./notice.validation.js";
import { NoticeController } from "./notice.controller.js";

const router = express.Router();

/* =========================
   Public Routes
========================= */
router.get(
    "/admin",
    auth(UserRole.ADMIN),
    NoticeController.getAllNoticesForAdmin
);


router.get(
    "/",
    NoticeController.getPublishedNotices
);

router.get(
    "/:id",
    validateRequest(NoticeValidation.noticeIdParamSchema),
    NoticeController.getSingleNotice
);

/* =========================
   Admin Routes
========================= */



router.post(
    "/",
    auth(UserRole.ADMIN),
    // validateRequest(NoticeValidation.createNoticeSchema),
    NoticeController.createNotice
);


router.patch(
    "/:id",
    auth(UserRole.ADMIN),
    validateRequest(NoticeValidation.updateNoticeSchema),
    NoticeController.updateNotice
);

router.patch(
    "/publish/:id",
    auth(UserRole.ADMIN),
    validateRequest(NoticeValidation.publishNoticeSchema),
    NoticeController.publishNotice
);

router.patch(
    "/soft-delete/:id",
    auth(UserRole.ADMIN),
    validateRequest(NoticeValidation.noticeIdParamSchema),
    NoticeController.softDeleteNotice
);

export const NoticeRoute: any = router;
