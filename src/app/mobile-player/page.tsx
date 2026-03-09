import { headers } from "next/headers";
import MobilePlayerClient from "./player-client";

export const dynamic = "force-dynamic";

type SearchParams = {
  videoDocumentId?: string | string[];
  premium?: string | string[];
};

function firstValue(value?: string | string[]): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function resolveAbsoluteUrl(baseUrl: string, url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${baseUrl}${url}`;
}

export default async function MobilePlayerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const videoDocumentId = firstValue(params.videoDocumentId).trim();
  const premium = firstValue(params.premium).trim() == "1";
  const authHeader = (await headers()).get("authorization") ?? "";
  const strapiBaseUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";

  if (!videoDocumentId) {
    return (
      <MobilePlayerClient
        errorMessage="Parâmetro videoDocumentId não informado."
      />
    );
  }

  if (!authHeader) {
    return (
      <MobilePlayerClient
        errorMessage="Sessão inválida. Abra novamente pelo aplicativo."
      />
    );
  }

  if (!strapiBaseUrl) {
    return (
      <MobilePlayerClient
        errorMessage="Configuração de ambiente indisponível."
      />
    );
  }

  const endpoint = premium ? "premium-videos" : "videos";
  const playbackUrl = `${strapiBaseUrl}/api/${endpoint}/playback/${videoDocumentId}`;

  try {
    const response = await fetch(playbackUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return (
        <MobilePlayerClient
          errorMessage={`Erro ao carregar vídeo (${response.status}).`}
        />
      );
    }

    const data = (await response.json()) as { url?: string };
    const url = (data.url ?? "").trim();

    if (!url) {
      return (
        <MobilePlayerClient
          errorMessage="URL de reprodução não encontrada."
        />
      );
    }

    return (
      <MobilePlayerClient playbackUrl={resolveAbsoluteUrl(strapiBaseUrl, url)} />
    );
  } catch {
    return (
      <MobilePlayerClient
        errorMessage="Erro de conexão ao resolver o vídeo."
      />
    );
  }
}
