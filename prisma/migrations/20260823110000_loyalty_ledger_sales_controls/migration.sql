ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rewardEligible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allowPointsCash" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rewardMaxQuantity" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rewardPromoStart" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rewardPromoEnd" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rewardActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rewardPromoPoints" INTEGER;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loyaltyResidualCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loyaltyPointsEarnedTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loyaltyPointsRedeemedTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loyaltyPointsExpiredTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loyaltyPointsAdjustedTotal" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "amountPaidCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "changeGivenCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "discountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "grossTotalCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "netTotalCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "eligiblePaidCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "pointsValueCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "loyaltyReversedAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PAID';

ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "grossLineCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "discountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "netLineCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "pointsValueCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "eligiblePaidCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "SalePayment" (
  "id" SERIAL PRIMARY KEY,
  "saleId" INTEGER NOT NULL,
  "method" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "reference" TEXT,
  "providerData" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PAID',
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LoyaltyPointMovement" (
  "id" SERIAL PRIMARY KEY,
  "customerId" INTEGER NOT NULL,
  "saleId" INTEGER,
  "movementType" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "balanceBefore" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "userId" INTEGER,
  "userName" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyPointMovement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LoyaltyPointMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LoyaltyProgramConfig" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "earnRateCents" INTEGER NOT NULL DEFAULT 20000,
  "redeemRateCents" INTEGER NOT NULL DEFAULT 1000,
  "allowPointsCash" BOOLEAN NOT NULL DEFAULT true,
  "pointsExpireDays" INTEGER,
  "roundingMode" TEXT NOT NULL DEFAULT 'FLOOR',
  "weekStartsOn" TEXT NOT NULL DEFAULT 'MONDAY',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SellerGoal" (
  "id" SERIAL PRIMARY KEY,
  "sellerId" INTEGER NOT NULL,
  "sellerName" TEXT,
  "period" TEXT NOT NULL DEFAULT 'MONTHLY',
  "targetCents" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BonusRule" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "period" TEXT NOT NULL DEFAULT 'MONTHLY',
  "eligiblePosition" INTEGER,
  "minimumTargetCents" INTEGER,
  "bonusValueCents" INTEGER NOT NULL,
  "bonusType" TEXT NOT NULL DEFAULT 'FIXED',
  "criteriaJson" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "SalePayment_idempotencyKey_key" ON "SalePayment"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyPointMovement_idempotencyKey_key" ON "LoyaltyPointMovement"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Sale_status_idx" ON "Sale"("status");
CREATE INDEX IF NOT EXISTS "Sale_date_idx" ON "Sale"("date");
CREATE INDEX IF NOT EXISTS "Sale_sellerId_idx" ON "Sale"("sellerId");
CREATE INDEX IF NOT EXISTS "SalePayment_saleId_idx" ON "SalePayment"("saleId");
CREATE INDEX IF NOT EXISTS "SalePayment_method_idx" ON "SalePayment"("method");
CREATE INDEX IF NOT EXISTS "SalePayment_status_idx" ON "SalePayment"("status");
CREATE INDEX IF NOT EXISTS "LoyaltyPointMovement_customerId_idx" ON "LoyaltyPointMovement"("customerId");
CREATE INDEX IF NOT EXISTS "LoyaltyPointMovement_saleId_idx" ON "LoyaltyPointMovement"("saleId");
CREATE INDEX IF NOT EXISTS "LoyaltyPointMovement_movementType_idx" ON "LoyaltyPointMovement"("movementType");
CREATE INDEX IF NOT EXISTS "LoyaltyPointMovement_createdAt_idx" ON "LoyaltyPointMovement"("createdAt");
CREATE INDEX IF NOT EXISTS "SellerGoal_sellerId_idx" ON "SellerGoal"("sellerId");
CREATE INDEX IF NOT EXISTS "SellerGoal_period_idx" ON "SellerGoal"("period");
CREATE INDEX IF NOT EXISTS "SellerGoal_status_idx" ON "SellerGoal"("status");
CREATE INDEX IF NOT EXISTS "SellerGoal_startsAt_endsAt_idx" ON "SellerGoal"("startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "BonusRule_period_idx" ON "BonusRule"("period");
CREATE INDEX IF NOT EXISTS "BonusRule_status_idx" ON "BonusRule"("status");

ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_loyaltyPoints_non_negative";
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_loyaltyPoints_non_negative" CHECK ("loyaltyPoints" >= 0);
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_loyaltyResidualCents_non_negative";
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_loyaltyResidualCents_non_negative" CHECK ("loyaltyResidualCents" >= 0);
ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_money_cents_non_negative";
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_money_cents_non_negative" CHECK (
  "amountPaidCents" >= 0 AND
  "changeGivenCents" >= 0 AND
  "discountCents" >= 0 AND
  "deliveryFeeCents" >= 0 AND
  "grossTotalCents" >= 0 AND
  "netTotalCents" >= 0 AND
  "eligiblePaidCents" >= 0 AND
  "pointsValueCents" >= 0
);

INSERT INTO "LoyaltyProgramConfig" ("id", "earnRateCents", "redeemRateCents", "allowPointsCash", "roundingMode", "weekStartsOn", "updatedAt")
VALUES (1, 20000, 1000, true, 'FLOOR', 'MONDAY', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
