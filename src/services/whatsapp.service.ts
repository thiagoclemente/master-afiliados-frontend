import { getAuthToken } from "@/lib/auth";
import type {
  WhatsAppAccount,
  WhatsAppCampaign,
  WhatsAppCampaignPreview,
  WhatsAppGroup,
  PaginationMeta,
} from "@/interfaces/whatsapp";

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
  let json: unknown = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      console.error("Erro ao parsear resposta da API do WhatsApp:", error);
    }
  }

  // @ts-expect-error dynamic shape
  if (!response.ok || (json && json.error)) {
    const jsonRecord = json as Record<string, unknown> | null;
    const errorObj = jsonRecord?.error as Record<string, unknown> | undefined;
    const message =
      (typeof errorObj?.message === "string" ? errorObj.message : null) ||
      (typeof jsonRecord?.message === "string" ? jsonRecord.message : null) ||
      "Não foi possível completar a solicitação.";
    throw new Error(message);
  }

  const parsed = json as Record<string, unknown> | null;
  const data = parsed && "data" in parsed ? parsed.data : json;
  return data as T;
}

export async function fetchWhatsappConnections(): Promise<WhatsAppAccount[]> {
  const data = await request<WhatsAppAccount | WhatsAppAccount[] | null>(
    "/api/whatsapp/connections/me"
  );

  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

export async function connectWhatsappSession(
  sessionName: string,
  title?: string
): Promise<WhatsAppAccount | null> {
  return request<WhatsAppAccount | null>("/api/whatsapp/connections/connect", {
    method: "POST",
    body: JSON.stringify({
      sessionName,
      ...(title ? { title } : {}),
    }),
  });
}

export async function syncWhatsappSession(
  sessionName: string
): Promise<WhatsAppAccount | null> {
  return request<WhatsAppAccount | null>("/api/whatsapp/connections/sync", {
    method: "POST",
    body: JSON.stringify({ sessionName }),
  });
}

export async function disconnectWhatsappSession(
  sessionName: string
): Promise<void> {
  await request<void>(
    `/api/whatsapp/connections/me?sessionName=${encodeURIComponent(
      sessionName
    )}`,
    {
      method: "DELETE",
      body: JSON.stringify({ sessionName }),
    }
  );
}

export async function setDefaultWhatsappGroup(params: {
  groupId: string;
  groupName: string;
  sessionName: string;
}): Promise<WhatsAppAccount | null> {
  return request<WhatsAppAccount | null>(
    "/api/whatsapp/connections/default-group",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

export async function fetchWhatsappGroups(
  sessionName: string,
  forceRefresh = false
): Promise<WhatsAppGroup[]> {
  const refreshQuery = forceRefresh ? "&refresh=true" : "";
  const data = await request<WhatsAppGroup[]>(
    `/api/whatsapp/groups?sessionName=${encodeURIComponent(
      sessionName
    )}${refreshQuery}`
  );
  return data ?? [];
}

export async function previewWhatsappCampaign(
  videoDocumentId: string,
  message?: string
): Promise<WhatsAppCampaignPreview> {
  const data = await request<Record<string, unknown> | null>(
    "/api/whatsapp/campaigns/preview",
    {
      method: "POST",
      body: JSON.stringify({
        videoDocumentId,
        ...(message ? { message } : {}),
      }),
    }
  );

  const payload =
    data && typeof data === "object" && "payload" in data && data.payload
      ? (data.payload as Record<string, unknown>)
      : {};
  const msg =
    data && typeof data === "object" && "message" in data && data.message
      ? String(data.message)
      : "";

  return {
    message: msg,
    payload,
  };
}

export async function scheduleWhatsappCampaign(params: {
  videoDocumentId?: string;
  link?: string;
  groupId: string;
  groupName: string;
  message: string;
  sendType: "immediate" | "scheduled";
  sessionName: string;
  scheduledAt?: string;
  previewPayload?: Record<string, unknown>;
}): Promise<WhatsAppCampaign> {
  if (!params.videoDocumentId && !params.link) {
    throw new Error("Informe o vídeo ou o link para o disparo do WhatsApp.");
  }
  const body = {
    ...(params.videoDocumentId ? { videoDocumentId: params.videoDocumentId } : {}),
    ...(params.link ? { link: params.link } : {}),
    groupId: params.groupId,
    groupName: params.groupName,
    message: params.message,
    sendType: params.sendType,
    sessionName: params.sessionName,
    ...(params.scheduledAt ? { scheduledAt: params.scheduledAt } : {}),
    ...(params.previewPayload ? { payload: params.previewPayload } : {}),
  };

  return request<WhatsAppCampaign>("/api/whatsapp/campaigns", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchWhatsappHistory(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ campaigns: WhatsAppCampaign[]; meta?: PaginationMeta }> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const statusQuery =
    params?.status && params.status.length
      ? `&status=${encodeURIComponent(params.status)}`
      : "";

  const data = await request<{
    data?: WhatsAppCampaign[];
    meta?: { pagination?: PaginationMeta };
  }>(
    `/api/whatsapp/campaigns/history?page=${page}&pageSize=${pageSize}${statusQuery}`
  );

  return {
    campaigns: data?.data ?? [],
    meta: data?.meta?.pagination,
  };
}
