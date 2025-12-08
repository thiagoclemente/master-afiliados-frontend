"use client";

import { useCallback, useEffect, useState } from "react";
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
import { fetchUserSubscriptions, hasSubscription, isSubscriptionPremium } from "@/services/user-subscription.service";

type TabKey = "create" | "links" | "campaigns";

export default function PromoterPage() {
  const router = useRouter();
  const whatsapp = useWhatsApp();

  const [activeTab, setActiveTab] = useState<TabKey>("create");
  const [linkInput, setLinkInput] = useState("");
  const [preview, setPreview] = useState<PromoterPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PromoterHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [allowAccess, setAllowAccess] = useState<boolean | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const defaultImage =
    preview?.payload?.productImageUrl && typeof preview.payload.productImageUrl === "string"
      ? (preview.payload.productImageUrl as string)
      : null;
  const productTitle =
    preview?.payload?.productTitle && typeof preview.payload.productTitle === "string"
      ? (preview.payload.productTitle as string)
      : "Promoção Shopee";

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetchUserSubscriptions();
        const subs = response.data || [];
        const allowed =
          hasSubscription(subs, "MASTER_PROMOTER") || isSubscriptionPremium(subs);
        setAllowAccess(allowed);
      } catch {
        setAllowAccess(false);
      }
    };
    void checkSubscription();
  }, []);

  const loadHistory = useCallback(async (reset = false) => {
    setIsHistoryLoading(true);
    setError(null);
    const nextPage = reset ? 1 : historyPage;
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
        !!result.meta && (result.meta.page ?? 1) < (result.meta.pageCount ?? 1)
      );
      setHistoryPage(nextPage + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar histórico."
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    void loadHistory(true);
    if (activeTab === "links") {
      void loadHistory(true);
    }
  }, [activeTab, loadHistory]);

  const validateLink = (link: string) => {
    const trimmed = link.trim().toLowerCase();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return "Informe uma URL válida.";
    }
    if (!trimmed.includes("shopee")) {
      return "Informe um link válido da Shopee.";
    }
    return null;
  };

  const handlePreview = async (force?: boolean) => {
    setSendSuccess(null);
    setError(null);
    const validation = validateLink(linkInput);
    if (validation) {
      setError(validation);
      return;
    }
    setIsLoadingPreview(true);
    try {
      const data = await promoterPreview(linkInput.trim(), force ? "" : undefined);
      setPreview({
        message: data.message || "",
        payload: data.payload || {},
      });
      setShowSendModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar mensagem de divulgação."
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

  const renderHeader = () => (
    <div className="bg-black shadow rounded-lg p-6 border border-gray-800 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Divulgador Master</h1>
            <p className="text-gray-300">
              Gere mensagens de promoção e dispare para seus grupos.
            </p>
          </div>
        </div>
        <Link
          href="/profile/whatsapp"
          className="text-sm px-4 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e] hover:text-white transition-colors"
        >
          Configurar WhatsApp
        </Link>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex gap-2 mb-4">
      {[
        { key: "create", label: "Criar envio", icon: MessageCircle },
        { key: "links", label: "Histórico de links", icon: Copy },
        { key: "campaigns", label: "Listas / Disparos", icon: Clock },
      ].map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
              activeTab === tab.key
                ? "border-[#7d570e] text-white"
                : "border-gray-700 text-gray-300 hover:border-[#7d570e]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const renderCreateTab = () => (
    <div className="bg-black border border-gray-800 rounded-lg p-6">
      {sendSuccess && (
        <div className="mb-4 p-3 rounded-md border border-emerald-700 bg-emerald-900/40 text-emerald-200">
          {sendSuccess}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#7d570e] flex items-center justify-center">
              <Bolt className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Gerar divulgação automática
                  </h2>
                  <p className="text-gray-300 text-sm">
                    Cole o link da Shopee e criaremos a mensagem e a prévia.
                  </p>
                </div>
                <Link
                  href="/master/promoter/lists"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e]"
                >
                  <ListChecks className="w-4 h-4" />
                  Listas automáticas
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                <label className="text-sm text-gray-300">Link do produto</label>
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://shopee.com.br/..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-[#7d570e]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview()}
                    disabled={!linkInput.trim() || isLoadingPreview}
                    className="px-4 py-2 rounded-md bg-[#7d570e] text-white hover:bg-[#6b4a0c] disabled:opacity-50"
                  >
                    {isLoadingPreview ? "Processando..." : "Gerar divulgação"}
                  </button>
                  <button
                    onClick={() => handlePreview(true)}
                    disabled={!linkInput.trim() || isLoadingPreview}
                    className="px-4 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e] disabled:opacity-50"
                  >
                    Reprocessar
                  </button>
                </div>
                {error && (
                  <div className="text-sm text-red-300 border border-red-800 bg-red-900/30 rounded-md p-3">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isLoadingPreview && (
            <div className="flex items-center gap-2 text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando mensagem...
            </div>
          )}

          {preview && (
            <div className="border border-gray-800 rounded-lg p-4 bg-gray-900 space-y-4">
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
                  <div className="w-16 h-16 rounded-md bg-gray-800 flex items-center justify-center text-gray-500">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">
                    {productTitle}
                  </div>
                  <textarea
                    value={preview.message}
                    onChange={(e) =>
                      setPreview({ ...preview, message: e.target.value })
                    }
                    rows={6}
                    className="w-full bg-gray-950 border border-gray-800 rounded-md px-3 py-2 text-white resize-none"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowSendModal(true)}
                  disabled={!preview || !linkInput.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Enviar pelo WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Copy className="w-4 h-4" />
            Histórico de links
          </div>
          {isHistoryLoading && history.length === 0 ? (
            <div className="flex items-center gap-2 text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando histórico...
            </div>
          ) : history.length === 0 ? (
            <div className="text-gray-400">Nenhum registro encontrado.</div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.documentId}
                  className="border border-gray-800 rounded-md p-3 bg-gray-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-400">Link</div>
                      <div className="text-white truncate">
                        {item.link}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteHistory(item)}
                      className="p-2 rounded-md border border-red-800 text-red-300 hover:bg-red-900/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-gray-200 text-sm whitespace-pre-wrap line-clamp-3">
                    {item.message || ""}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setLinkInput(item.link);
                        setPreview({
                          message: item.message || "",
                          payload: item.payload || {},
                        });
                        setActiveTab("create");
                        setSendSuccess(null);
                      }}
                      className="px-3 py-1.5 text-xs rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e]"
                    >
                      Reabrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {historyHasMore && (
            <button
              onClick={() => loadHistory()}
              disabled={isHistoryLoading}
              className="w-full px-3 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e] disabled:opacity-50"
            >
              {isHistoryLoading ? "Carregando..." : "Carregar mais"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="bg-black border border-gray-800 rounded-lg p-6">
      {isHistoryLoading && history.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Carregando histórico...
        </div>
      ) : history.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.documentId}
              className="border border-gray-800 rounded-lg p-4 bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-400">Link</div>
                  <div className="text-white truncate max-w-md">{item.link}</div>
                  <div className="text-xs text-gray-500">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteHistory(item)}
                  className="p-2 rounded-md border border-red-800 text-red-300 hover:bg-red-900/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 text-gray-200 whitespace-pre-wrap">
                {item.message || ""}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setLinkInput(item.link);
                    setPreview({
                      message: item.message || "",
                      payload: item.payload || {},
                    });
                    setActiveTab("create");
                  }}
                  className="px-3 py-2 text-sm rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e]"
                >
                  Reabrir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {historyHasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => loadHistory()}
            disabled={isHistoryLoading}
            className="px-4 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e] disabled:opacity-50"
          >
            {isHistoryLoading ? "Carregando..." : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );

  const renderCampaignsTab = () => (
    <div className="bg-black border border-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2 text-gray-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        Acompanhe seus disparos e listas agendadas.
      </div>
      <div className="p-4 rounded-lg border border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-semibold">Listas automáticas</div>
            <p className="text-gray-400 text-sm">
              Monte filas de links e dispare com intervalos definidos.
            </p>
          </div>
          <Link
            href="/master/promoter/lists"
            className="px-3 py-2 text-sm rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e]"
          >
            Abrir listas
          </Link>
        </div>
      </div>
      <div className="p-4 rounded-lg border border-gray-800 bg-gray-900">
        <div className="text-gray-400">
          Consulte o histórico completo de disparos na aba de histórico do WhatsApp.
        </div>
        <Link
          href="/profile/whatsapp"
          className="inline-flex mt-3 text-sm px-3 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e]"
        >
          Ver histórico de disparos
        </Link>
      </div>
    </div>
  );

  if (allowAccess === false) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <div className="bg-black border border-gray-800 rounded-lg p-8 text-center">
          <div className="text-[#7d570e] font-semibold text-lg mb-2">
            Recurso exclusivo para Divulgador Master ou Premium
          </div>
          <p className="text-gray-300 mb-4">
            Ative sua assinatura para gerar e enviar links automaticamente pelo WhatsApp.
          </p>
          <a
            href="https://masterafiliados.com.br"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-md bg-[#7d570e] text-white hover:bg-[#6b4a0c]"
          >
            Conhecer planos
          </a>
        </div>
      </div>
    );
  }

  if (allowAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Verificando acesso...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderTabs()}
      {activeTab === "create" && renderCreateTab()}
      {activeTab === "links" && renderHistoryTab()}
      {activeTab === "campaigns" && renderCampaignsTab()}

      {showSendModal && preview && (
        <PromoterSendModal
          link={linkInput.trim()}
          initialMessage={preview.message}
          payload={preview.payload}
          whatsapp={whatsapp}
          onClose={() => setShowSendModal(false)}
          onSent={async (msg) => {
            setPreview({ ...preview, message: msg });
            await savePromoterHistory({
              link: linkInput.trim(),
              message: msg,
              payload: preview.payload,
            });
            setLinkInput("");
            setPreview(null);
            setSendSuccess("Mensagem enviada e salva no histórico.");
            setHistory([]);
            setHistoryPage(1);
            setHistoryHasMore(true);
            await loadHistory(true);
          }}
        />
      )}
    </div>
  );
}
