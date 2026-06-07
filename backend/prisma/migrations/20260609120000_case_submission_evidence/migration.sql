-- CreateTable
CREATE TABLE "CaseSubmissionEvidence" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseSubmissionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseSubmissionEvidence_submissionId_idx" ON "CaseSubmissionEvidence"("submissionId");

-- AddForeignKey
ALTER TABLE "CaseSubmissionEvidence" ADD CONSTRAINT "CaseSubmissionEvidence_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CaseSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
