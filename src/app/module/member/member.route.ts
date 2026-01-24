import express, { Router } from "express";
import { MemberController } from "./member.controller.js";
import { auth } from "../../middleware/auth.js";
import { UserRole } from "@prisma/client";

const router = express.Router();

/* =========================
   MEMBER → Apply for Membership
========================= */
router.post(
    "/apply",
    auth(UserRole.GUEST),
    MemberController.applyForMembership
);

/* =========================
   ADMIN → Get All Applications
========================= */
router.get(
    "/applications",
    auth(UserRole.ADMIN),
    MemberController.getAllApplications
);

/* =========================
   ADMIN → Approve Application
========================= */
router.patch(
    "/applications/approve/:id",
    auth(UserRole.ADMIN),
    MemberController.approveApplication
);

/* =========================
   ADMIN → Reject Application
========================= */
router.patch(
    "/applications/reject/:id",
    auth(UserRole.ADMIN),
    MemberController.rejectApplication
);

export const MemberRoute: Router = router;
