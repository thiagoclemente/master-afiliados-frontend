import { getAuthToken } from "@/lib/auth";
import qs from "qs";

export interface Pack {
  id: number;
  documentId: string;
  title: string;
  description: string;
  image: {
    url: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PackResponse {
  data: Pack[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export async function fetchPacks(page: number = 1, pageSize: number = 20) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = qs.stringify(
    {
      populate: ["image"],
      sort: ["createdAt:DESC"],
      pagination: {
        page,
        pageSize,
      },
    },
    {
      encodeValuesOnly: true,
    }
  );

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/packs?${query}`,
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
    throw new Error("Failed to fetch packs");
  }

  return response.json() as Promise<PackResponse>;
}
