import qs from "qs";
import { getAuthToken } from "@/lib/auth";
import { ImageInterface } from "@/interfaces/image.interface";
import { Pack } from "@/interfaces/pack";
import { Category } from "@/interfaces/category";

interface VideoFormat {
  url: string;
  ext: string;
  size: number;
  mime: string;
}

interface VideoModel {
  id: number;
  url: string;
  formats: {
    thumbnail: VideoFormat;
  };
}

export interface Video {
  id: number;
  documentId: string;
  title: string;
  link: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  video: VideoModel;
  pack: Pack;
  category: Category;
  coverImage: ImageInterface;
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
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

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
      populate: ["category", "video", "pack.image", "links", "coverImage"],
      sort: [sortOrder],
      pagination: {
        page,
        pageSize,
      },
      filters: {
        ...(search
          ? {
              title: {
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

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/videos?${query}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = qs.stringify({
    sort: "name:ASC",
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/video-categories?${query}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
