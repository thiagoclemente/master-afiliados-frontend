export interface PromoterHistoryItem {
  id: number;
  documentId: string;
  link: string;
  message?: string | null;
  payload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  createdAt?: string | null;
}

export interface PromoterPreview {
  message: string;
  payload: Record<string, unknown>;
}

export interface WhatsAppBatchCampaign {
  documentId: string;
  statusCampaign: string;
  sendType: string;
  groupId: string;
  groupName?: string | null;
  message?: string | null;
  errorMessage?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface WhatsAppBatch {
  documentId: string;
  title?: string | null;
  groupId: string;
  groupName?: string | null;
  sessionName?: string | null;
  status: string;
  intervalMinutes?: number | null;
  itemsCount?: number | null;
  startAt?: string | null;
  payload?: Record<string, unknown> | null;
  campaigns?: WhatsAppBatchCampaign[] | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}
