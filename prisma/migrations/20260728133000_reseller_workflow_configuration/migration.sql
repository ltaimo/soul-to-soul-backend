ALTER TABLE "CommercialPartner"
  ADD COLUMN IF NOT EXISTS "warehouseId" INTEGER,
  ADD COLUMN IF NOT EXISTS "agreementType" TEXT NOT NULL DEFAULT 'Direct Sale',
  ADD COLUMN IF NOT EXISTS "pricePolicy" TEXT NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS "priceAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT,
  ADD COLUMN IF NOT EXISTS "settlementCycle" TEXT NOT NULL DEFAULT 'On Sale',
  ADD COLUMN IF NOT EXISTS "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "defaultSaleChannel" TEXT NOT NULL DEFAULT 'Store',
  ADD COLUMN IF NOT EXISTS "trackingEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Sale"
  ADD COLUMN IF NOT EXISTS "orderReference" TEXT,
  ADD COLUMN IF NOT EXISTS "fulfillmentStatus" TEXT NOT NULL DEFAULT 'Delivered';

CREATE INDEX IF NOT EXISTS "CommercialPartner_agreementType_idx" ON "CommercialPartner"("agreementType");
CREATE INDEX IF NOT EXISTS "CommercialPartner_warehouseId_idx" ON "CommercialPartner"("warehouseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'CommercialPartner_warehouseId_fkey'
      AND table_name = 'CommercialPartner'
  ) THEN
    ALTER TABLE "CommercialPartner"
      ADD CONSTRAINT "CommercialPartner_warehouseId_fkey"
      FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
