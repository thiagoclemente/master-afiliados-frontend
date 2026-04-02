"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Coins,
  Loader2,
  RefreshCcw,
  Send,
  ListPlus,
  Calendar,
  X,
  Search,
  ShoppingBag,
  Link2,
  Trash2,
  Ban,
  Upload,
} from "lucide-react";
import {
  activatePromoterListAutomation,
  checkTelegramQuota,
  fetchWhatsappBatches,
  fetchTelegramBatches,
  fetchTelegramBatchDetail,
  fetchTelegramGroups,
  fetchPromoterListAutomationStatus,
  scheduleWhatsappList,
  scheduleTelegramList,
  checkWhatsappQuota,
  deleteTelegramBatch,
  deleteWhatsappBatch,
  fetchWhatsAppProductInfo,
  fetchWhatsappBatchDetail,
  fetchPromoterShopeeProducts,
  fetchPromoterListDraft,
  fetchPromoterListDrafts,
  createPromoterListDraft,
  pausePromoterListAutomation,
  resetPromoterListAutomationSource,
  restartPromoterListAutomationQueue,
  resumePromoterListAutomation,
  updatePromoterListDraft,
  updatePromoterListAutomationConfig,
  updatePromoterListAutomationTargets,
  deletePromoterListDraft,
  type PromoterShopeeProduct,
  type PromoterListDraft,
} from "@/services/promoter.service";
import type {
  PromoterAutoSourceConfig,
  PromoterAutomationTargetInput,
  PromoterAutomationStatusResponse,
  PromoterAutomationTarget,
  PromoterItemSourceMode,
  PromoterListMode,
  TelegramBatch,
  TelegramBatchCampaign,
  TelegramGroup,
  WhatsAppBatch,
  WhatsAppBatchCampaign,
} from "@/interfaces/promoter";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import type { WhatsAppGroup } from "@/interfaces/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ExtensionInstallBanner from "@/components/promoter/ExtensionInstallBanner";
import PromoterCouponField from "@/components/promoter/PromoterCouponField";
import {
  buildListItemFromExtensionPayload,
  getExtensionPayloadCardData,
  tryParseExtensionPayload,
} from "@/lib/promoter-extension-payload";
import {
  appendPromoterCouponToMessage,
  normalizePromoterCoupon,
  resolvePromoterCoupon,
  withPromoterCouponPayload,
} from "@/lib/promoter-coupon";
import {
  getFirstPromoterCsvValue,
  hasPromoterCsvProductLinkColumns,
  parsePromoterCsvDocument,
  resolvePromoterCsvLink,
} from "@/lib/promoter-csv";

type ListItem = {
  itemId?: string;
  link: string;
  message: string;
  payload: Record<string, unknown>;
  title?: string;
  imageUrl?: string;
};

type ScheduledGroup = {
  groupId: string;
  groupName: string;
  sessionName?: string | null;
  startAt: string;
  endAt?: string;
  overflowStartAt?: string;
  intervalMinutes?: number;
  overflowDayStarts?: string[];
  overflowDayEnds?: string[];
};

type ScheduledTelegramGroup = {
  groupId: string;
  groupName: string;
  startAt: string;
  endAt?: string;
  overflowStartAt?: string;
  intervalMinutes?: number;
  overflowDayStarts?: string[];
  overflowDayEnds?: string[];
};

type SourceTab = "custom" | "shopee";

type ProcessingOverlayCurrentProduct = {
  title?: string;
  price?: string;
  imageUrl?: string;
  link?: string;
};

type ProcessingOverlayState = {
  open: boolean;
  mode: "links" | "csv" | null;
  title: string;
  description: string;
  processed: number;
  total: number;
  added: number;
  failed: number;
  currentProduct: ProcessingOverlayCurrentProduct | null;
  status: string | null;
  allowCancel: boolean;
  isCancelling: boolean;
};

type AutomationProductSnapshot = {
  title?: string | null;
  imageUrl?: string | null;
  link?: string | null;
};

const SHOPEE_ACCENT = "#EE4D2D";
const LINK_PREVIEW_CONCURRENCY = 4;
const MAX_LIST_ITEMS = 100;
const MAX_AUTOMATIC_MANUAL_ITEMS = 500;
const INLINE_ITEMS_PREVIEW_LIMIT = 12;
const ITEMS_DIALOG_PAGE_SIZE = 50;
const CSV_IMPORT_DELAY_MS = 120;
const CSV_PRODUCT_TITLE_ALIASES = [
  "Product Name",
  "product_name",
  "Item Name",
  "Title",
  "Nome do produto",
  "Nome",
];
const CSV_IMAGE_ALIASES = [
  "Image Url",
  "Image URL",
  "image_url",
  "Product Image",
  "Imagem",
];
const CSV_PRICE_ALIASES = [
  "Price",
  "Offer Price",
  "Product Price",
  "Preço",
  "Valor",
];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  `${index}`.padStart(2, "0")
);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  `${index * 5}`.padStart(2, "0")
);
const EMPTY_PROCESSING_OVERLAY: ProcessingOverlayState = {
  open: false,
  mode: null,
  title: "",
  description: "",
  processed: 0,
  total: 0,
  added: 0,
  failed: 0,
  currentProduct: null,
  status: null,
  allowCancel: false,
  isCancelling: false,
};
const LIGHT_THEME_VARS: CSSProperties = {
  "--background": "0 0% 100%",
  "--foreground": "222.2 84% 4.9%",
  "--card": "0 0% 100%",
  "--card-foreground": "222.2 84% 4.9%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222.2 84% 4.9%",
  "--primary": "221.2 83.2% 53.3%",
  "--primary-foreground": "210 40% 98%",
  "--secondary": "210 40% 96.1%",
  "--secondary-foreground": "222.2 47.4% 11.2%",
  "--muted": "210 40% 96.1%",
  "--muted-foreground": "215.4 16.3% 28%",
  "--accent": "210 40% 96.1%",
  "--accent-foreground": "222.2 47.4% 11.2%",
  "--destructive": "0 84.2% 60.2%",
  "--destructive-foreground": "210 40% 98%",
  "--border": "214.3 31.8% 86.4%",
  "--input": "214.3 31.8% 86.4%",
  "--ring": "221.2 83.2% 53.3%",
} as CSSProperties;

const AUTOMATION_TARGET_PAUSED_STATES = [
  "paused_manual",
  "paused_credit_approval",
  "paused_insufficient_credits",
  "paused_channel_unavailable",
] as const;

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

const detectMarketplaceFromLink = (link: string): string | undefined => {
  const normalized = link.toLowerCase();
  if (normalized.includes("shopee")) return "shopee";
  if (normalized.includes("amazon")) return "amazon";
  if (normalized.includes("mercadolivre") || normalized.includes("mercadolibre")) {
    return "mercado-livre";
  }
  return undefined;
};

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const extractDatePart = (value?: string | null) => {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (match) return match[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const extractTimePart = (value?: string | null) => {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (match) return match[2];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

const mergeDateTimeParts = (datePart: string, timePart: string) => {
  if (!datePart) return "";
  return `${datePart}T${timePart || "00:00"}`;
};

type DateTimePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultTime: string;
  clearable?: boolean;
};

function DateTimePickerField({
  label,
  value,
  onChange,
  defaultTime,
  clearable = false,
}: DateTimePickerFieldProps) {
  const datePart = extractDatePart(value);
  const timePart = extractTimePart(value) || (datePart ? defaultTime : "");
  const hourPart = timePart ? timePart.slice(0, 2) : "";
  const minutePart = timePart ? timePart.slice(3, 5) : "";
  const minuteOptions = MINUTE_OPTIONS.includes(minutePart)
    ? MINUTE_OPTIONS
    : minutePart
      ? [...MINUTE_OPTIONS, minutePart].sort((a, b) => Number(a) - Number(b))
      : MINUTE_OPTIONS;

  const handleDateChange = (nextDate: string) => {
    if (!nextDate) {
      onChange("");
      return;
    }
    onChange(mergeDateTimeParts(nextDate, timePart || defaultTime));
  };

  const handleHourChange = (nextHour: string) => {
    if (!datePart) return;
    const nextMinute = minutePart || defaultTime.slice(3, 5);
    onChange(mergeDateTimeParts(datePart, `${nextHour}:${nextMinute}`));
  };

  const handleMinuteChange = (nextMinute: string) => {
    if (!datePart) return;
    const nextHour = hourPart || defaultTime.slice(0, 2);
    onChange(mergeDateTimeParts(datePart, `${nextHour}:${nextMinute}`));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">{label}</div>
        {clearable ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Limpar
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_221px]">
        <Input
          type="date"
          value={datePart}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full min-w-0"
          style={{ colorScheme: "dark" }}
        />
        <div className="grid grid-cols-2 gap-2">
          <Select value={hourPart} onValueChange={handleHourChange} disabled={!datePart}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Hora" />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minutePart} onValueChange={handleMinuteChange} disabled={!datePart}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

type TimePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function TimePickerField({
  label,
  value,
  onChange,
  disabled = false,
}: TimePickerFieldProps) {
  const normalized = value ? value.slice(0, 5) : "";
  const [hourPart = "", minutePart = ""] = normalized.split(":");
  const minuteOptions = MINUTE_OPTIONS.includes(minutePart)
    ? MINUTE_OPTIONS
    : minutePart
      ? [...MINUTE_OPTIONS, minutePart].sort((a, b) => Number(a) - Number(b))
      : MINUTE_OPTIONS;

  const handleHourChange = (nextHour: string) => {
    const nextMinute = minutePart || "00";
    onChange(`${nextHour}:${nextMinute}:00`);
  };

  const handleMinuteChange = (nextMinute: string) => {
    const nextHour = hourPart || "00";
    onChange(`${nextHour}:${nextMinute}:00`);
  };

  return (
    <div className="space-y-1.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={hourPart || undefined} onValueChange={handleHourChange} disabled={disabled}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Hora" />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minutePart || undefined} onValueChange={handleMinuteChange} disabled={disabled}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

type PromoterListsPageScreenProps = {
  routeMode?: "index" | "new" | "detail";
  routeDocumentId?: string | null;
};

export default function PromoterListsScreen({
  routeMode = "index",
  routeDocumentId = null,
}: PromoterListsPageScreenProps) {
  const router = useRouter();
  const pageView: "editor" | "lists" = routeMode === "index" ? "lists" : "editor";
  const [batches, setBatches] = useState<WhatsAppBatch[]>([]);
  const [telegramBatches, setTelegramBatches] = useState<TelegramBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTelegramBatches, setIsLoadingTelegramBatches] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scheduleResetNotice, setScheduleResetNotice] = useState<string | null>(null);
  const [noticeDialog, setNoticeDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({ open: false, title: "", description: "" });
  const [quotaDialog, setQuotaDialog] = useState<{
    open: boolean;
    mode: "confirm" | "insufficient";
    title: string;
    description: string;
  }>({ open: false, mode: "confirm", title: "", description: "" });
  const quotaDialogResolver = useRef<((value: boolean) => void) | null>(null);

  const whatsapp = useWhatsApp();
  const selectedAccount = useMemo(() => {
    if (!whatsapp.selectedAccount) return null;
    return whatsapp.accounts.find(
      (acc) => acc.sessionName === whatsapp.selectedAccount?.sessionName
    );
  }, [whatsapp.accounts, whatsapp.selectedAccount]);

  const [title, setTitle] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [overflowStartAt, setOverflowStartAt] = useState("");
  const [listCoupon, setListCoupon] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [itemsDialogPage, setItemsDialogPage] = useState(1);
  const [listMode, setListMode] = useState<PromoterListMode>("manual");
  const [itemSourceMode, setItemSourceMode] =
    useState<PromoterItemSourceMode>("manual_queue");
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [automationHasStarted, setAutomationHasStarted] = useState(false);
  const [automationTargets, setAutomationTargets] = useState<PromoterAutomationTarget[]>([]);
  const [automationDraftTargets, setAutomationDraftTargets] = useState<
    PromoterAutomationTargetInput[]
  >([]);
  const [automationWindowStartTime, setAutomationWindowStartTime] = useState("08:00:00");
  const [automationWindowEndTime, setAutomationWindowEndTime] = useState("20:00:00");
  const [allowExtraCredits, setAllowExtraCredits] = useState(false);
  const [isRefreshingAutomation, setIsRefreshingAutomation] = useState(false);
  const [isSavingAutomation, setIsSavingAutomation] = useState(false);
  const [isAutomationActionLoading, setIsAutomationActionLoading] = useState(false);
  const [isResettingAutomation, setIsResettingAutomation] = useState(false);
  const [isResettingSource, setIsResettingSource] = useState(false);
  const [quotaSummary, setQuotaSummary] = useState<{
    dailyLimit: number;
    usedToday: number;
    creditsAvailable: number;
  } | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  const openDailyUsageInfoNotice = useCallback(() => {
    const dailyLimit = quotaSummary?.dailyLimit ?? 200;

    setNoticeDialog({
      open: true,
      title: "Uso do dia",
      description:
        `Sua conta pode enviar até ${dailyLimit} ofertas por dia somando WhatsApp e Telegram.\n\n` +
        "Quando esse limite acaba, os próximos envios passam a usar créditos.",
    });
  }, [quotaSummary?.dailyLimit]);

  const openCreditsInfoNotice = useCallback(() => {
    setNoticeDialog({
      open: true,
      title: "Créditos",
      description:
        "Por enquanto, o acompanhamento detalhado e a compra de créditos estão disponíveis apenas no app.\n\n" +
        "Use o app para ver os detalhes dos seus créditos e comprar mais quando precisar.",
    });
  }, []);

  const [sourceTab, setSourceTab] = useState<SourceTab>("custom");
  const [singleLinkInput, setSingleLinkInput] = useState("");
  const [singleLinkCoupon, setSingleLinkCoupon] = useState("");
  const [customLinksInput, setCustomLinksInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addingStatus, setAddingStatus] = useState<string | null>(null);
  const [processingOverlay, setProcessingOverlay] =
    useState<ProcessingOverlayState>(EMPTY_PROCESSING_OVERLAY);
  const [selectedCsvFileName, setSelectedCsvFileName] = useState("");

  const [shopeeQuery, setShopeeQuery] = useState("");
  const [shopeeLimit, setShopeeLimit] = useState(10);
  const [shopeePage, setShopeePage] = useState(1);
  const [shopeeProducts, setShopeeProducts] = useState<PromoterShopeeProduct[]>([]);
  const [shopeeHasNextPage, setShopeeHasNextPage] = useState(false);
  const [shopeeSelectedIds, setShopeeSelectedIds] = useState<string[]>([]);
  const [shopeeSortType, setShopeeSortType] = useState<number | null>(null);
  const [shopeeIsAMSOffer, setShopeeIsAMSOffer] = useState<boolean | null>(null);
  const [shopeePreset, setShopeePreset] = useState<string>("");
  const [hasLoadedShopee, setHasLoadedShopee] = useState(false);
  const [lastShopeeSearchKey, setLastShopeeSearchKey] = useState("");
  const [isLoadingShopee, setIsLoadingShopee] = useState(false);
  const [shopeeError, setShopeeError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [scheduleDialogChannel, setScheduleDialogChannel] = useState<
    "whatsapp" | "telegram" | null
  >(null);
  const [automationTargetDialogChannel, setAutomationTargetDialogChannel] = useState<
    "whatsapp" | "telegram" | null
  >(null);
  const [startAtField, setStartAtField] = useState("");
  const [endAtField, setEndAtField] = useState("");

  const [selectedBatch, setSelectedBatch] = useState<WhatsAppBatch | null>(null);
  const [batchDetail, setBatchDetail] = useState<WhatsAppBatch | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedTelegramBatch, setSelectedTelegramBatch] = useState<TelegramBatch | null>(null);
  const [telegramBatchDetail, setTelegramBatchDetail] = useState<TelegramBatch | null>(null);
  const [isTelegramDetailLoading, setIsTelegramDetailLoading] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);
  const csvImportAbortControllerRef = useRef<AbortController | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [scheduledGroups, setScheduledGroups] = useState<ScheduledGroup[]>([]);
  const [scheduledTelegramGroups, setScheduledTelegramGroups] = useState<ScheduledTelegramGroup[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<PromoterListDraft[]>([]);
  const [activeDraftDocumentId, setActiveDraftDocumentId] = useState<string>("");
  const [activeDraftSnapshot, setActiveDraftSnapshot] = useState<PromoterListDraft | null>(null);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [isRouteActionLoading, setIsRouteActionLoading] = useState(routeMode !== "index");
  const [telegramGroups, setTelegramGroups] = useState<TelegramGroup[]>([]);
  const [selectedTelegramGroupId, setSelectedTelegramGroupId] = useState<string | null>(null);
  const [isLoadingTelegramGroups, setIsLoadingTelegramGroups] = useState(false);
  const hasLoadedDraftRef = useRef(false);
  const isHydratingDraftRef = useRef(false);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHandledInitialRouteActionRef = useRef(false);
  const activeDraftSnapshotRef = useRef<PromoterListDraft | null>(null);
  const lastSyncedDraftSignatureRef = useRef("");

  const groups = whatsapp.groups;
  const selectedWhatsAppGroupValue =
    selectedGroupId && groups.some((group) => group.id === selectedGroupId)
      ? selectedGroupId
      : "";
  const selectedTelegramGroupValue =
    selectedTelegramGroupId &&
    telegramGroups.some((group) => group.groupId === selectedTelegramGroupId)
      ? selectedTelegramGroupId
      : "";
  const activeDraftRecord =
    savedDrafts.find((draft) => draft.documentId === activeDraftDocumentId) ||
    (activeDraftSnapshot?.documentId === activeDraftDocumentId
      ? activeDraftSnapshot
      : null);
  const isAutomaticList = listMode === "automatic_window";
  const isAutomaticShopee = isAutomaticList && itemSourceMode === "shopee_catalog";
  const isAutomaticManualQueue = isAutomaticList && itemSourceMode === "manual_queue";
  const currentItemsLimit = isAutomaticManualQueue
    ? MAX_AUTOMATIC_MANUAL_ITEMS
    : MAX_LIST_ITEMS;
  const previewItems = useMemo(
    () => items.slice(0, INLINE_ITEMS_PREVIEW_LIMIT),
    [items]
  );
  const itemsDialogTotalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / ITEMS_DIALOG_PAGE_SIZE)),
    [items.length]
  );
  const itemsDialogEntries = useMemo(() => {
    const startIndex = (itemsDialogPage - 1) * ITEMS_DIALOG_PAGE_SIZE;
    return items
      .slice(startIndex, startIndex + ITEMS_DIALOG_PAGE_SIZE)
      .map((item, offset) => ({
        item,
        index: startIndex + offset,
      }));
  }, [items, itemsDialogPage]);

  useEffect(() => {
    if (itemsDialogPage > itemsDialogTotalPages) {
      setItemsDialogPage(itemsDialogTotalPages);
    }
  }, [itemsDialogPage, itemsDialogTotalPages]);
  const canSwitchBackToManual = !automationHasStarted && items.length <= MAX_LIST_ITEMS;
  const activeAutomationTargets = automationTargets.filter(
    (target) => target.automationState === "active"
  );
  const isAutomaticConfigLocked = automationEnabled && activeAutomationTargets.length > 0;
  const pausedAutomationTargets = automationTargets.filter((target) =>
    AUTOMATION_TARGET_PAUSED_STATES.includes(
      target.automationState as (typeof AUTOMATION_TARGET_PAUSED_STATES)[number]
    )
  );
  const errorAutomationTargets = automationTargets.filter(
    (target) => target.automationState === "error"
  );
  const allAutomationTargetsCompleted =
    automationTargets.length > 0 &&
    automationTargets.every((target) => target.progress?.completed === true);
  const canEditCreditsPreference =
    isAutomaticList && (!automationEnabled || pausedAutomationTargets.length > 0);
  const shouldRefreshAutomationStatus =
    !!activeDraftDocumentId &&
    (automationHasStarted ||
      automationEnabled ||
      activeDraftRecord?.automationHasStarted === true ||
      activeDraftRecord?.automationEnabled === true);
  const shopeeItemsOptions = useMemo(() => {
    const base = isAutomaticManualQueue
      ? [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500]
      : [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    return base.includes(shopeeLimit)
      ? base
      : [...base, shopeeLimit].sort((a, b) => a - b);
  }, [isAutomaticManualQueue, shopeeLimit]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const shouldBlockEditorLoading =
    routeMode !== "index" &&
    (isLoadingDrafts ||
      isRouteActionLoading ||
      (pageView === "editor" && !activeDraftDocumentId));

  const findListItemById = useCallback(
    (itemId?: string | null) => {
      if (!itemId) return null;
      return items.find((item) => item.itemId === itemId) || null;
    },
    [items]
  );

  const resolveListItemSnapshot = useCallback((item?: ListItem | null): AutomationProductSnapshot | null => {
    if (!item) return null;

    const extensionCard = getExtensionPayloadCardData(item.payload);
    const title =
      item.title ||
      extensionCard?.title ||
      (typeof item.payload?.productTitle === "string"
        ? item.payload.productTitle
        : typeof item.payload?.productName === "string"
          ? item.payload.productName
          : item.link);
    const imageUrl =
      item.imageUrl ||
      extensionCard?.imageUrl ||
      (typeof item.payload?.productImageUrl === "string"
        ? item.payload.productImageUrl
        : typeof item.payload?.imageUrl === "string"
          ? item.payload.imageUrl
          : null);
    const link =
      (typeof item.payload?.offerLink === "string"
        ? item.payload.offerLink
        : typeof item.payload?.productLink === "string"
          ? item.payload.productLink
          : item.link) || null;

    if (!title && !imageUrl && !link) return null;

    return { title, imageUrl, link };
  }, []);

  const resolveAutomationTargetSnapshot = useCallback(
    (
      target: PromoterAutomationTarget,
      kind: "sent" | "failed"
    ): AutomationProductSnapshot | null => {
      const progress = target.progress || null;
      const metadata = target.metadata || null;
      const itemId =
        kind === "sent"
          ? progress?.lastSentItemId || metadata?.lastSentItemId || null
          : progress?.lastFailedItemId || metadata?.lastFailedItemId || null;
      const fallbackTitle =
        kind === "sent"
          ? progress?.lastSentItemTitle || metadata?.lastSentItemTitle || null
          : progress?.lastFailedItemTitle || metadata?.lastFailedItemTitle || null;
      const fallbackImageUrl =
        kind === "sent"
          ? progress?.lastSentItemImageUrl || metadata?.lastSentItemImageUrl || null
          : progress?.lastFailedItemImageUrl || metadata?.lastFailedItemImageUrl || null;
      const fallbackLink =
        kind === "sent"
          ? progress?.lastSentItemLink || metadata?.lastSentItemLink || null
          : progress?.lastFailedItemLink || metadata?.lastFailedItemLink || null;

      const fromList = resolveListItemSnapshot(findListItemById(itemId));
      const snapshot: AutomationProductSnapshot = {
        title: fromList?.title || fallbackTitle || null,
        imageUrl: fromList?.imageUrl || fallbackImageUrl || null,
        link: fromList?.link || fallbackLink || null,
      };

      if (!snapshot.title && !snapshot.imageUrl && !snapshot.link) {
        return null;
      }

      return snapshot;
    },
    [findListItemById, resolveListItemSnapshot]
  );

  const isSameMinute = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate() &&
      a.getHours() === b.getHours() &&
      a.getMinutes() === b.getMinutes()
    );
  };

  const toInt = (value: unknown) => {
    if (typeof value === "number") return Math.trunc(value);
    if (typeof value === "string") return Number.parseInt(value, 10) || 0;
    return 0;
  };

  const resolveBatchStatus = (batch?: WhatsAppBatch | null) => {
    if (!batch) return "";
    const direct = (batch.status || "").trim();
    if (direct) return direct;
    const statusBatch =
      typeof (batch as unknown as { statusBatch?: string }).statusBatch === "string"
        ? ((batch as unknown as { statusBatch?: string }).statusBatch || "").trim()
        : "";
    if (statusBatch) return statusBatch;
    const payloadStatus =
      typeof batch.payload?.status === "string" ? String(batch.payload.status).trim() : "";
    return payloadStatus;
  };

  const resolveTelegramBatchStatus = (batch?: TelegramBatch | null) => {
    if (!batch) return "";
    const direct = (batch.status || "").trim();
    if (direct) return direct;
    const statusBatch =
      typeof batch.statusBatch === "string" ? batch.statusBatch.trim() : "";
    if (statusBatch) return statusBatch;
    const payloadStatus =
      typeof batch.payload?.status === "string" ? String(batch.payload.status).trim() : "";
    return payloadStatus;
  };

  const isBatchFinalized = (status?: string | null) => {
    const normalized = (status || "").toLowerCase();
    return normalized === "sent" || normalized === "failed" || normalized === "canceled";
  };

  const isBatchCanceledOrSent = (status?: string | null) => {
    const normalized = (status || "").toLowerCase();
    return normalized === "canceled" || normalized === "cancelado" || normalized === "sent";
  };

  const isTelegramBatchCanceledOrSent = (status?: string | null) => {
    const normalized = (status || "").toLowerCase();
    return normalized === "canceled" || normalized === "cancelado" || normalized === "sent";
  };

  const formatBatchStatus = (status?: string | null) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "scheduled") return "Agendado";
    if (normalized === "processing") return "Processando";
    if (normalized === "sent") return "Enviado";
    if (normalized === "failed") return "Falhou";
    if (normalized === "canceled") return "Cancelado";
    return status || "--";
  };

  const formatDateTimeLocalInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const hours = `${date.getHours()}`.padStart(2, "0");
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const buildDefaultOverflowStartForDay = (base: Date) => {
    return new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      8,
      0,
      0,
      0
    );
  };

  const calculateBatchEndTime = (batch: WhatsAppBatch): Date | null => {
    const scheduledAtDates =
      batch.campaigns
        ?.map((campaign) =>
          campaign.scheduledAt ? new Date(campaign.scheduledAt) : null
        )
        .filter((value): value is Date => Boolean(value && !Number.isNaN(value.getTime()))) || [];

    if (scheduledAtDates.length > 0) {
      return scheduledAtDates.reduce((latest, current) =>
        current.getTime() > latest.getTime() ? current : latest
      );
    }

    if (!batch.startAt || !batch.intervalMinutes || !batch.itemsCount || batch.itemsCount <= 0) {
      return null;
    }

    const start = new Date(batch.startAt);
    if (Number.isNaN(start.getTime())) return null;

    const end = batch.endAt ? new Date(batch.endAt) : null;
    const overflow = batch.overflowStartAt
      ? new Date(batch.overflowStartAt)
      : batch.overflowDayStarts?.length
        ? new Date(batch.overflowDayStarts[0] as string)
        : null;
    const defaultOverflowStart = buildDefaultOverflowStartForDay(start);

    let overflowWindowStarted = false;
    let current = new Date(start);
    const total = Math.max(1, batch.itemsCount);
    const interval = Math.max(1, batch.intervalMinutes);

    const currentStartSource = () => {
      if (!overflowWindowStarted) return start;
      return overflow ?? defaultOverflowStart;
    };

    const moveToNextWindowStart = (fromDate: Date) => {
      if (!overflowWindowStarted && overflow) {
        overflowWindowStarted = true;
        return new Date(Math.max(overflow.getTime(), fromDate.getTime()));
      }
      if (!overflowWindowStarted) {
        overflowWindowStarted = true;
        const source = overflow ?? defaultOverflowStart;
        return new Date(
          fromDate.getFullYear(),
          fromDate.getMonth(),
          fromDate.getDate() + 1,
          source.getHours(),
          source.getMinutes(),
          source.getSeconds(),
          source.getMilliseconds()
        );
      }
      const source = currentStartSource();
      return new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate() + 1,
        source.getHours(),
        source.getMinutes(),
        source.getSeconds(),
        source.getMilliseconds()
      );
    };

    for (let i = 1; i < total; i++) {
      const candidate = new Date(current.getTime() + interval * 60 * 1000);
      if (!end) {
        current = candidate;
        continue;
      }

      const dayEnd = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        end.getHours(),
        end.getMinutes(),
        end.getSeconds(),
        end.getMilliseconds()
      );

      current =
        candidate.getTime() > dayEnd.getTime()
          ? moveToNextWindowStart(current)
          : candidate;
    }

    return current;
  };

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await fetchWhatsappBatches({ page: 1, pageSize: 50 });
      setBatches(result.items || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar listas automáticas."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadTelegramBatches = async () => {
    setIsLoadingTelegramBatches(true);
    try {
      const result = await fetchTelegramBatches({ page: 1, pageSize: 50 });
      setTelegramBatches(result.items || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar listas automáticas do Telegram."
      );
    } finally {
      setIsLoadingTelegramBatches(false);
    }
  };

  const loadQuotaSummary = async () => {
    setIsLoadingQuota(true);
    try {
      const quota = await checkWhatsappQuota(1);
      setQuotaSummary({
        dailyLimit: Number(quota.dailyLimit || 0),
        usedToday: Number(quota.usedToday || 0),
        creditsAvailable: Number(quota.creditsAvailable || 0),
      });
    } catch (err) {
      console.error("Erro ao carregar resumo de quota do promoter", err);
    } finally {
      setIsLoadingQuota(false);
    }
  };

  const loadTelegramGroups = async () => {
    setIsLoadingTelegramGroups(true);
    try {
      const groupsResult = await fetchTelegramGroups();
      setTelegramGroups(groupsResult || []);
    } catch (err) {
      console.error("Erro ao carregar grupos do Telegram", err);
    } finally {
      setIsLoadingTelegramGroups(false);
    }
  };

  const buildEmptyDraftPayload = (): PromoterListDraft => ({
    title: "",
    listStatus: "draft",
    sourceTab: "custom",
    listMode: "manual",
    itemSourceMode: "manual_queue",
    autoSourceConfig: null,
    automationHasStarted: false,
      automationEnabled: false,
      automationTargets: [],
      automationSummary: null,
      autoSourceSummary: null,
      sessionName: null,
      groupId: null,
    intervalMinutes: 5,
    windowStartTime: null,
    windowEndTime: null,
    allowExtraCredits: false,
    queueStrategy: "fifo",
    startAt: null,
    endAt: null,
    overflowStartAt: null,
    items: [],
    scheduledGroups: [],
    metadata: {
      listCoupon: "",
      singleLinkCoupon: "",
    },
  });

  const resolveShopeeQueryValue = ({
    itemSourceMode,
    metadata,
    autoSourceConfig,
    fallback = "",
  }: {
    itemSourceMode?: PromoterItemSourceMode;
    metadata?: Record<string, unknown>;
    autoSourceConfig?: PromoterAutoSourceConfig | null;
    fallback?: string;
  }) => {
    const metadataQuery =
      typeof metadata?.shopeeQuery === "string" ? metadata.shopeeQuery : "";
    const autoSourceKeyword =
      typeof autoSourceConfig?.keyword === "string" ? autoSourceConfig.keyword : "";

    if (itemSourceMode === "shopee_catalog") {
      return autoSourceKeyword || metadataQuery || fallback;
    }

    return metadataQuery || autoSourceKeyword || fallback;
  };

  const buildDraftAutosaveSignature = (draft: PromoterListDraft | null) => {
    if (!draft) return "";

    const metadata =
      draft.metadata && typeof draft.metadata === "object" ? draft.metadata : {};
    const normalizedItemSourceMode =
      draft.itemSourceMode === "shopee_catalog" ? "shopee_catalog" : "manual_queue";

    return JSON.stringify({
      title: draft.title?.trim() || "",
      listStatus: "draft",
      sourceTab: draft.sourceTab === "shopee" ? "shopee" : "custom",
      listMode: draft.listMode === "automatic_window" ? "automatic_window" : "manual",
      itemSourceMode: normalizedItemSourceMode,
      autoSourceConfig:
        normalizedItemSourceMode === "shopee_catalog"
          ? {
              keyword:
                typeof draft.autoSourceConfig?.keyword === "string"
                  ? draft.autoSourceConfig.keyword
                  : null,
              sortType:
                typeof draft.autoSourceConfig?.sortType === "number"
                  ? draft.autoSourceConfig.sortType
                  : null,
              isAMSOffer:
                typeof draft.autoSourceConfig?.isAMSOffer === "boolean"
                  ? draft.autoSourceConfig.isAMSOffer
                  : null,
              batchSize:
                typeof draft.autoSourceConfig?.batchSize === "number"
                  ? draft.autoSourceConfig.batchSize
                  : 10,
            }
          : null,
      automationHasStarted: draft.automationHasStarted === true,
      automationEnabled: draft.automationEnabled === true,
      automationTargets: Array.isArray(draft.automationTargets) ? draft.automationTargets : [],
      sessionName: draft.sessionName || null,
      groupId: draft.groupId || null,
      intervalMinutes:
        typeof draft.intervalMinutes === "number" && Number.isFinite(draft.intervalMinutes)
          ? draft.intervalMinutes
          : 5,
      windowStartTime: draft.windowStartTime || null,
      windowEndTime: draft.windowEndTime || null,
      allowExtraCredits: draft.allowExtraCredits === true,
      queueStrategy: draft.queueStrategy || "fifo",
      startAt: draft.startAt || null,
      endAt: draft.endAt || null,
      overflowStartAt: draft.overflowStartAt || null,
      items:
        normalizedItemSourceMode === "shopee_catalog"
          ? undefined
          : Array.isArray(draft.items)
            ? draft.items
            : [],
      scheduledGroups: Array.isArray(draft.scheduledGroups) ? draft.scheduledGroups : [],
      metadata: {
        singleLinkInput:
          typeof metadata.singleLinkInput === "string" ? metadata.singleLinkInput : "",
        singleLinkCoupon:
          typeof metadata.singleLinkCoupon === "string" ? metadata.singleLinkCoupon : "",
        customLinksInput:
          typeof metadata.customLinksInput === "string" ? metadata.customLinksInput : "",
        listCoupon: typeof metadata.listCoupon === "string" ? metadata.listCoupon : "",
        scheduledTelegramGroups: Array.isArray(metadata.scheduledTelegramGroups)
          ? metadata.scheduledTelegramGroups
          : [],
        shopeeQuery: typeof metadata.shopeeQuery === "string" ? metadata.shopeeQuery : "",
        shopeeLimit:
          typeof metadata.shopeeLimit === "number" && Number.isFinite(metadata.shopeeLimit)
            ? metadata.shopeeLimit
            : 10,
        shopeeSortType:
          typeof metadata.shopeeSortType === "number" &&
          Number.isFinite(metadata.shopeeSortType)
            ? metadata.shopeeSortType
            : null,
        shopeeIsAMSOffer:
          typeof metadata.shopeeIsAMSOffer === "boolean"
            ? metadata.shopeeIsAMSOffer
            : null,
        shopeePreset: typeof metadata.shopeePreset === "string" ? metadata.shopeePreset : "",
      },
    });
  };

  const applyDraft = (draft: PromoterListDraft | null) => {
    isHydratingDraftRef.current = true;
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
      draftSaveTimeoutRef.current = null;
    }
    lastSyncedDraftSignatureRef.current = buildDraftAutosaveSignature(draft);
    setActiveDraftSnapshot(draft);
    setTitle(draft?.title || "");
    setIntervalMinutes(
      typeof draft?.intervalMinutes === "number" && Number.isFinite(draft.intervalMinutes)
        ? draft.intervalMinutes
        : 5
    );
    setStartAt(draft?.startAt || "");
    setEndAt(draft?.endAt || "");
    setOverflowStartAt(draft?.overflowStartAt || "");
    setItems(Array.isArray(draft?.items) ? (draft?.items as ListItem[]) : []);
    setScheduledGroups(Array.isArray(draft?.scheduledGroups) ? (draft?.scheduledGroups as ScheduledGroup[]) : []);
    const metadata =
      draft?.metadata && typeof draft.metadata === "object" ? draft.metadata : {};
    const scheduledTelegramGroupsRaw = Array.isArray(
      (metadata as Record<string, unknown>).scheduledTelegramGroups
    )
      ? ((metadata as Record<string, unknown>).scheduledTelegramGroups as ScheduledTelegramGroup[])
      : [];
    setScheduledTelegramGroups(scheduledTelegramGroupsRaw);
    setListMode(draft?.listMode === "automatic_window" ? "automatic_window" : "manual");
    setItemSourceMode(
      draft?.itemSourceMode === "shopee_catalog" ? "shopee_catalog" : "manual_queue"
    );
    const autoSourceConfig =
      draft?.autoSourceConfig && typeof draft.autoSourceConfig === "object"
        ? draft.autoSourceConfig
        : null;
    setAutomationHasStarted(draft?.automationHasStarted === true);
    setAutomationEnabled(draft?.automationEnabled === true);
    setAutomationTargets(Array.isArray(draft?.automationTargets) ? draft.automationTargets : []);
    setAutomationDraftTargets(
      Array.isArray(draft?.automationTargets)
        ? draft.automationTargets.map((target) => ({
            channel: target.channel,
            accountKey: target.accountKey || null,
            targetId: target.targetId,
            targetName: target.targetName || null,
          }))
        : []
    );
    setAutomationWindowStartTime(draft?.windowStartTime || "08:00:00");
    setAutomationWindowEndTime(draft?.windowEndTime || "20:00:00");
    setAllowExtraCredits(draft?.allowExtraCredits === true);
    setSourceTab(draft?.sourceTab === "shopee" ? "shopee" : "custom");
    setSelectedGroupId(draft?.groupId || null);
    setSelectedTelegramGroupId(null);
    setSingleLinkInput(typeof metadata.singleLinkInput === "string" ? metadata.singleLinkInput : "");
    setSingleLinkCoupon(
      typeof metadata.singleLinkCoupon === "string"
        ? metadata.singleLinkCoupon
        : ""
    );
    setCustomLinksInput(typeof metadata.customLinksInput === "string" ? metadata.customLinksInput : "");
    setListCoupon(typeof metadata.listCoupon === "string" ? metadata.listCoupon : "");
    setShopeeQuery(
      resolveShopeeQueryValue({
        itemSourceMode: draft?.itemSourceMode,
        metadata,
        autoSourceConfig,
      })
    );
    setShopeeLimit(
      typeof metadata.shopeeLimit === "number" && Number.isFinite(metadata.shopeeLimit)
        ? metadata.shopeeLimit
        : 10
    );
    setShopeeSortType(
      typeof metadata.shopeeSortType === "number" && Number.isFinite(metadata.shopeeSortType)
        ? metadata.shopeeSortType
        : typeof autoSourceConfig?.sortType === "number"
          ? autoSourceConfig.sortType
          : null
    );
    setShopeeIsAMSOffer(
      typeof metadata.shopeeIsAMSOffer === "boolean"
        ? metadata.shopeeIsAMSOffer
        : typeof autoSourceConfig?.isAMSOffer === "boolean"
          ? autoSourceConfig.isAMSOffer
          : null
    );
    setShopeePreset(typeof metadata.shopeePreset === "string" ? metadata.shopeePreset : "");
    setSelectedCsvFileName("");
    setSelectedItemIndex(null);
    setTimeout(() => {
      isHydratingDraftRef.current = false;
    }, 0);
  };

  const applyAutomationStatus = useCallback((status: PromoterAutomationStatusResponse | null) => {
    if (!status) return;
    isHydratingDraftRef.current = true;
    setListMode(status.listMode === "automatic_window" ? "automatic_window" : "manual");
    setItemSourceMode(
      status.itemSourceMode === "shopee_catalog" ? "shopee_catalog" : "manual_queue"
    );
    if (status.itemSourceMode === "shopee_catalog") {
      setShopeeQuery((current) =>
        resolveShopeeQueryValue({
          itemSourceMode: status.itemSourceMode,
          autoSourceConfig: status.autoSourceConfig,
          fallback: current,
        })
      );
    }
    setShopeeSortType(
      typeof status.autoSourceConfig?.sortType === "number"
        ? status.autoSourceConfig.sortType
        : null
    );
    setShopeeIsAMSOffer(
      typeof status.autoSourceConfig?.isAMSOffer === "boolean"
        ? status.autoSourceConfig.isAMSOffer
        : null
    );
    setAutomationHasStarted(status.automationHasStarted === true);
    setAutomationEnabled(status.automationEnabled === true);
    const nextTargets = Array.isArray(status.targets) ? status.targets : [];
    const shouldPreserveLocalTargets =
      nextTargets.length === 0 &&
      (automationDraftTargets.length > 0 || automationTargets.length > 0);
    const currentSnapshot = activeDraftSnapshotRef.current;
    const mergedSnapshot = currentSnapshot
      ? {
          ...currentSnapshot,
          listMode: status.listMode,
          itemSourceMode: status.itemSourceMode,
          autoSourceConfig: status.autoSourceConfig || currentSnapshot.autoSourceConfig || null,
          automationHasStarted: status.automationHasStarted,
          automationEnabled: status.automationEnabled,
          intervalMinutes:
            typeof status.intervalMinutes === "number"
              ? status.intervalMinutes
              : currentSnapshot.intervalMinutes,
          windowStartTime: status.windowStartTime || currentSnapshot.windowStartTime || null,
          windowEndTime: status.windowEndTime || currentSnapshot.windowEndTime || null,
          allowExtraCredits: status.allowExtraCredits === true,
          queueStrategy: status.queueStrategy || currentSnapshot.queueStrategy || "fifo",
          automationTargets: shouldPreserveLocalTargets
            ? currentSnapshot.automationTargets || []
            : nextTargets,
          automationSummary: status.summary,
          autoSourceSummary:
            status.autoSourceSummary || currentSnapshot.autoSourceSummary || null,
        }
      : null;

    if (mergedSnapshot) {
      lastSyncedDraftSignatureRef.current = buildDraftAutosaveSignature(mergedSnapshot);
    }

    if (!shouldPreserveLocalTargets) {
      setAutomationTargets(nextTargets);
      setAutomationDraftTargets(
        nextTargets.map((target) => ({
          channel: target.channel,
          accountKey: target.accountKey || null,
          targetId: target.targetId,
          targetName: target.targetName || null,
        }))
      );
    }
    setAutomationWindowStartTime(status.windowStartTime || "08:00:00");
    setAutomationWindowEndTime(status.windowEndTime || "20:00:00");
    setAllowExtraCredits(status.allowExtraCredits === true);

    setActiveDraftSnapshot((prev) =>
      prev
        ? {
            ...prev,
            listMode: status.listMode,
            itemSourceMode: status.itemSourceMode,
            autoSourceConfig: status.autoSourceConfig || prev.autoSourceConfig || null,
            automationHasStarted: status.automationHasStarted,
            automationEnabled: status.automationEnabled,
            intervalMinutes:
              typeof status.intervalMinutes === "number"
                ? status.intervalMinutes
                : prev.intervalMinutes,
            windowStartTime: status.windowStartTime || prev.windowStartTime || null,
            windowEndTime: status.windowEndTime || prev.windowEndTime || null,
            allowExtraCredits: status.allowExtraCredits === true,
            queueStrategy: status.queueStrategy || prev.queueStrategy || "fifo",
            automationTargets: shouldPreserveLocalTargets
              ? prev.automationTargets || []
              : nextTargets,
            automationSummary: status.summary,
            autoSourceSummary: status.autoSourceSummary || prev.autoSourceSummary || null,
          }
        : prev
    );
    setTimeout(() => {
      isHydratingDraftRef.current = false;
    }, 0);
  }, [automationDraftTargets.length, automationTargets.length]);

  const refreshAutomationStatus = useCallback(async (
    documentId = activeDraftDocumentId,
    options?: { silent?: boolean }
  ) => {
    if (!documentId) return null;
    if (!options?.silent) {
      setIsRefreshingAutomation(true);
    }
    try {
      const status = await fetchPromoterListAutomationStatus(documentId);
      applyAutomationStatus(status);
      setSavedDrafts((prev) =>
        prev.map((entry) =>
          entry.documentId === documentId
            ? toDraftListEntry({
                ...entry,
                listMode: status?.listMode || entry.listMode,
                itemSourceMode: status?.itemSourceMode || entry.itemSourceMode,
                autoSourceConfig: status?.autoSourceConfig || entry.autoSourceConfig || null,
                automationHasStarted: status?.automationHasStarted ?? entry.automationHasStarted,
                automationEnabled: status?.automationEnabled ?? entry.automationEnabled,
                windowStartTime: status?.windowStartTime || entry.windowStartTime || null,
                windowEndTime: status?.windowEndTime || entry.windowEndTime || null,
                allowExtraCredits: status?.allowExtraCredits ?? entry.allowExtraCredits,
                automationTargets: status?.targets || entry.automationTargets || [],
                automationSummary: status?.summary || entry.automationSummary || null,
                autoSourceSummary: status?.autoSourceSummary || entry.autoSourceSummary || null,
              })
            : entry
        )
      );
      return status;
    } catch (err) {
      console.error("Erro ao atualizar status da automação", err);
      return null;
    } finally {
      if (!options?.silent) {
        setIsRefreshingAutomation(false);
      }
    }
  }, [activeDraftDocumentId, applyAutomationStatus]);

  useEffect(() => {
    void load();
    void loadTelegramBatches();
    void loadQuotaSummary();
  }, []);

  useEffect(() => {
    return () => {
      csvImportAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const ensureInitialDraft = async () => {
      setIsLoadingDrafts(true);
      try {
        const drafts = await fetchPromoterListDrafts({ summary: true });
        if (!isMounted) return;
        const sorted = sortDraftEntries(drafts.map(toDraftListEntry));
        setSavedDrafts(sorted);
        setActiveDraftDocumentId("");
        applyDraft(null);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar rascunhos salvos da lista."
          );
        }
      } finally {
        if (isMounted) {
          hasLoadedDraftRef.current = true;
          setIsLoadingDrafts(false);
        }
      }
    };

    void ensureInitialDraft();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoadingDrafts || !hasLoadedDraftRef.current || hasHandledInitialRouteActionRef.current) {
      return;
    }

    hasHandledInitialRouteActionRef.current = true;

    const handleRouteAction = async () => {
      setIsRouteActionLoading(true);

      if (routeMode === "index") {
        setIsRouteActionLoading(false);
        return;
      }

      if (routeMode === "new") {
        try {
          const created = await createPromoterListDraft(buildEmptyDraftPayload());
          if (!created?.documentId) {
            throw new Error("Não foi possível criar a nova lista.");
          }
          setSavedDrafts((prev) =>
            sortDraftEntries([
              toDraftListEntry(created),
              ...prev.filter((draft) => draft.documentId !== created.documentId),
            ])
          );
          setActiveDraftDocumentId(created.documentId);
          setActiveDraftSnapshot(created);
          applyDraft(created);
          router.replace(`/master/promoter/lists/${created.documentId}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao criar nova lista.");
        } finally {
          setIsRouteActionLoading(false);
        }
        return;
      }

      if (routeMode === "detail" && routeDocumentId) {
        try {
          const fullDraft = await fetchPromoterListDraft(routeDocumentId);
          if (!fullDraft?.documentId) {
            throw new Error("A lista selecionada não foi encontrada.");
          }
          setActiveDraftDocumentId(fullDraft.documentId);
          setActiveDraftSnapshot(fullDraft);
          applyDraft(fullDraft);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "A lista selecionada não foi encontrada."
          );
          router.replace("/master/promoter/lists");
        } finally {
          setIsRouteActionLoading(false);
        }
        return;
      }

      if (routeMode === "detail") {
        setError("A lista selecionada não foi encontrada.");
        router.replace("/master/promoter/lists");
      }

      setIsRouteActionLoading(false);
    };

    void handleRouteAction();
  }, [isLoadingDrafts, routeDocumentId, routeMode, router]);

  useEffect(() => {
    if (!activeDraftDocumentId) return;
    if (!shouldRefreshAutomationStatus) return;
    void refreshAutomationStatus(activeDraftDocumentId, { silent: true });
  }, [activeDraftDocumentId, refreshAutomationStatus, shouldRefreshAutomationStatus]);

  useEffect(() => {
    whatsapp.loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadTelegramGroups();
  }, []);

  useEffect(() => {
    if (whatsapp.accounts.length > 0 && !selectedAccount) {
      void whatsapp.selectAccount(whatsapp.accounts[0].sessionName);
    }
  }, [selectedAccount, whatsapp]);

  useEffect(() => {
    if (selectedGroupId) return;
    const defaultGroup =
      selectedAccount?.defaultGroupId ||
      groups.find((group: WhatsAppGroup) => !!group.id)?.id ||
      null;
    if (defaultGroup) {
      setSelectedGroupId(defaultGroup);
    }
  }, [selectedAccount, groups, selectedGroupId]);

  useEffect(() => {
    if (selectedTelegramGroupId) return;
    const defaultGroup = telegramGroups.find((group) => !!group.groupId)?.groupId || null;
    if (defaultGroup) {
      setSelectedTelegramGroupId(defaultGroup);
    }
  }, [selectedTelegramGroupId, telegramGroups]);

  useEffect(() => {
    activeDraftSnapshotRef.current = activeDraftSnapshot;
  }, [activeDraftSnapshot]);

  useEffect(() => {
    if (!hasLoadedDraftRef.current || isHydratingDraftRef.current || !activeDraftDocumentId) {
      return;
    }

    if (isAutomaticConfigLocked) {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = null;
      }
      return;
    }

    const baseDraft = activeDraftSnapshotRef.current ?? buildEmptyDraftPayload();
    const baseMetadata =
      baseDraft.metadata && typeof baseDraft.metadata === "object"
        ? baseDraft.metadata
        : {};
    const metadata = {
      ...baseMetadata,
      singleLinkInput,
      singleLinkCoupon,
      customLinksInput,
      listCoupon,
      scheduledTelegramGroups,
      shopeeQuery,
      shopeeLimit,
      shopeeSortType,
      shopeeIsAMSOffer,
      shopeePreset,
    };

    const draft: PromoterListDraft = {
      ...baseDraft,
      title: title.trim(),
      listStatus: "draft",
      sourceTab,
      listMode,
      itemSourceMode,
      autoSourceConfig:
        itemSourceMode === "shopee_catalog"
          ? {
              keyword: shopeeQuery || null,
              sortType: shopeeSortType,
              isAMSOffer: shopeeIsAMSOffer,
              batchSize: 10,
            }
          : null,
      automationHasStarted,
      automationEnabled,
      automationTargets,
      sessionName: selectedAccount?.sessionName || baseDraft.sessionName || null,
      groupId: selectedGroupId || baseDraft.groupId || null,
      intervalMinutes,
      windowStartTime: automationWindowStartTime || null,
      windowEndTime: automationWindowEndTime || null,
      allowExtraCredits,
      queueStrategy: "fifo",
      startAt: startAt || null,
      endAt: endAt || null,
      overflowStartAt: overflowStartAt || null,
      ...(itemSourceMode === "shopee_catalog" ? {} : { items }),
      scheduledGroups,
      metadata,
    };

    const currentSignature = buildDraftAutosaveSignature(draft);
    if (currentSignature === lastSyncedDraftSignatureRef.current) {
      return;
    }

    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = setTimeout(() => {
      const persist = async () => {
        try {
          const updated = await updatePromoterListDraft(activeDraftDocumentId, draft);
          lastSyncedDraftSignatureRef.current = currentSignature;
          setActiveDraftSnapshot(updated || draft);
          setSavedDrafts((prev) => {
            const next = prev.map((entry) =>
              entry.documentId === activeDraftDocumentId
                ? toDraftListEntry({
                    ...entry,
                    ...(updated || draft),
                    documentId: activeDraftDocumentId,
                  })
                : entry
            );
            return sortDraftEntries(next);
          });
        } catch (err) {
          console.error("Erro ao persistir rascunho do promoter", err);
        }
      };

      void persist();
    }, 800);

    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [
    activeDraftDocumentId,
    isAutomaticConfigLocked,
    title,
    sourceTab,
    listMode,
    itemSourceMode,
    automationHasStarted,
    automationEnabled,
    automationTargets,
    automationDraftTargets,
    selectedAccount?.sessionName,
    selectedGroupId,
    intervalMinutes,
    automationWindowStartTime,
    automationWindowEndTime,
    allowExtraCredits,
    startAt,
    endAt,
    overflowStartAt,
    items,
    scheduledGroups,
    scheduledTelegramGroups,
    singleLinkInput,
    singleLinkCoupon,
    customLinksInput,
    listCoupon,
    shopeeQuery,
    shopeeLimit,
    shopeeSortType,
    shopeeIsAMSOffer,
    shopeePreset,
  ]);

  const initializeDateFields = () => {
    setStartAtField(formatDateTimeLocalInput(startAt));
    setEndAtField(formatDateTimeLocalInput(endAt));
  };

  const openManualScheduleDialog = (channel: "whatsapp" | "telegram") => {
    if (channel === "whatsapp") {
      if (whatsapp.accounts.length === 0) {
        showProblemNotice("Conecte sua conta do WhatsApp para escolher grupos de envio.");
        return;
      }
      if (groups.length === 0) {
        showProblemNotice("Nenhum grupo do WhatsApp disponível. Sincronize sua conexão.");
        return;
      }
    }

    if (channel === "telegram") {
      if (telegramGroups.length === 0) {
        showProblemNotice("Nenhum grupo do Telegram disponível.");
        return;
      }
    }

    initializeDateFields();
    setScheduleDialogChannel(channel);
  };

  const closeManualScheduleDialog = () => {
    setScheduleDialogChannel(null);
  };

  const openAutomationTargetDialog = (channel: "whatsapp" | "telegram") => {
    if (channel === "whatsapp") {
      if (whatsapp.accounts.length === 0) {
        showProblemNotice("Conecte sua conta do WhatsApp para escolher grupos de envio.");
        return;
      }
      if (groups.length === 0) {
        showProblemNotice("Nenhum grupo do WhatsApp disponível. Sincronize sua conexão.");
        return;
      }
    }

    if (channel === "telegram") {
      if (telegramGroups.length === 0) {
        showProblemNotice("Nenhum grupo do Telegram disponível.");
        return;
      }
    }

    setAutomationTargetDialogChannel(channel);
  };

  const closeAutomationTargetDialog = () => {
    setAutomationTargetDialogChannel(null);
  };

  const buildScheduleValuesFromFields = () => {
    if (!startAtField) {
      throw new Error("Escolha data e hora");
    }

    const combinedStart = new Date(startAtField);
    if (Number.isNaN(combinedStart.getTime()) || combinedStart.getTime() <= Date.now()) {
      throw new Error("A data e hora devem ser no futuro.");
    }

    let combinedEndIso = "";
    if (endAtField) {
      const combinedEnd = new Date(endAtField);
      if (Number.isNaN(combinedEnd.getTime())) {
        throw new Error("Escolha uma data final válida.");
      }
      if (combinedEnd.getTime() < combinedStart.getTime()) {
        throw new Error("A data final deve ser maior ou igual ao início.");
      }
      combinedEndIso = combinedEnd.toISOString();
    }

    let combinedOverflowIso = "";
    if (combinedEndIso) {
      const autoOverflow = new Date(combinedStart);
      autoOverflow.setDate(autoOverflow.getDate() + 1);
      autoOverflow.setHours(8, 0, 0, 0);
      combinedOverflowIso = autoOverflow.toISOString();
    }

    return {
      startAt: combinedStart.toISOString(),
      endAt: combinedEndIso,
      overflowStartAt: combinedOverflowIso,
    };
  };

  const parseLinksInput = (value: string) => {
    const matches = value.match(/https?:\/\/[^\s<>"]+/gi) ?? [];
    const sanitized = matches
      .map((link) => link.trim().replace(/[),.;!?]+$/g, ""))
      .filter(Boolean);
    return Array.from(new Set(sanitized));
  };

  const formatIntervalLabel = (minutes: number) =>
    minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes}m`;

  const calculateScheduledGroupEstimatedEnd = (group: ScheduledGroup) => {
    if (!group.startAt || items.length <= 0) return null;
    const start = new Date(group.startAt);
    if (Number.isNaN(start.getTime())) return null;

    const total = Math.max(1, items.length);
    const interval = Math.max(1, group.intervalMinutes || intervalMinutes || 1);
    const end = group.endAt ? new Date(group.endAt) : null;
    const overflow = group.overflowStartAt ? new Date(group.overflowStartAt) : null;
    const defaultOverflowStart = buildDefaultOverflowStartForDay(start);

    let overflowWindowStarted = false;
    let current = new Date(start);

    const moveToNextWindowStart = (fromDate: Date) => {
      if (!overflowWindowStarted && overflow) {
        overflowWindowStarted = true;
        return new Date(Math.max(overflow.getTime(), fromDate.getTime()));
      }
      overflowWindowStarted = true;
      const source = overflow ?? defaultOverflowStart;
      return new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate() + 1,
        source.getHours(),
        source.getMinutes(),
        source.getSeconds(),
        source.getMilliseconds()
      );
    };

    for (let i = 1; i < total; i++) {
      const candidate = new Date(current.getTime() + interval * 60 * 1000);
      if (!end) {
        current = candidate;
        continue;
      }

      const dayEnd = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        end.getHours(),
        end.getMinutes(),
        end.getSeconds(),
        end.getMilliseconds()
      );

      current =
        candidate.getTime() > dayEnd.getTime()
          ? moveToNextWindowStart(current)
          : candidate;
    }

    return current;
  };

  const clearSchedulingAfterItemsChange = () => {
    if (isAutomaticList) return;

    const hasSchedulingData =
      Boolean(startAt) ||
      Boolean(endAt) ||
      Boolean(overflowStartAt) ||
      scheduledGroups.length > 0 ||
      scheduledTelegramGroups.length > 0;

    if (!hasSchedulingData) return;

    setSelectedGroupId(null);
    setSelectedTelegramGroupId(null);
    setStartAt("");
    setEndAt("");
    setOverflowStartAt("");
    setScheduledGroups([]);
    setScheduledTelegramGroups([]);
    setScheduleResetNotice(
      "A configuração de grupo e agendamento foi removida porque a lista de itens foi alterada. Configure novamente antes de criar o envio."
    );
    setNoticeDialog({
      open: true,
      title: "Agendamento resetado",
      description:
        "A lista de itens foi alterada. Reconfigure grupo e agendamento antes de criar o envio.",
    });
  };

  const appendItemsToList = (incomingItems: ListItem[]) => {
    if (incomingItems.length === 0) return;

    let nextSelectedIndex: number | null = null;
    setItems((prev) => {
      const next = [...prev, ...incomingItems];
      nextSelectedIndex = next.length > 0 ? next.length - 1 : null;
      return next;
    });
    clearSchedulingAfterItemsChange();
    if (nextSelectedIndex !== null) {
      setSelectedItemIndex(nextSelectedIndex);
    }
  };

  const openItemsDialog = () => {
    const initialPage =
      selectedItemIndex !== null
        ? Math.floor(selectedItemIndex / ITEMS_DIALOG_PAGE_SIZE) + 1
        : 1;
    setItemsDialogPage(initialPage);
    setItemsDialogOpen(true);
  };

  const getItemCoupon = (item: ListItem) => resolvePromoterCoupon(item.payload);

  const getEffectiveCoupon = (item: ListItem) =>
    getItemCoupon(item) || normalizePromoterCoupon(listCoupon);

  const buildScheduledItemPayload = (item: ListItem) => {
    const itemCoupon = getItemCoupon(item);
    const appliedCoupon = itemCoupon || normalizePromoterCoupon(listCoupon);

    if (itemCoupon) {
      return withPromoterCouponPayload(item.payload, itemCoupon, {
        source: "item",
        hasSpecificCoupon: true,
      });
    }

    if (appliedCoupon) {
      return withPromoterCouponPayload(item.payload, appliedCoupon, {
        source: "list",
        hasSpecificCoupon: false,
      });
    }

    return withPromoterCouponPayload(item.payload, "", {
      source: "item",
      hasSpecificCoupon: true,
    });
  };

  const openQuotaDialog = (params: {
    mode: "confirm" | "insufficient";
    title: string;
    description: string;
  }) => {
    return new Promise<boolean>((resolve) => {
      quotaDialogResolver.current = resolve;
      setQuotaDialog({
        open: true,
        mode: params.mode,
        title: params.title,
        description: params.description,
      });
    });
  };

  const resolveQuotaDialog = (value: boolean) => {
    quotaDialogResolver.current?.(value);
    quotaDialogResolver.current = null;
    setQuotaDialog((prev) => ({ ...prev, open: false }));
  };

  const showProblemNotice = (description: string, title = "Atenção") => {
    setError(description);
    setNoticeDialog({
      open: true,
      title,
      description,
    });
  };

  const confirmCreditsBeforeListSend = async (
    channel: "WhatsApp" | "Telegram",
    groupName: string,
    requestedCampaigns: number
  ) => {
    const quota =
      channel === "Telegram"
        ? await checkTelegramQuota(requestedCampaigns)
        : await checkWhatsappQuota(requestedCampaigns);
    const dailyLimit =
      toInt(quota.dailyLimit) > 0 ? toInt(quota.dailyLimit) : 0;
    const usedToday = toInt(quota.usedToday);
    const creditsRequired = toInt(
      quota.creditsRequired ?? quota.extraCampaignsNeeded
    );
    const creditsAvailable = toInt(quota.creditsAvailable);
    const creditsAfterSend = toInt(quota.creditsAfterSend);

    if (!quota.allowed) {
      await openQuotaDialog({
        mode: "insufficient",
        title: "Créditos insuficientes",
        description:
          `Seu plano inclui ${dailyLimit} campanhas grátis por dia.\n` +
          `Você já consumiu ${usedToday} hoje, então o envio via ${channel} precisa de créditos.\n\n` +
          `Necessário: ${creditsRequired} crédito(s)\n` +
          `Disponível: ${creditsAvailable} crédito(s)`,
      });
      return false;
    }

    if (creditsRequired > 0) {
      return openQuotaDialog({
        mode: "confirm",
        title: `Confirmar uso de créditos (${channel})`,
        description:
          `Seu plano inclui ${dailyLimit} campanhas por dia.\n` +
          `Você já consumiu ${usedToday} hoje e este envio para "${groupName}" passará a usar créditos.\n\n` +
          `Este envio consumirá ${creditsRequired} crédito(s).\n` +
          `Créditos disponíveis: ${creditsAvailable}\n` +
          `Créditos após envio: ${creditsAfterSend}`,
      });
    }

    return true;
  };

  const addLinksToList = async (
    links: string[],
    options?: {
      coupon?: string;
    }
  ) => {
    const availableSlots = Math.max(0, currentItemsLimit - items.length);
    if (availableSlots <= 0) {
      setError(`Limite máximo de ${currentItemsLimit} itens por lista atingido.`);
      return;
    }

    const existingLinks = new Set(items.map((item) => item.link.trim()).filter(Boolean));
    const uniqueLinks = Array.from(
      new Set(links.map((link) => link.trim()).filter(Boolean))
    ).filter((link) => !existingLinks.has(link));
    const linksToProcess = uniqueLinks.slice(0, availableSlots);
    const ignoredByLimitCount = uniqueLinks.length - linksToProcess.length;

    if (linksToProcess.length === 0) {
      setError("Nenhum link novo para adicionar. Verifique se já não estão na lista.");
      return;
    }

    setIsAdding(true);
    setAddingStatus(`Adicionando ${linksToProcess.length} item(ns) à lista...`);
    setProcessingOverlay({
      open: true,
      mode: "links",
      title: "Processando links",
      description: "Buscando informações dos produtos e adicionando à sua lista.",
      processed: 0,
      total: linksToProcess.length,
      added: 0,
      failed: 0,
      currentProduct: null,
      status: `Adicionando ${linksToProcess.length} item(ns) à lista...`,
      allowCancel: false,
      isCancelling: false,
    });
    setError(null);
    setSuccessMessage(null);
    setShopeeError(null);

    try {
      const addedItems: ListItem[] = [];
      const failedLinks: string[] = [];
      const specificCoupon = normalizePromoterCoupon(options?.coupon);
      let processedCount = 0;
      let addedCount = 0;
      let failedCount = 0;

      for (let start = 0; start < linksToProcess.length; start += LINK_PREVIEW_CONCURRENCY) {
        const chunk = linksToProcess.slice(start, start + LINK_PREVIEW_CONCURRENCY);
        const results = await Promise.all(
          chunk.map(async (link) => {
            try {
              const preview = await fetchWhatsAppProductInfo(link);
              const previewPayload = (preview.payload || {}) as Record<string, unknown>;
              const productTitle =
                typeof previewPayload.productTitle === "string"
                  ? previewPayload.productTitle
                  : typeof previewPayload.productName === "string"
                    ? previewPayload.productName
                    : "";
              const productPrice =
                typeof previewPayload.productPrice === "string"
                  ? previewPayload.productPrice
                  : typeof previewPayload.productPriceMin === "string"
                    ? previewPayload.productPriceMin
                    : undefined;
              const productImageUrl =
                typeof previewPayload.productImageUrl === "string"
                  ? previewPayload.productImageUrl
                  : undefined;
              return {
                ok: true as const,
                item: {
                  link,
                  message: productTitle || preview.message || "",
                  payload: withPromoterCouponPayload(
                    {
                      ...previewPayload,
                      needsAiProcessing: true,
                      sourceType: "custom_link",
                      sourceLink: link,
                    },
                    specificCoupon,
                    { source: "item", hasSpecificCoupon: true }
                  ),
                },
                product: {
                  title: productTitle || undefined,
                  price: productPrice,
                  imageUrl: productImageUrl,
                  link,
                },
              };
            } catch {
              return { ok: false as const, link };
            }
          })
        );

        let lastSuccessProduct: {
          title?: string;
          price?: string;
          imageUrl?: string;
          link?: string;
        } | null = null;

        results.forEach((result) => {
          if (result.ok) {
            addedItems.push(result.item);
            addedCount += 1;
            lastSuccessProduct = result.product;
            return;
          }
          failedLinks.push(result.link);
          failedCount += 1;
        });
        processedCount += results.length;

        setAddingStatus(
          `Processando links... ${Math.min(start + chunk.length, linksToProcess.length)}/${linksToProcess.length}`
        );
        setProcessingOverlay((prev) => ({
          ...prev,
          open: true,
          processed: processedCount,
          added: addedCount,
          failed: failedCount,
          currentProduct: lastSuccessProduct ?? prev.currentProduct,
          status: `Processando links... ${Math.min(
            start + chunk.length,
            linksToProcess.length
          )}/${linksToProcess.length}`,
        }));
      }

      if (addedItems.length > 0) {
        appendItemsToList(addedItems);
      }

      if (failedLinks.length > 0 || ignoredByLimitCount > 0) {
        const previewLinksLimit = 10;
        const failedLinksPreview = failedLinks.slice(0, previewLinksLimit);
        const remaining = failedLinks.length - failedLinksPreview.length;
        const failedLinksText = failedLinksPreview.join("\n");
        const remainingText =
          remaining > 0 ? `\n...e mais ${remaining} link(s).` : "";
        const failedText =
          failedLinks.length > 0
            ? `${failedLinks.length} link(s) não puderam ser processados e foram ignorados:\n${failedLinksText}${remainingText}`
            : "";
        const limitText =
          ignoredByLimitCount > 0
            ? `${failedText ? "\n\n" : ""}${ignoredByLimitCount} link(s) foram ignorados por limite máximo de ${currentItemsLimit} itens por lista.`
            : "";
        setError(`${failedText}${limitText}`);
      } else if (addedItems.length > 0) {
        setSuccessMessage(`${addedItems.length} link(s) adicionados à fila.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar links.");
    } finally {
      setIsAdding(false);
      setAddingStatus(null);
      setProcessingOverlay(EMPTY_PROCESSING_OVERLAY);
    }
  };

  const addExtensionPayloadToList = (
    rawPayload: string,
    inputReset?: () => void
  ) => {
    if (items.length >= currentItemsLimit) {
      setError(`Limite máximo de ${currentItemsLimit} itens por lista atingido.`);
      return true;
    }

    const parsed = tryParseExtensionPayload(rawPayload);
    if (!parsed) return false;

    const item = buildListItemFromExtensionPayload(parsed);
    if (!item.link) {
      setError("O payload da extensão não possui um link válido para o produto.");
      return true;
    }

    let nextSelectedIndex: number | null = null;
    setItems((prev) => {
      const next = [...prev, item];
      nextSelectedIndex = next.length > 0 ? next.length - 1 : null;
      return next;
    });
    clearSchedulingAfterItemsChange();
    if (nextSelectedIndex !== null) {
      setSelectedItemIndex(nextSelectedIndex);
    }
    setError(null);
    setSuccessMessage(null);
    inputReset?.();
    return true;
  };

  const addShopeeProductsToList = async (products: PromoterShopeeProduct[]) => {
    if (products.length === 0) return [] as string[];

    const availableSlots = Math.max(0, currentItemsLimit - items.length);
    if (availableSlots <= 0) {
      setShopeeError(`Limite máximo de ${currentItemsLimit} itens por lista atingido.`);
      return [] as string[];
    }

    setIsAdding(true);
    setAddingStatus(`Adicionando ${Math.min(products.length, availableSlots)} produto(s) da Shopee...`);
    setError(null);
    setSuccessMessage(null);

    try {
      const existingLinks = new Set(items.map((item) => item.link.trim()).filter(Boolean));
      const seenIncoming = new Set<string>();
      const acceptedProductIds: string[] = [];
      const ignoredByLimitCount = Math.max(0, products.length - availableSlots);

      const addedItems: ListItem[] = products.flatMap((product) => {
        const link = (product.offerLink || product.productLink || "").trim();
        if (!link) return [];
        if (existingLinks.has(link)) return [];
        if (seenIncoming.has(link)) return [];
        if (acceptedProductIds.length >= availableSlots) return [];

        seenIncoming.add(link);
        acceptedProductIds.push(String(product.itemId));

        return [{
          link,
          // Não processa IA nesta etapa; IA acontece na fila após agendar.
          message: product.productName || "",
          payload: {
            needsAiProcessing: true,
            productTitle: product.productName,
            productImageUrl: product.imageUrl,
            productPrice: product.price,
            productPriceMin: product.priceMin,
            productPriceMax: product.priceMax,
            productSales: product.sales,
            commissionRate: product.commissionRate,
            offerLink: product.offerLink,
            productLink: product.productLink,
            itemId: product.itemId,
          },
        }];
      });

      if (addedItems.length === 0) {
        setShopeeError("Nenhum produto válido encontrado para adicionar.");
        return [] as string[];
      }

      appendItemsToList(addedItems);

      if (ignoredByLimitCount > 0) {
        setShopeeError(
          `${ignoredByLimitCount} produto(s) foram ignorados por limite máximo de ${currentItemsLimit} itens por lista.`
        );
      } else {
        setShopeeError(null);
      }
      return acceptedProductIds;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar produtos da Shopee.");
      return [] as string[];
    } finally {
      setIsAdding(false);
      setAddingStatus(null);
    }
  };

  const handleAddCustomLinks = async () => {
    if (addExtensionPayloadToList(customLinksInput, () => setCustomLinksInput(""))) {
      return;
    }
    const links = parseLinksInput(customLinksInput);
    if (links.length === 0) {
      setError("Cole pelo menos um link válido.");
      return;
    }
    await addLinksToList(links);
    setCustomLinksInput("");
  };

  const handleAddSingleLink = async () => {
    if (addExtensionPayloadToList(singleLinkInput, () => setSingleLinkInput(""))) {
      setSingleLinkCoupon("");
      return;
    }
    const links = parseLinksInput(singleLinkInput);
    if (links.length === 0) {
      setError("Informe um link para adicionar.");
      return;
    }
    await addLinksToList(links, { coupon: singleLinkCoupon });
    setSingleLinkInput("");
    setSingleLinkCoupon("");
  };

  const buildCsvImportItem = (
    link: string,
    csvRow: Record<string, string>,
    preview: Awaited<ReturnType<typeof fetchWhatsAppProductInfo>>
  ): {
    item: ListItem;
    product: ProcessingOverlayCurrentProduct;
  } => {
    const previewPayload = (preview.payload || {}) as Record<string, unknown>;
    const csvTitle = getFirstPromoterCsvValue(csvRow, CSV_PRODUCT_TITLE_ALIASES);
    const csvImageUrl = getFirstPromoterCsvValue(csvRow, CSV_IMAGE_ALIASES);
    const csvPrice = getFirstPromoterCsvValue(csvRow, CSV_PRICE_ALIASES);
    const csvOfferLink = getFirstPromoterCsvValue(csvRow, ["Offer Link", "offerLink"]);
    const csvProductLink = getFirstPromoterCsvValue(csvRow, [
      "Product Link",
      "productLink",
    ]);

    const resolvedTitle =
      toOptionalString(previewPayload.productTitle) ??
      toOptionalString(previewPayload.productName) ??
      csvTitle ??
      link;
    const resolvedImageUrl =
      toOptionalString(previewPayload.productImageUrl) ??
      toOptionalString(previewPayload.imageUrl) ??
      csvImageUrl;
    const resolvedPrice =
      toOptionalString(previewPayload.productPrice) ??
      toOptionalString(previewPayload.productPriceMin) ??
      toOptionalString(previewPayload.price) ??
      csvPrice;
    const resolvedOfferLink =
      toOptionalString(previewPayload.offerLink) ?? csvOfferLink ?? link;
    const resolvedProductLink =
      toOptionalString(previewPayload.productLink) ??
      csvProductLink ??
      resolvedOfferLink;
    const resolvedMarketplace =
      toOptionalString(previewPayload.marketplace) ?? detectMarketplaceFromLink(link) ?? "shopee";

    return {
      item: {
        link,
        message: preview.message || resolvedTitle || link,
        payload: {
          ...previewPayload,
          productLink: resolvedProductLink,
          offerLink: resolvedOfferLink,
          marketplace: resolvedMarketplace,
          productTitle: resolvedTitle,
          productImageUrl: resolvedImageUrl,
          productPrice: resolvedPrice,
          needsAiProcessing: true,
          source: "csv",
          sourceType: "csv_import",
          sourceLink: link,
          csvRawData: { ...csvRow },
        },
      },
      product: {
        title: resolvedTitle,
        price: resolvedPrice,
        imageUrl: resolvedImageUrl,
        link,
      },
    };
  };

  const handleCancelCsvImport = () => {
    if (!csvImportAbortControllerRef.current) return;

    const confirmed = window.confirm(
      "Deseja cancelar o processamento do CSV? Os produtos já processados serão mantidos na lista."
    );

    if (!confirmed) return;

    setAddingStatus("Cancelando processamento do CSV...");
    setProcessingOverlay((prev) => ({
      ...prev,
      isCancelling: true,
      status: "Cancelando...",
    }));
    csvImportAbortControllerRef.current.abort();
  };

  const processCsvImportFile = async (file: File) => {
    const isCsvFile =
      file.name.toLowerCase().endsWith(".csv") || file.type.toLowerCase().includes("csv");

    if (!isCsvFile) {
      setShopeeError("Selecione um arquivo CSV válido.");
      return;
    }

    const availableSlots = Math.max(0, currentItemsLimit - items.length);
    if (availableSlots <= 0) {
      setShopeeError(`Limite máximo de ${currentItemsLimit} itens por lista atingido.`);
      return;
    }

    const abortController = new AbortController();
    csvImportAbortControllerRef.current = abortController;
    setSelectedCsvFileName(file.name);
    setIsAdding(true);
    setAddingStatus("Lendo arquivo CSV...");
    setProcessingOverlay({
      ...EMPTY_PROCESSING_OVERLAY,
      open: true,
      mode: "csv",
      title: "Processando CSV",
      description: "Produtos do CSV estão sendo processados e adicionados à sua lista.",
      allowCancel: true,
      status: "Lendo arquivo CSV...",
    });
    setError(null);
    setSuccessMessage(null);
    setShopeeError(null);

    try {
      const content = await file.text();
      const parsed = parsePromoterCsvDocument(content);

      if (parsed.header.length === 0 || parsed.rows.length === 0) {
        setShopeeError("CSV vazio ou inválido.");
        return;
      }

      if (!hasPromoterCsvProductLinkColumns(parsed.header)) {
        setShopeeError('CSV deve conter coluna "Offer Link" ou "Product Link".');
        return;
      }

      const rows = parsed.rows.filter((row) =>
        Object.values(row.record).some((value) => value.trim().length > 0)
      );

      if (rows.length === 0) {
        setShopeeError("CSV vazio ou inválido.");
        return;
      }

      const existingLinks = new Set(items.map((item) => item.link.trim()).filter(Boolean));
      const seenCsvLinks = new Set<string>();
      const addedItems: ListItem[] = [];
      const failedLines: number[] = [];
      let addedCount = 0;
      let failedCount = 0;
      let ignoredByLimitCount = 0;
      let processedCount = 0;

      setAddingStatus(`Processando ${rows.length} produto(s) do CSV...`);
      setProcessingOverlay((prev) => ({
        ...prev,
        total: rows.length,
        status: `Processando ${rows.length} produto(s)...`,
      }));

      for (let start = 0; start < rows.length; start += LINK_PREVIEW_CONCURRENCY) {
        if (abortController.signal.aborted) {
          break;
        }

        if (addedCount >= availableSlots) {
          ignoredByLimitCount += rows.length - start;
          break;
        }

        const chunk = rows.slice(start, start + LINK_PREVIEW_CONCURRENCY);
        const plannedChunkLinks = new Set<string>();

        setAddingStatus(
          `Processando produtos ${start + 1} a ${Math.min(start + chunk.length, rows.length)} de ${rows.length}...`
        );
        setProcessingOverlay((prev) => ({
          ...prev,
          status: `Processando produtos ${start + 1} a ${Math.min(
            start + chunk.length,
            rows.length
          )} de ${rows.length}...`,
        }));

        const results = await Promise.all(
          chunk.map(async (row, offset) => {
            const currentItem = start + offset + 1;
            const currentLink = resolvePromoterCsvLink(row.record)?.trim();

            if (!currentLink) {
              return {
                type: "invalid" as const,
                row,
                currentItem,
                status: `Linha ${row.lineNumber}: link não encontrado`,
              };
            }

            if (
              existingLinks.has(currentLink) ||
              seenCsvLinks.has(currentLink) ||
              plannedChunkLinks.has(currentLink)
            ) {
              return {
                type: "duplicate" as const,
                row,
                currentItem,
                status: `Linha ${row.lineNumber}: produto duplicado`,
              };
            }

            plannedChunkLinks.add(currentLink);
            seenCsvLinks.add(currentLink);

            try {
              const preview = await fetchWhatsAppProductInfo(currentLink, {
                signal: abortController.signal,
              });

              if (abortController.signal.aborted) {
                return {
                  type: "aborted" as const,
                  row,
                  currentItem,
                };
              }

              return {
                type: "success" as const,
                row,
                currentItem,
                link: currentLink,
                builtItem: buildCsvImportItem(currentLink, row.record, preview),
              };
            } catch (err) {
              if (isAbortError(err)) {
                return {
                  type: "aborted" as const,
                  row,
                  currentItem,
                };
              }

              return {
                type: "failed" as const,
                row,
                currentItem,
                status: `Linha ${row.lineNumber}: não foi possível carregar o produto`,
              };
            }
          })
        );

        let lastStatus = `Processando ${Math.min(start + chunk.length, rows.length)} de ${rows.length}...`;
        let lastCurrentProduct: ProcessingOverlayCurrentProduct | null = null;

        results.forEach((result) => {
          if (result.type === "aborted") {
            return;
          }

          processedCount += 1;

          if (result.type === "success") {
            if (addedCount < availableSlots) {
              addedItems.push(result.builtItem.item);
              existingLinks.add(result.link);
              addedCount += 1;
              lastCurrentProduct = result.builtItem.product;
              lastStatus = `Produto adicionado! (${addedCount} adicionado(s), ${processedCount}/${rows.length})`;
            } else {
              ignoredByLimitCount += 1;
              lastStatus = `Limite máximo atingido. ${ignoredByLimitCount} produto(s) ignorado(s).`;
            }
            return;
          }

          failedCount += 1;
          failedLines.push(result.row.lineNumber);
          lastStatus = result.status;
        });

        setAddingStatus(lastStatus);
        setProcessingOverlay((prev) => ({
          ...prev,
          processed: processedCount,
          added: addedCount,
          failed: failedCount,
          currentProduct: lastCurrentProduct ?? prev.currentProduct,
          status: lastStatus,
        }));

        if (!abortController.signal.aborted && start + chunk.length < rows.length) {
          await wait(CSV_IMPORT_DELAY_MS);
        }
      }

      const wasCancelled = abortController.signal.aborted;

      if (addedItems.length > 0) {
        appendItemsToList(addedItems);
      }

      setProcessingOverlay((prev) => ({
        ...prev,
        processed: rows.length,
        total: rows.length,
        status: wasCancelled ? "Processamento cancelado." : "Finalizando...",
      }));

      if (!wasCancelled) {
        await wait(250);
      }

      if (wasCancelled) {
        if (addedCount > 0) {
          setSuccessMessage(`Processamento cancelado. ${addedCount} produto(s) já adicionado(s).`);
        } else {
          setShopeeError("Processamento do CSV cancelado.");
        }
        return;
      }

      const failedLinesPreview = failedLines.slice(0, 10).join(", ");
      const failedLinesSuffix = failedLines.length > 10 ? ", ..." : "";
      const failedText =
        failedCount > 0
          ? `${failedCount} linha(s) foram ignoradas por erro ou duplicidade${
              failedLinesPreview ? `: ${failedLinesPreview}${failedLinesSuffix}` : ""
            }.`
          : "";
      const limitText =
        ignoredByLimitCount > 0
          ? `${failedText ? " " : ""}${ignoredByLimitCount} produto(s) foram ignorados por limite máximo de ${currentItemsLimit} itens por lista.`
          : "";

      if (addedCount === 0) {
        setError(`Nenhum produto adicionado. Verifique os links no CSV.${failedText ? ` ${failedText}` : ""}${limitText}`);
        return;
      }

      if (failedText || limitText) {
        setError(`CSV processado: ${addedCount} produto(s) adicionados. ${failedText}${limitText}`.trim());
      } else {
        setSuccessMessage(`CSV processado: ${addedCount} produto(s) adicionados à fila.`);
      }
    } catch (err) {
      if (isAbortError(err)) {
        setShopeeError("Processamento do CSV cancelado.");
        return;
      }

      setShopeeError(
        err instanceof Error ? err.message : "Erro ao processar o arquivo CSV."
      );
    } finally {
      csvImportAbortControllerRef.current = null;
      setIsAdding(false);
      setAddingStatus(null);
      setProcessingOverlay(EMPTY_PROCESSING_OVERLAY);
    }
  };

  const handleCsvFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    void processCsvImportFile(file);
  };

  const loadShopeeProducts = async (pageToLoad = 1, append = false) => {
    setIsLoadingShopee(true);
    setShopeeError(null);
    try {
      const maxPagesSafety = 20;
      const perRequestMax = 50;
      let currentPage = pageToLoad;
      let hasNextPage = true;
      let pagesFetched = 0;
      let fetchedAny = false;

      const existingListLinks = new Set(
        items.map((item) => item.link.trim()).filter(Boolean)
      );
      const currentResultLinks = append
        ? new Set(
            shopeeProducts
              .map((product) => (product.offerLink || product.productLink || "").trim())
              .filter(Boolean)
          )
        : new Set<string>();

      const seenLinks = new Set(currentResultLinks);
      const uniqueNewNodes: PromoterShopeeProduct[] = [];

      while (
        uniqueNewNodes.length < shopeeLimit &&
        hasNextPage &&
        pagesFetched < maxPagesSafety
      ) {
        const remainingNeeded = shopeeLimit - uniqueNewNodes.length;
        const requestLimit = Math.min(perRequestMax, Math.max(remainingNeeded, 1));

        const response = await fetchPromoterShopeeProducts({
          page: currentPage,
          limit: requestLimit,
          query: shopeeQuery || undefined,
          sortType: shopeeSortType ?? undefined,
          isAMSOffer: shopeeIsAMSOffer ?? undefined,
        });

        const nodes = response.nodes || [];
        hasNextPage = Boolean(response.pageInfo?.hasNextPage);
        fetchedAny = fetchedAny || nodes.length > 0;

        if (nodes.length === 0) {
          break;
        }

        for (const node of nodes) {
          const link = (node.offerLink || node.productLink || "").trim();
          if (!link) continue;
          if (existingListLinks.has(link)) continue;
          if (seenLinks.has(link)) continue;

          seenLinks.add(link);
          uniqueNewNodes.push(node);

          if (uniqueNewNodes.length >= shopeeLimit) {
            break;
          }
        }

        currentPage += 1;
        pagesFetched += 1;
      }

      const lastFetchedPage = pagesFetched > 0 ? currentPage - 1 : pageToLoad;
      setShopeePage(lastFetchedPage);
      setShopeeHasNextPage(hasNextPage);
      setHasLoadedShopee(true);
      setShopeeProducts((prev) => (append ? [...prev, ...uniqueNewNodes] : uniqueNewNodes));
      setShopeeSelectedIds((prev) => {
        const incomingIds = uniqueNewNodes.map((product) => String(product.itemId));
        const merged = new Set([...prev, ...incomingIds]);
        return Array.from(merged);
      });

      if (!fetchedAny || uniqueNewNodes.length === 0) {
        setShopeeError("Nenhum novo produto encontrado para os filtros aplicados.");
      }
    } catch (err) {
      setShopeeError(
        err instanceof Error ? err.message : "Erro ao buscar produtos da Shopee."
      );
    } finally {
      setIsLoadingShopee(false);
    }
  };

  const handleSearchShopee = async () => {
    const currentSearchKey = JSON.stringify({
      query: shopeeQuery.trim(),
      limit: shopeeLimit,
      sortType: shopeeSortType,
      isAMSOffer: shopeeIsAMSOffer,
    });

    const hasCriteriaChanged = currentSearchKey !== lastShopeeSearchKey;
    const nextPage = hasCriteriaChanged ? 1 : shopeePage + 1;

    if (hasCriteriaChanged) {
      setShopeeProducts([]);
      setShopeeSelectedIds([]);
      setShopeeHasNextPage(false);
    }

    setLastShopeeSearchKey(currentSearchKey);
    await loadShopeeProducts(nextPage, !hasCriteriaChanged);
  };

  const toggleShopeeSelection = (itemId: string) => {
    setShopeeSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleSelectAllShopee = () => {
    const allIds = shopeeProducts.map((product) => String(product.itemId));
    const allSelected = allIds.length > 0 && allIds.every((id) => shopeeSelectedIds.includes(id));
    setShopeeSelectedIds(allSelected ? [] : allIds);
  };

  const handleAddSelectedShopee = async () => {
    const selectedProducts = shopeeProducts.filter((product) =>
      shopeeSelectedIds.includes(String(product.itemId))
    );

    if (selectedProducts.length === 0) {
      setShopeeError("Selecione ao menos um produto da Shopee.");
      return;
    }

    const addedIds = await addShopeeProductsToList(selectedProducts);
    const addedIdsSet = new Set(addedIds);
    setShopeeProducts((prev) =>
      prev.filter((product) => !addedIdsSet.has(String(product.itemId)))
    );
    setShopeeSelectedIds((prev) => prev.filter((id) => !addedIdsSet.has(id)));
  };

  const applyShopeePreset = (preset: "top_sales" | "high_commission" | "ams_only") => {
    setShopeePreset(preset);
    setShopeeSortType(null);
    setShopeeIsAMSOffer(null);

    if (preset === "top_sales") {
      setShopeeSortType(2);
    } else if (preset === "high_commission") {
      setShopeeSortType(5);
    } else if (preset === "ams_only") {
      setShopeeIsAMSOffer(true);
    }
  };

  const clearShopeeFilters = () => {
    setShopeePreset("");
    setShopeeSortType(null);
    setShopeeIsAMSOffer(null);
    setShopeeQuery("");
    setShopeePage(1);
    setShopeeLimit(10);
    setShopeeProducts([]);
    setShopeeSelectedIds([]);
    setShopeeHasNextPage(false);
    setShopeeError(null);
    setHasLoadedShopee(false);
    setLastShopeeSearchKey("");
  };

  const handleSelectBatch = async (batch: WhatsAppBatch) => {
    setSelectedBatch(batch);
    setIsDetailLoading(true);
    setBatchDetail(null);
    try {
      const detail = await fetchWhatsappBatchDetail(batch.documentId);
      setBatchDetail(detail ?? batch);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar itens da lista."
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSelectTelegramBatch = async (batch: TelegramBatch) => {
    setSelectedTelegramBatch(batch);
    setIsTelegramDetailLoading(true);
    setTelegramBatchDetail(null);
    try {
      const detail = await fetchTelegramBatchDetail(batch.documentId);
      setTelegramBatchDetail(detail ?? batch);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar itens da lista do Telegram."
      );
    } finally {
      setIsTelegramDetailLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    const confirmed = window.confirm(
      "Deseja apagar esta lista? Os envios pendentes serão cancelados."
    );
    if (!confirmed) return;

    try {
      await deleteWhatsappBatch(batchId, true);
      setBatches((prev) => prev.filter((batch) => batch.documentId !== batchId));
      if (selectedBatch?.documentId === batchId) {
        setSelectedBatch(null);
        setBatchDetail(null);
      }
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao apagar lista."
      );
    }
  };

  const handleDeleteTelegramBatch = async (batchId: string) => {
    const confirmed = window.confirm(
      "Deseja apagar esta lista? Os envios pendentes serão cancelados."
    );
    if (!confirmed) return;

    try {
      await deleteTelegramBatch(batchId, true);
      setTelegramBatches((prev) =>
        prev.filter((batch) => batch.documentId !== batchId)
      );
      if (selectedTelegramBatch?.documentId === batchId) {
        setSelectedTelegramBatch(null);
        setTelegramBatchDetail(null);
      }
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao apagar lista do Telegram."
      );
    }
  };

  const handleCancelBatch = async (batchId: string) => {
    const confirmed = window.confirm(
      "Deseja cancelar os envios pendentes desta lista?"
    );
    if (!confirmed) return;

    try {
      await deleteWhatsappBatch(batchId, false);
      setBatches((prev) =>
        prev.map((batch) =>
          batch.documentId === batchId
            ? { ...batch, status: "canceled" }
            : batch
        )
      );
      if (selectedBatch?.documentId === batchId) {
        setSelectedBatch((prev) => (prev ? { ...prev, status: "canceled" } : prev));
        setBatchDetail((prev) => (prev ? { ...prev, status: "canceled" } : prev));
      }
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao cancelar lista."
      );
    }
  };

  const handleCancelTelegramBatch = async (batchId: string) => {
    const confirmed = window.confirm(
      "Deseja cancelar os envios pendentes desta lista?"
    );
    if (!confirmed) return;

    try {
      await deleteTelegramBatch(batchId, false);
      setTelegramBatches((prev) =>
        prev.map((batch) =>
          batch.documentId === batchId
            ? { ...batch, status: "canceled", statusBatch: "canceled" }
            : batch
        )
      );
      if (selectedTelegramBatch?.documentId === batchId) {
        setSelectedTelegramBatch((prev) =>
          prev ? { ...prev, status: "canceled", statusBatch: "canceled" } : prev
        );
        setTelegramBatchDetail((prev) =>
          prev ? { ...prev, status: "canceled", statusBatch: "canceled" } : prev
        );
      }
    } catch (err) {
      showProblemNotice(
        err instanceof Error
          ? err.message
          : "Erro ao cancelar lista do Telegram."
      );
    }
  };

  const removeItemAtIndex = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedItemIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
    clearSchedulingAfterItemsChange();
  };

  const renderDraftItemCard = (item: ListItem, idx: number) => {
    const extensionCard = getExtensionPayloadCardData(item.payload);
    const thumb = extensionCard?.imageUrl
      ? extensionCard.imageUrl
      : typeof item.payload?.productImageUrl === "string"
        ? (item.payload.productImageUrl as string)
        : null;
    const isSelected = selectedItemIndex === idx;
    const needsAiProcessing = item.payload?.needsAiProcessing === true;
    const itemCoupon = getItemCoupon(item);
    const effectiveCoupon = getEffectiveCoupon(item);
    const title =
      extensionCard?.title ||
      (typeof item.payload?.productTitle === "string"
        ? (item.payload.productTitle as string)
        : item.link);
    const subtitle =
      extensionCard?.price ||
      (typeof item.payload?.productPrice === "string"
        ? String(item.payload.productPrice)
        : item.message);

    return (
      <div
        key={`${item.link}-${idx}`}
        role="button"
        tabIndex={0}
        className={`w-full text-left border rounded-md p-3 bg-slate-50 transition-colors cursor-pointer overflow-hidden ${
          isSelected
            ? "border-[#7d570e] bg-amber-50"
            : "border-slate-300 hover:border-primary"
        }`}
        onClick={() => setSelectedItemIndex(idx)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedItemIndex(idx);
          }
        }}
      >
        <div className="flex gap-3 items-start overflow-hidden">
          {thumb ? (
            <div className="relative w-12 h-12 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="Produto" className="w-12 h-12 rounded-md object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-md bg-slate-200 flex items-center justify-center text-slate-500 text-xs">
              IMG
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {extensionCard ? (
                <div className="inline-flex rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-1">
                  Importado da extensão
                </div>
              ) : null}
              {extensionCard?.marketplace ? (
                <Badge
                  variant="outline"
                  className="border-sky-300 bg-sky-50 text-sky-700 text-[10px]"
                >
                  {extensionCard.marketplace === "mercado-livre"
                    ? "Mercado Livre"
                    : extensionCard.marketplace}
                </Badge>
              ) : null}
              {extensionCard?.priceDiscountRate ? (
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  {extensionCard.priceDiscountRate} OFF
                </Badge>
              ) : null}
            </div>
            <div className="text-sm leading-5 line-clamp-2 break-words">{title}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
              {subtitle}
            </div>
            {extensionCard?.priceMax ? (
              <div className="text-[11px] text-muted-foreground mt-1 line-through truncate">
                {extensionCard.priceMax}
              </div>
            ) : null}
            {effectiveCoupon ? (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px]"
                >
                  Cupom: {effectiveCoupon}
                </Badge>
              </div>
            ) : null}
            <div className="text-[11px] text-muted-foreground mt-1 break-all line-clamp-1">
              {item.link}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={isAutomaticConfigLocked}
            onClick={(e) => {
              e.stopPropagation();
              removeItemAtIndex(idx);
            }}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>

        {isSelected && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="space-y-2">
                <div className="font-medium text-foreground">Cupom do item</div>
                <Input
                  value={itemCoupon}
                  onChange={(e) => {
                    const nextCoupon = e.target.value;
                    setItems((prev) =>
                      prev.map((entry, entryIdx) =>
                        entryIdx === idx
                          ? {
                              ...entry,
                              payload: withPromoterCouponPayload(
                                entry.payload,
                                nextCoupon,
                                {
                                  source: "item",
                                  hasSpecificCoupon: true,
                                }
                              ),
                            }
                          : entry
                      )
                    );
                  }}
                  placeholder="Se vazio, usa o cupom da lista"
                  disabled={isAutomaticConfigLocked}
                />
                <div className="text-xs text-muted-foreground">
                  {effectiveCoupon
                    ? itemCoupon
                      ? `Cupom específico aplicado: ${effectiveCoupon}`
                      : `Usando o cupom da lista: ${effectiveCoupon}`
                    : "Nenhum cupom aplicado a este item."}
                </div>
              </div>
              <div className="font-medium text-foreground">Mensagem do item</div>
              {needsAiProcessing ? (
                <>
                  <div>
                    A mensagem deste produto ainda será processada automaticamente na fila após criar/agendar a lista.
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItemIndex(null);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Fechar
                  </Button>
                </>
              ) : (
                <>
                  <Textarea
                    value={item.message}
                    onChange={(e) => {
                      const nextMessage = e.target.value;
                      setItems((prev) =>
                        prev.map((entry, entryIdx) =>
                          entryIdx === idx
                            ? { ...entry, message: nextMessage }
                            : entry
                        )
                      );
                    }}
                    className="min-h-24"
                    placeholder="Edite a mensagem do item"
                    disabled={isAutomaticConfigLocked}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemIndex(null);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Fechar
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReadonlyDraftItemCard = (item: ListItem, idx: number) => {
    const extensionCard = getExtensionPayloadCardData(item.payload);
    const thumb = extensionCard?.imageUrl
      ? extensionCard.imageUrl
      : typeof item.payload?.productImageUrl === "string"
        ? (item.payload.productImageUrl as string)
        : null;
    const effectiveCoupon = getEffectiveCoupon(item);
    const title =
      extensionCard?.title ||
      (typeof item.payload?.productTitle === "string"
        ? (item.payload.productTitle as string)
        : item.link);
    const subtitle =
      extensionCard?.price ||
      (typeof item.payload?.productPrice === "string"
        ? String(item.payload.productPrice)
        : item.message);

    return (
      <div
        key={`${item.link}-${idx}`}
        className="w-full border rounded-md p-3 bg-slate-50 border-slate-300 overflow-hidden"
      >
        <div className="flex gap-3 items-start overflow-hidden">
          {thumb ? (
            <div className="relative w-12 h-12 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="Produto" className="w-12 h-12 rounded-md object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-md bg-slate-200 flex items-center justify-center text-slate-500 text-xs">
              IMG
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge className="bg-[#EE4D2D] text-white hover:bg-[#EE4D2D] text-[10px]">
                Shopee
              </Badge>
              {extensionCard?.marketplace ? (
                <Badge
                  variant="outline"
                  className="border-sky-300 bg-sky-50 text-sky-700 text-[10px]"
                >
                  {extensionCard.marketplace === "mercado-livre"
                    ? "Mercado Livre"
                    : extensionCard.marketplace}
                </Badge>
              ) : null}
              {extensionCard?.priceDiscountRate ? (
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  {extensionCard.priceDiscountRate} OFF
                </Badge>
              ) : null}
            </div>
            <div className="text-sm leading-5 line-clamp-2 break-words">{title}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
              {subtitle}
            </div>
            {extensionCard?.priceMax ? (
              <div className="text-[11px] text-muted-foreground mt-1 line-through truncate">
                {extensionCard.priceMax}
              </div>
            ) : null}
            {effectiveCoupon ? (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px]"
                >
                  Cupom: {effectiveCoupon}
                </Badge>
              </div>
            ) : null}
            <div className="text-[11px] text-muted-foreground mt-1 break-all line-clamp-1">
              {item.link}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const hasBatchStartConflict = (
    scheduledStartAt: string,
    sourceBatches: WhatsAppBatch[],
    groupId?: string
  ) => {
    const target = new Date(scheduledStartAt);
    if (Number.isNaN(target.getTime())) return false;

    return sourceBatches.some((batch) => {
      if (!batch.startAt) return false;
      if (isBatchCanceledOrSent(resolveBatchStatus(batch))) return false;
      if (groupId && batch.groupId !== groupId) return false;

      const existing = new Date(batch.startAt);
      if (Number.isNaN(existing.getTime())) return false;

      return isSameMinute(target, existing);
    });
  };

  const validateGroupAgainstExistingBatches = async (
    groupId: string,
    startDate: Date
  ) => {
    const now = new Date();
    const groupBatches = batches.filter(
      (batch) =>
        batch.groupId === groupId &&
        !isBatchCanceledOrSent(resolveBatchStatus(batch)) &&
        Boolean(batch.startAt)
    );

    if (groupBatches.length === 0) return null;

    const endTimes = await Promise.all(
      groupBatches.map(async (batch) => {
        let batchForCalculation = batch;
        if (!batch.campaigns || batch.campaigns.length === 0) {
          try {
            const detailed = await fetchWhatsappBatchDetail(batch.documentId);
            if (detailed) batchForCalculation = detailed;
          } catch {
            // Mantém dados atuais caso detalhe falhe
          }
        }
        return calculateBatchEndTime(batchForCalculation);
      })
    );

    const validEndTimes = endTimes
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime());

    if (validEndTimes.length === 0) return null;

    const minAllowedTime = new Date(validEndTimes[0].getTime() + 5 * 60 * 1000);
    const effectiveMinTime =
      minAllowedTime.getTime() > now.getTime() ? minAllowedTime : now;

    if (startDate.getTime() < effectiveMinTime.getTime()) {
      return `A data e hora devem ser após ou igual a ${formatDateTime(
        effectiveMinTime.toISOString()
      )} (5 minutos após o término do último envio).`;
    }

    return null;
  };

  const handleAddScheduledGroup = async (options?: {
    groupId?: string | null;
    startAt?: string;
    endAt?: string;
    overflowStartAt?: string;
    intervalMinutes?: number;
    sessionName?: string | null;
  }) => {
    const nextGroupId = options?.groupId ?? selectedGroupId;
    const nextStartAt = options?.startAt ?? startAt;
    const nextEndAt = options?.endAt ?? endAt;
    const nextOverflowStartAt = options?.overflowStartAt ?? overflowStartAt;
    const nextIntervalMinutes = options?.intervalMinutes ?? intervalMinutes;
    const nextSessionName = options?.sessionName ?? selectedAccount?.sessionName ?? null;

    if (!nextGroupId) {
      showProblemNotice("Selecione um grupo para adicionar.");
      return false;
    }

    if (!nextStartAt) {
      showProblemNotice("Defina a data e hora de início.");
      return false;
    }

    const startDate = new Date(nextStartAt);
    if (Number.isNaN(startDate.getTime()) || startDate.getTime() < Date.now()) {
      showProblemNotice("Escolha uma data e hora no futuro.");
      return false;
    }

    if (nextEndAt) {
      const endDate = new Date(nextEndAt);
      if (Number.isNaN(endDate.getTime()) || endDate.getTime() < startDate.getTime()) {
        showProblemNotice("A data final deve ser maior ou igual ao início.");
        return false;
      }
    }

    if (nextOverflowStartAt) {
      const overflowDate = new Date(nextOverflowStartAt);
      if (
        Number.isNaN(overflowDate.getTime()) ||
        overflowDate.getTime() < startDate.getTime()
      ) {
        showProblemNotice("O início dos próximos dias deve ser maior ou igual ao início.");
        return false;
      }
    }

    if (
      scheduledGroups.some(
        (group) =>
          group.groupId === nextGroupId &&
          (group.sessionName || null) === (nextSessionName || null)
      )
    ) {
      showProblemNotice("Este grupo já foi adicionado à lista.");
      return false;
    }

    if (
      scheduledGroups.some((group) => {
        const existingStart = new Date(group.startAt);
        return !Number.isNaN(existingStart.getTime()) && isSameMinute(existingStart, startDate);
      })
    ) {
      showProblemNotice("Este horário conflita com outro grupo agendado. Escolha outro horário.");
      return false;
    }

    const groupTimeValidationError = await validateGroupAgainstExistingBatches(
      nextGroupId,
      startDate
    );
    if (groupTimeValidationError) {
      showProblemNotice(groupTimeValidationError);
      return false;
    }

    if (hasBatchStartConflict(nextStartAt, batches, nextGroupId)) {
      const group = groups.find((g) => g.id === nextGroupId);
      showProblemNotice(
        `O horário inicial desse grupo já está sendo usado em outra lista (${group?.name || nextGroupId}).`
      );
      return false;
    }

    const selectedGroup = groups.find((group) => group.id === nextGroupId);
    const nextGroup: ScheduledGroup = {
      groupId: nextGroupId,
      groupName: selectedGroup?.name || nextGroupId,
      sessionName: nextSessionName,
      startAt: nextStartAt,
      endAt: nextEndAt || undefined,
      overflowStartAt: nextOverflowStartAt || undefined,
      intervalMinutes: nextIntervalMinutes,
    };

    setScheduledGroups((prev) => [...prev, nextGroup]);
    setSelectedGroupId(null);
    setStartAt("");
    setEndAt("");
    setOverflowStartAt("");
    setError(null);
    setScheduleResetNotice(null);
    return true;
  };

  const handleAddScheduledTelegramGroup = async (options?: {
    groupId?: string | null;
    startAt?: string;
    endAt?: string;
    overflowStartAt?: string;
    intervalMinutes?: number;
  }) => {
    const nextGroupId = options?.groupId ?? selectedTelegramGroupId;
    const nextStartAt = options?.startAt ?? startAt;
    const nextEndAt = options?.endAt ?? endAt;
    const nextOverflowStartAt = options?.overflowStartAt ?? overflowStartAt;
    const nextIntervalMinutes = options?.intervalMinutes ?? intervalMinutes;

    if (!nextGroupId) {
      showProblemNotice("Selecione um grupo do Telegram para adicionar.");
      return false;
    }

    if (!nextStartAt) {
      showProblemNotice("Defina a data e hora de início.");
      return false;
    }

    const startDate = new Date(nextStartAt);
    if (Number.isNaN(startDate.getTime()) || startDate.getTime() < Date.now()) {
      showProblemNotice("Escolha uma data e hora no futuro.");
      return false;
    }

    if (nextEndAt) {
      const endDate = new Date(nextEndAt);
      if (Number.isNaN(endDate.getTime()) || endDate.getTime() < startDate.getTime()) {
        showProblemNotice("A data final deve ser maior ou igual ao início.");
        return false;
      }
    }

    if (nextOverflowStartAt) {
      const overflowDate = new Date(nextOverflowStartAt);
      if (
        Number.isNaN(overflowDate.getTime()) ||
        overflowDate.getTime() < startDate.getTime()
      ) {
        showProblemNotice("O início dos próximos dias deve ser maior ou igual ao início.");
        return false;
      }
    }

    if (scheduledTelegramGroups.some((group) => group.groupId === nextGroupId)) {
      showProblemNotice("Este grupo do Telegram já foi adicionado à lista.");
      return false;
    }

    if (
      scheduledTelegramGroups.some((group) => {
        const existingStart = new Date(group.startAt);
        return !Number.isNaN(existingStart.getTime()) && isSameMinute(existingStart, startDate);
      })
    ) {
      showProblemNotice("Este horário conflita com outro grupo agendado. Escolha outro horário.");
      return false;
    }

    if (
      telegramBatches.some((batch) => {
        if (!batch.startAt) return false;
        if (isTelegramBatchCanceledOrSent(resolveTelegramBatchStatus(batch))) return false;
        if (batch.groupId !== nextGroupId) return false;
        const existing = new Date(batch.startAt);
        if (Number.isNaN(existing.getTime())) return false;
        return isSameMinute(existing, startDate);
      })
    ) {
      const group = telegramGroups.find((entry) => entry.groupId === nextGroupId);
      showProblemNotice(
        `O horário inicial desse grupo do Telegram já está sendo usado em outra lista (${group?.groupName || nextGroupId}).`
      );
      return false;
    }

    const selectedGroup = telegramGroups.find((group) => group.groupId === nextGroupId);
    const nextGroup: ScheduledTelegramGroup = {
      groupId: nextGroupId,
      groupName: selectedGroup?.groupName || nextGroupId,
      startAt: nextStartAt,
      endAt: nextEndAt || undefined,
      overflowStartAt: nextOverflowStartAt || undefined,
      intervalMinutes: nextIntervalMinutes,
    };

    setScheduledTelegramGroups((prev) => [...prev, nextGroup]);
    setSelectedTelegramGroupId(null);
    setStartAt("");
    setEndAt("");
    setOverflowStartAt("");
    setError(null);
    setScheduleResetNotice(null);
    return true;
  };

  const removeScheduledGroup = (index: number) => {
    setScheduledGroups((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeScheduledTelegramGroup = (index: number) => {
    setScheduledTelegramGroups((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSelectDraft = async (draft: PromoterListDraft) => {
    if (!draft.documentId) return;
    setError(null);
    setSuccessMessage(null);
    router.push(`/master/promoter/lists/${draft.documentId}`);
  };

  const handleCreateNewDraft = async () => {
    router.push("/master/promoter/lists/new");
  };

  const handleDeleteDraft = async (documentId: string) => {
    const confirmed = window.confirm("Deseja excluir este rascunho?");
    if (!confirmed) return;

    try {
      await deletePromoterListDraft(documentId);
      const remaining = savedDrafts.filter((draft) => draft.documentId !== documentId);
      setSavedDrafts(remaining);

      if (remaining.length === 0) {
        setActiveDraftDocumentId("");
        applyDraft(null);
        router.replace("/master/promoter/lists");
      } else {
        if (activeDraftDocumentId === documentId) {
          setActiveDraftDocumentId("");
          applyDraft(null);
          router.replace("/master/promoter/lists");
        } else {
          setActiveDraftSnapshot((prev) =>
            prev?.documentId === activeDraftDocumentId ? prev : null
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir rascunho.");
    }
  };

  const refreshActiveDraftFromServer = useCallback(async (documentId = activeDraftDocumentId) => {
    if (!documentId) return null;

    const draft = await fetchPromoterListDraft(documentId);
    if (!draft) return null;

    setSavedDrafts((prev) => {
      const exists = prev.some((entry) => entry.documentId === documentId);
      const next = exists
        ? prev.map((entry) =>
            entry.documentId === documentId
              ? toDraftListEntry({ ...entry, ...draft, documentId })
              : entry
          )
        : [toDraftListEntry({ ...draft, documentId }), ...prev];

      return sortDraftEntries(next);
    });

    if (documentId === activeDraftDocumentId) {
      setActiveDraftSnapshot(draft);
      applyDraft(draft);
    }

    return draft;
  }, [activeDraftDocumentId]);

  const persistAutomationConfig = async () => {
    if (!activeDraftDocumentId) {
      throw new Error("Nenhum rascunho ativo para configurar.");
    }

    setIsSavingAutomation(true);
    try {
      const updated = await updatePromoterListAutomationConfig(activeDraftDocumentId, {
        listMode,
        itemSourceMode,
        intervalMinutes,
        windowStartTime: automationWindowStartTime,
        windowEndTime: automationWindowEndTime,
        allowExtraCredits,
        autoSourceConfig:
          itemSourceMode === "shopee_catalog"
            ? {
                keyword: shopeeQuery || null,
                sortType: shopeeSortType,
                isAMSOffer: shopeeIsAMSOffer,
                batchSize: 10,
              }
            : null,
        metadata:
          itemSourceMode === "shopee_catalog"
            ? {
                shopeeQuery,
                shopeeSortType,
                shopeeIsAMSOffer,
                shopeePreset,
              }
            : undefined,
      });
      if (updated) {
        setActiveDraftSnapshot(updated);
        applyDraft(updated);
        setSavedDrafts((prev) =>
          prev.map((draft) =>
            draft.documentId === activeDraftDocumentId
              ? toDraftListEntry({
                  ...draft,
                  ...updated,
                  documentId: activeDraftDocumentId,
                })
              : draft
          )
        );
      }
      return updated;
    } finally {
      setIsSavingAutomation(false);
    }
  };

  const persistAutomationTargets = async () => {
    if (!activeDraftDocumentId) {
      throw new Error("Nenhum rascunho ativo para configurar.");
    }

    const status = await updatePromoterListAutomationTargets(
      activeDraftDocumentId,
      automationDraftTargets
    );
    applyAutomationStatus(status);
    return status;
  };

  const executeAutomationAction = async (
    action: () => Promise<PromoterAutomationStatusResponse | null>,
    successText: string
  ) => {
    setIsAutomationActionLoading(true);
    try {
      const status = await action();
      applyAutomationStatus(status);
      await refreshActiveDraftFromServer();
      if (activeDraftDocumentId) {
        await refreshAutomationStatus(activeDraftDocumentId, { silent: true });
      }
      await loadQuotaSummary();
      setSuccessMessage(successText);
      return status;
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao executar a automação."
      );
      return null;
    } finally {
      setIsAutomationActionLoading(false);
    }
  };

  const handleActivateAutomation = async () => {
    if (!activeDraftDocumentId) {
      showProblemNotice("Nenhum rascunho ativo para ativar.");
      return;
    }

    try {
      await persistAutomationConfig();
      await persistAutomationTargets();
      await executeAutomationAction(
        () => activatePromoterListAutomation(activeDraftDocumentId),
        "Automação ativada com sucesso."
      );
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao ativar a automação."
      );
    }
  };

  const handlePauseAutomation = async () => {
    if (!activeDraftDocumentId) return;
    await executeAutomationAction(
      () => pausePromoterListAutomation(activeDraftDocumentId),
      "Automação pausada."
    );
  };

  const handleResumeAutomation = async () => {
    if (!activeDraftDocumentId) return;

    try {
      await persistAutomationConfig();
      await persistAutomationTargets();
      await executeAutomationAction(
        () => resumePromoterListAutomation(activeDraftDocumentId),
        "Automação retomada."
      );
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao retomar a automação."
      );
    }
  };

  const handleRestartAutomationQueue = async () => {
    if (!activeDraftDocumentId) return;
    setIsResettingAutomation(true);
    try {
      const status = await restartPromoterListAutomationQueue(activeDraftDocumentId);
      applyAutomationStatus(status);
      setSuccessMessage("Fila reiniciada com sucesso.");
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao reiniciar a fila."
      );
    } finally {
      setIsResettingAutomation(false);
    }
  };

  const handleResetAutomationSource = async () => {
    if (!activeDraftDocumentId) return;
    setIsResettingSource(true);
    try {
      const status = await resetPromoterListAutomationSource(activeDraftDocumentId);
      applyAutomationStatus(status);
      setSuccessMessage("Catálogo redefinido com sucesso.");
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao redefinir o catálogo."
      );
    } finally {
      setIsResettingSource(false);
    }
  };

  const formatDraftSavedAt = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortDraftEntries = (drafts: PromoterListDraft[]) =>
    [...drafts].sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt || "";
      const bDate = b.updatedAt || b.createdAt || "";
      return bDate.localeCompare(aDate);
    });

  const toDraftListEntry = (draft: PromoterListDraft): PromoterListDraft => ({
    id: draft.id,
    documentId: draft.documentId,
    title: draft.title,
    listStatus: draft.listStatus,
    sourceTab: draft.sourceTab,
    listMode: draft.listMode,
    itemSourceMode: draft.itemSourceMode,
    autoSourceConfig: draft.autoSourceConfig ?? null,
    automationHasStarted: draft.automationHasStarted,
    automationEnabled: draft.automationEnabled,
    sessionName: draft.sessionName ?? null,
    groupId: draft.groupId ?? null,
    intervalMinutes: draft.intervalMinutes,
    windowStartTime: draft.windowStartTime ?? null,
    windowEndTime: draft.windowEndTime ?? null,
    allowExtraCredits: draft.allowExtraCredits,
    queueStrategy: draft.queueStrategy ?? null,
    itemsCount: draft.itemsCount ?? draft.items?.length ?? 0,
    automationTargets: Array.isArray(draft.automationTargets)
      ? draft.automationTargets
      : [],
    automationSummary: draft.automationSummary ?? null,
    autoSourceSummary: draft.autoSourceSummary ?? null,
    createdAt: draft.createdAt ?? null,
    updatedAt: draft.updatedAt ?? null,
  });

  const getDraftTargets = (draft: PromoterListDraft): PromoterAutomationTarget[] =>
    Array.isArray(draft.automationTargets) ? draft.automationTargets : [];

  const isDraftTargetCompleted = (target: PromoterAutomationTarget) =>
    target.progress?.completed === true;

  const resolveDraftStatus = (draft: PromoterListDraft) => {
    const isAutomatic =
      draft.listMode === "automatic_window" || draft.automationHasStarted === true;
    const targets = getDraftTargets(draft);
    const hasTargets = targets.length > 0;
    const hasActiveTargets = targets.some((target) => target.automationState === "active");
    const hasPausedTargets = targets.some((target) =>
      AUTOMATION_TARGET_PAUSED_STATES.includes(
        target.automationState as (typeof AUTOMATION_TARGET_PAUSED_STATES)[number]
      )
    );
    const hasErrorTargets = targets.some((target) => target.automationState === "error");
    const hasCompletedTargets = targets.some(isDraftTargetCompleted);
    const allCompleted = hasTargets && targets.every(isDraftTargetCompleted);

    if (!isAutomatic) {
      return { label: "Rascunho", className: "bg-slate-500 text-white" };
    }

    if (draft.automationEnabled && hasActiveTargets) {
      return { label: "Ativa", className: "bg-emerald-600 text-white" };
    }

    if (allCompleted) {
      return { label: "Enviada", className: "bg-sky-600 text-white" };
    }

    if (
      draft.automationHasStarted &&
      (hasPausedTargets || hasErrorTargets || hasCompletedTargets || hasTargets || draft.automationEnabled)
    ) {
      return { label: "Pausada", className: "bg-amber-500 text-white" };
    }

    return { label: "Rascunho", className: "bg-slate-500 text-white" };
  };

  const buildAutomationTargetKey = useCallback((target: {
    channel: "whatsapp" | "telegram";
    accountKey?: string | null;
    targetId: string;
  }) => `${target.channel}:${target.accountKey || ""}:${target.targetId}`, []);

  const toAutomationTargetInput = useCallback(
    (
      target:
        | PromoterAutomationTargetInput
        | Pick<PromoterAutomationTarget, "channel" | "accountKey" | "targetId" | "targetName">
    ): PromoterAutomationTargetInput => ({
      channel: target.channel,
      accountKey: target.accountKey || null,
      targetId: target.targetId,
      targetName: target.targetName || target.targetId,
    }),
    []
  );

  const buildDraftAutomationTarget = useCallback((
    target: PromoterAutomationTargetInput,
    current?: PromoterAutomationTarget | null
  ): PromoterAutomationTarget => ({
    documentId: current?.documentId || buildAutomationTargetKey(target),
    channel: target.channel,
    accountKey: target.accountKey || null,
    targetId: target.targetId,
    targetName: target.targetName || target.targetId,
    automationState: current?.automationState || "inactive",
    nextDispatchAt: current?.nextDispatchAt || null,
    lastDispatchedAt: current?.lastDispatchedAt || null,
    lastProcessedItemId: current?.lastProcessedItemId || null,
    lastErrorCode: current?.lastErrorCode || null,
    lastErrorMessage: current?.lastErrorMessage || null,
    consecutiveFailures: current?.consecutiveFailures || 0,
    metadata: current?.metadata || null,
    progress: current?.progress || null,
  }), [buildAutomationTargetKey]);

  const syncAutomationDraftTargets = useCallback((nextTargets: PromoterAutomationTargetInput[]) => {
    const deduped = nextTargets.reduce<PromoterAutomationTargetInput[]>((acc, target) => {
      const key = buildAutomationTargetKey(target);
      if (acc.some((entry) => buildAutomationTargetKey(entry) === key)) {
        return acc;
      }
      return [...acc, target];
    }, []);

    setAutomationDraftTargets(deduped);
    setAutomationTargets((prev) =>
      deduped.map((target) => {
        const current =
          prev.find((entry) => buildAutomationTargetKey(entry) === buildAutomationTargetKey(target)) ||
          null;
        return buildDraftAutomationTarget(target, current);
      })
    );
  }, [buildAutomationTargetKey, buildDraftAutomationTarget]);

  const getEditableAutomationTargets = useCallback(
    () =>
      automationDraftTargets.length > 0
        ? automationDraftTargets.map(toAutomationTargetInput)
        : automationTargets.map(toAutomationTargetInput),
    [automationDraftTargets, automationTargets, toAutomationTargetInput]
  );

  const syncAutomationTargetsWithPersistence = useCallback(
    async (nextTargets: PromoterAutomationTargetInput[]) => {
      const previousDraftTargets = automationDraftTargets.map(toAutomationTargetInput);
      const previousTargets = [...automationTargets];

      syncAutomationDraftTargets(nextTargets);

      if (!activeDraftDocumentId) {
        return true;
      }

      try {
        const status = await updatePromoterListAutomationTargets(
          activeDraftDocumentId,
          nextTargets
        );
        applyAutomationStatus(status);
        await refreshActiveDraftFromServer(activeDraftDocumentId);
        return true;
      } catch (err) {
        setAutomationDraftTargets(previousDraftTargets);
        setAutomationTargets(previousTargets);
        showProblemNotice(
          err instanceof Error
            ? err.message
            : "Não foi possível atualizar os destinos automáticos."
        );
        return false;
      }
    },
    [
      activeDraftDocumentId,
      applyAutomationStatus,
      automationDraftTargets,
      automationTargets,
      refreshActiveDraftFromServer,
      syncAutomationDraftTargets,
      toAutomationTargetInput,
    ]
  );

  const formatAutomationState = (state?: string | null) => {
    switch (state) {
      case "active":
        return { label: "Ativo", className: "bg-emerald-600 text-white" };
      case "paused_credit_approval":
        return { label: "Pausado por crédito", className: "bg-amber-500 text-white" };
      case "paused_insufficient_credits":
        return { label: "Sem créditos", className: "bg-amber-500 text-white" };
      case "paused_channel_unavailable":
        return { label: "Canal indisponível", className: "bg-amber-500 text-white" };
      case "paused_manual":
        return { label: "Pausado manualmente", className: "bg-amber-500 text-white" };
      case "error":
        return { label: "Erro", className: "bg-rose-600 text-white" };
      default:
        return { label: "Configurado", className: "bg-slate-500 text-white" };
    }
  };

  const formatWindowTime = (value?: string | null) => {
    if (!value) return "";
    return value.slice(0, 5);
  };

  const parseWindowTimeToMinutes = (value?: string | null) => {
    if (!value) return null;
    const [rawHours, rawMinutes] = value.split(":");
    const hours = Number.parseInt(rawHours ?? "", 10);
    const minutes = Number.parseInt(rawMinutes ?? "", 10);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };

  const automationDispatchesPerTarget = useMemo(() => {
    if (!isAutomaticList) return 0;
    const startMinutes = parseWindowTimeToMinutes(automationWindowStartTime);
    const endMinutes = parseWindowTimeToMinutes(automationWindowEndTime);
    if (startMinutes === null || endMinutes === null || endMinutes < startMinutes) {
      return 0;
    }
    const interval = Math.max(1, intervalMinutes || 1);
    return Math.floor((endMinutes - startMinutes) / interval) + 1;
  }, [automationWindowEndTime, automationWindowStartTime, intervalMinutes, isAutomaticList]);

  const effectiveAutomationTargetsCount =
    automationDraftTargets.length > 0
      ? automationDraftTargets.length
      : automationTargets.length;

  const automationDailyEstimate = useMemo(
    () => automationDispatchesPerTarget * effectiveAutomationTargetsCount,
    [automationDispatchesPerTarget, effectiveAutomationTargetsCount]
  );

  const remainingIncludedSends = useMemo(() => {
    if (!quotaSummary) return 0;
    return Math.max(0, quotaSummary.dailyLimit - quotaSummary.usedToday);
  }, [quotaSummary]);

  const totalSupportedSends = useMemo(
    () => remainingIncludedSends + (quotaSummary?.creditsAvailable || 0),
    [quotaSummary?.creditsAvailable, remainingIncludedSends]
  );

  const shouldWarnQuotaShortage =
    isAutomaticList &&
    !allowExtraCredits &&
    effectiveAutomationTargetsCount > 0 &&
    automationDailyEstimate > remainingIncludedSends;

  const addAutomaticWhatsAppTarget = async () => {
    if (!selectedAccount?.sessionName) {
      showProblemNotice("Selecione a conta do WhatsApp para adicionar o destino.");
      return false;
    }
    if (!selectedGroupId) {
      showProblemNotice("Selecione um grupo do WhatsApp para adicionar o destino.");
      return false;
    }

    const group = groups.find((entry) => entry.id === selectedGroupId);
    const candidate: PromoterAutomationTargetInput = {
      channel: "whatsapp",
      accountKey: selectedAccount.sessionName,
      targetId: selectedGroupId,
      targetName: group?.name || selectedGroupId,
    };
    const editableTargets = getEditableAutomationTargets();
    const alreadyExists = editableTargets.some(
      (target) => buildAutomationTargetKey(target) === buildAutomationTargetKey(candidate)
    );
    if (alreadyExists) {
      showProblemNotice("Este destino já foi adicionado.");
      return false;
    }
    const success = await syncAutomationTargetsWithPersistence([
      ...editableTargets,
      candidate,
    ]);
    if (!success) {
      return false;
    }
    setSelectedGroupId(null);
    return true;
  };

  const addAutomaticTelegramTarget = async () => {
    if (!selectedTelegramGroupId) {
      showProblemNotice("Selecione um grupo do Telegram para adicionar o destino.");
      return false;
    }

    const group = telegramGroups.find((entry) => entry.groupId === selectedTelegramGroupId);
    const candidate: PromoterAutomationTargetInput = {
      channel: "telegram",
      targetId: selectedTelegramGroupId,
      targetName: group?.groupName || selectedTelegramGroupId,
    };
    const editableTargets = getEditableAutomationTargets();
    const alreadyExists = editableTargets.some(
      (target) => buildAutomationTargetKey(target) === buildAutomationTargetKey(candidate)
    );
    if (alreadyExists) {
      showProblemNotice("Este destino já foi adicionado.");
      return false;
    }
    const success = await syncAutomationTargetsWithPersistence([
      ...editableTargets,
      candidate,
    ]);
    if (!success) {
      return false;
    }
    setSelectedTelegramGroupId(null);
    return true;
  };

  const removeAutomationTarget = async (targetKey: string) => {
    const editableTargets = getEditableAutomationTargets();
    await syncAutomationTargetsWithPersistence(
      editableTargets.filter(
        (target) => buildAutomationTargetKey(target) !== targetKey
      )
    );
  };

  const currentAutomationTargets = useMemo(() => {
    if (automationDraftTargets.length > 0) {
      const currentByKey = new Map(
        automationTargets.map((target) => [buildAutomationTargetKey(target), target])
      );
      return automationDraftTargets.map((target) =>
        buildDraftAutomationTarget(target, currentByKey.get(buildAutomationTargetKey(target)) || null)
      );
    }
    return automationTargets;
  }, [
    automationDraftTargets,
    automationTargets,
    buildAutomationTargetKey,
    buildDraftAutomationTarget,
  ]);

  const handleCreateList = async () => {
    if (items.length === 0 || (scheduledGroups.length === 0 && scheduledTelegramGroups.length === 0)) {
      showProblemNotice("Adicione ao menos um grupo agendado e pelo menos um item na lista.");
      return;
    }

    if (!title.trim()) {
      showProblemNotice("Informe o título da lista.");
      return;
    }

    setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      setScheduleResetNotice(null);
    try {
      const latestBatchesResponse = await fetchWhatsappBatches({
        page: 1,
        pageSize: 200,
      });
      const latestTelegramBatchesResponse = await fetchTelegramBatches({
        page: 1,
        pageSize: 200,
      });
      const latestBatches = latestBatchesResponse.items || [];
      const latestTelegramBatches = latestTelegramBatchesResponse.items || [];
      setBatches(latestBatches);
      setTelegramBatches(latestTelegramBatches);

      for (const group of scheduledGroups) {
        if (!group.sessionName) {
          throw new Error(
            `Selecione a conta do WhatsApp para o grupo "${group.groupName}".`
          );
        }
        if (hasBatchStartConflict(group.startAt, latestBatches)) {
          throw new Error(
            `O horário de início do grupo WhatsApp "${group.groupName}" já está sendo usado por outra lista. Escolha outro horário de início.`
          );
        }

        const canProceed = await confirmCreditsBeforeListSend(
          "WhatsApp",
          group.groupName,
          items.length
        );
        if (!canProceed) {
          throw new Error("Envio interrompido por limite/créditos.");
        }

        await scheduleWhatsappList({
          title: title.trim() || undefined,
          groupId: group.groupId,
          groupName: group.groupName,
          sessionName: group.sessionName,
          intervalMinutes: group.intervalMinutes || intervalMinutes || undefined,
          startAt: group.startAt || undefined,
          endAt: group.endAt || undefined,
          overflowStartAt: group.overflowStartAt || undefined,
          items: items.map((item) => ({
            link: item.link,
            message: appendPromoterCouponToMessage(
              item.message,
              getEffectiveCoupon(item)
            ),
            payload: buildScheduledItemPayload(item),
          })),
        });
      }

      for (const group of scheduledTelegramGroups) {
        if (
          latestTelegramBatches.some((batch) => {
            if (batch.groupId !== group.groupId || !batch.startAt) return false;
            if (isTelegramBatchCanceledOrSent(resolveTelegramBatchStatus(batch))) {
              return false;
            }
            const existing = new Date(batch.startAt);
            if (Number.isNaN(existing.getTime())) return false;
            return isSameMinute(existing, new Date(group.startAt));
          })
        ) {
          throw new Error(
            `O horário de início do grupo Telegram "${group.groupName}" já está sendo usado por outra lista. Escolha outro horário de início.`
          );
        }

        const canProceed = await confirmCreditsBeforeListSend(
          "Telegram",
          group.groupName,
          items.length
        );
        if (!canProceed) {
          throw new Error("Envio interrompido por limite/créditos.");
        }

        await scheduleTelegramList({
          title: title.trim() || undefined,
          groupId: group.groupId,
          groupName: group.groupName,
          intervalMinutes: group.intervalMinutes || intervalMinutes || undefined,
          startAt: group.startAt || undefined,
          endAt: group.endAt || undefined,
          overflowStartAt: group.overflowStartAt || undefined,
          items: items.map((item) => ({
            link: item.link,
            message: appendPromoterCouponToMessage(
              item.message,
              getEffectiveCoupon(item)
            ),
            payload: buildScheduledItemPayload(item),
          })),
        });
      }
      setItems([]);
      setSelectedItemIndex(null);
      setScheduledGroups([]);
      setScheduledTelegramGroups([]);
      setTitle("");
      setIntervalMinutes(5);
      setStartAt("");
      setEndAt("");
      setOverflowStartAt("");
      setListCoupon("");
      setCustomLinksInput("");
      setSingleLinkInput("");
      setSingleLinkCoupon("");
      setShopeeSelectedIds([]);
      await loadQuotaSummary();
      if (activeDraftDocumentId) {
        await deletePromoterListDraft(activeDraftDocumentId);
      }
      const refreshedDrafts = await fetchPromoterListDrafts({ summary: true });
      const sorted = sortDraftEntries(refreshedDrafts.map(toDraftListEntry));
      setSavedDrafts(sorted);
      setActiveDraftDocumentId("");
      setActiveDraftSnapshot(null);
      router.replace("/master/promoter/lists");
      await load();
      await loadTelegramBatches();
      setSuccessMessage("Lista criada e agendada com sucesso.");
      setNoticeDialog({
        open: true,
        title: "Lista criada",
        description: "Lista criada e agendada com sucesso.",
      });
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Erro ao criar lista automática."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmManualScheduleDialog = async () => {
    try {
      const values = buildScheduleValuesFromFields();

      if (scheduleDialogChannel === "whatsapp") {
        const added = await handleAddScheduledGroup({
          ...values,
          groupId: selectedWhatsAppGroupValue || null,
          intervalMinutes,
          sessionName: selectedAccount?.sessionName ?? null,
        });

        if (added) {
          closeManualScheduleDialog();
        }
        return;
      }

      if (scheduleDialogChannel === "telegram") {
        const added = await handleAddScheduledTelegramGroup({
          ...values,
          groupId: selectedTelegramGroupValue || null,
          intervalMinutes,
        });

        if (added) {
          closeManualScheduleDialog();
        }
      }
    } catch (err) {
      showProblemNotice(
        err instanceof Error ? err.message : "Não foi possível adicionar o grupo."
      );
    }
  };

  const handleConfirmAutomationTargetDialog = async () => {
    if (automationTargetDialogChannel === "whatsapp") {
      const added = await addAutomaticWhatsAppTarget();
      if (added) {
        closeAutomationTargetDialog();
      }
      return;
    }

    if (automationTargetDialogChannel === "telegram") {
      const added = await addAutomaticTelegramTarget();
      if (added) {
        closeAutomationTargetDialog();
      }
    }
  };

  const handleBackToSavedLists = () => {
    setActiveDraftDocumentId("");
    setActiveDraftSnapshot(null);
    applyDraft(null);
    router.push("/master/promoter/lists");
  };

  return (
    <div className="space-y-6 rounded-xl bg-slate-50 p-4 md:p-6 text-slate-900" style={LIGHT_THEME_VARS}>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBackToSavedLists}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Lista de disparos</CardTitle>
              </div>
            </div>
            <Button
              onClick={() => {
                void load();
                void loadTelegramBatches();
                void loadQuotaSummary();
                if (isAutomaticList && activeDraftDocumentId) {
                  void refreshAutomationStatus(activeDraftDocumentId);
                }
              }}
              variant="outline"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      <ExtensionInstallBanner />

      {shouldBlockEditorLoading ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <div>
                <div className="text-base font-semibold text-slate-900">
                  Carregando lista
                </div>
                <div className="text-sm text-slate-600">
                  Aguarde enquanto as informações da lista são carregadas.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {error && (
        <Alert className="border-red-300 bg-red-50 text-red-800">
          <AlertDescription className="whitespace-pre-line break-words">{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-800">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {scheduleResetNotice && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-800">
          <AlertDescription>{scheduleResetNotice}</AlertDescription>
        </Alert>
      )}
      {isAdding && addingStatus && !processingOverlay.open && (
        <Alert className="border-sky-300 bg-sky-50 text-sky-800">
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {addingStatus}
          </AlertDescription>
        </Alert>
      )}

      {isAdding && processingOverlay.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-base font-semibold text-slate-900">{processingOverlay.title}</div>
              <div className="text-xs text-slate-600">
                {processingOverlay.processed}/{processingOverlay.total}
              </div>
            </div>

            <div className="text-sm text-slate-600">{processingOverlay.description}</div>

            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{
                  width: `${
                    processingOverlay.total > 0
                      ? (processingOverlay.processed / processingOverlay.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-center">
                <div className="text-slate-500">Adicionados</div>
                <div className="text-emerald-700 font-semibold">{processingOverlay.added}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-center">
                <div className="text-slate-500">Falharam</div>
                <div className="text-rose-700 font-semibold">{processingOverlay.failed}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-center">
                <div className="text-slate-500">Restantes</div>
                <div className="text-slate-900 font-semibold">
                  {Math.max(0, processingOverlay.total - processingOverlay.processed)}
                </div>
              </div>
            </div>

            {processingOverlay.currentProduct ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-2">Último produto processado</div>
                <div className="flex items-start gap-3">
                  {processingOverlay.currentProduct.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={processingOverlay.currentProduct.imageUrl}
                      alt={processingOverlay.currentProduct.title || "Produto"}
                      className="w-12 h-12 rounded-md object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                      IMG
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {processingOverlay.currentProduct.title || "Produto sem título"}
                    </div>
                    {processingOverlay.currentProduct.price ? (
                      <div className="text-xs text-emerald-700 mt-0.5 truncate">
                        {processingOverlay.currentProduct.price}
                      </div>
                    ) : null}
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      {processingOverlay.currentProduct.link}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Buscando informações dos produtos...</div>
            )}

            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {processingOverlay.status || addingStatus || "Processando..."}
            </div>

            {processingOverlay.allowCancel ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={handleCancelCsvImport}
                  disabled={processingOverlay.isCancelling}
                >
                  {processingOverlay.isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    "Cancelar"
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {pageView === "editor" ? (
        <div className="xl:col-span-7 space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <ListPlus className="w-4 h-4 text-indigo-600" />
                  Nome da lista
                </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome da lista (opcional)"
                disabled={isAutomaticConfigLocked}
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Send className="w-4 h-4 text-emerald-600" />
                  Modo da lista
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Button
                  type="button"
                  variant={listMode === "manual" ? "default" : "outline"}
                  className={listMode === "manual" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
                  disabled={!canSwitchBackToManual || isAutomaticConfigLocked}
                  onClick={() => {
                    if (!canSwitchBackToManual) return;
                    setListMode("manual");
                    setItemSourceMode("manual_queue");
                  }}
                >
                    Agendado (padrão)
                </Button>
                <Button
                  type="button"
                  variant={listMode === "automatic_window" ? "default" : "outline"}
                  className={
                    listMode === "automatic_window"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }
                  disabled={isAutomaticConfigLocked}
                  onClick={() => setListMode("automatic_window")}
                >
                    Recorrente (diário)
                </Button>
              </div>

              {!canSwitchBackToManual && (
                <Alert className="border-amber-300 bg-amber-50 text-amber-800">
                  <AlertDescription>
                    Esta lista já iniciou automação. Por regra de consistência, ela não pode voltar para o modo manual.
                  </AlertDescription>
                </Alert>
              )}

              {isAutomaticList ? (
                <div className="space-y-4 rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-900">
                      Origem dos produtos
                    </div>
                    <div className="text-xs text-slate-600">
                      Escolha seus próprios links ou deixe que o MA faça isso por você!
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Button
                        type="button"
                        variant={itemSourceMode === "manual_queue" ? "default" : "outline"}
                        className={
                          itemSourceMode === "manual_queue"
                            ? "bg-slate-900 hover:bg-slate-800 text-white"
                            : ""
                        }
                        disabled={isAutomaticConfigLocked}
                        onClick={() => setItemSourceMode("manual_queue")}
                      >
                        Modo Manual
                      </Button>
                      <Button
                        type="button"
                        variant={itemSourceMode === "shopee_catalog" ? "default" : "outline"}
                        className={
                          itemSourceMode === "shopee_catalog"
                            ? "bg-[#EE4D2D] hover:bg-[#d94325] text-white"
                            : ""
                        }
                        disabled={isAutomaticConfigLocked}
                        onClick={() => {
                          setItemSourceMode("shopee_catalog");
                          setSourceTab("shopee");
                        }}
                      >
                        Modo Master
                      </Button>
                    </div>
                    <div
                      className={
                        itemSourceMode === "shopee_catalog"
                          ? "rounded-md border border-[#EE4D2D]/30 bg-[#EE4D2D]/10 p-3 text-xs text-slate-800"
                          : "rounded-md border border-blue-300/40 bg-blue-50 p-3 text-xs text-slate-800"
                      }
                    >
                      {itemSourceMode === "shopee_catalog"
                        ? "O MA vai buscar as melhores ofertas para você na Shopee."
                        : "Você continua adicionando produtos manualmente com links, Shopee ou CSV."}
                    </div>
                    {isAutomaticConfigLocked ? (
                      <div className="text-xs text-slate-600">
                        Lista automática ativa. Para alterar produtos, cupom, destinos ou horários, pause a automação.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-[#7d570e]" />
                Origem dos produtos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAutomaticShopee ? (
                <div className="space-y-4">
                  <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                      <div className="text-sm font-medium">Filtros rápidos:</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={shopeePreset === "top_sales" ? "default" : "outline"}
                        size="sm"
                        disabled={isAutomaticConfigLocked}
                        onClick={() => applyShopeePreset("top_sales")}
                        className={shopeePreset === "top_sales" ? "text-white" : ""}
                        style={
                          shopeePreset === "top_sales"
                            ? { backgroundColor: SHOPEE_ACCENT }
                            : undefined
                        }
                      >
                        Mais vendidos
                      </Button>
                      <Button
                        type="button"
                        variant={shopeePreset === "high_commission" ? "default" : "outline"}
                        size="sm"
                        disabled={isAutomaticConfigLocked}
                        onClick={() => applyShopeePreset("high_commission")}
                        className={shopeePreset === "high_commission" ? "text-white" : ""}
                        style={
                          shopeePreset === "high_commission"
                            ? { backgroundColor: SHOPEE_ACCENT }
                            : undefined
                        }
                      >
                        Maior comissão
                      </Button>
                      <Button
                        type="button"
                        variant={shopeePreset === "ams_only" ? "default" : "outline"}
                        size="sm"
                        disabled={isAutomaticConfigLocked}
                        onClick={() => applyShopeePreset("ams_only")}
                        className={shopeePreset === "ams_only" ? "text-white" : ""}
                        style={
                          shopeePreset === "ams_only"
                            ? { backgroundColor: SHOPEE_ACCENT }
                            : undefined
                        }
                      >
                        Comissão extra
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isAutomaticConfigLocked}
                        onClick={clearShopeeFilters}
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,auto]">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Palavra-chave da Shopee (opcional)</div>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                          value={shopeeQuery}
                          onChange={(e) => setShopeeQuery(e.target.value)}
                          placeholder="Ex.: fone bluetooth"
                          className="pl-9"
                          disabled={isAutomaticConfigLocked}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:min-w-[190px]">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isResettingSource || !automationHasStarted}
                        onClick={() => void handleResetAutomationSource()}
                      >
                        {isResettingSource ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redefinindo...
                          </>
                        ) : (
                          "Redefinir catálogo"
                        )}
                      </Button>
                    </div>
                  </div>

                  <Alert className="border-sky-200 bg-sky-50 text-sky-900">
                    <AlertDescription>
                      O MA vai buscar as melhores ofertas para você na Shopee.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
              <Tabs
                value={sourceTab}
                onValueChange={(value) => {
                  if (isAutomaticConfigLocked) return;
                  setSourceTab(value as SourceTab);
                }}
              >
                <TabsList className="grid grid-cols-2 w-full h-auto gap-2 p-0 bg-transparent">
                  <TabsTrigger
                    value="custom"
                    disabled={isAutomaticConfigLocked}
                    className="h-11 rounded-md border border-slate-300 bg-slate-100 text-slate-700 font-semibold transition-colors hover:bg-slate-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:!text-white data-[state=active]:border-indigo-600 data-[state=active]:shadow-md"
                  >
                    <span className="inline-flex items-center gap-2 text-inherit">
                      <Link2 className="w-4 h-4" />
                      Links Personalizados
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="shopee"
                    disabled={isAutomaticConfigLocked}
                    className="h-11 rounded-md border border-slate-300 bg-slate-100 text-slate-700 font-semibold transition-colors hover:bg-slate-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:!text-white data-[state=active]:border-indigo-600 data-[state=active]:shadow-md"
                  >
                    <span className="inline-flex items-center gap-2 text-inherit">
                      <ShoppingBag className="w-4 h-4" />
                      Carregar da Shopee
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="custom" className="space-y-3 mt-4">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Adicionar por link ou payload da extensão
                  </label>
                  <div className="space-y-2">
                    <Input
                      value={singleLinkInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSingleLinkInput(value);
                        if (value.trim().startsWith("{")) {
                          const handled = addExtensionPayloadToList(value, () =>
                            setSingleLinkInput("")
                          );
                          if (handled) {
                            setSingleLinkCoupon("");
                          }
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (addExtensionPayloadToList(pasted, () => setSingleLinkInput(""))) {
                          setSingleLinkCoupon("");
                          e.preventDefault();
                        }
                      }}
                      placeholder="https://shopee.com.br/... https://amazon.com.br/..."
                      disabled={isAutomaticConfigLocked}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleAddSingleLink();
                        }
                      }}
                    />
                    <PromoterCouponField
                      value={singleLinkCoupon}
                      onChange={setSingleLinkCoupon}
                      label="Cupom deste link"
                      description="Se preencher aqui, o cupom vale só para este produto."
                      placeholder="Ex.: DESCONTO10"
                      disabled={isAutomaticConfigLocked}
                    />
                    <Button
                      onClick={() => void handleAddSingleLink()}
                      disabled={!singleLinkInput.trim() || isAdding || isAutomaticConfigLocked}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Adicionar link"
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Ou cole vários links abaixo (um por linha):</div>
                  <Textarea
                    value={customLinksInput}
                    onChange={(e) => setCustomLinksInput(e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      if (addExtensionPayloadToList(pasted, () => setCustomLinksInput(""))) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="https://shopee.com.br/...https://amazon.com.br/..."
                    className="min-h-32"
                    disabled={isAutomaticConfigLocked}
                  />
                  <Button
                    onClick={() => void handleAddCustomLinks()}
                    disabled={!customLinksInput.trim() || isAdding || isAutomaticConfigLocked}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando links...
                      </>
                    ) : (
                      "Adicionar links à fila"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="shopee" className="space-y-3 mt-4">
                  <div className="space-y-3 rounded-md border border-sky-200 bg-sky-50 p-3">
                    <input
                      ref={csvFileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={handleCsvFileChange}
                    />
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <Upload className="h-4 w-4 text-sky-700" />
                          Importar CSV da Shopee
                        </div>
                        <p className="text-xs text-slate-600">
                          Envie o CSV exportado da Shopee para adicionar produtos diretamente
                          na lista. O arquivo deve conter a coluna <strong>Offer Link</strong> ou{" "}
                          <strong>Product Link</strong>.
                        </p>
                        <p className="text-xs text-slate-500">
                          Colunas opcionais aproveitadas como fallback:{" "}
                          <span className="font-medium">Product Name</span>,{" "}
                          <span className="font-medium">Image URL</span> e{" "}
                          <span className="font-medium">Price</span>.
                        </p>
                        {selectedCsvFileName ? (
                          <div className="text-xs font-medium text-sky-800">
                            Último arquivo selecionado: {selectedCsvFileName}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        onClick={() => csvFileInputRef.current?.click()}
                        disabled={isAdding || isLoadingShopee}
                        className="bg-sky-700 text-white hover:bg-sky-800"
                      >
                        {isAdding && processingOverlay.mode === "csv" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando CSV...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar produtos do CSV
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                    <div className="text-sm font-medium">Quantidade de produtos:</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {shopeeItemsOptions.map((qty) => {
                        const selected = shopeeLimit === qty;
                        return (
                          <Button
                            key={qty}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                        onClick={() => setShopeeLimit(qty)}
                        disabled={isAutomaticConfigLocked}
                            className={selected ? "text-white" : ""}
                            style={selected ? { backgroundColor: SHOPEE_ACCENT } : undefined}
                          >
                            {qty}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                    <div className="text-sm font-medium">Filtros rápidos:</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={shopeePreset === "top_sales" ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyShopeePreset("top_sales")}
                        disabled={isAutomaticConfigLocked}
                        className={shopeePreset === "top_sales" ? "text-white" : ""}
                        style={
                          shopeePreset === "top_sales"
                            ? { backgroundColor: SHOPEE_ACCENT }
                            : undefined
                        }
                      >
                        Mais vendidos
                      </Button>
                      <Button
                        type="button"
                        variant={shopeePreset === "high_commission" ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyShopeePreset("high_commission")}
                        disabled={isAutomaticConfigLocked}
                        className={shopeePreset === "high_commission" ? "text-white" : ""}
                        style={
                          shopeePreset === "high_commission"
                            ? { backgroundColor: SHOPEE_ACCENT }
                            : undefined
                        }
                      >
                        Maior comissão
                      </Button>
                      <Button
                        type="button"
                        variant={shopeePreset === "ams_only" ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyShopeePreset("ams_only")}
                        disabled={isAutomaticConfigLocked}
                        className={shopeePreset === "ams_only" ? "text-white" : ""}
                        style={
                          shopeePreset === "ams_only"
                            ? { backgroundColor: SHOPEE_ACCENT }
                            : undefined
                        }
                      >
                        Comissão extra
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearShopeeFilters}
                        disabled={isAutomaticConfigLocked}
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Nome do produto (opcional)</div>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                          value={shopeeQuery}
                          onChange={(e) => setShopeeQuery(e.target.value)}
                          placeholder="Digite o nome do produto..."
                          className="pl-9"
                          disabled={isAutomaticConfigLocked}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => void handleSearchShopee()}
                      disabled={isLoadingShopee || isAdding || isAutomaticConfigLocked}
                      className="text-white"
                      style={{ backgroundColor: SHOPEE_ACCENT }}
                    >
                      {isLoadingShopee ? "Carregando..." : "Carregar produtos da Shopee"}
                    </Button>
                  </div>

                  {shopeeError && (
                    <Alert className="border-red-300 bg-red-50 text-red-800">
                      <AlertDescription>{shopeeError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="border border-orange-200 rounded-md bg-orange-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <div className="text-sm text-muted-foreground">
                        Produtos carregados: {shopeeProducts.length} • Selecionados: {shopeeSelectedIds.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={toggleSelectAllShopee}
                          disabled={shopeeProducts.length === 0 || isAutomaticConfigLocked}
                          variant="outline"
                          size="sm"
                        >
                          {shopeeProducts.length > 0 &&
                          shopeeProducts.every((p) => shopeeSelectedIds.includes(String(p.itemId)))
                            ? "Desmarcar todos"
                            : "Selecionar todos"}
                        </Button>
                        <Button
                          onClick={() => void handleAddSelectedShopee()}
                          disabled={shopeeSelectedIds.length === 0 || isAdding || isAutomaticConfigLocked}
                          variant={shopeeSelectedIds.length > 0 ? "default" : "outline"}
                          size="sm"
                          className={shopeeSelectedIds.length > 0 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                        >
                          {isAdding ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            `Adicionar selecionados (${shopeeSelectedIds.length})`
                          )}
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-72">
                      <div className="divide-y">
                        {shopeeProducts.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500 bg-white/60">
                            {hasLoadedShopee
                              ? "Nenhum produto encontrado para os filtros aplicados."
                              : "Defina os filtros e clique em Carregar da Shopee para buscar produtos."}
                          </div>
                        ) : (
                          shopeeProducts.map((product) => {
                            const id = String(product.itemId);
                            const selected = shopeeSelectedIds.includes(id);
                            const titleText = product.productName || "Produto sem nome";
                            const link = product.offerLink || product.productLink;
                            return (
                              <div key={id} className="p-3 flex gap-3 items-start">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleShopeeSelection(id)}
                                  className="mt-1"
                                />
                                {product.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={product.imageUrl} alt={titleText} className="w-12 h-12 rounded-md object-cover" />
                                ) : (
                                  <div className="w-12 h-12 rounded-md bg-gray-800" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm truncate">{titleText}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {product.priceMin || product.price || "--"}
                                    {product.sales ? ` • ${product.sales} vendas` : ""}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => {
                                    if (!link) return;
                                    void addShopeeProductsToList([product]);
                                    setShopeeProducts((prev) =>
                                      prev.filter((p) => String(p.itemId) !== id)
                                    );
                                    setShopeeSelectedIds((prev) =>
                                      prev.filter((selectedId) => selectedId !== id)
                                    );
                                  }}
                                  disabled={!link || isAdding || isAutomaticConfigLocked}
                                  variant="outline"
                                  size="sm"
                                >
                                  Adicionar
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex items-center justify-between px-3 py-2 border-t">
                      <span className="text-xs text-muted-foreground">Página {shopeePage}</span>
                      <Button
                        onClick={() => void loadShopeeProducts(shopeePage + 1, true)}
                        disabled={!shopeeHasNextPage || isLoadingShopee}
                        variant="outline"
                        size="sm"
                      >
                        Carregar mais
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  {isAutomaticShopee ? "Produtos automáticos" : "Produtos da lista"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-white px-2.5 py-1 font-semibold ${
                      isAutomaticShopee
                        ? "bg-emerald-600 hover:bg-emerald-600"
                        : "bg-indigo-600 hover:bg-indigo-600"
                    }`}
                  >
                    {items.length} item(ns)
                  </Badge>
                  {isAutomaticShopee ? (
                    <Badge className="bg-[#EE4D2D] text-white hover:bg-[#EE4D2D] px-2.5 py-1 font-semibold">
                      Shopee
                    </Badge>
                  ) : (
                    <>
                      <span className="text-xs text-slate-500">Limite {currentItemsLimit}</span>
                      <Button
                        onClick={() => {
                          setItems([]);
                          setSelectedItemIndex(null);
                          clearSchedulingAfterItemsChange();
                        }}
                        disabled={items.length === 0 || isAutomaticConfigLocked}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Limpar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAutomaticShopee ? (
                <>
                  <Alert className="border-slate-200 bg-slate-50 text-slate-800">
                    <AlertDescription>
                      {items.length === 0
                        ? "A Shopee vai buscar produtos automaticamente. Você não precisa adicionar produtos manualmente."
                        : "Os itens abaixo foram encontrados automaticamente pela Shopee e ficam em modo somente leitura."}
                    </AlertDescription>
                  </Alert>
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
                      Ainda não há produtos disponíveis. Quando a automação estiver pronta para rodar, a Shopee vai buscar novos produtos automaticamente.
                    </div>
                  ) : (
                    <ScrollArea className="h-[340px]">
                      <div className="space-y-2 pr-1">
                        {items.map((item, idx) => renderReadonlyDraftItemCard(item, idx))}
                      </div>
                    </ScrollArea>
                  )}
                </>
              ) : items.length === 0 ? (
                <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
                  Nenhum item adicionado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  <ScrollArea className="h-[360px]">
                    <div className="space-y-2 pr-1">
                      {previewItems.map((item, idx) => renderDraftItemCard(item, idx))}
                    </div>
                  </ScrollArea>
                  {items.length > INLINE_ITEMS_PREVIEW_LIMIT ? (
                    <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 md:flex-row md:items-center md:justify-between">
                      <div className="text-xs text-slate-600">
                        Mostrando {INLINE_ITEMS_PREVIEW_LIMIT} de {items.length} itens nesta tela.
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={openItemsDialog}>
                        Ver todos os itens
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
              <PromoterCouponField
                value={listCoupon}
                onChange={setListCoupon}
                label="Cupom da lista"
                description="Aplicado aos itens sem cupom específico. Se um item já tiver cupom próprio, ele mantém o cupom individual."
                placeholder="Ex.: CUPOMDALISTA"
                disabled={items.length === 0 || isAutomaticConfigLocked}
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <Calendar className="w-4 h-4 text-amber-600" />
                {isAutomaticList ? "Janela automática" : "Configuração e agendamento"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAutomaticList ? (
                <>
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">Intervalo entre disparos</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {[2, 5, 10, 30, 60].map((val) => {
                        const selected = intervalMinutes === val;
                        return (
                          <Button
                            key={val}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            disabled={isAutomaticConfigLocked}
                            onClick={() => setIntervalMinutes(val)}
                            className={
                              selected
                                ? "bg-[#7d570e] hover:bg-[#946a13] text-white"
                                : "text-foreground"
                            }
                          >
                            {val === 60 ? "1h" : `${val}m`}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <TimePickerField
                      label="Horário inicial"
                      value={formatWindowTime(automationWindowStartTime)}
                      disabled={isAutomaticConfigLocked}
                      onChange={setAutomationWindowStartTime}
                    />
                    <TimePickerField
                      label="Horário final"
                      value={formatWindowTime(automationWindowEndTime)}
                      disabled={isAutomaticConfigLocked}
                      onChange={setAutomationWindowEndTime}
                    />
                  </div>

                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={allowExtraCredits}
                        disabled={!canEditCreditsPreference}
                        onChange={(e) => setAllowExtraCredits(e.target.checked)}
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-900">
                          Permitir uso de créditos extras
                        </div>
                        <div className="text-xs text-slate-600">
                          Se os envios incluídos do dia acabarem, a lista continua com créditos. Se desativado, ela pausa.
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-sm font-medium text-slate-900">
                      Estimativa de envios
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-500">
                          Por grupo
                        </div>
                        <div className="mt-1 text-xl font-semibold text-slate-900">
                          {automationDispatchesPerTarget > 0
                            ? `${automationDispatchesPerTarget}/dia`
                            : "--"}
                        </div>
                        <div className="text-xs text-slate-600">
                          disparos dentro da janela
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-500">
                          Total por dia
                        </div>
                        <div className="mt-1 text-xl font-semibold text-slate-900">
                          {effectiveAutomationTargetsCount > 0 && automationDailyEstimate > 0
                            ? `${automationDailyEstimate}`
                            : "Selecione os grupos"}
                        </div>
                        <div className="text-xs text-slate-600">
                          com {effectiveAutomationTargetsCount} destino(s)
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      {effectiveAutomationTargetsCount <= 0
                        ? `Com a janela atual, cabem até ${automationDispatchesPerTarget} disparos por grupo ao longo do dia. Selecione os destinos para ver o total diário.`
                        : `Na configuração atual, a lista pode fazer até ${automationDailyEstimate} envios por dia.`}
                    </div>
                  </div>

                  {shouldWarnQuotaShortage ? (
                    <Alert className="border-red-300 bg-red-50 text-red-800">
                      <AlertDescription>
                        A estimativa de envios diários passa da quantidade padrão. Sem ativar créditos extras, a automação pode pausar antes de concluir os envios do dia.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Button
                      type="button"
                      onClick={() => openManualScheduleDialog("whatsapp")}
                      disabled={whatsapp.isLoading || whatsapp.accounts.length === 0}
                      variant="outline"
                      className="w-full border-emerald-500 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:border-slate-300 disabled:text-slate-400"
                    >
                      <ListPlus className="w-4 h-4 mr-2" />
                      Adicionar grupo WhatsApp
                    </Button>
                    <Button
                      type="button"
                      onClick={() => openManualScheduleDialog("telegram")}
                      disabled={isLoadingTelegramGroups || telegramGroups.length === 0}
                      variant="outline"
                      className="w-full border-sky-500 text-sky-700 hover:bg-sky-50 hover:text-sky-800 disabled:border-slate-300 disabled:text-slate-400"
                    >
                      <ListPlus className="w-4 h-4 mr-2" />
                      Adicionar grupo Telegram
                    </Button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Escolha o grupo e a data ao adicionar cada destino.
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <Send className="w-4 h-4 text-sky-600" />
                {isAutomaticList ? "Destinos automáticos" : "Grupos agendados"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAutomaticList ? (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-emerald-500 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:border-slate-300 disabled:text-slate-400"
                      disabled={whatsapp.isLoading || whatsapp.accounts.length === 0 || isAutomaticConfigLocked}
                      onClick={() => openAutomationTargetDialog("whatsapp")}
                    >
                      <ListPlus className="w-4 h-4 mr-2" />
                      Adicionar grupo WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-sky-500 text-sky-700 hover:bg-sky-50 hover:text-sky-800 disabled:border-slate-300 disabled:text-slate-400"
                      disabled={isLoadingTelegramGroups || telegramGroups.length === 0 || isAutomaticConfigLocked}
                      onClick={() => openAutomationTargetDialog("telegram")}
                    >
                      <ListPlus className="w-4 h-4 mr-2" />
                      Adicionar grupo Telegram
                    </Button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Escolha a conta e o grupo ao adicionar cada destino.
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                      Ativos {activeAutomationTargets.length}
                    </Badge>
                    <Badge className="bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700">
                      Pausados {pausedAutomationTargets.length}
                    </Badge>
                    <Badge className="bg-rose-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
                      Erros {errorAutomationTargets.length}
                    </Badge>
                  </div>

                  {currentAutomationTargets.length === 0 ? (
                    <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                      Nenhum destino automático configurado ainda.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentAutomationTargets.map((target) => {
                        const targetKey = buildAutomationTargetKey(target);
                        const badge = formatAutomationState(target.automationState);
                        const lastSentSnapshot = resolveAutomationTargetSnapshot(target, "sent");
                        const lastFailedSnapshot = resolveAutomationTargetSnapshot(target, "failed");
                        const hasShopeeHistory =
                          (target.progress?.sentItems ?? 0) > 0 ||
                          (target.progress?.failedItems ?? 0) > 0;
                        return (
                          <div
                            key={targetKey}
                            className="rounded-md border border-slate-300 p-3 bg-slate-50 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {target.targetName || target.targetId}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {target.channel === "whatsapp"
                                    ? `WhatsApp${target.accountKey ? ` • ${target.accountKey}` : ""}`
                                    : "Telegram"}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={badge.className}>{badge.label}</Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={isAutomaticConfigLocked}
                                  onClick={() => removeAutomationTarget(targetKey)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>

                            {isAutomaticShopee ? (
                              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                                {hasShopeeHistory
                                  ? "Shopee automática ativa. Este card mostra apenas o que já foi enviado ou falhou neste destino."
                                  : "Shopee automática ativa. Os próximos produtos serão buscados e enviados continuamente dentro da janela configurada."}
                              </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                              <div className="rounded-md border border-slate-200 bg-white p-3">
                                <div className="text-xs text-slate-500">Enviados</div>
                                <div className="text-lg font-semibold text-slate-900">
                                  {target.progress?.sentItems ?? 0}
                                </div>
                              </div>
                              <div className="rounded-md border border-slate-200 bg-white p-3">
                                <div className="text-xs text-slate-500">Falhas</div>
                                <div className="text-lg font-semibold text-slate-900">
                                  {target.progress?.failedItems ?? 0}
                                </div>
                              </div>
                              <div className="rounded-md border border-slate-200 bg-white p-3">
                                <div className="text-xs text-slate-500">Próximo</div>
                                <div className="text-sm font-medium text-slate-900">
                                  {formatDateTime(target.nextDispatchAt)}
                                </div>
                              </div>
                              <div className="rounded-md border border-slate-200 bg-white p-3">
                                <div className="text-xs text-slate-500">Último</div>
                                <div className="text-sm font-medium text-slate-900">
                                  {formatDateTime(target.lastDispatchedAt)}
                                </div>
                              </div>
                            </div>

                            {target.lastErrorMessage ? (
                              <Alert className="border-red-300 bg-red-50 text-red-800">
                                <AlertDescription>{target.lastErrorMessage}</AlertDescription>
                              </Alert>
                            ) : null}

                            {lastSentSnapshot ? (
                              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                                <div className="flex gap-3">
                                  {lastSentSnapshot.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={lastSentSnapshot.imageUrl}
                                      alt={lastSentSnapshot.title || "Último produto enviado"}
                                      className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                                      <ShoppingBag className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span>Último produto enviado</span>
                                    </div>
                                    <div className="line-clamp-2 text-base font-semibold text-slate-900">
                                      {lastSentSnapshot.title || "Produto enviado"}
                                    </div>
                                    {lastSentSnapshot.link ? (
                                      <div className="mt-1 truncate text-sm text-slate-600">
                                        {lastSentSnapshot.link}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {lastFailedSnapshot ? (
                              <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                                <div className="flex gap-3">
                                  {lastFailedSnapshot.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={lastFailedSnapshot.imageUrl}
                                      alt={lastFailedSnapshot.title || "Último produto com erro"}
                                      className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-700">
                                      <ShoppingBag className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-rose-700">
                                      <AlertCircle className="h-4 w-4" />
                                      <span>Último produto com erro</span>
                                    </div>
                                    <div className="line-clamp-2 text-base font-semibold text-slate-900">
                                      {lastFailedSnapshot.title || "Produto com erro"}
                                    </div>
                                    {lastFailedSnapshot.link ? (
                                      <div className="mt-1 truncate text-sm text-slate-600">
                                        {lastFailedSnapshot.link}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void refreshAutomationStatus()}
                      disabled={isRefreshingAutomation || !activeDraftDocumentId}
                    >
                      {isRefreshingAutomation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Atualizar lista
                        </>
                      )}
                    </Button>
                    {automationEnabled ? (
                      <Button
                        type="button"
                        className="bg-amber-500 hover:bg-amber-400 text-white"
                        onClick={() => void handlePauseAutomation()}
                        disabled={isAutomationActionLoading || isSavingAutomation}
                      >
                        {isAutomationActionLoading || isSavingAutomation ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Pausar automação
                      </Button>
                    ) : allAutomationTargetsCompleted ? (
                      <Button
                        type="button"
                        className="bg-sky-600 hover:bg-sky-500 text-white"
                        onClick={() => void handleRestartAutomationQueue()}
                        disabled={
                          isResettingAutomation ||
                          !activeDraftDocumentId ||
                          isSavingAutomation
                        }
                      >
                        {isResettingAutomation || isSavingAutomation ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Iniciar novo ciclo
                      </Button>
                    ) : automationHasStarted ? (
                      <Button
                        type="button"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => void handleResumeAutomation()}
                        disabled={isAutomationActionLoading || isSavingAutomation}
                      >
                        {isAutomationActionLoading || isSavingAutomation ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Retomar automação
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => void handleActivateAutomation()}
                        disabled={
                          isAutomationActionLoading ||
                          isSavingAutomation ||
                          currentAutomationTargets.length === 0
                        }
                      >
                        {isAutomationActionLoading || isSavingAutomation ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Ativar automação
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Grupos do WhatsApp ({scheduledGroups.length})
                      </div>
                      {scheduledGroups.length === 0 ? (
                        <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                          Nenhum grupo do WhatsApp adicionado ainda.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {scheduledGroups.map((group, index) => {
                            const estimated = calculateScheduledGroupEstimatedEnd(group);
                            const endDisplay = group.endAt
                              ? formatDateTime(group.endAt)
                              : estimated
                                ? formatDateTime(estimated.toISOString())
                                : "--";
                            return (
                              <div
                                key={`${group.groupId}-${group.startAt}-${index}`}
                                className="rounded-md border border-slate-300 p-3 bg-slate-50"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-sm text-slate-800">
                                    <div className="font-semibold text-slate-900">{group.groupName}</div>
                                    {group.sessionName ? (
                                      <div className="text-xs text-slate-500">
                                        Conta: {group.sessionName}
                                      </div>
                                    ) : null}
                                    <div>Início: {formatDateTime(group.startAt)}</div>
                                    <div>Fim: {endDisplay}</div>
                                    <div className="text-slate-900 font-medium mt-1">
                                      Intervalo: {formatIntervalLabel(group.intervalMinutes || intervalMinutes)} • Itens: {items.length}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeScheduledGroup(index)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Grupos do Telegram ({scheduledTelegramGroups.length})
                      </div>
                      {scheduledTelegramGroups.length === 0 ? (
                        <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                          Nenhum grupo do Telegram adicionado ainda.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {scheduledTelegramGroups.map((group, index) => (
                            <div
                              key={`${group.groupId}-${group.startAt}-${index}`}
                              className="rounded-md border border-slate-300 p-3 bg-slate-50"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-sm text-slate-800">
                                  <div className="font-semibold text-slate-900">{group.groupName}</div>
                                  <div>Início: {formatDateTime(group.startAt)}</div>
                                  <div>Fim: {group.endAt ? formatDateTime(group.endAt) : "--"}</div>
                                  <div className="text-slate-900 font-medium mt-1">
                                    Intervalo: {formatIntervalLabel(group.intervalMinutes || intervalMinutes)} • Itens: {items.length}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => removeScheduledTelegramGroup(index)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => void handleCreateList()}
                    disabled={
                      isSubmitting ||
                      (scheduledGroups.length === 0 && scheduledTelegramGroups.length === 0) ||
                      items.length === 0
                    }
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando lista...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Criar e agendar lista
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        ) : null}

        <div className={`${pageView === "editor" ? "xl:col-span-5" : "xl:col-span-12"} space-y-4`}>
          {pageView === "editor" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <button
                type="button"
                onClick={openDailyUsageInfoNotice}
                className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <div className="flex items-start gap-3">
                  <BarChart3
                    className={`mt-0.5 h-4 w-4 ${remainingIncludedSends <= 0 ? "text-amber-500" : "text-emerald-500"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">
                        Uso do dia
                      </div>
                      {isLoadingQuota ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                      ) : null}
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-3">
                      {isLoadingQuota ? (
                        <div className="text-sm text-slate-600">Carregando...</div>
                      ) : (
                        <>
                          <div className="text-2xl font-semibold text-slate-900">
                            {quotaSummary?.usedToday || 0}
                            <span className="text-sm font-medium text-slate-500">
                              {" "}
                              / {quotaSummary?.dailyLimit || 200}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            Restam {remainingIncludedSends} envios incluídos hoje.
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={openCreditsInfoNotice}
                className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="flex items-start gap-3">
                  <Coins
                    className={`mt-0.5 h-4 w-4 ${(quotaSummary?.creditsAvailable || 0) > 0 ? "text-amber-500" : "text-orange-500"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">
                        Créditos
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-semibold text-slate-900">
                        {quotaSummary?.creditsAvailable || 0}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Saldo total de hoje: {totalSupportedSends} envios.
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ) : null}

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-violet-600" />
                  Listas
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => void handleCreateNewDraft()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                >
                  <ListPlus className="w-4 h-4 mr-1.5" />
                  Nova lista
                </Button>
              </div>
              <CardDescription>
                Continue de onde parou ou abra uma nova lista em rascunho.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDrafts ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando rascunhos...
                </div>
              ) : savedDrafts.length === 0 ? (
                <div className="text-center text-muted-foreground">Nenhum rascunho salvo.</div>
              ) : (
                <div className="space-y-2">
                  {savedDrafts.map((draft) => {
                    const isActive = draft.documentId === activeDraftDocumentId;
                    const draftItems = draft.itemsCount ?? (Array.isArray(draft.items) ? draft.items.length : 0);
                    const draftTitle = draft.title?.trim() || "Lista sem título";
                    const isAutomatic =
                      draft.listMode === "automatic_window" ||
                      draft.automationHasStarted === true;
                    const draftStatus = resolveDraftStatus(draft);
                    return (
                      <div
                        key={draft.documentId || draft.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => void handleSelectDraft(draft)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            void handleSelectDraft(draft);
                          }
                        }}
                        className={`rounded-md border p-3 cursor-pointer transition-colors ${isActive ? "border-[#7d570e] bg-amber-50" : "bg-slate-50 hover:border-primary"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{draftTitle}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {isAutomatic ? (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                  Automática
                                </Badge>
                              ) : null}
                              <Badge className={draftStatus.className}>
                                {draftStatus.label}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {draftItems} item(ns) • {formatDraftSavedAt(draft.updatedAt || draft.createdAt)}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteDraft(draft.documentId || "");
                            }}
                            disabled={!draft.documentId}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                Listas agendadas recentemente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="whatsapp" className="space-y-4">
                <TabsList className="grid grid-cols-2 w-full h-auto gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="whatsapp"
                    className="h-11 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold transition-colors hover:bg-emerald-100 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600"
                  >
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger
                    value="telegram"
                    className="h-11 rounded-md border border-sky-300 bg-sky-50 text-sky-700 font-semibold transition-colors hover:bg-sky-100 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600"
                  >
                    Telegram
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="whatsapp">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando listas...
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="text-center text-muted-foreground">Nenhuma lista encontrada.</div>
                  ) : (
                    <div className="space-y-3">
                      {batches.map((batch) => {
                        const batchStatus = resolveBatchStatus(batch);
                        const isFinalized = isBatchFinalized(batchStatus);
                        return (
                          <div
                            key={batch.documentId}
                            role="button"
                            tabIndex={0}
                            onClick={() => void handleSelectBatch(batch)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                void handleSelectBatch(batch);
                              }
                            }}
                            className="w-full text-left border rounded-lg p-4 bg-slate-50 hover:border-primary transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="font-semibold">
                                  {batch.title || "Lista de disparo"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Grupo: {batch.groupName || batch.groupId}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Status:{" "}
                                  <span
                                    className={
                                      isFinalized ? "text-muted-foreground" : "text-emerald-600"
                                    }
                                  >
                                    {formatBatchStatus(batchStatus)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="text-xs text-muted-foreground text-right">
                                  Início: {formatDateTime(batch.startAt)}
                                </div>
                                {!isFinalized && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Cancelar agendamento"
                                    aria-label="Cancelar agendamento"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleCancelBatch(batch.documentId);
                                    }}
                                  >
                                    <Ban className="w-4 h-4 text-amber-400" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDeleteBatch(batch.documentId);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Intervalo: {batch.intervalMinutes ? `${batch.intervalMinutes} min` : "--"} • Itens: {batch.itemsCount ?? "--"} • Fim: {formatDateTime(batch.endAt)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="telegram">
                  {isLoadingTelegramBatches ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando listas...
                    </div>
                  ) : telegramBatches.length === 0 ? (
                    <div className="text-center text-muted-foreground">Nenhuma lista encontrada.</div>
                  ) : (
                    <div className="space-y-3">
                      {telegramBatches.map((batch) => {
                        const batchStatus = resolveTelegramBatchStatus(batch);
                        const isFinalized = isBatchFinalized(batchStatus);
                        return (
                          <div
                            key={batch.documentId}
                            role="button"
                            tabIndex={0}
                            onClick={() => void handleSelectTelegramBatch(batch)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                void handleSelectTelegramBatch(batch);
                              }
                            }}
                            className="w-full text-left border rounded-lg p-4 bg-slate-50 hover:border-primary transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="font-semibold">
                                  {batch.title || "Lista de disparo"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Grupo: {batch.groupName || batch.groupId}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Status:{" "}
                                  <span
                                    className={
                                      isFinalized ? "text-muted-foreground" : "text-emerald-600"
                                    }
                                  >
                                    {formatBatchStatus(batchStatus)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="text-xs text-muted-foreground text-right">
                                  Início: {formatDateTime(batch.startAt)}
                                </div>
                                {!isFinalized && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Cancelar agendamento"
                                    aria-label="Cancelar agendamento"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleCancelTelegramBatch(batch.documentId);
                                    }}
                                  >
                                    <Ban className="w-4 h-4 text-amber-400" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDeleteTelegramBatch(batch.documentId);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Intervalo: {batch.intervalMinutes ? `${batch.intervalMinutes} min` : "--"} • Itens: {batch.itemsCount ?? "--"} • Fim: {formatDateTime(batch.endAt)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={scheduleDialogChannel !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeManualScheduleDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {scheduleDialogChannel === "telegram"
                ? "Adicionar grupo Telegram"
                : "Adicionar grupo WhatsApp"}
            </DialogTitle>
            <DialogDescription>
              Escolha o grupo e o horário de envio deste destino.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {scheduleDialogChannel === "whatsapp" ? (
              <>
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">Conta do WhatsApp</div>
                  <Select
                    value={selectedAccount?.sessionName || ""}
                    onValueChange={(value) => {
                      void whatsapp.selectAccount(value);
                    }}
                    disabled={whatsapp.isLoading || whatsapp.accounts.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsapp.accounts.map((account) => (
                        <SelectItem key={account.sessionName} value={account.sessionName}>
                          {account.title || account.sessionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">Grupo do WhatsApp</div>
                  <Select
                    value={selectedWhatsAppGroupValue}
                    onValueChange={(value) => setSelectedGroupId(value)}
                    disabled={whatsapp.isGroupsLoading || !groups.length}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          whatsapp.isGroupsLoading
                            ? "Carregando grupos..."
                            : "Selecione o grupo"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group: WhatsAppGroup) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name || group.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Grupo do Telegram</div>
                <Select
                  value={selectedTelegramGroupValue}
                  onValueChange={(value) => setSelectedTelegramGroupId(value)}
                  disabled={isLoadingTelegramGroups || telegramGroups.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingTelegramGroups
                          ? "Carregando grupos..."
                          : "Selecione o grupo"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {telegramGroups.map((group) => (
                      <SelectItem key={group.groupId} value={group.groupId}>
                        {group.groupName || group.groupId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-4">
              <DateTimePickerField
                label="Data e hora inicial"
                value={startAtField}
                onChange={setStartAtField}
                defaultTime="08:00"
              />

              <DateTimePickerField
                label="Hora final diária (opcional)"
                value={endAtField}
                onChange={setEndAtField}
                defaultTime="20:00"
                clearable
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Intervalo entre envios</div>
              <div className="flex flex-wrap items-center gap-2">
                {[2, 5, 10, 30, 60].map((val) => {
                  const selected = intervalMinutes === val;
                  return (
                    <Button
                      key={val}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => setIntervalMinutes(val)}
                      className={
                        selected
                          ? "bg-[#7d570e] hover:bg-[#946a13] text-white"
                          : "text-foreground"
                      }
                    >
                      {val === 60 ? "1h" : `${val}m`}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeManualScheduleDialog}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => {
                void handleConfirmManualScheduleDialog();
              }}
            >
              Adicionar grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={automationTargetDialogChannel !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeAutomationTargetDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {automationTargetDialogChannel === "telegram"
                ? "Adicionar grupo Telegram"
                : "Adicionar grupo WhatsApp"}
            </DialogTitle>
            <DialogDescription>
              Escolha o destino que vai receber os disparos automáticos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {automationTargetDialogChannel === "whatsapp" ? (
              <>
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">Conta do WhatsApp</div>
                  <Select
                    value={selectedAccount?.sessionName || ""}
                    onValueChange={(value) => {
                      void whatsapp.selectAccount(value);
                    }}
                    disabled={whatsapp.isLoading || whatsapp.accounts.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsapp.accounts.map((account) => (
                        <SelectItem key={account.sessionName} value={account.sessionName}>
                          {account.title || account.sessionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">Grupo do WhatsApp</div>
                  <Select
                    value={selectedWhatsAppGroupValue}
                    onValueChange={(value) => setSelectedGroupId(value)}
                    disabled={whatsapp.isGroupsLoading || !groups.length}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          whatsapp.isGroupsLoading
                            ? "Carregando grupos..."
                            : "Selecione o grupo"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group: WhatsAppGroup) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name || group.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Grupo do Telegram</div>
                <Select
                  value={selectedTelegramGroupValue}
                  onValueChange={(value) => setSelectedTelegramGroupId(value)}
                  disabled={isLoadingTelegramGroups || telegramGroups.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingTelegramGroups
                          ? "Carregando grupos..."
                          : "Selecione o grupo"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {telegramGroups.map((group) => (
                      <SelectItem key={group.groupId} value={group.groupId}>
                        {group.groupName || group.groupId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAutomationTargetDialog}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => {
                void handleConfirmAutomationTargetDialog();
              }}
            >
              Adicionar grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Itens da lista</DialogTitle>
            <DialogDescription>
              {items.length === 0
                ? "Nenhum item disponível."
                : `Mostrando ${Math.min(
                    (itemsDialogPage - 1) * ITEMS_DIALOG_PAGE_SIZE + 1,
                    items.length
                  )}-${Math.min(itemsDialogPage * ITEMS_DIALOG_PAGE_SIZE, items.length)} de ${items.length} itens.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <ScrollArea className="h-[70vh] pr-2">
              <div className="space-y-2 pr-1">
                {itemsDialogEntries.map(({ item, index }) =>
                  renderDraftItemCard(item, index)
                )}
              </div>
            </ScrollArea>

            {itemsDialogTotalPages > 1 ? (
              <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
                <div className="text-xs text-slate-600">
                  Página {itemsDialogPage} de {itemsDialogTotalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={itemsDialogPage <= 1}
                    onClick={() => setItemsDialogPage((prev) => Math.max(1, prev - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={itemsDialogPage >= itemsDialogTotalPages}
                    onClick={() =>
                      setItemsDialogPage((prev) =>
                        Math.min(itemsDialogTotalPages, prev + 1)
                      )
                    }
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setItemsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={noticeDialog.open}
        onOpenChange={(open) =>
          setNoticeDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{noticeDialog.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {noticeDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() =>
                setNoticeDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={quotaDialog.open}
        onOpenChange={(open) => {
          if (!open && quotaDialog.open) {
            resolveQuotaDialog(false);
          } else {
            setQuotaDialog((prev) => ({ ...prev, open }));
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{quotaDialog.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {quotaDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => resolveQuotaDialog(false)}>
              {quotaDialog.mode === "confirm" ? "Cancelar" : "Fechar"}
            </Button>
            {quotaDialog.mode === "insufficient" && (
              <Button
                variant="outline"
                onClick={() => {
                  window.open("https://masterafiliados.com.br/contato", "_blank", "noopener,noreferrer");
                }}
              >
                Entrar em contato
              </Button>
            )}
            {quotaDialog.mode === "confirm" && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => resolveQuotaDialog(true)}
              >
                Confirmar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedBatch)} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBatch?.title || "Lista de disparo"}
            </DialogTitle>
            <DialogDescription>
              Grupo: {selectedBatch?.groupName || selectedBatch?.groupId} • Status: {formatBatchStatus(resolveBatchStatus(selectedBatch))}
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando itens...
            </div>
          ) : batchDetail?.campaigns && batchDetail.campaigns.length > 0 ? (
            <div className="space-y-3">
              {batchDetail.campaigns.map((campaign: WhatsAppBatchCampaign) => {
                const thumb =
                  campaign.payload && typeof campaign.payload === "object"
                    ? (campaign.payload["productImageUrl"] as string | undefined)
                    : undefined;
                return (
                  <div key={campaign.documentId} className="border rounded-md p-3 bg-muted/20">
                    <div className="flex items-start gap-3">
                      {thumb ? (
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt="Produto" className="w-12 h-12 rounded-md object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                          IMG
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">
                            {campaign.groupName || campaign.groupId}
                          </div>
                          <div className="text-xs text-muted-foreground">{campaign.statusCampaign}</div>
                        </div>
                        <div className="mt-1 text-sm whitespace-pre-wrap">
                          {campaign.message || ""}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Agendado: {formatDateTime(campaign.scheduledAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground">Nenhum item encontrado.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedBatch(null);
              setBatchDetail(null);
            }}>
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedTelegramBatch)}
        onOpenChange={(open) => !open && setSelectedTelegramBatch(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTelegramBatch?.title || "Lista de disparo"}
            </DialogTitle>
            <DialogDescription>
              Grupo: {selectedTelegramBatch?.groupName || selectedTelegramBatch?.groupId} • Status:{" "}
              {formatBatchStatus(resolveTelegramBatchStatus(selectedTelegramBatch))}
            </DialogDescription>
          </DialogHeader>

          {isTelegramDetailLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando itens...
            </div>
          ) : telegramBatchDetail?.campaigns && telegramBatchDetail.campaigns.length > 0 ? (
            <div className="space-y-3">
              {telegramBatchDetail.campaigns.map((campaign: TelegramBatchCampaign) => {
                const thumb =
                  campaign.payload && typeof campaign.payload === "object"
                    ? (campaign.payload["productImageUrl"] as string | undefined)
                    : undefined;
                return (
                  <div key={campaign.documentId} className="border rounded-md p-3 bg-muted/20">
                    <div className="flex items-start gap-3">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt="Produto"
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                          IMG
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">
                            {campaign.groupName || campaign.groupId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {campaign.statusCampaign}
                          </div>
                        </div>
                        <div className="mt-1 text-sm whitespace-pre-wrap">
                          {campaign.message || ""}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Agendado: {formatDateTime(campaign.scheduledAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground">Nenhum item encontrado.</div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTelegramBatch(null);
                setTelegramBatchDetail(null);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .promoter-datetime-input::-webkit-calendar-picker-indicator {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
