import qs from "qs";
import { authFetch } from "@/lib/auth";
import type {
  PremiumVideo,
  PremiumVideoDetailResponse,
  PremiumVideoResponse,
} from "@/interfaces/premium-video";

export const PREMIUM_VIDEO_TYPE_SLUGS = [
  "bombando-na-shopee",
  "videos-de-ia",
] as const;

export type PremiumVideoTypeSlug = (typeof PREMIUM_VIDEO_TYPE_SLUGS)[number];

type PremiumVideoTypeMeta = {
  slug: PremiumVideoTypeSlug;
  apiType: string;
  title: string;
  shortTitle: string;
  description: string;
};

export const PREMIUM_VIDEO_TYPE_META: Record<
  PremiumVideoTypeSlug,
  PremiumVideoTypeMeta
> = {
  "bombando-na-shopee": {
    slug: "bombando-na-shopee",
    apiType: "TRENDING_ON_SHOPPE",
    title: "Bombando na Shopee",
    shortTitle: "Bombando",
    description: "Vídeos premium com foco em ofertas e produtos em alta.",
  },
  "videos-de-ia": {
    slug: "videos-de-ia",
    apiType: "CREATED_BY_IA",
    title: "Vídeos de IA",
    shortTitle: "Vídeos de IA",
    description: "Conteúdos premium criados com inteligência artificial.",
  },
};

function getStrapiUrl() {
  return process.env.NEXT_PUBLIC_STRAPI_URL;
}

function buildMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${getStrapiUrl()}${url}`;
}

export function isPremiumVideoTypeSlug(value: string): value is PremiumVideoTypeSlug {
  return PREMIUM_VIDEO_TYPE_SLUGS.includes(value as PremiumVideoTypeSlug);
}

export function getPremiumVideoTypeMeta(slug: PremiumVideoTypeSlug) {
  return PREMIUM_VIDEO_TYPE_META[slug];
}

export function resolvePremiumVideoCover(video: PremiumVideo): string | null {
  const cover =
    video.image ||
    video.covers?.[0] ||
    video.shopeeImageProduct ||
    null;

  if (!cover) return null;

  return (
    buildMediaUrl(cover.formats?.large?.url) ||
    buildMediaUrl(cover.formats?.medium?.url) ||
    buildMediaUrl(cover.formats?.small?.url) ||
    buildMediaUrl(cover.url)
  );
}

export function resolvePremiumVideoStreamingUrl(video: PremiumVideo): string | null {
  const files = video.videoStreamingFiles ?? [];
  if (!files.length) return null;

  const m3u8 = files.find((file) => file.ext === ".m3u8");
  const mp4 = files.find((file) => file.ext === ".mp4");
  const fallback = m3u8 ?? mp4 ?? files[0];

  return buildMediaUrl(fallback?.url);
}

export function getPremiumVideoLinks(video: PremiumVideo): string[] {
  return (video.links ?? [])
    .map((item) => item.url || item.link || item.text || null)
    .filter((value): value is string => Boolean(value));
}

export async function fetchPremiumVideos({
  page = 1,
  pageSize = 20,
  search,
  typeSlug,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  typeSlug: PremiumVideoTypeSlug;
}): Promise<PremiumVideoResponse> {
  const meta = getPremiumVideoTypeMeta(typeSlug);
  const query = qs.stringify(
    {
      populate: [
        "categories",
        "links",
        "image",
        "videoStreamingFiles",
        "covers",
        "shopeeImageProduct",
      ],
      sort: ["createdAt:DESC"],
      pagination: {
        page,
        pageSize,
      },
      filters: {
        type: {
          $eq: meta.apiType,
        },
        ...(search
          ? {
              search_text: {
                $containsi: search,
              },
            }
          : {}),
      },
    },
    { encodeValuesOnly: true }
  );

  const response = await authFetch(
    `${getStrapiUrl()}/api/premium-videos?${query}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    throw new Error("Failed to fetch premium videos");
  }

  return response.json() as Promise<PremiumVideoResponse>;
}

export async function fetchPremiumVideo(documentId: string): Promise<PremiumVideo> {
  const query = qs.stringify(
    {
      populate: [
        "categories",
        "links",
        "image",
        "videoStreamingFiles",
        "covers",
        "shopeeImageProduct",
      ],
    },
    { encodeValuesOnly: true }
  );

  const response = await authFetch(
    `${getStrapiUrl()}/api/premium-videos/${documentId}?${query}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    if (response.status === 404) {
      throw new Error("Premium video not found");
    }
    throw new Error("Failed to fetch premium video");
  }

  const result = (await response.json()) as PremiumVideoDetailResponse;
  return result.data;
}

export async function fetchPremiumVideoPlaybackUrl(
  documentId: string
): Promise<string> {
  const response = await authFetch(
    `${getStrapiUrl()}/api/premium-videos/playback/${documentId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }

    let errorMessage = "Não foi possível reproduzir o vídeo premium.";
    try {
      const errorData = (await response.json()) as {
        message?: string;
        error?: { message?: string };
      };
      errorMessage = errorData?.error?.message || errorData?.message || errorMessage;
    } catch {
      // noop
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    throw new Error("Premium playback URL not available");
  }

  return buildMediaUrl(data.url) ?? data.url;
}

export async function fetchPremiumVideoDownloadUrl(
  documentId: string
): Promise<string> {
  const response = await authFetch(
    `${getStrapiUrl()}/api/premium-videos/download/${documentId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }

    let errorMessage = "Não foi possível baixar o vídeo premium no momento.";
    try {
      const errorData = (await response.json()) as {
        message?: string;
        error?: { message?: string };
      };
      errorMessage = errorData?.error?.message || errorData?.message || errorMessage;
    } catch {
      // noop
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    throw new Error("Premium download URL not available");
  }

  return buildMediaUrl(data.url) ?? data.url;
}
