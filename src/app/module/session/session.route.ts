// src/app/modules/session/session.route.ts
import express from "express";
import { SessionController } from "./session.controller.js";
import { auth } from "../../middleware/auth.js";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/",
    auth(UserRole.ADMIN),
    SessionController.createSession);
router.get("/", SessionController.getAllSessions);
router.patch("/:id",
    auth(UserRole.ADMIN),
    SessionController.softDeleteSession);

export const SessionRoute: any = router;
