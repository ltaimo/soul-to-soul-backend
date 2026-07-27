-- Multi-warehouse stock management.
-- Keeps Product.stock as the consolidated total while adding per-location balances.

CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Warehouse',
    "address" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WarehouseStock" (
    "id" SERIAL NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockTransfer" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockTransferItem" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Purchase" ADD COLUMN "warehouseId" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN "warehouseName" TEXT;

ALTER TABLE "InventoryBatch" ADD COLUMN "warehouseId" INTEGER;

ALTER TABLE "StockMovement" ADD COLUMN "warehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "sourceWarehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "destinationWarehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "transferId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "responsibleId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "responsibleName" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Posted';

ALTER TABLE "Sale" ADD COLUMN "warehouseId" INTEGER;
ALTER TABLE "Sale" ADD COLUMN "warehouseName" TEXT;

CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
CREATE INDEX "Warehouse_status_idx" ON "Warehouse"("status");
CREATE INDEX "Warehouse_type_idx" ON "Warehouse"("type");
CREATE UNIQUE INDEX "WarehouseStock_warehouseId_productId_key" ON "WarehouseStock"("warehouseId", "productId");
CREATE INDEX "WarehouseStock_productId_idx" ON "WarehouseStock"("productId");
CREATE UNIQUE INDEX "StockTransfer_transferNumber_key" ON "StockTransfer"("transferNumber");
CREATE INDEX "StockTransfer_sourceWarehouseId_idx" ON "StockTransfer"("sourceWarehouseId");
CREATE INDEX "StockTransfer_destinationWarehouseId_idx" ON "StockTransfer"("destinationWarehouseId");
CREATE INDEX "StockTransfer_status_idx" ON "StockTransfer"("status");
CREATE INDEX "StockTransferItem_productId_idx" ON "StockTransferItem"("productId");
CREATE INDEX "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");
CREATE INDEX "StockMovement_sourceWarehouseId_idx" ON "StockMovement"("sourceWarehouseId");
CREATE INDEX "StockMovement_destinationWarehouseId_idx" ON "StockMovement"("destinationWarehouseId");
CREATE INDEX "StockMovement_transferId_idx" ON "StockMovement"("transferId");
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Warehouse" ("code", "name", "type", "status", "isDefault", "createdAt", "updatedAt")
VALUES ('MAIN', 'Soul2Soul Baia Mall', 'Shop', 'Active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

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
