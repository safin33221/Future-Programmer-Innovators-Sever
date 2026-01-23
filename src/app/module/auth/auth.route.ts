import express, { Router } from "express";
import { authController } from "./auth.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { loginSchema } from "./auth.validation.js";


const router = express.Router()
//login
router.post('/login',
    // validateRequest(loginSchema),
    authController.login)

export const AuthRoute: Router = router;