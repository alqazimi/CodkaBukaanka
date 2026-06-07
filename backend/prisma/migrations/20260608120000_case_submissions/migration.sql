-- CreateTable
CREATE TABLE "CaseSubmission" (
    "id" TEXT NOT NULL,
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "submitterPhone" TEXT,
    "submitterIp" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reasonForVisit" TEXT NOT NULL,
    "incidentDescription" TEXT NOT NULL,
    "currentCondition" TEXT,
    "whatWentWrong" "WhatWentWrong" NOT NULL,
    "category" "CaseCategory" NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "hospitalLocation" TEXT,
    "patientName" TEXT NOT NULL,
    "patientAge" INTEGER,
    "patientGender" TEXT,
    "doctorName" TEXT,
    "medicationName" TEXT,
    "evidenceNotes" TEXT NOT NULL,
    "status" "InboxStatus" NOT NULL DEFAULT 'NEW',
    "readAt" TIMESTAMP(3),
    "readById" TEXT,
    "internalNote" TEXT,
    "linkedCaseId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseSubmission_createdAt_idx" ON "CaseSubmission"("createdAt");
CREATE INDEX "CaseSubmission_submitterIp_createdAt_idx" ON "CaseSubmission"("submitterIp", "createdAt");
CREATE INDEX "CaseSubmission_status_idx" ON "CaseSubmission"("status");
CREATE INDEX "CaseSubmission_deletedAt_idx" ON "CaseSubmission"("deletedAt");
CREATE INDEX "CaseSubmission_status_deletedAt_idx" ON "CaseSubmission"("status", "deletedAt");

-- AddForeignKey
ALTER TABLE "CaseSubmission" ADD CONSTRAINT "CaseSubmission_readById_fkey" FOREIGN KEY ("readById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CaseSubmission" ADD CONSTRAINT "CaseSubmission_linkedCaseId_fkey" FOREIGN KEY ("linkedCaseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
