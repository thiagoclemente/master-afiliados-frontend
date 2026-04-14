"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
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
import {
  createPackRenewalCheckoutSession,
  fetchPackRenewalOffer,
  type PackRenewalOffer,
} from "@/services/billing.service";
import { fetchUserPacks, type UserPack } from "@/services/user-pack.service";
import {
  fetchUserSubscriptions,
  isSubscriptionPremium,
} from "@/services/user-subscription.service";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CreditCard,
  Loader2,
  ShieldCheck,
} from "lucide-react";

function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPacks, setUserPacks] = useState<UserPack[]>([]);
  const [renewalOffer, setRenewalOffer] = useState<PackRenewalOffer | null>(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [processingUserPackId, setProcessingUserPackId] = useState<string | null>(
    null,
  );

  const highlightedPackDocumentId = searchParams.get("pack");
  const renewalState = searchParams.get("renewal");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [packsResponse, subscriptionsResponse, renewalOfferResponse] =
        await Promise.all([
          fetchUserPacks(),
          fetchUserSubscriptions(),
          fetchPackRenewalOffer(),
        ]);

      setUserPacks(packsResponse.data || []);
      setHasPremiumAccess(isSubscriptionPremium(subscriptionsResponse.data || []));
      setRenewalOffer(renewalOfferResponse.data);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message === "Authentication failed" ||
          err.message === "Authentication required"
        ) {
          logout();
          router.push("/login");
          return;
        }

        setError(err.message);
      } else {
        setError("Não foi possível carregar suas renovações.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sortedPacks = useMemo(() => {
    return [...userPacks].sort((left, right) => {
      const leftExpired = left.downloadAccessExpired ? 1 : 0;
      const rightExpired = right.downloadAccessExpired ? 1 : 0;

      if (leftExpired !== rightExpired) {
        return rightExpired - leftExpired;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [userPacks]);

  const formatDateTime = (value?: string | null): string => {
    if (!value) {
      return "Ainda não definido";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Data inválida";
    }

    return date.toLocaleString("pt-BR");
  };

  const handleCheckout = async (userPackDocumentId: string) => {
    try {
      setProcessingUserPackId(userPackDocumentId);
      const response = await createPackRenewalCheckoutSession(userPackDocumentId);
      window.location.assign(response.data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar o checkout da renovação.",
      );
      setProcessingUserPackId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando renovações...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
        <AlertTitle>Falha ao carregar renovações</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error}</p>
          <Button variant="outline" onClick={() => void loadData()}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const durationLabel = renewalOffer?.durationLabel || "1 ano";
  const highlightedPriceLabel =
    renewalOffer?.priceLabel || "Valor no pagamento";

  return (
    <div className="space-y-6">
      {renewalState === "cancelled" && (
        <Alert className="border-amber-500/60 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertTitle>Pagamento cancelado</AlertTitle>
          <AlertDescription>
            O pagamento foi cancelado. Nenhuma renovação foi aplicada ao seu pacote.
          </AlertDescription>
        </Alert>
      )}

      {hasPremiumAccess && (
        <Alert className="border-sky-500/60 bg-sky-500/10">
          <ShieldCheck className="h-4 w-4 text-sky-300" />
          <AlertTitle>Master Premium ativo</AlertTitle>
          <AlertDescription>
            Sua assinatura Master Premium libera os downloads mesmo se o pacote
            estiver expirado. A renovação do pacote só volta a ser necessária se
            sua assinatura encerrar.
          </AlertDescription>
        </Alert>
      )}

      {!renewalOffer?.enabled && (
        <Alert className="border-amber-500/60 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertTitle>Renovação temporariamente indisponível</AlertTitle>
          <AlertDescription>
            A renovação ainda não está disponível no momento. Tente novamente em
            instantes.
          </AlertDescription>
        </Alert>
      )}

      {sortedPacks.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Nenhum pacote encontrado</p>
              <p className="text-sm text-muted-foreground">
                Esta área mostra apenas pacotes já adquiridos pelo usuário.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/combos")}>
              Ver pacotes disponíveis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedPacks.map((userPack) => {
            const isHighlighted =
              highlightedPackDocumentId &&
              (userPack.pack.documentId === highlightedPackDocumentId ||
                userPack.documentId === highlightedPackDocumentId);
            const isExpired = Boolean(userPack.downloadAccessExpired);
            const isProcessing = processingUserPackId === userPack.documentId;
            const buttonLabel = isExpired
              ? `Renovar por mais ${renewalOffer?.durationLabel || "1 ano"}`
              : "Antecipar renovação";

            return (
              <Card
                key={userPack.documentId}
                className={
                  isHighlighted
                    ? "overflow-hidden border-primary/60 bg-[#191919] shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_24px_60px_rgba(0,0,0,0.28)]"
                    : "overflow-hidden border-white/15 bg-[#171717] shadow-[0_18px_48px_rgba(0,0,0,0.22)]"
                }
              >
                <CardHeader className="gap-4 border-b border-white/10 bg-white/[0.05] md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <CardTitle>{userPack.pack.name}</CardTitle>
                    <CardDescription>
                      {userPack.pack.description ||
                        "Pacote adquirido pelo usuário para acesso aos vídeos."}
                    </CardDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      isExpired
                        ? "border-amber-500/60 text-amber-200"
                        : "border-emerald-500/60 text-emerald-300"
                    }
                  >
                    {isExpired ? "Acesso expirado" : "Acesso ativo"}
                  </Badge>
                </CardHeader>

                <CardContent className="py-5">
                  <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_292px]">
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/15 bg-white/[0.10] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className="text-xs uppercase tracking-wide text-zinc-400">
                            Comprado em
                          </div>
                          <div className="mt-2 text-sm font-medium text-zinc-100">
                            {formatDateTime(userPack.createdAt)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/15 bg-white/[0.10] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Válido até
                          </div>
                          <div className="mt-2 text-sm font-medium text-zinc-100">
                            {formatDateTime(userPack.downloadAccessExpiresAt)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/15 bg-white/[0.10] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className="text-xs uppercase tracking-wide text-zinc-400">
                            Última renovação
                          </div>
                          <div className="mt-2 text-sm font-medium text-zinc-100">
                            {userPack.lastRenewedAt
                              ? formatDateTime(userPack.lastRenewedAt)
                              : "Ainda não renovado"}
                          </div>
                        </div>
                      </div>

                      {userPack.supportMessage && (
                        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-50">
                          <AlertCircle className="h-4 w-4 text-amber-300" />
                          <AlertTitle>Atualizações bloqueadas</AlertTitle>
                          <AlertDescription>{userPack.supportMessage}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="self-start rounded-[24px] border border-zinc-200/80 bg-zinc-50 p-5 text-zinc-950 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        Renovação
                      </div>
                      <div className="mt-2 text-sm text-zinc-600">
                        Mais {durationLabel.toLowerCase()} para este pacote
                      </div>
                      <div className="mt-4 text-[2.15rem] font-semibold tracking-tight text-zinc-950">
                        {highlightedPriceLabel}
                      </div>

                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                        <div className="text-sm font-medium text-zinc-900">
                          {isExpired ? "Acesso expirado" : "Acesso ativo"}
                        </div>
                        <div className="mt-1 text-sm text-zinc-600">
                          {userPack.lastRenewedAt
                            ? `Última renovação em ${formatDateTime(userPack.lastRenewedAt)}`
                            : "Ainda não renovado"}
                        </div>
                      </div>

                      <div className="mt-4">
                        {hasPremiumAccess ? (
                          <Button
                            disabled
                            className="h-12 w-full rounded-xl bg-zinc-200 text-zinc-600"
                          >
                            Coberto pela Master Premium
                          </Button>
                        ) : (
                          <Button
                            onClick={() => void handleCheckout(userPack.documentId)}
                            disabled={!renewalOffer?.enabled || isProcessing}
                            className="h-12 w-full rounded-xl bg-zinc-950 text-base text-white hover:bg-zinc-800"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Redirecionando...
                              </>
                            ) : (
                              <>
                                {buttonLabel}
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
