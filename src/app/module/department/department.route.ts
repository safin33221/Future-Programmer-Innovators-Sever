import express, { Router } from "express";
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
router.delete("/:id",
    auth(UserRole.ADMIN),
    DepartmentController.deleteDepartment);

export const DepartmentRoute: Router = router;
