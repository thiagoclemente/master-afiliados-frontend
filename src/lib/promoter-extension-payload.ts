import { normalizePromoterCoupon, withPromoterCouponPayload } from "@/lib/promoter-coupon";

export type ExtensionProductPayload = {
  source: string;
  version?: number;
  type: string;
  origin?: string;
  marketplace?: string;
  capturedAt?: string;
  couponCode?: string;
  coupon?: string;
  cupom?: string;
  product: {
    itemId?: string;
    productName?: string;
    productLink?: string;
    offerLink?: string;
    imageUrl?: string;
    price?: string;
    priceMin?: string;
    priceMax?: string | null;
    priceDiscountRate?: string | null;
    shopName?: string;
    sales?: string | null;
    couponCode?: string;
    coupon?: string;
    cupom?: string;
    affiliateMeta?: {
      shortUrl?: string;
    };
  };
};

export function tryParseExtensionPayload(
  raw: string
): ExtensionProductPayload | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (
      parsed.source !== "masterafiliados_extension" ||
      parsed.type !== "product_payload" ||
      !parsed.product ||
      typeof parsed.product !== "object"
    ) {
      return null;
    }

    return parsed as unknown as ExtensionProductPayload;
  } catch {
    return null;
  }
}

export function buildPreviewPayloadFromExtension(
  extensionPayload: ExtensionProductPayload
): Record<string, unknown> {
  const product = extensionPayload.product || {};
  const offerLink =
    product.offerLink?.trim() ||
    product.affiliateMeta?.shortUrl?.trim() ||
    product.productLink?.trim() ||
    "";
  const coupon = normalizePromoterCoupon(
    product.couponCode ??
      product.coupon ??
      product.cupom ??
      extensionPayload.couponCode ??
      extensionPayload.coupon ??
      extensionPayload.cupom
  );

  return withPromoterCouponPayload(
    {
      source: extensionPayload.origin || "browser_extension",
      marketplace: extensionPayload.marketplace || "mercado-livre",
      itemId: product.itemId || "",
      productId: product.itemId || "",
      productTitle: product.productName || "",
      productName: product.productName || "",
      productLink: product.productLink || offerLink,
      offerLink,
      productImageUrl: product.imageUrl || "",
      imageUrl: product.imageUrl || "",
      productPrice: product.price || product.priceMin || "",
      price: product.price || product.priceMin || "",
      priceMin: product.priceMin || product.price || "",
      priceMax: product.priceMax || null,
      priceDiscountRate: product.priceDiscountRate || null,
      shopName: product.shopName || "",
      sales: product.sales || null,
      needsAiProcessing: true,
      extensionPayload,
    },
    coupon,
    { source: "item", hasSpecificCoupon: true }
  );
}

export function getPromoterLinkFromPayload(
  payload: Record<string, unknown> | null | undefined
): string {
  if (!payload || typeof payload !== "object") return "";
  const offerLink =
    typeof payload.offerLink === "string" ? payload.offerLink.trim() : "";
  if (offerLink) return offerLink;
  const productLink =
    typeof payload.productLink === "string" ? payload.productLink.trim() : "";
  if (productLink) return productLink;
  return "";
}

export function getExtensionPayloadCardData(
  payload: Record<string, unknown> | null | undefined
) {
  if (!payload || typeof payload !== "object") return null;
  const source = typeof payload.source === "string" ? payload.source : "";
  const extensionPayload =
    payload.extensionPayload && typeof payload.extensionPayload === "object"
      ? (payload.extensionPayload as Record<string, unknown>)
      : null;

  if (source !== "browser_extension" && !extensionPayload) {
    return null;
  }

  return {
    title:
      typeof payload.productTitle === "string" ? payload.productTitle : "",
    imageUrl:
      typeof payload.productImageUrl === "string"
        ? payload.productImageUrl
        : "",
    price:
      typeof payload.productPrice === "string" ? payload.productPrice : "",
    priceMax:
      typeof payload.priceMax === "string" ? payload.priceMax : "",
    priceDiscountRate:
      typeof payload.priceDiscountRate === "string"
        ? payload.priceDiscountRate
        : "",
    shopName: typeof payload.shopName === "string" ? payload.shopName : "",
    marketplace:
      typeof payload.marketplace === "string" ? payload.marketplace : "",
    link: getPromoterLinkFromPayload(payload),
  };
}

export function buildListItemFromExtensionPayload(
  extensionPayload: ExtensionProductPayload
) {
  const payload = buildPreviewPayloadFromExtension(extensionPayload);
  const title =
    typeof payload.productTitle === "string" ? payload.productTitle : "";

  return {
    link: getPromoterLinkFromPayload(payload),
    title,
    imageUrl:
      typeof payload.productImageUrl === "string" ? payload.productImageUrl : "",
    message: title,
    payload: {
      ...payload,
      needsAiProcessing: true,
      sourceType: "browser_extension",
      sourceLink: getPromoterLinkFromPayload(payload),
    },
  };
}
