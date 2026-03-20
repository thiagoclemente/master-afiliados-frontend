"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
  fetchWhatsappBatches,
  scheduleWhatsappList,
  checkWhatsappQuota,
  deleteWhatsappBatch,
  fetchWhatsAppProductInfo,
  fetchWhatsappBatchDetail,
  fetchPromoterShopeeProducts,
  fetchPromoterListDrafts,
  createPromoterListDraft,
  updatePromoterListDraft,
  deletePromoterListDraft,
  type PromoterShopeeProduct,
  type PromoterListDraft,
} from "@/services/promoter.service";
import type { WhatsAppBatch, WhatsAppBatchCampaign } from "@/interfaces/promoter";
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
  link: string;
  message: string;
  payload: Record<string, unknown>;
};

type ScheduledGroup = {
  groupId: string;
  groupName: string;
  startAt: string;
  endAt?: string;
  overflowStartAt?: string;
  intervalMinutes?: number;
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

const SHOPEE_ACCENT = "#EE4D2D";
const LINK_PREVIEW_CONCURRENCY = 4;
const MAX_LIST_ITEMS = 100;
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

export default function PromoterListsPage() {
  const [batches, setBatches] = useState<WhatsAppBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const shopeeItemsOptions = useMemo(() => {
    const base = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    return base.includes(shopeeLimit) ? base : [...base, shopeeLimit].sort((a, b) => a - b);
  }, [shopeeLimit]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDateModal, setShowDateModal] = useState(false);
  const [startAtField, setStartAtField] = useState("");
  const [endAtField, setEndAtField] = useState("");

  const [selectedBatch, setSelectedBatch] = useState<WhatsAppBatch | null>(null);
  const [batchDetail, setBatchDetail] = useState<WhatsAppBatch | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const startAtInputRef = useRef<HTMLInputElement | null>(null);
  const endAtInputRef = useRef<HTMLInputElement | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);
  const csvImportAbortControllerRef = useRef<AbortController | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [scheduledGroups, setScheduledGroups] = useState<ScheduledGroup[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<PromoterListDraft[]>([]);
  const [activeDraftDocumentId, setActiveDraftDocumentId] = useState<string>("");
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const canAddScheduledGroup = Boolean(selectedGroupId && startAt);
  const hasLoadedDraftRef = useRef(false);
  const isHydratingDraftRef = useRef(false);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = whatsapp.groups;

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

  const isBatchFinalized = (status?: string | null) => {
    const normalized = (status || "").toLowerCase();
    return normalized === "sent" || normalized === "failed" || normalized === "canceled";
  };

  const isBatchCanceledOrSent = (status?: string | null) => {
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
    setError(null);
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

  const buildEmptyDraftPayload = (): PromoterListDraft => ({
    title: "",
    listStatus: "draft",
    sourceTab: "custom",
    sessionName: null,
    groupId: null,
    intervalMinutes: 5,
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

  const applyDraft = (draft: PromoterListDraft | null) => {
    isHydratingDraftRef.current = true;
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
    setSourceTab(draft?.sourceTab === "shopee" ? "shopee" : "custom");
    setSelectedGroupId(draft?.groupId || null);

    const metadata =
      draft?.metadata && typeof draft.metadata === "object" ? draft.metadata : {};
    setSingleLinkInput(typeof metadata.singleLinkInput === "string" ? metadata.singleLinkInput : "");
    setSingleLinkCoupon(
      typeof metadata.singleLinkCoupon === "string"
        ? metadata.singleLinkCoupon
        : ""
    );
    setCustomLinksInput(typeof metadata.customLinksInput === "string" ? metadata.customLinksInput : "");
    setListCoupon(typeof metadata.listCoupon === "string" ? metadata.listCoupon : "");
    setShopeeQuery(typeof metadata.shopeeQuery === "string" ? metadata.shopeeQuery : "");
    setShopeeLimit(
      typeof metadata.shopeeLimit === "number" && Number.isFinite(metadata.shopeeLimit)
        ? metadata.shopeeLimit
        : 10
    );
    setShopeeSortType(
      typeof metadata.shopeeSortType === "number" && Number.isFinite(metadata.shopeeSortType)
        ? metadata.shopeeSortType
        : null
    );
    setShopeeIsAMSOffer(
      typeof metadata.shopeeIsAMSOffer === "boolean" ? metadata.shopeeIsAMSOffer : null
    );
    setShopeePreset(typeof metadata.shopeePreset === "string" ? metadata.shopeePreset : "");
    setSelectedCsvFileName("");
    setSelectedItemIndex(null);
    setTimeout(() => {
      isHydratingDraftRef.current = false;
    }, 0);
  };

  useEffect(() => {
    void load();
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
        const drafts = await fetchPromoterListDrafts();
        if (!isMounted) return;

        if (drafts.length === 0) {
          const created = await createPromoterListDraft(buildEmptyDraftPayload());
          if (!isMounted) return;
          const nextDrafts = created ? [created] : [];
          setSavedDrafts(nextDrafts);
          setActiveDraftDocumentId(created?.documentId || "");
          applyDraft(created || null);
        } else {
          const sorted = [...drafts].sort((a, b) => {
            const aDate = a.updatedAt || a.createdAt || "";
            const bDate = b.updatedAt || b.createdAt || "";
            return bDate.localeCompare(aDate);
          });
          const active = sorted[0] || null;
          setSavedDrafts(sorted);
          setActiveDraftDocumentId(active?.documentId || "");
          applyDraft(active);
        }
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
    whatsapp.loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!hasLoadedDraftRef.current || isHydratingDraftRef.current || !activeDraftDocumentId) {
      return;
    }

    const metadata = {
      singleLinkInput,
      singleLinkCoupon,
      customLinksInput,
      listCoupon,
      shopeeQuery,
      shopeeLimit,
      shopeeSortType,
      shopeeIsAMSOffer,
      shopeePreset,
    };

    const draft: PromoterListDraft = {
      title: title.trim(),
      listStatus: "draft",
      sourceTab,
      sessionName: selectedAccount?.sessionName || null,
      groupId: selectedGroupId || null,
      intervalMinutes,
      startAt: startAt || null,
      endAt: endAt || null,
      overflowStartAt: overflowStartAt || null,
      items,
      scheduledGroups,
      metadata,
    };

    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = setTimeout(() => {
      const persist = async () => {
        try {
          const updated = await updatePromoterListDraft(activeDraftDocumentId, draft);
          setSavedDrafts((prev) => {
            const next = prev.map((entry) =>
              entry.documentId === activeDraftDocumentId ? { ...entry, ...(updated || draft), documentId: activeDraftDocumentId } : entry
            );
            return next.sort((a, b) => {
              const aDate = a.updatedAt || a.createdAt || "";
              const bDate = b.updatedAt || b.createdAt || "";
              return bDate.localeCompare(aDate);
            });
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
    title,
    sourceTab,
    selectedAccount?.sessionName,
    selectedGroupId,
    intervalMinutes,
    startAt,
    endAt,
    overflowStartAt,
    items,
    scheduledGroups,
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

  const overflowInfo = useMemo(() => {
    if (!selectedGroupId || !startAt || items.length === 0) return null;

    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) return null;
    const end = endAt ? new Date(endAt) : null;
    const overflow = overflowStartAt ? new Date(overflowStartAt) : null;
    const defaultOverflowStart = buildDefaultOverflowStartForDay(start);
    let overflowWindowStarted = false;
    let current = new Date(start);
    const groupedByDay = new Map<string, { date: Date; count: number; startsAt: Date; endsAt: Date }>();

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

    for (let i = 0; i < items.length; i++) {
      if (end) {
        const source = currentStartSource();
        const dayStart = new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate(),
          source.getHours(),
          source.getMinutes(),
          source.getSeconds(),
          source.getMilliseconds()
        );
        const dayEnd = new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate(),
          end.getHours(),
          end.getMinutes(),
          end.getSeconds(),
          end.getMilliseconds()
        );
        if (current.getTime() < dayStart.getTime()) {
          current = dayStart;
        }
        if (current.getTime() > dayEnd.getTime()) {
          current = moveToNextWindowStart(dayStart);
        }
      }

      const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      const dayData = groupedByDay.get(key);
      if (!dayData) {
        groupedByDay.set(key, {
          date: new Date(current),
          count: 1,
          startsAt: new Date(current),
          endsAt: new Date(current),
        });
      } else {
        dayData.count += 1;
        dayData.endsAt = new Date(current);
      }

      const candidate = new Date(current.getTime() + intervalMinutes * 60 * 1000);
      if (!end) {
        current = candidate;
      } else {
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
    }

    const startKey = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
    const startDay = groupedByDay.get(startKey);
    groupedByDay.delete(startKey);

    const days = Array.from(groupedByDay.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const overflowTotal = days.reduce((acc, d) => acc + d.count, 0);
    const todayCount = startDay?.count ?? 0;
    const todayEndsAt = startDay?.endsAt;

    return { overflowTotal, todayCount, todayEndsAt, days };
  }, [selectedGroupId, startAt, endAt, overflowStartAt, intervalMinutes, items]);

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
    const hasSchedulingData =
      Boolean(startAt) ||
      Boolean(endAt) ||
      Boolean(overflowStartAt) ||
      scheduledGroups.length > 0;

    if (!hasSchedulingData) return;

    setSelectedGroupId(null);
    setStartAt("");
    setEndAt("");
    setOverflowStartAt("");
    setScheduledGroups([]);
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
    groupName: string,
    requestedCampaigns: number
  ) => {
    const quota = await checkWhatsappQuota(requestedCampaigns);
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
          `Você já consumiu ${usedToday} hoje, então o envio via WhatsApp precisa de créditos.\n\n` +
          `Necessário: ${creditsRequired} crédito(s)\n` +
          `Disponível: ${creditsAvailable} crédito(s)`,
      });
      return false;
    }

    if (creditsRequired > 0) {
      return openQuotaDialog({
        mode: "confirm",
        title: "Confirmar uso de créditos (WhatsApp)",
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
    const availableSlots = Math.max(0, MAX_LIST_ITEMS - items.length);
    if (availableSlots <= 0) {
      setError(`Limite máximo de ${MAX_LIST_ITEMS} itens por lista atingido.`);
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
            ? `${failedText ? "\n\n" : ""}${ignoredByLimitCount} link(s) foram ignorados por limite máximo de ${MAX_LIST_ITEMS} itens por lista.`
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
    if (items.length >= MAX_LIST_ITEMS) {
      setError(`Limite máximo de ${MAX_LIST_ITEMS} itens por lista atingido.`);
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

    const availableSlots = Math.max(0, MAX_LIST_ITEMS - items.length);
    if (availableSlots <= 0) {
      setShopeeError(`Limite máximo de ${MAX_LIST_ITEMS} itens por lista atingido.`);
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
          `${ignoredByLimitCount} produto(s) foram ignorados por limite máximo de ${MAX_LIST_ITEMS} itens por lista.`
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

    const availableSlots = Math.max(0, MAX_LIST_ITEMS - items.length);
    if (availableSlots <= 0) {
      setShopeeError(`Limite máximo de ${MAX_LIST_ITEMS} itens por lista atingido.`);
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
          ? `${failedText ? " " : ""}${ignoredByLimitCount} produto(s) foram ignorados por limite máximo de ${MAX_LIST_ITEMS} itens por lista.`
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

  const handleAddScheduledGroup = async () => {
    if (!selectedGroupId) {
      showProblemNotice("Selecione um grupo para adicionar.");
      return;
    }

    if (!startAt) {
      showProblemNotice("Defina a data e hora de início.");
      return;
    }

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime()) || startDate.getTime() < Date.now()) {
      showProblemNotice("Escolha uma data e hora no futuro.");
      return;
    }

    if (endAt) {
      const endDate = new Date(endAt);
      if (Number.isNaN(endDate.getTime()) || endDate.getTime() < startDate.getTime()) {
        showProblemNotice("A data final deve ser maior ou igual ao início.");
        return;
      }
    }

    if (overflowStartAt) {
      const overflowDate = new Date(overflowStartAt);
      if (
        Number.isNaN(overflowDate.getTime()) ||
        overflowDate.getTime() < startDate.getTime()
      ) {
        showProblemNotice("O início dos próximos dias deve ser maior ou igual ao início.");
        return;
      }
    }

    if (scheduledGroups.some((group) => group.groupId === selectedGroupId)) {
      showProblemNotice("Este grupo já foi adicionado à lista.");
      return;
    }

    if (
      scheduledGroups.some((group) => {
        const existingStart = new Date(group.startAt);
        return !Number.isNaN(existingStart.getTime()) && isSameMinute(existingStart, startDate);
      })
    ) {
      showProblemNotice("Este horário conflita com outro grupo agendado. Escolha outro horário.");
      return;
    }

    const groupTimeValidationError = await validateGroupAgainstExistingBatches(
      selectedGroupId,
      startDate
    );
    if (groupTimeValidationError) {
      showProblemNotice(groupTimeValidationError);
      return;
    }

    if (hasBatchStartConflict(startAt, batches, selectedGroupId)) {
      const group = groups.find((g) => g.id === selectedGroupId);
      showProblemNotice(
        `O horário inicial desse grupo já está sendo usado em outra lista (${group?.name || selectedGroupId}).`
      );
      return;
    }

    const selectedGroup = groups.find((group) => group.id === selectedGroupId);
    const nextGroup: ScheduledGroup = {
      groupId: selectedGroupId,
      groupName: selectedGroup?.name || selectedGroupId,
      startAt,
      endAt: endAt || undefined,
      overflowStartAt: overflowStartAt || undefined,
      intervalMinutes,
    };

    setScheduledGroups((prev) => [...prev, nextGroup]);
    setSelectedGroupId(null);
    setStartAt("");
    setEndAt("");
    setOverflowStartAt("");
    setError(null);
    setScheduleResetNotice(null);
  };

  const removeScheduledGroup = (index: number) => {
    setScheduledGroups((prev) => prev.filter((_, idx) => idx !== index));
  };

  const closeNativeDateTimePicker = () => {
    if (typeof document === "undefined") return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  };

  const openNativeDateTimePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.focus();
    try {
      const candidate = input as HTMLInputElement & { showPicker?: () => void };
      if (typeof candidate.showPicker === "function") {
        candidate.showPicker();
      }
    } catch {
      // Fallback em navegadores sem suporte ao showPicker.
    }
  };

  const handleSelectDraft = (draft: PromoterListDraft) => {
    setActiveDraftDocumentId(draft.documentId || "");
    applyDraft(draft);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCreateNewDraft = async () => {
    try {
      const created = await createPromoterListDraft(buildEmptyDraftPayload());
      if (!created?.documentId) {
        throw new Error("Não foi possível criar a nova lista.");
      }
      setSavedDrafts((prev) => [created, ...prev]);
      setActiveDraftDocumentId(created.documentId);
      applyDraft(created);
      setSuccessMessage("Nova lista criada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar nova lista.");
    }
  };

  const handleDeleteDraft = async (documentId: string) => {
    const confirmed = window.confirm("Deseja excluir este rascunho?");
    if (!confirmed) return;

    try {
      await deletePromoterListDraft(documentId);
      const remaining = savedDrafts.filter((draft) => draft.documentId !== documentId);
      if (remaining.length === 0) {
        const created = await createPromoterListDraft(buildEmptyDraftPayload());
        const nextDrafts = created ? [created] : [];
        setSavedDrafts(nextDrafts);
        setActiveDraftDocumentId(created?.documentId || "");
        applyDraft(created || null);
      } else {
        const nextActive =
          activeDraftDocumentId === documentId ? remaining[0] : remaining.find((d) => d.documentId === activeDraftDocumentId) || remaining[0];
        setSavedDrafts(remaining);
        if (nextActive) {
          setActiveDraftDocumentId(nextActive.documentId || "");
          applyDraft(nextActive);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir rascunho.");
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

  const handleCreateList = async () => {
    if (!selectedAccount || items.length === 0 || scheduledGroups.length === 0) {
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
      const latestBatches = latestBatchesResponse.items || [];
      setBatches(latestBatches);

      for (const group of scheduledGroups) {
        if (hasBatchStartConflict(group.startAt, latestBatches)) {
          throw new Error(
            `O horário de início do grupo WhatsApp "${group.groupName}" já está sendo usado por outra lista. Escolha outro horário de início.`
          );
        }

        const canProceed = await confirmCreditsBeforeListSend(
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
          sessionName: selectedAccount.sessionName,
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
      if (activeDraftDocumentId) {
        await deletePromoterListDraft(activeDraftDocumentId);
      }
      const refreshedDrafts = await fetchPromoterListDrafts();
      if (refreshedDrafts.length > 0) {
        const sorted = [...refreshedDrafts].sort((a, b) => {
          const aDate = a.updatedAt || a.createdAt || "";
          const bDate = b.updatedAt || b.createdAt || "";
          return bDate.localeCompare(aDate);
        });
        setSavedDrafts(sorted);
        setActiveDraftDocumentId(sorted[0]?.documentId || "");
        applyDraft(sorted[0] || null);
      } else {
        const createdDraft = await createPromoterListDraft(buildEmptyDraftPayload());
        setSavedDrafts(createdDraft ? [createdDraft] : []);
        setActiveDraftDocumentId(createdDraft?.documentId || "");
        applyDraft(createdDraft || null);
      }
      await load();
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

  return (
    <div className="space-y-6 rounded-xl bg-slate-50 p-4 md:p-6 text-slate-900" style={LIGHT_THEME_VARS}>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon">
                <Link href="/master/promoter">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <CardTitle className="text-2xl">Listas automáticas</CardTitle>
                <CardDescription>
                  Configure, revise e agende disparos com menos passos.
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => void load()} variant="outline">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      <ExtensionInstallBanner />

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
        <div className="xl:col-span-7 space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <ListPlus className="w-4 h-4 text-indigo-600" />
                1. Nome da lista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da lista"
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-[#7d570e]" />
                2. Origem dos produtos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={sourceTab} onValueChange={(value) => setSourceTab(value as SourceTab)}>
                <TabsList className="grid grid-cols-2 w-full h-auto gap-2 p-0 bg-transparent">
                  <TabsTrigger
                    value="custom"
                    className="h-11 rounded-md border border-slate-300 bg-slate-100 text-slate-700 font-semibold transition-colors hover:bg-slate-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:!text-white data-[state=active]:border-indigo-600 data-[state=active]:shadow-md"
                  >
                    <span className="inline-flex items-center gap-2 text-inherit">
                      <Link2 className="w-4 h-4" />
                      Links Personalizados
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="shopee"
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
                    />
                    <Button
                      onClick={() => void handleAddSingleLink()}
                      disabled={!singleLinkInput.trim() || isAdding}
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
                  />
                  <Button
                    onClick={() => void handleAddCustomLinks()}
                    disabled={!customLinksInput.trim() || isAdding}
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
                    <div className="text-sm font-medium">Quantidade de produtos</div>
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
                    <div className="text-sm font-medium">Filtros rápidos</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={shopeePreset === "top_sales" ? "default" : "outline"}
                        size="sm"
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
                        onClick={clearShopeeFilters}
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <Input
                        value={shopeeQuery}
                        onChange={(e) => setShopeeQuery(e.target.value)}
                        placeholder="Buscar produto na Shopee"
                        className="pl-9"
                      />
                    </div>
                    <Button
                      onClick={() => void handleSearchShopee()}
                      disabled={isLoadingShopee || isAdding}
                      className="text-white"
                      style={{ backgroundColor: SHOPEE_ACCENT }}
                    >
                      {isLoadingShopee ? "Carregando..." : "Carregar da Shopee"}
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
                          disabled={shopeeProducts.length === 0}
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
                          disabled={shopeeSelectedIds.length === 0 || isAdding}
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
                                  disabled={!link || isAdding}
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
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  3. Itens da lista
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white hover:bg-indigo-600 px-2.5 py-1 font-semibold">
                    {items.length} item(ns)
                  </Badge>
                  <Button
                    onClick={() => {
                      setItems([]);
                      setSelectedItemIndex(null);
                      clearSchedulingAfterItemsChange();
                    }}
                    disabled={items.length === 0}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
                  Nenhum item adicionado ainda.
                </div>
              ) : (
                <ScrollArea className="h-[520px]">
                  <div className="space-y-2 pr-1">
                    {items.map((item, idx) => {
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
                    })}
                  </div>
                </ScrollArea>
              )}
              <PromoterCouponField
                value={listCoupon}
                onChange={setListCoupon}
                label="Cupom da lista"
                description="Aplicado aos itens sem cupom específico. Se um item já tiver cupom próprio, ele mantém o cupom individual."
                placeholder="Ex.: CUPOMDALISTA"
                disabled={items.length === 0}
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <Calendar className="w-4 h-4 text-amber-600" />
                4. Configuração e agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Grupo</div>
                <Select
                  value={selectedGroupId ?? ""}
                  onValueChange={(value) => setSelectedGroupId(value)}
                  disabled={whatsapp.isGroupsLoading || !groups.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={whatsapp.isGroupsLoading ? "Carregando grupos..." : "Grupo de envio"} />
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
                        className={selected ? "bg-[#7d570e] hover:bg-[#946a13] text-white" : "text-foreground"}
                      >
                        {val === 60 ? "1h" : `${val}m`}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Data de envio</div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    initializeDateFields();
                    setShowDateModal(true);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {startAt
                    ? `${formatDateTime(startAt)}${endAt ? ` até ${formatDateTime(endAt)}` : ""}`
                    : "Definir data e hora"}
                </Button>
              </div>

              {startAt && (
                <Alert className="border-emerald-300 bg-emerald-50 text-emerald-800">
                  <AlertDescription>
                    {overflowInfo?.todayCount
                      ? `Hoje: ${overflowInfo.todayCount} campanha(s) iniciando em ${formatDateTime(startAt)}${overflowInfo.todayEndsAt ? ` e terminando em ${formatDateTime(overflowInfo.todayEndsAt.toISOString())}` : ""}.`
                      : `Início programado para ${formatDateTime(startAt)}.`}
                  </AlertDescription>
                </Alert>
              )}

              {overflowInfo && overflowInfo.days.length > 0 && (
                <Alert className="border-amber-300 bg-amber-50 text-amber-800">
                  <AlertDescription className="space-y-1">
                    <div>{overflowInfo.overflowTotal} campanha(s) serão enviadas nos próximos dias:</div>
                    {overflowInfo.days.map((day) => (
                      <div key={day.date.toISOString()}>
                        {day.count} campanha(s) • início {formatDateTime(day.startsAt.toISOString())} • término {formatDateTime(day.endsAt.toISOString())}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => void handleAddScheduledGroup()}
                disabled={!canAddScheduledGroup}
                variant={canAddScheduledGroup ? "default" : "outline"}
                className={`w-full ${
                  canAddScheduledGroup
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : ""
                }`}
              >
                <ListPlus className="w-4 h-4 mr-2" />
                Adicionar grupo na fila
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <Send className="w-4 h-4 text-sky-600" />
                5. Grupos agendados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Grupos agendados ({scheduledGroups.length})
                </div>
                {scheduledGroups.length === 0 ? (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                    Nenhum grupo adicionado ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scheduledGroups.map((group, index) => (
                      <div
                        key={`${group.groupId}-${group.startAt}-${index}`}
                        className="rounded-md border border-slate-300 p-3 bg-slate-50"
                      >
                        {(() => {
                          const estimated = calculateScheduledGroupEstimatedEnd(group);
                          const endDisplay = group.endAt
                            ? formatDateTime(group.endAt)
                            : estimated
                              ? formatDateTime(estimated.toISOString())
                              : "--";
                          return (
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm text-slate-800">
                            <div className="font-semibold text-slate-900">{group.groupName}</div>
                            <div className="text-slate-800">
                              Início: {formatDateTime(group.startAt)}
                            </div>
                            <div className="text-slate-800">
                              Fim: {endDisplay}
                            </div>
                            <div className="text-slate-900 font-medium mt-1">
                              Intervalo: {formatIntervalLabel(group.intervalMinutes || intervalMinutes)} • Itens: {items.length} • Fim estimado: {estimated ? formatDateTime(estimated.toISOString()) : "--"}
                            </div>
                            {group.overflowStartAt && (
                              <div className="text-slate-800">
                                Próximos dias: {formatDateTime(group.overflowStartAt)}
                              </div>
                            )}
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
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => void handleCreateList()}
                disabled={isSubmitting || !selectedAccount || scheduledGroups.length === 0 || items.length === 0}
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
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-5 space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-violet-600" />
                  Rascunhos salvos
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
                    const draftItems = Array.isArray(draft.items) ? draft.items.length : 0;
                    const draftTitle = draft.title?.trim() || "Lista sem título";
                    return (
                      <div
                        key={draft.documentId || draft.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectDraft(draft)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectDraft(draft);
                          }
                        }}
                        className={`rounded-md border p-3 cursor-pointer transition-colors ${isActive ? "border-[#7d570e] bg-amber-50" : "bg-slate-50 hover:border-primary"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{draftTitle}</div>
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
                Listas criadas recentemente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando listas...
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center text-muted-foreground">Nenhuma lista encontrada.</div>
              ) : (
                <div className="space-y-3">
                  {batches.map((batch) => (
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
                      {(() => {
                        const batchStatus = resolveBatchStatus(batch);
                        const isFinalized = isBatchFinalized(batchStatus);

                        return (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold">
                            {batch.title || "Lista de disparo"}
                          </div>
                          <div className="text-sm text-muted-foreground">Grupo: {batch.groupName || batch.groupId}</div>
                          <div className="text-xs text-muted-foreground">
                            Status:{" "}
                            <span
                              className={
                                isFinalized
                                  ? "text-muted-foreground"
                                  : "text-emerald-600"
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
                        );
                      })()}
                      <div className="text-xs text-muted-foreground mt-2">
                        Intervalo: {batch.intervalMinutes ? `${batch.intervalMinutes} min` : "--"} • Itens: {batch.itemsCount ?? "--"} • Fim: {formatDateTime(batch.endAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDateModal} onOpenChange={setShowDateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir data e hora</DialogTitle>
            <DialogDescription>
              Configure início e, se necessário, uma hora final diária.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Início da lista</span>
              <div className="relative">
                <Input
                  ref={startAtInputRef}
                  type="datetime-local"
                  value={startAtField}
                  onChange={(e) => setStartAtField(e.target.value)}
                  onFocus={(e) => openNativeDateTimePicker(e.currentTarget)}
                  onClick={(e) => openNativeDateTimePicker(e.currentTarget)}
                  className="promoter-datetime-input pr-12"
                  style={{ colorScheme: "dark" }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:text-white"
                  onClick={() => openNativeDateTimePicker(startAtInputRef.current)}
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Fim diário (opcional)</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeNativeDateTimePicker}
                  >
                    Fechar seletor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEndAtField("");
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Input
                  ref={endAtInputRef}
                  type="datetime-local"
                  value={endAtField}
                  onChange={(e) => setEndAtField(e.target.value)}
                  onFocus={(e) => openNativeDateTimePicker(e.currentTarget)}
                  onClick={(e) => openNativeDateTimePicker(e.currentTarget)}
                  className="promoter-datetime-input pr-12"
                  style={{ colorScheme: "dark" }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:text-white"
                  onClick={() => openNativeDateTimePicker(endAtInputRef.current)}
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDateModal(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => {
                if (!startAtField) {
                  showProblemNotice("Informe data e hora para agendar.");
                  return;
                }
                const combinedStart = new Date(startAtField);
                if (Number.isNaN(combinedStart.getTime()) || combinedStart.getTime() < Date.now()) {
                  showProblemNotice("Escolha uma data e hora no futuro.");
                  return;
                }

                let combinedEndIso = "";
                if (endAtField) {
                  const combinedEnd = new Date(endAtField);
                  if (Number.isNaN(combinedEnd.getTime())) {
                    showProblemNotice("Escolha uma data final válida.");
                    return;
                  }
                  if (combinedEnd.getTime() < combinedStart.getTime()) {
                    showProblemNotice("A data final deve ser maior ou igual ao início.");
                    return;
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

                setStartAt(combinedStart.toISOString());
                setEndAt(combinedEndIso);
                setOverflowStartAt(combinedOverflowIso);
                setError(null);
                setShowDateModal(false);
              }}
            >
              Aplicar
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

      <style jsx global>{`
        .promoter-datetime-input::-webkit-calendar-picker-indicator {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
