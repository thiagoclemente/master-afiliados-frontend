export type PromoterCouponSource = "item" | "list";

export function normalizePromoterCoupon(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value).trim();
  }

  return "";
}

export function resolvePromoterCoupon(
  payload?: Record<string, unknown> | null
): string {
  if (!payload || typeof payload !== "object") return "";

  return normalizePromoterCoupon(
    payload.couponCode ?? payload.coupon ?? payload.cupom
  );
}

export function withPromoterCouponPayload(
  payload: Record<string, unknown> | null | undefined,
  couponValue: unknown,
  options?: {
    source?: PromoterCouponSource;
    hasSpecificCoupon?: boolean;
  }
): Record<string, unknown> {
  const nextPayload: Record<string, unknown> = { ...(payload ?? {}) };
  const coupon = normalizePromoterCoupon(couponValue);

  if (!coupon) {
    delete nextPayload.coupon;
    delete nextPayload.couponCode;
    delete nextPayload.couponSource;
    delete nextPayload.hasSpecificCoupon;
    return nextPayload;
  }

  const source = options?.source ?? "item";
  nextPayload.coupon = coupon;
  nextPayload.couponCode = coupon;
  nextPayload.couponSource = source;
  nextPayload.hasSpecificCoupon =
    options?.hasSpecificCoupon ?? source === "item";
  return nextPayload;
}

export function appendPromoterCouponToMessage(
  message: string | null | undefined,
  couponValue: unknown
): string {
  const coupon = normalizePromoterCoupon(couponValue);
  const trimmedMessage = (message || "").trim();

  if (!coupon) {
    return trimmedMessage;
  }

  if (trimmedMessage.toLowerCase().includes(coupon.toLowerCase())) {
    return trimmedMessage;
  }

  if (!trimmedMessage) {
    return `Cupom: ${coupon}`;
  }

  return `${trimmedMessage}\n\nCupom: ${coupon}`;
}
