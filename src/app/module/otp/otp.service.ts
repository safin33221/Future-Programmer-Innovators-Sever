import crypto from "crypto";
import prisma from "../../../lib/prisma.js";
import { ensureRedis, redisClient } from "../../config/redis.config.js";
import { sendEmail } from "../../utils/sendEmail.js";
import ApiError from "../../errors/ApiError.js";
import { statusCode } from "../../shared/statusCode.js";

/* ================= CONFIG ================= */

const OTP_LENGTH = 6;
const OTP_EXPIRATION_SECONDS = 300; // 5 minutes
const OTP_REDIS_PREFIX = "otp";
const OTP_MAX_ATTEMPTS = 5;

/* ================= HELPERS ================= */

const normalizeEmail = (email: string): string =>
  email.toLowerCase().trim();

const generateOtp = (length = OTP_LENGTH): string => {
  return crypto
    .randomInt(10 ** (length - 1), 10 ** length)
    .toString();
};

const getRedisKey = (email: string): string =>
  `${OTP_REDIS_PREFIX}:${normalizeEmail(email)}`;

const getAttemptsKey = (email: string): string =>
  `${getRedisKey(email)}:attempts`;

/* ================= SEND OTP ================= */

const sendAuthOtp = async (email: string, name: string): Promise<void> => {
  const normalizedEmail = normalizeEmail(email);
  const redisKey = getRedisKey(normalizedEmail);

  // Check if user already verified (block silently)
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });



  if (user) {
    throw new ApiError(
      statusCode.CONFLICT,
      "This email already has an account"
    );
  }


  await ensureRedis();

  // Prevent OTP spamming
  const exists = await redisClient.exists(redisKey);
  if (exists) {
    throw new ApiError(
      statusCode.TOO_MANY_REQUESTS,
      "OTP already sent. Please wait."
    );
  }

  const otp = generateOtp();

  // Save OTP with expiration
  await redisClient.set(redisKey, otp, {
    EX: OTP_EXPIRATION_SECONDS,
  });

  // Reset attempts
  await redisClient.del(getAttemptsKey(normalizedEmail));

  // Send email
  await sendEmail({
    to: normalizedEmail,
    subject: "Your OTP Code | Future Programmer Innovators Club",
    templateName: "otp",
    templateData: { name, otp },
  });
};

/* ================= VERIFY OTP ================= */

const verifyOtp = async (email: string, otp: string): Promise<void> => {
  const normalizedEmail = normalizeEmail(email);
  const redisKey = getRedisKey(normalizedEmail);
  const attemptsKey = getAttemptsKey(normalizedEmail);

  await ensureRedis();

  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new ApiError(statusCode.UNAUTHORIZED, "OTP expired");
  }

  const attempts = Number(await redisClient.get(attemptsKey)) || 0;

  if (attempts >= OTP_MAX_ATTEMPTS) {
    await redisClient.del(redisKey);
    await redisClient.del(attemptsKey);
    throw new ApiError(
      statusCode.TOO_MANY_REQUESTS,
      "Too many invalid attempts. OTP expired."
    );
  }

  if (savedOtp !== otp.trim()) {
    await redisClient.incr(attemptsKey);
    await redisClient.expire(attemptsKey, OTP_EXPIRATION_SECONDS);

    throw new ApiError(statusCode.UNAUTHORIZED, "Invalid OTP");
  }

  // Success → cleanup
  await redisClient.del(redisKey);
  await redisClient.del(attemptsKey);
};

/* ================= EXPORT ================= */

export const OTPService = {
  sendAuthOtp,
  verifyOtp,
};
