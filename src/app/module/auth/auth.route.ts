import express from "express";
import { authController } from "./auth.controller.js";


const router = express.Router()
//login
router.post('/registration',
    authController.registerAsGuest)

router.post('/login',
    // validateRequest(loginSchema),
    authController.login)

export const AuthRoute: any = router;
