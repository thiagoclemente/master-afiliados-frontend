"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Chrome, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ma_extension_banner_dismissed_v1";
const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/anncedlkbdpopoffhfjkcpnplgempihf";

export default function ExtensionInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
      setIsVisible(!dismissed);
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm sm:block">
            <Image
              src="/logo.png"
              alt="Master Afiliados"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-sky-700">
                Novidade: extensão do Divulgador Master
              </div>
              <div className="text-sm text-slate-700 sm:text-base">
                Capture produtos do Mercado Livre e envie para seus rascunhos com{" "}
                <span className="font-semibold">1 clique</span> direto do navegador.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white">
                <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Instalar extensão
                </a>
              </Button>

              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                <Chrome className="h-3.5 w-3.5 text-sky-600" />
                Google Chrome
              </div>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-slate-500 hover:text-slate-900"
          onClick={handleDismiss}
          aria-label="Fechar aviso da extensão"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
