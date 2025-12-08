"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  RefreshCcw,
  Send,
  ListPlus,
  Calendar,
  X,
  Info,
} from "lucide-react";
import {
  fetchWhatsappBatches,
  scheduleWhatsappList,
  promoterPreview,
  fetchWhatsappBatchDetail,
} from "@/services/promoter.service";
import type { WhatsAppBatch, WhatsAppBatchCampaign } from "@/interfaces/promoter";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import type { WhatsAppGroup } from "@/interfaces/whatsapp";

type ListItem = {
  link: string;
  message: string;
  payload: Record<string, unknown>;
};

export default function PromoterListsPage() {
  const [batches, setBatches] = useState<WhatsAppBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [items, setItems] = useState<ListItem[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateField, setDateField] = useState<string>("");
  const [timeField, setTimeField] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<WhatsAppBatch | null>(null);
  const [batchDetail, setBatchDetail] = useState<WhatsAppBatch | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchWhatsappBatches({ page: 1, pageSize: 20 });
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

  useEffect(() => {
    void load();
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

  const groups = whatsapp.groups;

  useEffect(() => {
    const defaultGroup =
      selectedAccount?.defaultGroupId ||
      groups.find((group: WhatsAppGroup) => !!group.id)?.id ||
      null;
    if (defaultGroup) {
      setSelectedGroupId(defaultGroup);
    }
  }, [selectedAccount, groups]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const initializeDateFields = () => {
    const now = new Date();
    const target = startAt ? new Date(startAt) : new Date(now.getTime() + 5 * 60000);
    setDateField(target.toISOString().slice(0, 10));
    setTimeField(target.toTimeString().slice(0, 5));
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

  const handleAddItem = async () => {
    if (!linkInput.trim()) return;
    try {
      setIsAdding(true);
      const preview = await promoterPreview(linkInput.trim());
      const newItem: ListItem = {
        link: linkInput.trim(),
        message: preview.message || "",
        payload: preview.payload || {},
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItem(newItem);
      setLinkInput("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar mensagem do item."
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateList = async () => {
    if (!selectedAccount || !selectedGroupId || items.length === 0) {
      setError("Preencha todos os campos obrigatórios e adicione pelo menos um link.");
      return;
    }

    if (!title.trim()) {
      setError("Informe o título da lista.");
      return;
    }

    if (!startAt) {
      setError("Defina data e hora para iniciar o envio.");
      return;
    }
    const group = groups.find((g) => g.id === selectedGroupId);

    if (startAt) {
      const parsed = new Date(startAt);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() < Date.now()) {
        setError("Escolha uma data e hora no futuro.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await scheduleWhatsappList({
        title: title.trim() || undefined,
        groupId: selectedGroupId,
        groupName: group?.name || selectedGroupId,
        sessionName: selectedAccount.sessionName,
        intervalMinutes: intervalMinutes || undefined,
        startAt: startAt || undefined,
        items: items.map((item) => ({
          link: item.link,
          message: item.message,
          payload: item.payload,
        })),
      });
      setItems([]);
      setTitle("");
      setIntervalMinutes(5);
      setStartAt("");
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar lista automática."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/master/promoter"
              className="text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Listas automáticas
              </h1>
              <p className="text-gray-300">
                Acompanhe filas de disparo criadas no aplicativo.
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e]"
          >
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-black border border-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-gray-300">
          <ListPlus className="w-4 h-4 text-[#7d570e]" />
          <span>Criar nova lista</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da lista (opcional)"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Intervalo (min)
                </label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                >
                  {[2, 5, 10, 30, 60].map((val) => (
                    <option key={val} value={val}>
                      {val === 60 ? "60 (1h)" : val}
                    </option>
                  ))}
                </select>
              </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-400 block mb-1">
              Início (opcional)
            </label>
            <button
              onClick={() => {
                initializeDateFields();
                setShowDateModal(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white text-left hover:border-[#7d570e]"
            >
              <Calendar className="w-4 h-4 text-gray-400" />
              {startAt
                ? new Date(startAt).toLocaleString()
                : "Definir data e hora"}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Definição obrigatória: use uma data futura.
            </p>
          </div>
        </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 block mb-1">
                Grupo de envio
              </label>
              {whatsapp.isGroupsLoading ? (
                <div className="flex items-center gap-2 text-gray-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando grupos...
                </div>
              ) : groups.length ? (
                <select
                  value={selectedGroupId ?? ""}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"
                >
                  {groups.map((group: WhatsAppGroup) => (
                    <option key={group.id} value={group.id}>
                      {group.name || group.id}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-gray-400">
                  Nenhum grupo disponível. Configure em Perfil &gt; WhatsApp.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-300 font-semibold">
              Itens da lista
            </div>
            <div className="space-y-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Link da Shopee"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              />
              <button
                onClick={handleAddItem}
                disabled={!linkInput.trim() || isAdding}
                className="w-full px-3 py-2 rounded-md bg-[#7d570e] text-white hover:bg-[#6b4a0c] disabled:opacity-50"
              >
                {isAdding ? "Processando..." : "Adicionar link"}
              </button>
            </div>
            {items.length === 0 ? (
              <div className="text-sm text-gray-400">
                Nenhum item adicionado ainda.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item, idx) => {
                  const thumb =
                    typeof item.payload?.productImageUrl === "string"
                      ? (item.payload.productImageUrl as string)
                      : null;
                  return (
                    <button
                      key={`${item.link}-${idx}`}
                      className={`w-full text-left border rounded-md p-3 bg-gray-900 flex gap-3 items-start ${
                        selectedItem === item
                          ? "border-[#7d570e]"
                          : "border-gray-800 hover:border-[#7d570e]"
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      {thumb ? (
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb}
                            alt="Produto"
                            className="w-12 h-12 rounded-md object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                          IMG
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">
                          {item.link}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {item.message}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={handleCreateList}
              disabled={
                isSubmitting ||
                !selectedAccount ||
                !selectedGroupId ||
                items.length === 0
              }
              className="w-full px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando lista...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Criar e agendar lista
                </span>
              )}
            </button>
          </div>

          {/* Item preview */}
          <div className="lg:col-span-3">
            {selectedItem ? (
              <div className="border border-gray-800 rounded-md p-4 bg-gray-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-white font-semibold">Prévia do item</div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1 rounded-md text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-300 break-words">
                  <span className="font-semibold text-gray-200">Link: </span>
                  {selectedItem.link}
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  <span className="font-semibold text-gray-200">Mensagem:</span>
                  <div className="mt-1">{selectedItem.message}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 border border-dashed border-gray-800 rounded-md p-4 bg-gray-900/60">
                Clique em um item para ver a mensagem que será enviada.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-black border border-gray-800 rounded-lg p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando listas...
          </div>
        ) : error ? (
          <div className="text-sm text-red-300 border border-red-800 bg-red-900/30 rounded-md p-3">
            {error}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center text-gray-400">
            Nenhuma lista encontrada.
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <button
                key={batch.documentId}
                onClick={() => handleSelectBatch(batch)}
                className="w-full text-left border border-gray-800 rounded-lg p-4 bg-gray-900 hover:border-[#7d570e] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">
                      {batch.title || "Lista de disparo"}
                    </div>
                    <div className="text-sm text-gray-400">
                      Grupo: {batch.groupName || batch.groupId}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {batch.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    Início:{" "}
                    {batch.startAt
                      ? new Date(batch.startAt).toLocaleString()
                      : "--"}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Intervalo:{" "}
                  {batch.intervalMinutes ? `${batch.intervalMinutes} min` : "--"} •{" "}
                  Itens: {batch.itemsCount ?? "--"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold text-white">
                  {selectedBatch.title || "Lista de disparo"}
                </div>
                <div className="text-sm text-gray-400">
                  Grupo: {selectedBatch.groupName || selectedBatch.groupId} • Status: {selectedBatch.status}
                </div>
                <div className="text-xs text-gray-500">
                  Início:{" "}
                  {selectedBatch.startAt
                    ? new Date(selectedBatch.startAt).toLocaleString()
                    : "--"}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  setBatchDetail(null);
                }}
                className="p-2 rounded-md text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="flex items-center gap-2 text-gray-300">
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
                    <div
                      key={campaign.documentId}
                      className="border border-gray-800 rounded-md p-3 bg-gray-900"
                    >
                      <div className="flex items-start gap-3">
                        {thumb ? (
                          <div className="relative w-12 h-12 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumb}
                              alt="Produto"
                              className="w-12 h-12 rounded-md object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                            IMG
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-300 font-semibold">
                              {campaign.groupName || campaign.groupId}
                            </div>
                            <div className="text-xs text-gray-500">
                              {campaign.statusCampaign}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-gray-200 whitespace-pre-wrap">
                            {campaign.message || ""}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Agendado:{" "}
                            {campaign.scheduledAt
                              ? new Date(campaign.scheduledAt).toLocaleString()
                              : "--"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-400">Nenhum item encontrado.</div>
            )}
          </div>
        </div>
      )}

      {/* Date modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Calendar className="w-4 h-4" />
                Definir data e hora
              </div>
              <button
                onClick={() => setShowDateModal(false)}
                className="p-2 rounded-md text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={dateField}
                  onChange={(e) => setDateField(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={timeField}
                  onChange={(e) => setTimeField(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!dateField || !timeField) {
                    setError("Informe data e hora para agendar.");
                    return;
                  }
                  const combined = new Date(`${dateField}T${timeField}:00`);
                  if (Number.isNaN(combined.getTime()) || combined.getTime() < Date.now()) {
                    setError("Escolha uma data e hora no futuro.");
                    return;
                  }
                  setStartAt(combined.toISOString());
                  setShowDateModal(false);
                }}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
              >
                Aplicar
              </button>
            </div>
            {error && (
              <div className="text-sm text-red-300 border border-red-800 bg-red-900/30 rounded-md p-2">
                {error}
              </div>
            )}
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Se não definir, usará o horário atual para enviar.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
