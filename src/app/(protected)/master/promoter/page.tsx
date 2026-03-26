"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bolt,
  CheckCircle2,
  Clock,
  Copy,
  Send,
  Loader2,
  MessageCircle,
  Trash2,
  ListChecks,
} from "lucide-react";
import {
  promoterPreview,
  fetchPromoterHistory,
  savePromoterHistory,
  deletePromoterHistory,
} from "@/services/promoter.service";
import type { PromoterHistoryItem, PromoterPreview } from "@/interfaces/promoter";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import PromoterSendModal from "@/components/whatsapp/PromoterSendModal";
import {
  fetchUserSubscriptions,
  hasSubscription,
  isSubscriptionPremium,
} from "@/services/user-subscription.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ExtensionInstallBanner from "@/components/promoter/ExtensionInstallBanner";
import PromoterCouponField from "@/components/promoter/PromoterCouponField";
import {
  buildPreviewPayloadFromExtension,
  getExtensionPayloadCardData,
  getPromoterLinkFromPayload,
  tryParseExtensionPayload,
  type ExtensionProductPayload,
} from "@/lib/promoter-extension-payload";
import {
  resolvePromoterCoupon,
  withPromoterCouponPayload,
} from "@/lib/promoter-coupon";

type TabKey = "create" | "links" | "campaigns";

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

export default function PromoterPage() {
  const router = useRouter();
  const whatsapp = useWhatsApp();

  const [activeTab, setActiveTab] = useState<TabKey>("create");
  const [linkInput, setLinkInput] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [preview, setPreview] = useState<PromoterPreview | null>(null);
  const [importedPayload, setImportedPayload] =
    useState<ExtensionProductPayload | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PromoterHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [allowAccess, setAllowAccess] = useState<boolean | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const historyPageRef = useRef(1);

  const defaultImage =
    preview?.payload?.productImageUrl &&
    typeof preview.payload.productImageUrl === "string"
      ? (preview.payload.productImageUrl as string)
      : null;
  const productTitle =
    preview?.payload?.productTitle &&
    typeof preview.payload.productTitle === "string"
      ? (preview.payload.productTitle as string)
      : "Promoção";
  const importedCard = importedPayload
    ? getExtensionPayloadCardData(buildPreviewPayloadFromExtension(importedPayload))
    : null;
  const currentSendLink = importedPayload
    ? getPromoterLinkFromPayload(buildPreviewPayloadFromExtension(importedPayload))
    : linkInput.trim();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetchUserSubscriptions();
        const subs = response.data || [];
        const allowed =
          hasSubscription(subs, "MASTER_PROMOTER") ||
          isSubscriptionPremium(subs);
        setAllowAccess(allowed);
      } catch {
        setAllowAccess(false);
      }
    };
    void checkSubscription();
  }, []);

  const loadHistory = useCallback(
    async (reset = false) => {
      setIsHistoryLoading(true);
      setError(null);
      const nextPage = reset ? 1 : historyPageRef.current;
      try {
        const result = await fetchPromoterHistory({
          page: nextPage,
          pageSize: 10,
        });
        if (reset) {
          setHistory(result.items);
        } else {
          setHistory((prev) => [...prev, ...result.items]);
        }
        setHistoryHasMore(
          !!result.meta &&
            (result.meta.page ?? 1) < (result.meta.pageCount ?? 1)
        );
        historyPageRef.current = nextPage + 1;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar histórico."
        );
      } finally {
        setIsHistoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadHistory(true);
  }, [loadHistory]);

  useEffect(() => {
    if (activeTab === "links") {
      historyPageRef.current = 1;
      setHistoryHasMore(true);
      void loadHistory(true);
    }
  }, [activeTab, loadHistory]);

  const validateLink = (link: string) => {
    const trimmed = link.trim().toLowerCase();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return "Informe uma URL válida.";
    }
    if (!trimmed.includes("shopee") && !trimmed.includes("amazon")) {
      return "Informe um link válido da Shopee ou Amazon.";
    }
    return null;
  };

  const handleImportedPayload = useCallback((raw: string) => {
    const parsed = tryParseExtensionPayload(raw);
    if (!parsed) return false;
    const parsedPayload = buildPreviewPayloadFromExtension(parsed);

    setImportedPayload(parsed);
    setCouponInput(resolvePromoterCoupon(parsedPayload));
    setLinkInput("");
    setPreview(null);
    setError(null);
    setSendSuccess(null);
    return true;
  }, []);

  const handlePreview = async (force?: boolean) => {
    setSendSuccess(null);
    setError(null);
    const requestLink = importedPayload
      ? getPromoterLinkFromPayload(buildPreviewPayloadFromExtension(importedPayload))
      : linkInput.trim();

    if (!requestLink) {
      setError("Informe uma URL válida.");
      return;
    }

    if (!importedPayload) {
      const validation = validateLink(linkInput);
      if (validation) {
        setError(validation);
        return;
      }
    }

    setIsLoadingPreview(true);
    try {
      const requestPayload = withPromoterCouponPayload(
        importedPayload
          ? buildPreviewPayloadFromExtension(importedPayload)
          : undefined,
        couponInput,
        { source: "item", hasSpecificCoupon: true }
      );
      const data = await promoterPreview(
        requestLink,
        force ? "" : undefined,
        Object.keys(requestPayload).length > 0 ? requestPayload : undefined
      );
      setPreview({
        message: data.message || "",
        payload:
          Object.keys(data.payload || {}).length > 0
            ? data.payload || {}
            : requestPayload,
      });
      setShowSendModal(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao gerar mensagem de divulgação."
      );
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDeleteHistory = async (item: PromoterHistoryItem) => {
    try {
      await deletePromoterHistory(item.documentId || String(item.id));
      setHistory((prev) => prev.filter((h) => h.documentId !== item.documentId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao deletar item do histórico."
      );
    }
  };

  const tabItems: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "create", label: "Criar envio", icon: MessageCircle },
    { key: "links", label: "Histórico", icon: Copy },
    { key: "campaigns", label: "Listas / Disparos", icon: Clock },
  ];

  if (allowAccess === false) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Divulgador Master</CardTitle>
            <CardDescription>
              Recurso exclusivo para Divulgador Master ou Premium.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ative sua assinatura para gerar e enviar links automaticamente pelo
              WhatsApp.
            </p>
            <Button asChild>
              <a
                href="https://masterafiliados.com.br"
                target="_blank"
                rel="noreferrer"
              >
                Conhecer planos
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allowAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Verificando acesso...
      </div>
    );
  }

  return (
    <div
      className="space-y-6 rounded-xl bg-slate-50 p-4 text-slate-900 md:p-6"
      style={LIGHT_THEME_VARS}
    >
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Divulgador Master</CardTitle>
                <CardDescription>
                  Gere mensagens de promoção e dispare para seus grupos.
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/profile/whatsapp">Configurar WhatsApp</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <ExtensionInstallBanner />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sendSuccess && (
        <Alert>
          <AlertDescription>{sendSuccess}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-3 h-fit border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Menu</CardTitle>
            <CardDescription className="text-slate-600">
              Navegação do Divulgador Master
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  variant="ghost"
                  className={
                    active
                      ? "w-full justify-start border border-indigo-600 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md hover:from-indigo-700 hover:to-blue-700 hover:text-white"
                      : "w-full justify-start border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <div className="lg:col-span-9 space-y-4">
          {activeTab === "create" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card className="xl:col-span-2 border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bolt className="w-4 h-4" />
                        Gerar divulgação automática
                      </CardTitle>
                      <CardDescription>
                        Cole um link ou o payload da extensão e criaremos a mensagem e a prévia.
                      </CardDescription>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/master/promoter/lists">
                        <ListChecks className="w-4 h-4 mr-2" />
                        Listas automáticas
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {importedCard && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex gap-3 items-start">
                        {importedCard.imageUrl ? (
                          <div className="relative w-20 h-20 shrink-0">
                            <Image
                              src={importedCard.imageUrl}
                              alt={importedCard.title || "Produto importado"}
                              fill
                              className="object-cover rounded-md"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <MessageCircle className="w-6 h-6" />
                          </div>
                        )}
                          <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              Importado da extensão
                            </div>
                            {importedCard.marketplace ? (
                              <Badge
                                variant="outline"
                                className="border-sky-200 bg-sky-50 text-sky-700"
                              >
                                {importedCard.marketplace === "mercado-livre"
                                  ? "Mercado Livre"
                                  : importedCard.marketplace}
                              </Badge>
                            ) : null}
                            {importedCard.priceDiscountRate ? (
                              <Badge className="bg-emerald-600 text-white">
                                {importedCard.priceDiscountRate} OFF
                              </Badge>
                            ) : null}
                          </div>
                          <div className="font-semibold leading-snug line-clamp-3">
                            {importedCard.title}
                          </div>
                          {(importedCard.price || importedCard.priceMax) && (
                            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              {importedCard.price ? (
                                <div className="text-lg font-bold text-amber-700">
                                  {importedCard.price}
                                </div>
                              ) : null}
                              {importedCard.priceMax ? (
                                <div className="text-sm text-muted-foreground line-through">
                                  {importedCard.priceMax}
                                </div>
                              ) : null}
                            </div>
                          )}
                          {importedCard.shopName ? (
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {importedCard.shopName}
                            </div>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                        setImportedPayload(null);
                        setPreview(null);
                      }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Textarea
                    value={linkInput}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setLinkInput(nextValue);
                      if (nextValue.trim().startsWith("{")) {
                        handleImportedPayload(nextValue);
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      if (handleImportedPayload(pasted)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="https://shopee.com.br/... https://amazon.com.br/..."
                    rows={4}
                  />
                  <PromoterCouponField
                    value={couponInput}
                    onChange={setCouponInput}
                    label="Cupom da divulgação"
                    description="Se preencher, o cupom entra junto na geração da mensagem."
                    placeholder="Ex.: DESCONTO10"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => void handlePreview()}
                      disabled={
                        (!linkInput.trim() && !importedPayload) || isLoadingPreview
                      }
                    >
                      {isLoadingPreview ? "Processando..." : "Gerar divulgação"}
                    </Button>
                    <Button
                      onClick={() => void handlePreview(true)}
                      disabled={
                        (!linkInput.trim() && !importedPayload) || isLoadingPreview
                      }
                      variant="outline"
                    >
                      Reprocessar
                    </Button>
                  </div>

                  {isLoadingPreview && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando mensagem...
                    </div>
                  )}

                  {preview && (
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex gap-3 items-start">
                        {defaultImage ? (
                          <div className="relative w-16 h-16">
                            <Image
                              src={defaultImage}
                              alt={productTitle}
                              fill
                              className="object-cover rounded-md"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                            <MessageCircle className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{productTitle}</div>
                          <Textarea
                            value={preview.message}
                            onChange={(e) =>
                              setPreview({ ...preview, message: e.target.value })
                            }
                            rows={7}
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowSendModal(true)}
                        disabled={!preview || !currentSendLink}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar pelo WhatsApp
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Histórico de links</CardTitle>
                </CardHeader>
                <CardContent>
                  {isHistoryLoading && history.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando histórico...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Nenhum registro encontrado.
                    </div>
                  ) : (
                    <ScrollArea className="h-[520px] pr-2">
                      <div className="space-y-2">
                        {history.map((item) => (
                          <div
                            key={item.documentId}
                            className="rounded-md border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-muted-foreground">Link</div>
                                <div className="truncate">{item.link}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.createdAt
                                    ? new Date(item.createdAt).toLocaleString()
                                    : ""}
                                </div>
                              </div>
                              <Button
                                onClick={() => void handleDeleteHistory(item)}
                                size="icon"
                                variant="ghost"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="mt-2 text-sm whitespace-pre-wrap line-clamp-3">
                              {item.message || ""}
                            </div>
                            <Button
                              onClick={() => {
                                const restoredPayload =
                                  item.payload && typeof item.payload === "object"
                                    ? item.payload
                                    : {};
                                const extensionPayload =
                                  restoredPayload.extensionPayload &&
                                  typeof restoredPayload.extensionPayload === "object"
                                    ? (restoredPayload
                                        .extensionPayload as ExtensionProductPayload)
                                    : null;
                                setCouponInput(resolvePromoterCoupon(restoredPayload));
                                setImportedPayload(extensionPayload);
                                setLinkInput(extensionPayload ? "" : item.link);
                                setPreview({
                                  message: item.message || "",
                                  payload: restoredPayload || {},
                                });
                                setActiveTab("create");
                                setSendSuccess(null);
                              }}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              Reabrir
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  {historyHasMore && (
                    <Button
                      onClick={() => void loadHistory()}
                      disabled={isHistoryLoading}
                      variant="outline"
                      className="w-full mt-3"
                    >
                      {isHistoryLoading ? "Carregando..." : "Carregar mais"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "links" && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Histórico de links</CardTitle>
              </CardHeader>
              <CardContent>
                {isHistoryLoading && history.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Carregando histórico...
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.documentId}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Link</div>
                            <div className="truncate max-w-md">{item.link}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleString()
                                : ""}
                            </div>
                          </div>
                          <Button
                            onClick={() => void handleDeleteHistory(item)}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mt-3 whitespace-pre-wrap">{item.message || ""}</div>
                        <Button
                          onClick={() => {
                            const restoredPayload =
                              item.payload && typeof item.payload === "object"
                                ? item.payload
                                : {};
                            const extensionPayload =
                              restoredPayload.extensionPayload &&
                              typeof restoredPayload.extensionPayload === "object"
                                ? (restoredPayload
                                    .extensionPayload as ExtensionProductPayload)
                                : null;
                            setCouponInput(resolvePromoterCoupon(restoredPayload));
                            setImportedPayload(extensionPayload);
                            setLinkInput(extensionPayload ? "" : item.link);
                            setPreview({
                              message: item.message || "",
                              payload: restoredPayload || {},
                            });
                            setActiveTab("create");
                          }}
                          variant="outline"
                          className="mt-3"
                        >
                          Reabrir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {historyHasMore && (
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={() => void loadHistory()}
                      disabled={isHistoryLoading}
                      variant="outline"
                    >
                      {isHistoryLoading ? "Carregando..." : "Carregar mais"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "campaigns" && (
            <div className="space-y-4">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="w-4 h-4" />
                    Acompanhe seus disparos e listas agendadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  >
                    <Link href="/master/promoter/lists">Criar ou gerenciar listas</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Histórico completo</CardTitle>
                  <CardDescription>
                    Consulte o histórico completo de disparos na integração do WhatsApp.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link href="/profile/whatsapp">Ver histórico de disparos</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {showSendModal && preview && (
        <PromoterSendModal
          link={currentSendLink}
          initialMessage={preview.message}
          payload={preview.payload}
          whatsapp={whatsapp}
          onClose={() => setShowSendModal(false)}
          onSent={async (msg) => {
            setPreview({ ...preview, message: msg });
            await savePromoterHistory({
              link: currentSendLink,
              message: msg,
              payload: preview.payload,
            });
            setLinkInput("");
            setCouponInput("");
            setImportedPayload(null);
            setPreview(null);
            setSendSuccess("Mensagem enviada e salva no histórico.");
            setHistory([]);
            historyPageRef.current = 1;
            setHistoryHasMore(true);
            await loadHistory(true);
          }}
        />
      )}
    </div>
  );
}
