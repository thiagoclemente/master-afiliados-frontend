import { getAuthToken } from "@/lib/auth";
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
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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

export async function scheduleWhatsappList(payload: {
  title?: string;
  groupId: string;
  groupName: string;
  sessionName: string;
  intervalMinutes?: number;
  startAt?: string;
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
