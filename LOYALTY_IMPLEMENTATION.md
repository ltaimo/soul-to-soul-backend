# Soul2Soul Loyalty, Points and Sales Controls

## Core Rules

- Each 200 MT of eligible paid product value generates 1 point.
- Residual eligible value below 200 MT is stored on the customer as `loyaltyResidualCents`.
- Each point is initially worth 10 MT.
- Delivery, discounts, cancelled values, returned values and values covered by points are excluded from point earning.
- Points are recorded through `LoyaltyPointMovement`; balances must not be edited directly.

## Database Additions

- `LoyaltyProgramConfig`: configurable earn/redeem rates and points+cash behavior.
- `LoyaltyPointMovement`: auditable ledger for EARN, REDEEM, REFUND, REVERSAL, EXPIRATION, ADMIN_ADJUSTMENT and BONUS.
- `SalePayment`: combined payments per sale.
- `SellerGoal` and `BonusRule`: configurable seller targets and bonus definitions.
- Extra cent-based fields were added to `Sale` and `SaleItem` while keeping legacy Float fields for compatibility.

## API Additions

- `PATCH /api/sales/:id/cancel`: cancels a sale and creates compensating point movements once.
- `GET /api/customers/:id/points`: returns point history.
- `POST /api/customers/:id/points/adjust`: manager-only audited point adjustment with required reason.
- `GET/PUT /api/settings/loyalty`: manager/admin loyalty configuration.
- `GET /api/analytics/sales-dashboard`: period-aware sales dashboard.
- `GET /api/analytics/seller-ranking`: seller ranking by eligible net paid value.
- `GET/POST /api/analytics/seller-goals`: configurable seller goals.
- `GET/POST /api/analytics/bonus-rules`: configurable bonus rules.

## Conservative Decisions

- Monetary control fields use integer cents to avoid new floating-point financial logic.
- Legacy fields remain in place so older sales, dashboards and receipts continue to render.
- Cancel reversal refuses to make a customer point balance negative; this preserves the no-negative-balance rule.
- Period filters are calculated with Africa/Maputo timezone and Monday as the start of the week.
