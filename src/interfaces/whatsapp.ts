export interface WhatsAppGroup {
  id: string;
  name?: string | null;
  type?: string | null;
  picture?: string | null;
}

export interface WhatsAppAccount {
  documentId: string;
  sessionName: string;
  title?: string | null;
  statusConnection: string;
  qrCode?: string | null;
  defaultGroupId?: string | null;
  defaultGroupName?: string | null;
  lastSyncedAt?: string | null;
  phoneNumber?: string | null;
  groupsCache?: WhatsAppGroup[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface WhatsAppCampaign {
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

export interface WhatsAppCampaignPreview {
  message: string;
  payload: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}
