import crypto from "crypto";
import prisma from "../../../lib/prisma.js";
import { redisClient } from "../../config/redis.config.js";
import { sendEmail } from "../../utils/sendEmail.js";
import ApiError from "../../errors/ApiError.js";
import { statusCode } from "../../shared/statusCode.js";

const OTP_LENGTH = 6;
const OTP_EXPIRATION_SECONDS = 120;
const OTP_REDIS_PREFIX = "otp";

const normalizeEmail = (email: string) =>
  email.toLowerCase().trim();

const generateOtp = (length = OTP_LENGTH): string => {
  return crypto
    .randomInt(10 ** (length - 1), 10 ** length)
    .toString();
};

const getRedisKey = (email: string): string =>
  `${OTP_REDIS_PREFIX}:${normalizeEmail(email)}`;

/* ================= SEND OTP ================= */

const sendAuthOtp = async (email: string, name: string): Promise<void> => {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user && user.isVerified) {
    throw new ApiError(
      statusCode.UNAUTHORIZED,
      "This email already has an account"
    );
  }

  const otp = generateOtp();
  const redisKey = getRedisKey(normalizedEmail);

  await redisClient.set(
    redisKey,
    otp,
    { EX: OTP_EXPIRATION_SECONDS }
  );

  await sendEmail({
    to: normalizedEmail,
    subject: "Your OTP Code | Future Programmer Innovators Club",
    templateName: "otp",
    templateData: { name, otp },
  });
};

/* ================= VERIFY OTP ================= */

const verifyOtp = async (email: string, otp: string): Promise<void> => {
  const redisKey = getRedisKey(email);
  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new ApiError(statusCode.UNAUTHORIZED, "OTP expired");
  }

  if (savedOtp !== otp.trim()) {
    throw new ApiError(statusCode.UNAUTHORIZED, "Invalid OTP");
  }

  await redisClient.del(redisKey);
};

export const OTPService = {
  sendAuthOtp,
  verifyOtp,
};
