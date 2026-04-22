"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, Loader2, QrCode, RefreshCcw, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import type { useWhatsApp } from "@/hooks/use-whatsapp";

type WhatsAppHook = ReturnType<typeof useWhatsApp>;

interface Props {
  whatsapp: WhatsAppHook;
}

/**
 * A reusable banner that alerts the user when their WhatsApp connection
 * has an issue (error/disconnected) and offers a one-tap restart.
 *
 * Shows inline QR Code after restart so the user can scan immediately.
 * Auto-hides when the connection returns to "connected".
 */
export default function WhatsAppConnectionBanner({ whatsapp }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const account = whatsapp.selectedAccount;

  if (!account || whatsapp.accounts.length === 0) return null;

  const status = account.statusConnection;
  const isPending = status === "pending" && !whatsapp.isRestarting;
  const isError = status === "error" || status === "disconnected";

  if (!isError && !isPending) return null;

  const handleRestart = async () => {
    setShowConfirm(false);
    try {
      await whatsapp.restartConnection(account.sessionName);
    } catch {
      // Error is handled by the hook
    }
  };

  const renderQrCode = () => {
    if (!account.qrCode) return null;
    const src = account.qrCode.startsWith("data:")
      ? account.qrCode
      : `data:image/png;base64,${account.qrCode}`;

    return (
      <div className="mt-3 flex flex-col items-center gap-2">
        <div className="inline-block rounded-xl border border-amber-400 bg-white p-3">
          <Image
            src={src}
            alt="QR Code do WhatsApp"
            width={180}
            height={180}
            className="h-44 w-44 object-contain"
            unoptimized
          />
        </div>
        <p className="text-xs font-medium text-amber-800">
          Abra o WhatsApp → Aparelhos conectados → Conectar um aparelho
        </p>
      </div>
    );
  };

  // Confirmation dialog
  if (showConfirm) {
    return (
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm">
        <p className="mb-1 text-sm font-bold text-amber-900">
          Reconectar WhatsApp?
        </p>
        <p className="mb-3 text-sm text-amber-800">
          A sessão atual será encerrada e uma nova será criada. Você precisará
          escanear o QR Code novamente.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Confirmar
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Pending state — show QR code
  if (isPending) {
    return (
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Escaneie o QR Code
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Escaneie o QR Code abaixo com o WhatsApp para finalizar a
              reconexão.
            </p>
          </div>
        </div>
        {renderQrCode()}
      </div>
    );
  }

  // Error / disconnected state
  return (
    <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-red-900">
            Conexão com problema
          </p>
          <p className="mt-1 text-sm text-red-800">
            {whatsapp.connectionIssueMessage}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={whatsapp.isRestarting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {whatsapp.isRestarting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reiniciando...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Reconectar
            </>
          )}
        </button>
        <button
          onClick={() => router.push("/profile/whatsapp")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Detalhes
        </button>
      </div>
    </div>
  );
}

