-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "github" TEXT,
ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "portfolio" TEXT,
ADD COLUMN     "skills" TEXT[];
