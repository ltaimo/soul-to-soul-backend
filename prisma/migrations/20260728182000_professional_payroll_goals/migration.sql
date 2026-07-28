ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "performanceMode" TEXT NOT NULL DEFAULT 'Attendance';

ALTER TABLE "HrPayment"
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'Manual',
  ADD COLUMN IF NOT EXISTS "payrollMonth" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;

CREATE INDEX IF NOT EXISTS "HrPayment_payrollMonth_idx" ON "HrPayment"("payrollMonth");
CREATE UNIQUE INDEX IF NOT EXISTS "HrPayment_employeeId_type_payrollMonth_key" ON "HrPayment"("employeeId", "type", "payrollMonth");

CREATE TABLE IF NOT EXISTS "WorkGoal" (
  "id" SERIAL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkGoal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WorkGoal_employeeId_idx" ON "WorkGoal"("employeeId");
CREATE INDEX IF NOT EXISTS "WorkGoal_status_idx" ON "WorkGoal"("status");
CREATE INDEX IF NOT EXISTS "WorkGoal_dueDate_idx" ON "WorkGoal"("dueDate");
