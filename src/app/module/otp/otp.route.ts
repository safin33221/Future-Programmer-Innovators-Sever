import express, { Router } from 'express';
import { OTPController } from './otp.controller.js';

const router = express.Router()

router.post("/auth/send", OTPController.sendAuthOtp);
router.post("/auth/verify", OTPController.verifyOtp);

export const OtpRoute: Router = router