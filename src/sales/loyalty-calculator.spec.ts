import { calculateEarnedPoints, calculateRedeemValue } from './loyalty-calculator';

describe('loyalty calculator', () => {
  it('awards 1 point for 200 MT', () => {
    expect(calculateEarnedPoints(20000)).toEqual({
      pointsEarned: 1,
      newResidualCents: 0,
    });
  });

  it('keeps 150 MT residual after a 350 MT purchase', () => {
    expect(calculateEarnedPoints(35000)).toEqual({
      pointsEarned: 1,
      newResidualCents: 15000,
    });
  });

  it('converts residual plus a later 50 MT purchase into a new point', () => {
    expect(calculateEarnedPoints(5000, 15000)).toEqual({
      pointsEarned: 1,
      newResidualCents: 0,
    });
  });

  it('awards 5 points for 1000 MT', () => {
    expect(calculateEarnedPoints(100000)).toEqual({
      pointsEarned: 5,
      newResidualCents: 0,
    });
  });

  it('redeems a 500 MT product with 50 points', () => {
    expect(calculateRedeemValue(50, 50000)).toEqual({
      pointsRedeemed: 50,
      pointsValueCents: 50000,
      customerPaysCents: 0,
    });
  });

  it('supports points plus cash and earns only on the paid portion', () => {
    const redemption = calculateRedeemValue(100, 200000);
    const earned = calculateEarnedPoints(redemption.customerPaysCents);

    expect(redemption).toEqual({
      pointsRedeemed: 100,
      pointsValueCents: 100000,
      customerPaysCents: 100000,
    });
    expect(earned.pointsEarned).toBe(5);
  });

  it('does not award points on delivery fees', () => {
    const productPaidCents = 15000;
    const deliveryCents = 10000;
    expect(calculateEarnedPoints(productPaidCents).pointsEarned).toBe(0);
    expect(calculateEarnedPoints(productPaidCents + deliveryCents).pointsEarned).toBe(1);
  });

  it('does not award points on the value covered by points', () => {
    const redemption = calculateRedeemValue(25, 100000);
    expect(calculateEarnedPoints(redemption.customerPaysCents)).toEqual({
      pointsEarned: 3,
      newResidualCents: 15000,
    });
  });

  it('keeps point debits bounded by available value', () => {
    expect(calculateRedeemValue(200, 50000)).toEqual({
      pointsRedeemed: 50,
      pointsValueCents: 50000,
      customerPaysCents: 0,
    });
  });

  it('rejects fractional point creation by flooring conversions', () => {
    expect(calculateEarnedPoints(55000)).toEqual({
      pointsEarned: 2,
      newResidualCents: 15000,
    });
  });
});
