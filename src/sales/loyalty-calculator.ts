export const DEFAULT_EARN_RATE_CENTS = 20000;
export const DEFAULT_REDEEM_RATE_CENTS = 1000;

export function calculateEarnedPoints(
  eligiblePaidCents: number,
  residualCents = 0,
  earnRateCents = DEFAULT_EARN_RATE_CENTS,
) {
  const totalForConversion = Math.max(0, residualCents) + Math.max(0, eligiblePaidCents);
  const pointsEarned = Math.floor(totalForConversion / earnRateCents);
  const newResidualCents = totalForConversion % earnRateCents;
  return { pointsEarned, newResidualCents };
}

export function calculateRedeemValue(points: number, netProductCents: number, redeemRateCents = DEFAULT_REDEEM_RATE_CENTS) {
  const redeemablePoints = Math.max(0, Math.floor(points));
  const pointsValueCents = Math.min(Math.max(0, netProductCents), redeemablePoints * redeemRateCents);
  return {
    pointsRedeemed: Math.floor(pointsValueCents / redeemRateCents),
    pointsValueCents,
    customerPaysCents: Math.max(0, netProductCents - pointsValueCents),
  };
}
