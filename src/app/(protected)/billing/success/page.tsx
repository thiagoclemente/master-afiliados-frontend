"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
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
  fetchPackRenewalSessionStatus,
  type PackRenewalSessionStatusResponse,
} from "@/services/billing.service";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function BillingSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] =
    useState<PackRenewalSessionStatusResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const formatDateTime = (value?: string | null): string => {
    if (!value) {
      return "Ainda processando";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Data inválida";
    }

    return date.toLocaleString("pt-BR");
  };

  const formatPaymentStatus = (value?: string | null): string => {
    switch (value) {
      case "paid":
        return "pago";
      case "unpaid":
        return "não pago";
      case "no_payment_required":
        return "sem cobrança";
      case "pending":
        return "pendente";
      default:
        return value || "pendente";
    }
  };

  const loadStatus = useCallback(async (attempt = 0) => {
    if (!sessionId) {
      setError("Sessão do checkout não encontrada.");
      setIsPolling(false);
      return;
    }

    try {
      const response = await fetchPackRenewalSessionStatus(sessionId);
      setStatus(response.data);
      setError(null);

      const shouldContinuePolling =
        !response.data.fulfilled &&
        attempt < 8 &&
        (response.data.paymentStatus === "paid" ||
          response.data.sessionStatus === "complete");

      if (shouldContinuePolling) {
        window.setTimeout(() => {
          void loadStatus(attempt + 1);
        }, 3000);
        return;
      }

      setIsPolling(false);
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
        setError("Não foi possível consultar a renovação.");
      }
      setIsPolling(false);
    }
  }, [logout, router, sessionId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  if (!sessionId) {
    return (
      <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
        <AlertTitle>Sessão inválida</AlertTitle>
        <AlertDescription>
          O Stripe não retornou o identificador da sessão para esta confirmação.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
        <AlertTitle>Falha ao confirmar renovação</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error}</p>
          <Button variant="outline" onClick={() => void loadStatus()}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              {status?.fulfilled ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin" />
              )}
            </div>
            <div>
              <CardTitle>
                {status?.fulfilled
                  ? "Renovação confirmada"
                  : "Confirmando renovação"}
              </CardTitle>
              <CardDescription>
                {status?.fulfilled
                  ? "O prazo do seu pacote já foi atualizado."
                  : "Estamos aguardando a confirmação final do Stripe e do backend."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.packName && (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-primary/50 text-primary">
                {status.packName}
              </Badge>
              <Badge variant="outline">
                Pagamento: {formatPaymentStatus(status.paymentStatus)}
              </Badge>
            </div>
          )}

          {status?.fulfilled ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
              <div className="font-medium text-emerald-200">
                Novo prazo liberado
              </div>
              <p className="mt-2 text-emerald-100/90">
                Seu pacote agora está válido até{" "}
                <strong>
                  {formatDateTime(status.accessInfo?.downloadAccessExpiresAt)}
                </strong>
                .
              </p>
            </div>
          ) : (
            <Alert className="border-amber-500/60 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-300" />
              <AlertTitle>Pagamento recebido, aguardando processamento</AlertTitle>
              <AlertDescription>
                Se esta tela não atualizar em alguns segundos, você pode tentar
                novamente ou voltar para a área de renovações.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 md:flex-row">
            <Button variant="outline" onClick={() => router.push("/billing")}>
              Voltar para renovações
            </Button>
            {status?.packDocumentId && (
              <Button
                onClick={() => router.push(`/videos?pack=${status.packDocumentId}`)}
              >
                Abrir vídeos do pacote
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {!status?.fulfilled && (
              <Button
                variant="secondary"
                onClick={() => {
                  setIsPolling(true);
                  void loadStatus();
                }}
                disabled={isPolling}
              >
                {isPolling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar status"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
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
      <BillingSuccessPageContent />
    </Suspense>
  );
}
