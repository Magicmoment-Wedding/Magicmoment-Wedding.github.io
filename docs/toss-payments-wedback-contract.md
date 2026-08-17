# Toss Payments WedBack Contract

This frontend (WedFront / GitHub Pages) no longer calls NICEPAY.
WedBack must expose the endpoints below before live payments work.

## Required environment variables (WedBack / Vercel)

- `TOSS_CLIENT_KEY` — widget/payment-window client key (safe to return to browser via prepare)
- `TOSS_SECRET_KEY` — server-only secret key for confirm/cancel (never expose to frontend)

Do not commit real secret values.

## Endpoints

### 1) `POST /api/payments/toss/prepare`

Auth: logged-in user session required.

Request body (compatible with previous nice prepare fields):

```json
{
  "packageId": "open_first_spark_pass_8",
  "productCode": "open_first_spark_pass_8",
  "productName": "첫 설렘 패스",
  "orderName": "첫 설렘 패스 - AI 웨딩사진 제작 이용권 12회",
  "passUses": 12,
  "servicePeriodMonths": 3,
  "amount": 9900,
  "successUrl": "https://magicaistudio.co.kr/payment/success",
  "failUrl": "https://magicaistudio.co.kr/payment/fail",
  "provider": "toss"
}
```

Server responsibilities:

1. Authenticate user
2. Resolve product from server-side catalog (do not trust client amount)
3. Create pending order (`status=pending`)
4. Persist server amount, product code, user id, orderId
5. Return:

```json
{
  "ok": true,
  "payment": {
    "orderId": "order_...",
    "amount": 9900,
    "orderName": "...",
    "clientKey": "test_ck_...",
    "customerKey": "user_<id>",
    "productCode": "open_first_spark_pass_8",
    "buyerName": "",
    "buyerEmail": ""
  }
}
```

### 2) `POST /api/payments/toss/confirm`

Auth: logged-in user session required.

Request:

```json
{
  "paymentKey": "...",
  "orderId": "...",
  "amount": 9900
}
```

Server responsibilities (must all pass before granting pass/credits):

1. Load order by `orderId`
2. Reject if order missing / wrong user
3. Reject if order already paid (idempotent success response, no second grant)
4. Compare request amount vs server order amount
5. Call Toss confirm API: `POST https://api.tosspayments.com/v1/payments/confirm`
   - Basic auth with secret key
   - body: `{ paymentKey, orderId, amount }`
6. On Toss success:
   - mark order paid
   - store paymentKey / method / approved amount
   - grant pass/credits exactly once (reuse existing grant logic from NICEPAY success path)
7. On Toss failure: mark failed and return error

Idempotency keys: `orderId` + `paymentKey`.

### 3) Admin cancel (if previously Nice-coupled)

If admin cancel currently calls Nice cancel, replace with Toss cancel:

`POST https://api.tosspayments.com/v1/payments/{paymentKey}/cancel`

Keep existing refund policy (manual ops is OK). Do not invent automatic partial-refund calculator unless already present.

## Frontend flow after WedBack is ready

1. Credits page product button
2. `POST /api/payments/toss/prepare`
3. Toss payment window (`payment().requestPayment`)
4. Redirect `/payment/success?paymentKey&orderId&amount`
5. Frontend calls `POST /api/payments/toss/confirm`
6. Redirect `/?payment=success` → credits UI refresh

## Retired frontend paths

- `POST /api/payments/nice/prepare` (no longer called by frontend)
- NICEPAY JS SDK `AUTHNICE.requestPay`

Preserve historical payment rows in Supabase.
