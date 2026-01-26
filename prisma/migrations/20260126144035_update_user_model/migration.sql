/*
  Warnings:

  - You are about to drop the column `profileImage` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `mentors` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "moderationLevel" AS ENUM ('BASIC', 'SENIOR');

-- DropIndex
DROP INDEX "admins_userId_idx";

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "profileImage",
ADD COLUMN     "department" TEXT,
ADD COLUMN     "permissions" TEXT[];

-- AlterTable
ALTER TABLE "members" DROP COLUMN "profileImage",
ADD COLUMN     "batch" TEXT,
ADD COLUMN     "github" TEXT,
ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "portfolio" TEXT,
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "skills" TEXT[];

-- AlterTable
ALTER TABLE "mentors" DROP COLUMN "profileImage",
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "maxMentees" INTEGER,
ADD COLUMN     "subExpertise" TEXT[],
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "moderators" ADD COLUMN     "assignedForums" TEXT[],
ADD COLUMN     "moderationLevel" "moderationLevel" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "permissions" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileImage" TEXT;

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");
