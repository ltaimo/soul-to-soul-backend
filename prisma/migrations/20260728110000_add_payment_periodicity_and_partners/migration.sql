ALTER TABLE "HrPayment" ADD COLUMN IF NOT EXISTS "periodicity" TEXT NOT NULL DEFAULT 'One-time';
ALTER TABLE "HrPayment" ADD COLUMN IF NOT EXISTS "periodStart" TIMESTAMP(3);
ALTER TABLE "HrPayment" ADD COLUMN IF NOT EXISTS "periodEnd" TIMESTAMP(3);
ALTER TABLE "HrPayment" ADD COLUMN IF NOT EXISTS "nextDueDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "HrPayment_periodicity_idx" ON "HrPayment"("periodicity");
CREATE INDEX IF NOT EXISTS "HrPayment_nextDueDate_idx" ON "HrPayment"("nextDueDate");

CREATE TABLE IF NOT EXISTS "CommercialPartner" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'Seller',
  "phone" TEXT,
  "email" TEXT,
  "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CommercialPartner_type_idx" ON "CommercialPartner"("type");
CREATE INDEX IF NOT EXISTS "CommercialPartner_status_idx" ON "CommercialPartner"("status");
CREATE INDEX IF NOT EXISTS "CommercialPartner_phone_idx" ON "CommercialPartner"("phone");

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "commercialPartnerId" INTEGER;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "sellerType" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Sale_commercialPartnerId_fkey'
  ) THEN
    ALTER TABLE "Sale"
    ADD CONSTRAINT "Sale_commercialPartnerId_fkey"
    FOREIGN KEY ("commercialPartnerId") REFERENCES "CommercialPartner"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
