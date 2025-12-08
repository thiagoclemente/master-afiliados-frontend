"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCcw,
  Smartphone,
  Wifi,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import type { WhatsAppAccount, WhatsAppGroup } from "@/interfaces/whatsapp";

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; color: string; text: string }
  > = {
    connected: {
      label: "Conectado",
      color: "bg-emerald-500/10 border-emerald-500/50",
      text: "text-emerald-400",
    },
    pending: {
      label: "Aguardando",
      color: "bg-amber-500/10 border-amber-500/40",
      text: "text-amber-300",
    },
    processing: {
      label: "Processando",
      color: "bg-amber-500/10 border-amber-500/40",
      text: "text-amber-300",
    },
    failed: {
      label: "Erro",
      color: "bg-red-500/10 border-red-500/40",
      text: "text-red-300",
    },
    error: {
      label: "Erro",
      color: "bg-red-500/10 border-red-500/40",
      text: "text-red-300",
    },
  };

  const fallback = {
    label: status,
    color: "bg-gray-700/70 border-gray-600",
    text: "text-gray-200",
  };

  const styles = map[status] ?? fallback;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles.color} ${styles.text}`}
    >
      <span className="h-2 w-2 rounded-full bg-current mr-2" />
      {styles.label}
    </span>
  );
}

function GroupList({
  groups,
  defaultGroupId,
  onSelectDefault,
  isLoading,
}: {
  groups: WhatsAppGroup[];
  defaultGroupId?: string | null;
  onSelectDefault: (group: WhatsAppGroup) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-300">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando grupos...
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="text-gray-400">
        Nenhum grupo encontrado. Sincronize para trazer a lista mais recente.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isDefault = group.id === defaultGroupId;
        return (
          <div
            key={group.id}
            className={`border rounded-lg px-4 py-3 bg-gray-900/60 flex items-center justify-between ${
              isDefault ? "border-emerald-600" : "border-gray-800"
            }`}
          >
            <div>
              <div className="text-white font-semibold">
                {group.name || group.id}
              </div>
              <div className="text-xs text-gray-400">{group.id}</div>
            </div>
            <button
              onClick={() => onSelectDefault(group)}
              className={`text-sm px-3 py-2 rounded-md border ${
                isDefault
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "text-gray-200 border-gray-700 hover:border-emerald-500 hover:text-white"
              }`}
            >
              {isDefault ? "Padrão" : "Definir padrão"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function IntegrationPage() {
  const whatsapp = useWhatsApp();
  const [sessionName, setSessionName] = useState("");

  useEffect(() => {
    whatsapp.loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAccount = useMemo(() => {
    if (!whatsapp.selectedAccount) return null;
    return whatsapp.accounts.find(
      (acc) => acc.sessionName === whatsapp.selectedAccount?.sessionName
    );
  }, [whatsapp.accounts, whatsapp.selectedAccount]);

  const handleConnect = async () => {
    if (!sessionName.trim()) return;
    await whatsapp.connectAccount(sessionName.trim());
    setSessionName("");
  };

  const handleSelectAccount = async (account: WhatsAppAccount) => {
    await whatsapp.selectAccount(account.sessionName);
  };

  const handleSync = async () => {
    await whatsapp.syncAccount();
  };

  const handleRefreshGroups = async () => {
    await whatsapp.refreshGroups(true);
  };

  const handleSetDefault = async (group: WhatsAppGroup) => {
    await whatsapp.defineDefaultGroup(group);
  };

  const renderQrCode = (account: WhatsAppAccount) => {
    if (!account.qrCode) return null;
    const src = account.qrCode.startsWith("data:")
      ? account.qrCode
      : `data:image/png;base64,${account.qrCode}`;

    return (
      <div className="mt-4">
        <div className="text-sm text-gray-300 mb-2">
          Escaneie o QR Code no WhatsApp Web para finalizar a conexão.
        </div>
        <div className="bg-white p-4 rounded-lg inline-block">
          <Image
            src={src}
            alt="QR Code do WhatsApp"
            width={192}
            height={192}
            className="w-48 h-48 object-contain"
            unoptimized
          />
        </div>
      </div>
    );
  };

  const renderAccountCard = (account: WhatsAppAccount) => {
    const isSelected = account.sessionName === selectedAccount?.sessionName;
    return (
      <div
        key={account.sessionName}
        className={`p-4 rounded-lg border transition-colors ${
          isSelected ? "border-emerald-600" : "border-gray-800"
        } bg-gray-900/60`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-300">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-semibold">
                {account.title?.trim() || account.sessionName}
              </div>
              <div className="text-xs text-gray-400">
                {account.phoneNumber || "Sessão"} • {account.sessionName}
              </div>
              <div className="mt-1">
                <StatusBadge status={account.statusConnection} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAccount(account)}
              className={`px-3 py-2 text-sm rounded-md border ${
                isSelected
                  ? "border-emerald-500 text-emerald-200 bg-emerald-500/10"
                  : "border-gray-700 text-gray-200 hover:border-emerald-500"
              }`}
            >
              {isSelected ? "Selecionada" : "Selecionar"}
            </button>
            <button
              onClick={whatsapp.disconnect}
              className="px-3 py-2 text-sm rounded-md border border-red-700 text-red-200 hover:bg-red-900/30"
            >
              Desconectar
            </button>
          </div>
        </div>
        {isSelected && renderQrCode(account)}
      </div>
    );
  };

  const renderHeader = () => (
    <div className="bg-black shadow rounded-lg p-6 border border-gray-800 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.back()}
            className="text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Integração WhatsApp</h1>
            <p className="text-gray-300">
              Conecte suas sessões e escolha grupos para disparos.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );

  const renderAccessError = () => (
    <div className="bg-black border border-red-700/60 rounded-lg p-6 text-center">
      <div className="flex items-center justify-center gap-2 text-red-300 mb-2">
        <XCircle className="w-6 h-6" />
        <span>Integração restrita</span>
      </div>
      <p className="text-gray-300 mb-4">
        Disponível apenas para assinantes Master Premium ou Divulgador Master.
      </p>
      <a
        href="https://masterafiliados.com.br"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center px-4 py-2 bg-[#7d570e] text-white rounded-md hover:bg-[#6b4a0c] transition-colors"
      >
        Conhecer planos
      </a>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderHeader()}

      {whatsapp.error && (
        <div className="bg-black border border-red-800 rounded-lg p-4 text-red-300">
          {whatsapp.error}
        </div>
      )}

      {whatsapp.hasAccess === false ? (
        renderAccessError()
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black border border-gray-800 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Plus className="w-5 h-5 text-[#7d570e]" />
                  <div>
                    <div className="text-white font-semibold">
                      Conectar nova sessão
                    </div>
                    <p className="text-gray-400 text-sm">
                      Dê um nome para identificar sua conta (ex: Vendas, Suporte).
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Nome da sessão"
                    className="flex-1 px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#7d570e]"
                  />
                  <button
                    onClick={handleConnect}
                    disabled={!sessionName.trim() || whatsapp.isLoading}
                    className="px-4 py-2 bg-[#7d570e] text-white rounded-md hover:bg-[#6b4a0c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {whatsapp.isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando...
                      </span>
                    ) : (
                      "Criar sessão"
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-black border border-gray-800 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-[#7d570e]" />
                    <div>
                      <div className="text-white font-semibold">Sessões</div>
                      <p className="text-gray-400 text-sm">
                        Selecione a conta para gerenciar grupos e disparos.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => whatsapp.loadConnections()}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e]"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Atualizar
                  </button>
                </div>

                {whatsapp.isLoading && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando sessões...
                  </div>
                )}

                {!whatsapp.isLoading && whatsapp.accounts.length === 0 && (
                  <div className="text-gray-400">
                    Nenhuma sessão criada. Conecte uma nova sessão para começar.
                  </div>
                )}

                <div className="space-y-3">
                  {whatsapp.accounts.map((account) => renderAccountCard(account))}
                </div>
              </div>
            </div>

            <div className="bg-black border border-gray-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">Grupos</div>
                  <p className="text-gray-400 text-sm">
                    Sincronize e defina o grupo padrão para disparos.
                  </p>
                </div>
                <button
                  onClick={handleRefreshGroups}
                  disabled={!selectedAccount || whatsapp.isGroupsLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Atualizar
                </button>
              </div>

              {selectedAccount ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    {selectedAccount.defaultGroupName ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          Grupo padrão: {selectedAccount.defaultGroupName}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-400" />
                        <span>Nenhum grupo padrão selecionado</span>
                      </>
                    )}
                  </div>

                  <GroupList
                    groups={whatsapp.groups}
                    defaultGroupId={selectedAccount.defaultGroupId}
                    onSelectDefault={handleSetDefault}
                    isLoading={whatsapp.isGroupsLoading}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSync}
                      disabled={whatsapp.isLoading}
                      className="flex-1 px-3 py-2 rounded-md border border-gray-700 text-gray-200 hover:border-[#7d570e] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {whatsapp.isLoading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sincronizando...
                        </span>
                      ) : (
                        "Sincronizar status"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-gray-400">
                  Selecione uma sessão para visualizar grupos.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
