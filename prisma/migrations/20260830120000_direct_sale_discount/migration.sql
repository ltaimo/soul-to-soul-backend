ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "directDiscountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "directDiscountReason" TEXT;

ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_money_cents_non_negative";
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_money_cents_non_negative" CHECK (
  "amountPaidCents" >= 0 AND
  "changeGivenCents" >= 0 AND
  "discountCents" >= 0 AND
  "directDiscountCents" >= 0 AND
  "deliveryFeeCents" >= 0 AND
  "grossTotalCents" >= 0 AND
  "netTotalCents" >= 0 AND
  "eligiblePaidCents" >= 0 AND
  "pointsValueCents" >= 0
);
