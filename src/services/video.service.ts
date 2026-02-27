import qs from "qs";
import { authFetch } from "@/lib/auth";
import { ImageInterface } from "@/interfaces/image.interface";
import { Pack } from "@/interfaces/pack";
import { Category } from "@/interfaces/category";

interface VideoStreamingFile {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: Record<string, unknown> | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Video {
  id: number;
  documentId: string;
  title: string;
  link: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  videoStreamingFiles?: VideoStreamingFile[];
  pack: Pack;
  category: Category;
  coverImage: ImageInterface;
  search_text: string;
}

interface VideoResponse {
  data: Video[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export async function fetchVideos(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  id?: string,
  packId?: string,
  categoryId?: number,
  sortBy?: "newest" | "oldest" | "name"
) {
  // Determine sort order
  let sortOrder: string;
  switch (sortBy) {
    case "oldest":
      sortOrder = "createdAt:ASC";
      break;
    case "name":
      sortOrder = "title:ASC";
      break;
    case "newest":
    default:
      sortOrder = "createdAt:DESC";
      break;
  }

  const query = qs.stringify(
    {
      populate: ["category", "videoStreamingFiles", "pack.image", "links", "coverImage"],
      sort: [sortOrder],
      pagination: {
        page,
        pageSize,
      },
      filters: {
        ...(search
          ? {
              search_text: {
                $containsi: search,
              },
            }
          : {}),
        ...(id
          ? {
              documentId: {
                $eq: id,
              },
            }
          : {}),
        ...(packId
          ? {
              pack: {
                documentId: {
                  $eq: packId,
                },
              },
            }
          : {}),
        ...(categoryId && categoryId > 0
          ? {
              category: {
                id: {
                  $eq: categoryId,
                },
              },
            }
          : {}),
      },
    },
    {
      encodeValuesOnly: true,
    }
  );

  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/videos?${query}`,
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
    throw new Error("Failed to fetch videos");
  }

  return response.json() as Promise<VideoResponse>;
}

export async function fetchVideoCategories() {
  const query = qs.stringify({
    sort: "name:ASC",
  });

  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/video-categories?${query}`,
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
    throw new Error("Failed to fetch video categories");
  }

  const result = await response.json();
  return result.data;
}

export function resolveVideoStreamingUrl(video: Video): string | null {
  const files = video.videoStreamingFiles ?? [];
  if (!files.length) return null;

  const m3u8 = files.find((file) => file.ext === ".m3u8");
  const mp4 = files.find((file) => file.ext === ".mp4");
  const fallback = m3u8 ?? mp4 ?? files[0];

  if (!fallback?.url) return null;
  if (fallback.url.startsWith("http")) return fallback.url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL}${fallback.url}`;
}

export async function fetchProtectedVideoDownloadUrl(
  videoDocumentId: string
): Promise<string> {
  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/videos/download/${videoDocumentId}`,
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

    let errorMessage = "Não foi possível baixar o vídeo no momento.";
    try {
      const errorData = (await response.json()) as {
        message?: string;
        error?: { message?: string };
      };
      errorMessage =
        errorData?.error?.message ||
        errorData?.message ||
        errorMessage;
    } catch {
      // mantém fallback
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    throw new Error("Protected download URL not available");
  }

  if (data.url.startsWith("http")) return data.url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL}${data.url}`;
}
