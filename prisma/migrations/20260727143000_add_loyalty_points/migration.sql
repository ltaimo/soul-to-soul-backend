ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "redemptionPointsCost" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "customerCode" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "pointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "redemptionPointsCost" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_customerCode_key" ON "Customer"("customerCode");
CREATE INDEX IF NOT EXISTS "Customer_customerCode_idx" ON "Customer"("customerCode");

UPDATE "Customer"
SET "customerCode" = 'CUST-' || LPAD("id"::text, 5, '0')
WHERE "customerCode" IS NULL;

UPDATE "SystemSetting"
SET "companyName" = 'Soul2Soul'
WHERE "id" = 1
  AND ("companyName" = 'Soul2Soul Baia Mall' OR "companyName" = 'Soul to Soul ERP');

UPDATE "Warehouse"
SET "name" = 'Soul2Soul Baia Mall',
    "type" = 'Shop',
    "notes" = COALESCE("notes", 'Main Baia Mall shop')
WHERE "name" IN ('Loja Local Teste', 'Armazem Principal');
