import type { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import { OTPService } from "./otp.service.js";
import sendResponse from "../../shared/sendResponse.js";


/* -------------------------------------------------------------------------- */
/*                               Controller Logic                              */
/* -------------------------------------------------------------------------- */

const sendAuthOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, name } = req.body;

  await OTPService.sendAuthOtp(email, name);

  sendResponse(res, {
    status: 200,
    success: true,
    message: "OTP sent successfully to your email address",
    data: null,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  console.log(req.body);
  await OTPService.verifyOtp(email, otp);

  sendResponse(res, {
    status: 200,
    success: true,
    message: "Email verified successfully",
    data: null,
  });
});

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

export const OTPController = {
  sendAuthOtp,
  verifyOtp,
};
