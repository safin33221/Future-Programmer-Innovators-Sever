-- CreateEnum
CREATE TYPE "TrackLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "member_applications" ADD COLUMN     "learningTrackId" TEXT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "learningTrackId" TEXT;

-- CreateTable
CREATE TABLE "LearningTrack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "longDesc" TEXT NOT NULL,
    "icon" TEXT,
    "difficulty" "TrackLevel" NOT NULL,
    "duration" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackTopic" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TrackTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackRoadmap" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TrackRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackCareer" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "TrackCareer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackTool" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "TrackTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningTrack_slug_key" ON "LearningTrack"("slug");

-- AddForeignKey
ALTER TABLE "TrackTopic" ADD CONSTRAINT "TrackTopic_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackRoadmap" ADD CONSTRAINT "TrackRoadmap_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackCareer" ADD CONSTRAINT "TrackCareer_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackTool" ADD CONSTRAINT "TrackTool_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_applications" ADD CONSTRAINT "member_applications_learningTrackId_fkey" FOREIGN KEY ("learningTrackId") REFERENCES "LearningTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_learningTrackId_fkey" FOREIGN KEY ("learningTrackId") REFERENCES "LearningTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
