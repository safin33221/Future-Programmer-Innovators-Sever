import express from "express";
import { DepartmentController } from "./department.controller.js";
import { auth } from "../../middleware/auth.js";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/",
    auth(UserRole.ADMIN),
    DepartmentController.createDepartment);
router.get("/", DepartmentController.getDepartments);
router.get("/:id",
    auth(UserRole.ADMIN),
    DepartmentController.getDepartmentById);
router.patch("/:id",
    auth(UserRole.ADMIN),
    DepartmentController.softDeleteDepartment);

export const DepartmentRoute: any = router;
