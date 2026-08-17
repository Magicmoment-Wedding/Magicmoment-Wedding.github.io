/**
 * Reference WedBack handlers for Toss Payments migration.
 *
 * This file is NOT wired into the live API by this frontend repo.
 * Copy/adapt into WedBack (api.magicaistudio.co.kr) routes.
 *
 * Critical rules:
 * - Never trust client amount
 * - Confirm on server with TOSS_SECRET_KEY
 * - Grant pass/credits only after confirm success
 * - Idempotent on orderId/paymentKey
 */

/* eslint-disable no-unused-vars */

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

function getTossAuthHeader(secretKey) {
  const token = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${token}`;
}

async function confirmTossPayment({ secretKey, paymentKey, orderId, amount }) {
  const response = await fetch(TOSS_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: getTossAuthHeader(secretKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

/**
 * Pseudocode for POST /api/payments/toss/prepare
 */
async function prepareHandler(req, res, deps) {
  const user = await deps.requireUser(req);
  const product = deps.resolveProduct(req.body?.productCode || req.body?.packageId);
  if (!product) return res.status(400).json({ ok: false, code: "INVALID_PRODUCT" });

  const amount = Number(product.price);
  const orderId = deps.createOrderId();
  await deps.createPendingOrder({
    orderId,
    userId: user.id,
    productCode: product.productCode,
    amount,
    provider: "toss",
    status: "pending",
  });

  return res.json({
    ok: true,
    payment: {
      orderId,
      amount,
      orderName: product.orderName,
      clientKey: deps.env.TOSS_CLIENT_KEY,
      customerKey: `user_${user.id}`,
      productCode: product.productCode,
      buyerEmail: user.email || "",
      buyerName: user.name || "",
    },
  });
}

/**
 * Pseudocode for POST /api/payments/toss/confirm
 */
async function confirmHandler(req, res, deps) {
  const user = await deps.requireUser(req);
  const paymentKey = String(req.body?.paymentKey || "").trim();
  const orderId = String(req.body?.orderId || "").trim();
  const amount = Number(req.body?.amount);

  const order = await deps.getOrder(orderId);
  if (!order || order.userId !== user.id) {
    return res.status(404).json({ ok: false, code: "ORDER_NOT_FOUND" });
  }
  if (order.status === "paid") {
    return res.json({ ok: true, alreadyCompleted: true, orderId });
  }
  if (!Number.isFinite(amount) || amount !== Number(order.amount)) {
    return res.status(400).json({ ok: false, code: "PAYMENT_AMOUNT_MISMATCH" });
  }

  const { response, payload } = await confirmTossPayment({
    secretKey: deps.env.TOSS_SECRET_KEY,
    paymentKey,
    orderId,
    amount: order.amount,
  });

  if (!response.ok) {
    await deps.markOrderFailed(orderId, payload);
    return res.status(400).json({
      ok: false,
      code: payload?.code || "PAYMENT_CONFIRM_FAILED",
      message: payload?.message || "결제 승인 실패",
    });
  }

  // Atomic: mark paid + grant once (reuse existing Nice success grant path).
  await deps.completePaidOrderAndGrantPass({
    orderId,
    paymentKey,
    provider: "toss",
    tossPayload: payload,
  });

  return res.json({ ok: true, orderId, paymentKey });
}

module.exports = {
  prepareHandler,
  confirmHandler,
  confirmTossPayment,
  getTossAuthHeader,
};
