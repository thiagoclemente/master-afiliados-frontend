import { authFetch } from "@/lib/auth";
import type {
  PaginationMeta,
  PromoterHistoryItem,
  PromoterPreview,
  WhatsAppBatch,
} from "@/interfaces/promoter";

const API_BASE = process.env.NEXT_PUBLIC_STRAPI_URL;

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authFetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok || (json && json.error)) {
    const message =
      json?.error?.message ||
      json?.message ||
      "Não foi possível completar a solicitação.";
    throw new Error(message);
  }

  const data = json?.data ?? json;
  return data as T;
}

export async function promoterPreview(
  link: string,
  message?: string
): Promise<PromoterPreview> {
  const data = await request<Record<string, unknown> | null>(
    "/api/whatsapp/promoter/preview",
    {
      method: "POST",
      body: JSON.stringify({
        link,
        ...(message ? { message } : {}),
      }),
    }
  );

  return {
    message: (data?.message as string) ?? "",
    payload:
      (data?.payload as Record<string, unknown> | undefined) ?? {},
  };
}

export type PromoterShopeeProduct = {
  itemId: string | number;
  productName?: string;
  productLink?: string;
  offerLink?: string;
  imageUrl?: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  sales?: number;
  commissionRate?: number;
};

export async function fetchPromoterShopeeProducts(params?: {
  page?: number;
  limit?: number;
  query?: string;
  sortType?: number;
  isAMSOffer?: boolean;
}): Promise<{
  nodes: PromoterShopeeProduct[];
  pageInfo?: { hasNextPage?: boolean };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.query?.trim()) searchParams.set("query", params.query.trim());
  if (typeof params?.sortType === "number") {
    searchParams.set("sortType", String(params.sortType));
  }
  if (typeof params?.isAMSOffer === "boolean") {
    searchParams.set("isAMSOffer", String(params.isAMSOffer));
  }

  const suffix = searchParams.toString();
  const data = await request<{
    nodes?: PromoterShopeeProduct[];
    pageInfo?: { hasNextPage?: boolean };
  }>(`/api/whatsapp/promoter/shopee-products${suffix ? `?${suffix}` : ""}`);

  return {
    nodes: Array.isArray(data?.nodes) ? data.nodes : [],
    pageInfo: data?.pageInfo,
  };
}

export async function fetchPromoterHistory(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: PromoterHistoryItem[]; meta?: PaginationMeta }> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const data = await request<
    | PromoterHistoryItem[]
    | {
        data?: PromoterHistoryItem[];
        meta?: { pagination?: PaginationMeta };
      }
  >(
    `/api/user-whatsapp-promoters?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`
  );

  const itemsSource = Array.isArray(data)
    ? data
    : (data?.data as PromoterHistoryItem[] | undefined) ?? [];

  // Normalizar payload quando vier como string JSON
  const items = itemsSource.map((item) => {
    if (item?.payload && typeof item.payload === "string") {
      try {
        return {
          ...item,
          payload: JSON.parse(item.payload as string),
        };
      } catch {
        return { ...item, payload: null };
      }
    }
    return item;
  });

  const meta = !Array.isArray(data)
    ? data?.meta?.pagination
    : undefined;

  return { items, meta };
}

export async function savePromoterHistory(payload: {
  link: string;
  message: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  await request("/api/user-whatsapp-promoters", {
    method: "POST",
    body: JSON.stringify({
      data: {
        link: payload.link,
        message: payload.message,
        payload:
          Object.keys(payload.payload || {}).length > 0
            ? JSON.stringify(payload.payload)
            : "",
      },
    }),
  });
}

export async function deletePromoterHistory(id: string): Promise<void> {
  await request(`/api/user-whatsapp-promoters/${id}`, {
    method: "DELETE",
  });
}

export async function fetchWhatsappBatches(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: WhatsAppBatch[]; meta?: PaginationMeta }> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const data = await request<
    | WhatsAppBatch[]
    | {
        data?: WhatsAppBatch[];
        meta?: { pagination?: PaginationMeta };
      }
  >(`/api/whatsapp/campaigns/batches?page=${page}&pageSize=${pageSize}`);

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];
  const meta = !Array.isArray(data) ? data?.meta?.pagination : undefined;
  return { items, meta };
}

export async function fetchWhatsappBatchDetail(batchId: string): Promise<WhatsAppBatch | null> {
  const data = await request<
    | WhatsAppBatch
    | { data?: WhatsAppBatch }
  >(`/api/whatsapp/campaigns/batches/${batchId}`);

  if (!data) return null;
  if (!Array.isArray(data) && "data" in data) {
    return (data as { data?: WhatsAppBatch }).data ?? null;
  }
  return data as WhatsAppBatch;
}

export async function deleteWhatsappBatch(
  batchId: string,
  shouldDelete = true
): Promise<void> {
  await request(
    `/api/whatsapp/campaigns/batches/${batchId}?delete=${shouldDelete ? "true" : "false"}`,
    { method: "DELETE" }
  );
}

export async function scheduleWhatsappList(payload: {
  title?: string;
  groupId: string;
  groupName: string;
  sessionName: string;
  intervalMinutes?: number;
  startAt?: string;
  endAt?: string;
  overflowStartAt?: string;
  overflowDayStarts?: string[];
  items: { link: string; message?: string; payload?: Record<string, unknown> }[];
}): Promise<void> {
  await request("/api/whatsapp/campaigns/list", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      items: payload.items.map((item) => ({
        link: item.link,
        ...(item.message ? { message: item.message } : {}),
        ...(item.payload ? { payload: item.payload } : {}),
      })),
    }),
  });
}

export type WhatsAppQuotaCheck = {
  allowed: boolean;
  dailyLimit: number;
  usedToday: number;
  requestedCampaigns: number;
  extraCampaignsNeeded: number;
  creditsAvailable: number;
  creditsRequired: number;
  creditsAfterSend: number;
  requiresCredits: boolean;
  code?: string | null;
  message?: string | null;
};

export async function checkWhatsappQuota(
  requestedCampaigns: number
): Promise<WhatsAppQuotaCheck> {
  return request<WhatsAppQuotaCheck>("/api/whatsapp/campaigns/quota-check", {
    method: "POST",
    body: JSON.stringify({ requestedCampaigns }),
  });
}
