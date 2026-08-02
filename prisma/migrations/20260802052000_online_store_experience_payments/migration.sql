ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "storeFeatured" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'Paid';
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "paymentReference" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "paymentProviderData" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "notificationStatus" TEXT NOT NULL DEFAULT 'Not Required';

UPDATE "Sale"
SET "paymentStatus" = 'Pending', "notificationStatus" = 'Pending'
WHERE "channel" = 'Online'
  AND "fulfillmentStatus" = 'Pending Payment'
  AND "paymentStatus" = 'Paid';

CREATE INDEX IF NOT EXISTS "Sale_channel_idx" ON "Sale"("channel");
CREATE INDEX IF NOT EXISTS "Sale_fulfillmentStatus_idx" ON "Sale"("fulfillmentStatus");
CREATE INDEX IF NOT EXISTS "Sale_paymentStatus_idx" ON "Sale"("paymentStatus");
CREATE INDEX IF NOT EXISTS "Sale_orderReference_idx" ON "Sale"("orderReference");
