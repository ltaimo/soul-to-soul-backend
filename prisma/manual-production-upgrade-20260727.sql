-- Soul2Soul production upgrade, 2026-07-27.
-- Safe to run more than once on PostgreSQL/Supabase.

CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT NOT NULL DEFAULT 'Soul2Soul',
    "companyLogo" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'MZN',
    "currencySymbol" TEXT NOT NULL DEFAULT 'MT',
    "decimalFormatting" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

INSERT INTO "SystemSetting" ("id", "companyName", "updatedAt")
VALUES (1, 'Soul2Soul', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "Warehouse" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Warehouse',
    "address" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WarehouseStock" (
    "id" SERIAL NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockTransfer" (
    "id" SERIAL NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "sourceWarehouseId" INTEGER NOT NULL,
    "destinationWarehouseId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'In Transit',
    "notes" TEXT,
    "requestedById" INTEGER,
    "requestedByName" TEXT,
    "confirmedById" INTEGER,
    "confirmedByName" TEXT,
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockTransferItem" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "warehouseId" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "warehouseName" TEXT;
ALTER TABLE "InventoryBatch" ADD COLUMN IF NOT EXISTS "warehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "warehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "sourceWarehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "destinationWarehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "transferId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "responsibleId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "responsibleName" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Posted';
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "warehouseId" INTEGER;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "warehouseName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "redemptionPointsCost" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "customerCode" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "pointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "redemptionPointsCost" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "HrPayment" ADD COLUMN IF NOT EXISTS "periodicity" TEXT NOT NULL DEFAULT 'One-time';
ALTER TABLE "HrPayment" ADD COLUMN IF NOT EXISTS "periodStart" TIMESTAMP(3);
ALTER TABLE "HrPayment" ADD COLUMN IF NOT EXISTS "periodEnd" TIMESTAMP(3);
ALTER TABLE "HrPayment" ADD COLUMN IF NOT EXISTS "nextDueDate" TIMESTAMP(3);

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

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "commercialPartnerId" INTEGER;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "sellerType" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "hrPaymentTypes" TEXT NOT NULL DEFAULT 'Salary,Rent,Advance,Bonus,Transport,Utilities,Commission,Other';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "paymentMethods" TEXT NOT NULL DEFAULT 'Cash,M-Pesa,E-Mola,Card,Bank Transfer';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "warehouseTypes" TEXT NOT NULL DEFAULT 'Warehouse,Shop,Storage,Transit';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "productCategories" TEXT NOT NULL DEFAULT 'Skincare,Haircare,Beard Care,Raw Material,Packaging';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "productTypes" TEXT NOT NULL DEFAULT 'Finished Good,Raw Material,Packaging';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "productUnits" TEXT NOT NULL DEFAULT 'pcs,kg,g,l,ml,box';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "attendanceStatuses" TEXT NOT NULL DEFAULT 'Present,Absent,Late,Half Day,Leave';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "payFrequencies" TEXT NOT NULL DEFAULT 'Monthly,Weekly,Daily,Hourly';

CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_code_key" ON "Warehouse"("code");
CREATE INDEX IF NOT EXISTS "Warehouse_status_idx" ON "Warehouse"("status");
CREATE INDEX IF NOT EXISTS "Warehouse_type_idx" ON "Warehouse"("type");
CREATE UNIQUE INDEX IF NOT EXISTS "WarehouseStock_warehouseId_productId_key" ON "WarehouseStock"("warehouseId", "productId");
CREATE INDEX IF NOT EXISTS "WarehouseStock_productId_idx" ON "WarehouseStock"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "StockTransfer_transferNumber_key" ON "StockTransfer"("transferNumber");
CREATE INDEX IF NOT EXISTS "StockTransfer_sourceWarehouseId_idx" ON "StockTransfer"("sourceWarehouseId");
CREATE INDEX IF NOT EXISTS "StockTransfer_destinationWarehouseId_idx" ON "StockTransfer"("destinationWarehouseId");
CREATE INDEX IF NOT EXISTS "StockTransfer_status_idx" ON "StockTransfer"("status");
CREATE INDEX IF NOT EXISTS "StockTransferItem_productId_idx" ON "StockTransferItem"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");
CREATE INDEX IF NOT EXISTS "StockMovement_sourceWarehouseId_idx" ON "StockMovement"("sourceWarehouseId");
CREATE INDEX IF NOT EXISTS "StockMovement_destinationWarehouseId_idx" ON "StockMovement"("destinationWarehouseId");
CREATE INDEX IF NOT EXISTS "StockMovement_transferId_idx" ON "StockMovement"("transferId");
CREATE INDEX IF NOT EXISTS "StockMovement_movementType_idx" ON "StockMovement"("movementType");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_customerCode_key" ON "Customer"("customerCode");
CREATE INDEX IF NOT EXISTS "Customer_customerCode_idx" ON "Customer"("customerCode");
CREATE INDEX IF NOT EXISTS "HrPayment_periodicity_idx" ON "HrPayment"("periodicity");
CREATE INDEX IF NOT EXISTS "HrPayment_nextDueDate_idx" ON "HrPayment"("nextDueDate");
CREATE INDEX IF NOT EXISTS "CommercialPartner_type_idx" ON "CommercialPartner"("type");
CREATE INDEX IF NOT EXISTS "CommercialPartner_status_idx" ON "CommercialPartner"("status");
CREATE INDEX IF NOT EXISTS "CommercialPartner_phone_idx" ON "CommercialPartner"("phone");

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

-- Company contact and social fields used on loyalty cards, receipts and exports.
ALTER TABLE "SystemSetting"
  ADD COLUMN IF NOT EXISTS "companyPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "companyWhatsApp" TEXT,
  ADD COLUMN IF NOT EXISTS "companyEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "companyAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "companyWebsite" TEXT,
  ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "tiktokUrl" TEXT;

ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "hrRoles" TEXT NOT NULL DEFAULT 'Manager,Cashier,Salesperson,Stock Manager,Production Assistant,Administrator';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "hrDepartments" TEXT NOT NULL DEFAULT 'Sales,Store,Warehouse,Production,Administration,Finance';

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER,
  "userName" TEXT,
  "userEmail" TEXT,
  "userRole" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "machine" TEXT,
  "metadata" TEXT,
  "statusCode" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WarehouseStock_warehouseId_fkey') THEN
    ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WarehouseStock_productId_fkey') THEN
    ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransfer_sourceWarehouseId_fkey') THEN
    ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransfer_destinationWarehouseId_fkey') THEN
    ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransferItem_transferId_fkey') THEN
    ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransferItem_productId_fkey') THEN
    ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_warehouseId_fkey') THEN
    ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryBatch_warehouseId_fkey') THEN
    ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_warehouseId_fkey') THEN
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_sourceWarehouseId_fkey') THEN
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_destinationWarehouseId_fkey') THEN
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_transferId_fkey') THEN
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Sale_warehouseId_fkey') THEN
    ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "Warehouse" ("code", "name", "type", "status", "isDefault", "createdAt", "updatedAt")
VALUES ('MAIN', 'Soul2Soul Baia Mall', 'Shop', 'Active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

UPDATE "Warehouse"
SET "name" = 'Soul2Soul Baia Mall',
    "type" = 'Shop',
    "status" = 'Active',
    "isDefault" = true,
    "notes" = COALESCE("notes", 'Main Baia Mall shop')
WHERE "code" = 'MAIN'
   OR "name" IN ('Loja Local Teste', 'Armazem Principal');

UPDATE "SystemSetting"
SET "companyName" = 'Soul2Soul'
WHERE "id" = 1
  AND ("companyName" IS NULL OR "companyName" = '' OR "companyName" IN ('Soul to Soul ERP', 'Soul2Soul Baia Mall'));

INSERT INTO "WarehouseStock" ("warehouseId", "productId", "quantity", "minStock", "updatedAt")
SELECT w."id", p."id", p."stock", p."minStock", CURRENT_TIMESTAMP
FROM "Product" p
CROSS JOIN "Warehouse" w
WHERE w."code" = 'MAIN'
ON CONFLICT ("warehouseId", "productId") DO NOTHING;

UPDATE "Purchase"
SET "warehouseId" = (SELECT "id" FROM "Warehouse" WHERE "code" = 'MAIN'),
    "warehouseName" = 'Soul2Soul Baia Mall'
WHERE "warehouseId" IS NULL;

UPDATE "InventoryBatch"
SET "warehouseId" = (SELECT "id" FROM "Warehouse" WHERE "code" = 'MAIN')
WHERE "warehouseId" IS NULL;

UPDATE "StockMovement"
SET "warehouseId" = (SELECT "id" FROM "Warehouse" WHERE "code" = 'MAIN')
WHERE "warehouseId" IS NULL
  AND "sourceWarehouseId" IS NULL
  AND "destinationWarehouseId" IS NULL;

UPDATE "Sale"
SET "warehouseId" = (SELECT "id" FROM "Warehouse" WHERE "code" = 'MAIN'),
    "warehouseName" = 'Soul2Soul Baia Mall'
WHERE "warehouseId" IS NULL;

UPDATE "Customer"
SET "customerCode" = 'CUST-' || LPAD("id"::text, 5, '0')
WHERE "customerCode" IS NULL;
-- Reseller workflow configuration, sale channel tracking and order status.
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
