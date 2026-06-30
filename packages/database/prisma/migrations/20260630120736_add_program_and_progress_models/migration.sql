-- CreateEnum
CREATE TYPE "nexus"."ProgramStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "nexus"."ProgressUpdateStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'BLOCKED', 'DONE');

-- CreateTable
CREATE TABLE "nexus"."Program" (
    "id" TEXT NOT NULL,
    "birdepId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objective" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" "nexus"."ProgramStatus" NOT NULL DEFAULT 'PLANNED',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "pressReleaseUrl" TEXT,
    "isPublishedToTevo" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus"."ProgramProgressUpdate" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "obstacle" TEXT,
    "nextStep" TEXT,
    "progressPercent" INTEGER NOT NULL,
    "status" "nexus"."ProgressUpdateStatus" NOT NULL DEFAULT 'ON_TRACK',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Program_birdepId_idx" ON "nexus"."Program"("birdepId");

-- CreateIndex
CREATE INDEX "Program_status_idx" ON "nexus"."Program"("status");

-- CreateIndex
CREATE INDEX "Program_isPublishedToTevo_idx" ON "nexus"."Program"("isPublishedToTevo");

-- CreateIndex
CREATE UNIQUE INDEX "Program_birdepId_slug_key" ON "nexus"."Program"("birdepId", "slug");

-- CreateIndex
CREATE INDEX "ProgramProgressUpdate_programId_idx" ON "nexus"."ProgramProgressUpdate"("programId");

-- CreateIndex
CREATE INDEX "ProgramProgressUpdate_authorUserId_idx" ON "nexus"."ProgramProgressUpdate"("authorUserId");

-- CreateIndex
CREATE INDEX "ProgramProgressUpdate_status_idx" ON "nexus"."ProgramProgressUpdate"("status");

-- CreateIndex
CREATE INDEX "ProgramProgressUpdate_reportedAt_idx" ON "nexus"."ProgramProgressUpdate"("reportedAt");

-- AddForeignKey
ALTER TABLE "nexus"."Program" ADD CONSTRAINT "Program_birdepId_fkey" FOREIGN KEY ("birdepId") REFERENCES "core"."Birdep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."Program" ADD CONSTRAINT "Program_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "nexus"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."Program" ADD CONSTRAINT "Program_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "nexus"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramProgressUpdate" ADD CONSTRAINT "ProgramProgressUpdate_programId_fkey" FOREIGN KEY ("programId") REFERENCES "nexus"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus"."ProgramProgressUpdate" ADD CONSTRAINT "ProgramProgressUpdate_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "nexus"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
