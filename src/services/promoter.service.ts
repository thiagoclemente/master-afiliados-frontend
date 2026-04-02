import { authFetch } from "@/lib/auth";
import type {
  PaginationMeta,
  PromoterAutomationStatusResponse,
  PromoterAutomationTargetInput,
  PromoterHistoryItem,
  PromoterListDraft,
  PromoterPreview,
  TelegramBatch,
  TelegramGroup,
  WhatsAppBatch,
} from "@/interfaces/promoter";

export type {
  PromoterAutomationStatusResponse,
  PromoterAutomationTarget,
  PromoterAutomationTargetInput,
  PromoterAutoSourceSummary,
  PromoterListDraft,
  PromoterListDraftGroup,
  PromoterListDraftItem,
  PromoterScheduledTelegramGroup,
  TelegramBatch,
  TelegramGroup,
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
  message?: string,
  payload?: Record<string, unknown>
): Promise<PromoterPreview> {
  const data = await request<Record<string, unknown> | null>(
    "/api/whatsapp/promoter/preview",
    {
      method: "POST",
      body: JSON.stringify({
        link,
        ...(message ? { message } : {}),
        ...(payload ? { payload } : {}),
      }),
    }
  );

  return {
    message: (data?.message as string) ?? "",
    payload:
      (data?.payload as Record<string, unknown> | undefined) ?? {},
  };
}

export async function fetchWhatsAppProductInfo(
  link: string,
  options?: {
    signal?: AbortSignal;
  }
): Promise<PromoterPreview> {
  const data = await request<Record<string, unknown> | null>(
    "/api/whatsapp/campaigns/product-info",
    {
      method: "POST",
      body: JSON.stringify({ link }),
      signal: options?.signal,
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

export async function fetchPromoterListDrafts(options?: {
  summary?: boolean;
}): Promise<PromoterListDraft[]> {
  const suffix = options?.summary ? "?summary=true" : "";
  const data = await request<PromoterListDraft[] | { data?: PromoterListDraft[] }>(`/api/promoter-lists/drafts${suffix}`);
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}

export async function createPromoterListDraft(payload?: PromoterListDraft): Promise<PromoterListDraft | null> {
  return request<PromoterListDraft | null>("/api/promoter-lists/drafts", {
    method: "POST",
    body: JSON.stringify({ data: payload || {} }),
  });
}

export async function fetchPromoterListDraft(documentId: string): Promise<PromoterListDraft | null> {
  return request<PromoterListDraft | null>(`/api/promoter-lists/drafts/${documentId}`);
}

export async function updatePromoterListDraft(documentId: string, payload: PromoterListDraft): Promise<PromoterListDraft | null> {
  return request<PromoterListDraft | null>(`/api/promoter-lists/drafts/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
}

export async function deletePromoterListDraft(documentId: string): Promise<void> {
  await request(`/api/promoter-lists/drafts/${documentId}`, {
    method: "DELETE",
  });
}

export async function fetchPromoterListAutomationStatus(
  documentId: string
): Promise<PromoterAutomationStatusResponse | null> {
  return request<PromoterAutomationStatusResponse | null>(
    `/api/promoter-lists/drafts/${documentId}/automation/status`
  );
}

export async function updatePromoterListAutomationConfig(
  documentId: string,
  payload: Partial<PromoterListDraft>
): Promise<PromoterListDraft | null> {
  return request<PromoterListDraft | null>(
    `/api/promoter-lists/drafts/${documentId}/automation/config`,
    {
      method: "PUT",
      body: JSON.stringify({ data: payload }),
    }
  );
}

export async function updatePromoterListAutomationTargets(
  documentId: string,
  targets: PromoterAutomationTargetInput[]
): Promise<PromoterAutomationStatusResponse | null> {
  return request<PromoterAutomationStatusResponse | null>(
    `/api/promoter-lists/drafts/${documentId}/automation/targets`,
    {
      method: "PUT",
      body: JSON.stringify({ data: { targets } }),
    }
  );
}

export async function activatePromoterListAutomation(
  documentId: string
): Promise<PromoterAutomationStatusResponse | null> {
  return request<PromoterAutomationStatusResponse | null>(
    `/api/promoter-lists/drafts/${documentId}/automation/activate`,
    {
      method: "POST",
    }
  );
}

export async function pausePromoterListAutomation(
  documentId: string
): Promise<PromoterAutomationStatusResponse | null> {
  return request<PromoterAutomationStatusResponse | null>(
    `/api/promoter-lists/drafts/${documentId}/automation/pause`,
    {
      method: "POST",
    }
  );
}

export async function resumePromoterListAutomation(
  documentId: string
): Promise<PromoterAutomationStatusResponse | null> {
  return request<PromoterAutomationStatusResponse | null>(
    `/api/promoter-lists/drafts/${documentId}/automation/resume`,
    {
      method: "POST",
    }
  );
}

export async function restartPromoterListAutomationQueue(
  documentId: string
): Promise<PromoterAutomationStatusResponse | null> {
  return request<PromoterAutomationStatusResponse | null>(
    `/api/promoter-lists/drafts/${documentId}/automation/restart`,
    {
      method: "POST",
    }
  );
}

export async function resetPromoterListAutomationSource(
  documentId: string
): Promise<PromoterAutomationStatusResponse | null> {
  return request<PromoterAutomationStatusResponse | null>(
    `/api/promoter-lists/drafts/${documentId}/automation/source/reset`,
    {
      method: "POST",
    }
  );
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

export async function fetchTelegramGroups(): Promise<TelegramGroup[]> {
  const data = await request<TelegramGroup[] | { data?: TelegramGroup[] }>(
    "/api/telegram/groups"
  );
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}

export async function fetchTelegramBatches(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: TelegramBatch[]; meta?: PaginationMeta }> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const data = await request<
    | TelegramBatch[]
    | {
        data?: TelegramBatch[];
        meta?: { pagination?: PaginationMeta };
      }
  >(`/api/telegram/campaigns/batches?page=${page}&pageSize=${pageSize}`);

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];
  const meta = !Array.isArray(data) ? data?.meta?.pagination : undefined;
  return { items, meta };
}

export async function fetchTelegramBatchDetail(
  batchId: string
): Promise<TelegramBatch | null> {
  const data = await request<TelegramBatch | { data?: TelegramBatch }>(
    `/api/telegram/campaigns/batches/${batchId}`
  );

  if (!data) return null;
  if (!Array.isArray(data) && "data" in data) {
    return (data as { data?: TelegramBatch }).data ?? null;
  }
  return data as TelegramBatch;
}

export async function deleteTelegramBatch(
  batchId: string,
  shouldDelete = true
): Promise<void> {
  await request(
    `/api/telegram/campaigns/batches/${batchId}?delete=${shouldDelete ? "true" : "false"}`,
    { method: "DELETE" }
  );
}

export async function scheduleTelegramList(payload: {
  title?: string;
  groupId: string;
  groupName: string;
  intervalMinutes?: number;
  startAt?: string;
  endAt?: string;
  overflowStartAt?: string;
  overflowDayStarts?: string[];
  items: { link: string; message?: string; payload?: Record<string, unknown> }[];
}): Promise<void> {
  await request("/api/telegram/campaigns/list", {
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

export async function checkTelegramQuota(
  requestedCampaigns: number
): Promise<WhatsAppQuotaCheck> {
  return request<WhatsAppQuotaCheck>("/api/telegram/campaigns/quota-check", {
    method: "POST",
    body: JSON.stringify({ requestedCampaigns }),
  });
}
