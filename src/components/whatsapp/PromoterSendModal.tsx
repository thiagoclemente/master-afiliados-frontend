"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Loader2, RefreshCcw, Send } from "lucide-react";
import type { useWhatsApp } from "@/hooks/use-whatsapp";
import type { WhatsAppAccount, WhatsAppGroup } from "@/interfaces/whatsapp";
import WhatsAppConnectionBanner from "@/components/whatsapp/WhatsAppConnectionBanner";

type WhatsAppHook = ReturnType<typeof useWhatsApp>;

interface Props {
  link: string;
  initialMessage: string;
  payload: Record<string, unknown>;
  onClose: () => void;
  whatsapp: WhatsAppHook;
  onSent?: (message: string) => Promise<void> | void;
}

export default function PromoterSendModal({
  link,
  initialMessage,
  payload,
  onClose,
  whatsapp,
  onSent,
}: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSessionName, setSelectedSessionName] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState(initialMessage);
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const selectedAccount = useMemo(() => {
    if (!whatsapp.selectedAccount) return null;
    return whatsapp.accounts.find(
      (acc: WhatsAppAccount) =>
        acc.sessionName === whatsapp.selectedAccount?.sessionName
    );
  }, [whatsapp.accounts, whatsapp.selectedAccount]);

  const groups = whatsapp.groups;

  useEffect(() => {
    const init = async () => {
      await whatsapp.loadConnections();
      const accountSession =
        whatsapp.selectedAccount?.sessionName ||
        whatsapp.accounts[0]?.sessionName ||
        null;
      setSelectedSessionName(accountSession);

      if (accountSession) {
        await whatsapp.selectAccount(accountSession);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const defaultGroup =
      selectedAccount?.defaultGroupId ||
      groups.find((group: WhatsAppGroup) => !!group.id)?.id ||
      null;
    setSelectedGroupId(defaultGroup ?? null);
  }, [selectedAccount, groups]);

  const handleAccountChange = async (sessionName: string) => {
    setSelectedSessionName(sessionName);
    await whatsapp.selectAccount(sessionName);
  };

  const handleRefreshGroups = async () => {
    await whatsapp.refreshGroups(true);
  };

  const handleSend = async () => {
    if (!selectedGroupId) return;
    const group = groups.find((g: WhatsAppGroup) => g.id === selectedGroupId);
    const scheduledDate =
      scheduleLater && scheduledAt ? new Date(scheduledAt) : undefined;
    try {
      await whatsapp.sendCampaign({
        link,
        groupId: selectedGroupId,
        groupName: group?.name || selectedGroupId,
        message: message.trim(),
        sendNow: !scheduleLater,
        scheduledAt: scheduledDate,
        previewPayload: payload,
      });
      await onSent?.(message.trim());
      onClose();
    } catch (err) {
      console.error("Erro ao enviar campanha WhatsApp:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-black border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold text-white">
              Enviar promoção pelo WhatsApp
            </div>
            <p className="text-gray-400 text-sm">
              Link: {link}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {whatsapp.error && (
          <div className="text-sm text-red-300 border border-red-700/50 bg-red-900/20 rounded-md p-3 mb-4">
            {whatsapp.error}
          </div>
        )}

        <div className="mb-4">
          <WhatsAppConnectionBanner whatsapp={whatsapp} />
        </div>

        {selectedAccount && whatsapp.accounts.length > 1 && (
          <div className="mb-4">
            <label className="text-sm text-gray-300 block mb-1">
              Conta WhatsApp
            </label>
            <select
              value={selectedSessionName ?? ""}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"
            >
              {whatsapp.accounts.map((account: WhatsAppAccount) => (
                <option key={account.sessionName} value={account.sessionName}>
                  {account.title?.trim() || account.sessionName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-sm text-gray-300 block">Grupo para envio</label>
            <div className="text-xs text-gray-400">
              Use o grupo padrão ou selecione outro da lista.
            </div>
          </div>
          <button
            onClick={handleRefreshGroups}
            className="text-sm flex items-center gap-1 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-md hover:border-[#7d570e]"
          >
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {whatsapp.isGroupsLoading ? (
          <div className="flex items-center gap-2 text-gray-300 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando grupos...
          </div>
        ) : groups.length ? (
          <select
            value={selectedGroupId ?? ""}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white mb-4"
          >
            {groups.map((group: WhatsAppGroup) => (
              <option key={group.id} value={group.id}>
                {group.name || group.id}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-gray-300 mb-4">
            Nenhum grupo disponível. Sincronize na página de integração.
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-300 block">Mensagem</label>
            <button
              onClick={() => setMessage(initialMessage)}
              className="text-sm flex items-center gap-1 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-md hover:border-[#7d570e]"
            >
              Restaurar
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white resize-none"
          />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="flex items-center gap-2 text-gray-200">
            <input
              type="checkbox"
              checked={scheduleLater}
              onChange={(e) => setScheduleLater(e.target.checked)}
              className="w-4 h-4"
            />
            Agendar envio
          </label>
          {scheduleLater && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-300" />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={
              !message.trim() ||
              !selectedGroupId ||
              whatsapp.isSending ||
              whatsapp.isGroupsLoading ||
              whatsapp.hasConnectionIssue
            }
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {whatsapp.isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {scheduleLater ? "Agendar envio" : "Enviar agora"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
