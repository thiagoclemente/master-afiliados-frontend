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

export type PromoterListMode = "manual" | "automatic_window";
export type PromoterItemSourceMode = "manual_queue" | "shopee_catalog";
export type PromoterAutomationState =
  | "inactive"
  | "active"
  | "paused_manual"
  | "paused_credit_approval"
  | "paused_insufficient_credits"
  | "paused_channel_unavailable"
  | "error";

export interface PromoterAutoSourceConfig {
  keyword?: string | null;
  sortType?: number | null;
  isAMSOffer?: boolean | null;
  keySeller?: boolean | null;
  batchSize?: number | null;
  refillThreshold?: number | null;
}

export interface PromoterAutoSourceStateSummary {
  sourceVersion?: number | null;
  nextPage?: number | null;
  hasNextPage?: boolean | null;
  exhausted?: boolean | null;
  seenCount?: number | null;
  lastFetchedAt?: string | null;
  lastFetchedCount?: number | null;
  consecutiveEmptyFetches?: number | null;
}

export interface PromoterAutoSourceSummary {
  itemSourceMode: PromoterItemSourceMode;
  autoSourceConfig?: PromoterAutoSourceConfig | null;
  autoSourceState?: PromoterAutoSourceStateSummary | null;
}

export interface PromoterAutomationTargetProgress {
  queueCycle: number;
  queueCycleStartedAt?: string | null;
  totalItems: number;
  processedItems: number;
  completedItems: number;
  processingItems: number;
  sentItems: number;
  failedItems: number;
  pendingItems: number;
  completed: boolean;
  lastProcessedItemTitle?: string | null;
  lastSentItemId?: string | null;
  lastSentItemTitle?: string | null;
  lastSentItemLink?: string | null;
  lastSentItemImageUrl?: string | null;
  lastFailedItemId?: string | null;
  lastFailedItemTitle?: string | null;
  lastFailedItemLink?: string | null;
  lastFailedItemImageUrl?: string | null;
}

export interface PromoterAutomationTargetMetadata {
  sourceVersion?: number | null;
  queueCycle?: number | null;
  queueCycleStartedAt?: string | null;
  processedCountCycle?: number | null;
  sentCountCycle?: number | null;
  failedCountCycle?: number | null;
  pendingItemId?: string | null;
  pendingCampaignId?: string | null;
  lastProcessedItemTitle?: string | null;
  lastSentItemId?: string | null;
  lastSentItemTitle?: string | null;
  lastSentItemLink?: string | null;
  lastSentItemImageUrl?: string | null;
  lastFailedItemId?: string | null;
  lastFailedItemTitle?: string | null;
  lastFailedItemLink?: string | null;
  lastFailedItemImageUrl?: string | null;
}

export interface PromoterAutomationTarget {
  documentId: string;
  channel: "whatsapp" | "telegram";
  accountKey?: string | null;
  targetId: string;
  targetName?: string | null;
  automationState: PromoterAutomationState;
  nextDispatchAt?: string | null;
  lastDispatchedAt?: string | null;
  lastProcessedItemId?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  consecutiveFailures?: number;
  metadata?: PromoterAutomationTargetMetadata | null;
  progress?: PromoterAutomationTargetProgress | null;
}

export interface PromoterAutomationSummary {
  total: number;
  active: number;
  paused: number;
  inactive: number;
  errors: number;
}

export interface PromoterListDraftItem {
  itemId?: string;
  link: string;
  title?: string;
  imageUrl?: string;
  message?: string;
  payload?: Record<string, unknown>;
}

export interface PromoterListDraftGroup {
  groupId: string;
  groupName: string;
  sessionName?: string | null;
  startAt: string;
  endAt?: string;
  overflowStartAt?: string;
  intervalMinutes?: number;
  overflowDayStarts?: string[];
  overflowDayEnds?: string[];
}

export interface PromoterScheduledTelegramGroup {
  groupId: string;
  groupName: string;
  startAt: string;
  endAt?: string;
  overflowStartAt?: string;
  intervalMinutes?: number;
  overflowDayStarts?: string[];
  overflowDayEnds?: string[];
}

export interface PromoterListDraft {
  id?: number;
  documentId?: string;
  title?: string;
  listStatus?: string;
  sourceTab?: "custom" | "shopee";
  listMode?: PromoterListMode;
  itemSourceMode?: PromoterItemSourceMode;
  autoSourceConfig?: PromoterAutoSourceConfig | null;
  automationHasStarted?: boolean;
  automationEnabled?: boolean;
  sessionName?: string | null;
  groupId?: string | null;
  intervalMinutes?: number;
  windowStartTime?: string | null;
  windowEndTime?: string | null;
  allowExtraCredits?: boolean;
  queueStrategy?: "fifo" | string | null;
  startAt?: string | null;
  endAt?: string | null;
  overflowStartAt?: string | null;
  itemsCount?: number | null;
  items?: PromoterListDraftItem[];
  scheduledGroups?: PromoterListDraftGroup[];
  automationTargets?: PromoterAutomationTarget[];
  automationSummary?: PromoterAutomationSummary | null;
  autoSourceSummary?: PromoterAutoSourceSummary | null;
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PromoterAutomationStatusResponse {
  documentId: string;
  listMode: PromoterListMode;
  itemSourceMode: PromoterItemSourceMode;
  autoSourceConfig?: PromoterAutoSourceConfig | null;
  automationHasStarted: boolean;
  automationEnabled: boolean;
  intervalMinutes?: number | null;
  windowStartTime?: string | null;
  windowEndTime?: string | null;
  allowExtraCredits?: boolean;
  queueStrategy?: string | null;
  itemsCount: number;
  targets: PromoterAutomationTarget[];
  summary: PromoterAutomationSummary;
  autoSourceSummary?: PromoterAutoSourceSummary | null;
}

export interface PromoterAutomationTargetInput {
  channel: "whatsapp" | "telegram";
  accountKey?: string | null;
  targetId: string;
  targetName?: string | null;
}

export interface TelegramGroup {
  id?: number;
  documentId?: string;
  groupId: string;
  groupName?: string | null;
  isActive?: boolean;
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
  endAt?: string | null;
  overflowStartAt?: string | null;
  overflowDayStarts?: string[] | null;
  payload?: Record<string, unknown> | null;
  campaigns?: WhatsAppBatchCampaign[] | null;
}

export interface TelegramBatchCampaign {
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

export interface TelegramBatch {
  documentId: string;
  title?: string | null;
  groupId: string;
  groupName?: string | null;
  status?: string;
  statusBatch?: string;
  intervalMinutes?: number | null;
  itemsCount?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  overflowStartAt?: string | null;
  overflowDayStarts?: string[] | null;
  payload?: Record<string, unknown> | null;
  campaigns?: TelegramBatchCampaign[] | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}
