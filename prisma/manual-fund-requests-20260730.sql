CREATE TABLE IF NOT EXISTS "FundRequest" (
  "id" SERIAL PRIMARY KEY,
  "requestNumber" TEXT NOT NULL,
  "requesterId" INTEGER,
  "requesterName" TEXT NOT NULL,
  "requesterEmail" TEXT,
  "requesterRole" TEXT,
  "department" TEXT,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MZN',
  "neededBy" TIMESTAMP(3),
  "priority" TEXT NOT NULL DEFAULT 'Normal',
  "paymentMethod" TEXT,
  "payeeName" TEXT,
  "payeePhone" TEXT,
  "payeeBank" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "reviewedById" INTEGER,
  "reviewedByName" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "FundRequest_requestNumber_key" ON "FundRequest"("requestNumber");
CREATE INDEX IF NOT EXISTS "FundRequest_requesterId_idx" ON "FundRequest"("requesterId");
CREATE INDEX IF NOT EXISTS "FundRequest_status_idx" ON "FundRequest"("status");
CREATE INDEX IF NOT EXISTS "FundRequest_createdAt_idx" ON "FundRequest"("createdAt");
CREATE INDEX IF NOT EXISTS "FundRequest_category_idx" ON "FundRequest"("category");
