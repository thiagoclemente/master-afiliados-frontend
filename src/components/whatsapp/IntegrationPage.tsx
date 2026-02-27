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
import { useRouter } from "next/navigation";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import type { WhatsAppAccount, WhatsAppGroup } from "@/interfaces/whatsapp";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    connected: { label: "Conectado", className: "border-emerald-500/60 text-emerald-300" },
    pending: { label: "Aguardando", className: "border-amber-500/60 text-amber-300" },
    processing: { label: "Processando", className: "border-amber-500/60 text-amber-300" },
    failed: { label: "Erro", className: "border-rose-500/60 text-rose-300" },
    error: { label: "Erro", className: "border-rose-500/60 text-rose-300" },
  };

  const styles = map[status] ?? {
    label: status || "Desconhecido",
    className: "border-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={styles.className}>
      {styles.label}
    </Badge>
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
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando grupos...
      </div>
    );
  }

  if (!groups.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum grupo encontrado. Sincronize para trazer a lista mais recente.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isDefault = group.id === defaultGroupId;
        return (
          <Card key={group.id} className={isDefault ? "border-emerald-500/60" : ""}>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{group.name || group.id}</p>
                <p className="truncate text-xs text-muted-foreground">{group.id}</p>
              </div>
              <Button
                onClick={() => onSelectDefault(group)}
                size="sm"
                variant={isDefault ? "default" : "outline"}
                className={isDefault ? "bg-emerald-600 text-white hover:bg-emerald-500" : ""}
              >
                {isDefault ? "Padrão" : "Definir padrão"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function IntegrationPage() {
  const whatsapp = useWhatsApp();
  const router = useRouter();
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
        <p className="mb-2 text-sm text-muted-foreground">
          Escaneie o QR Code no WhatsApp Web para finalizar a conexão.
        </p>
        <div className="inline-block rounded-lg bg-white p-4">
          <Image
            src={src}
            alt="QR Code do WhatsApp"
            width={192}
            height={192}
            className="h-48 w-48 object-contain"
            unoptimized
          />
        </div>
      </div>
    );
  };

  const renderAccountCard = (account: WhatsAppAccount) => {
    const isSelected = account.sessionName === selectedAccount?.sessionName;
    return (
      <Card key={account.sessionName} className={isSelected ? "border-emerald-500/60" : ""}>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{account.title?.trim() || account.sessionName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {account.phoneNumber || "Sessão"} • {account.sessionName}
                </p>
                <div className="mt-1">
                  <StatusBadge status={account.statusConnection} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => handleSelectAccount(account)}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className={isSelected ? "bg-emerald-600 text-white hover:bg-emerald-500" : ""}
              >
                {isSelected ? "Selecionada" : "Selecionar"}
              </Button>
              <Button
                onClick={whatsapp.disconnect}
                size="sm"
                variant="outline"
                className="border-rose-500/60 text-rose-300 hover:bg-rose-500/10"
              >
                Desconectar
              </Button>
            </div>
          </div>
          {isSelected && renderQrCode(account)}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle>Integração WhatsApp</CardTitle>
              <CardDescription>Conecte sessões e escolha grupos para disparos.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {whatsapp.error && (
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle>Erro na integração</AlertTitle>
          <AlertDescription className="text-destructive/90">{whatsapp.error}</AlertDescription>
        </Alert>
      )}

      {whatsapp.hasAccess === false ? (
        <Alert className="border-rose-500/50 bg-rose-500/10">
          <XCircle className="h-4 w-4 text-rose-300" />
          <AlertTitle className="text-rose-200">Integração restrita</AlertTitle>
          <AlertDescription className="space-y-3 text-rose-100">
            <p>Disponível apenas para assinantes Master Premium ou Divulgador Master.</p>
            <Button asChild className="w-fit">
              <a href="https://masterafiliados.com.br" target="_blank" rel="noreferrer">
                Conhecer planos
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-primary" />
                  Conectar nova sessão
                </CardTitle>
                <CardDescription>
                  Dê um nome para identificar sua conta (ex: Vendas, Suporte).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Nome da sessão"
                  className="h-10"
                />
                <Button
                  onClick={handleConnect}
                  disabled={!sessionName.trim() || whatsapp.isLoading}
                >
                  {whatsapp.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    "Criar sessão"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wifi className="h-4 w-4 text-primary" />
                      Sessões
                    </CardTitle>
                    <CardDescription>
                      Selecione a conta para gerenciar grupos e disparos.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => whatsapp.loadConnections()}>
                    <RefreshCcw className="h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {whatsapp.isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando sessões...
                  </div>
                )}

                {!whatsapp.isLoading && whatsapp.accounts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma sessão criada. Conecte uma nova sessão para começar.
                  </p>
                )}

                <div className="space-y-3">
                  {whatsapp.accounts.map((account) => renderAccountCard(account))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Grupos</CardTitle>
                  <CardDescription>Sincronize e defina o grupo padrão para disparos.</CardDescription>
                </div>
                <Button
                  onClick={handleRefreshGroups}
                  disabled={!selectedAccount || whatsapp.isGroupsLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAccount ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedAccount.defaultGroupName ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Grupo padrão: {selectedAccount.defaultGroupName}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-amber-400" />
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

                  <Button onClick={handleSync} disabled={whatsapp.isLoading} variant="outline" className="w-full">
                    {whatsapp.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      "Sincronizar status"
                    )}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione uma sessão para visualizar grupos.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
