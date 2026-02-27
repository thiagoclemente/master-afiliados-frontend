import { authFetch } from "@/lib/auth";
import qs from "qs";
import type { Pack } from "@/interfaces/pack";

export interface PackResponse {
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

export async function fetchPacks(page: number = 1, pageSize: number = 20): Promise<PackResponse> {
  const query = qs.stringify(
    {
      populate: ["image", "officialPackage", "plan"],
      sort: ["order:ASC"],
      pagination: {
        page,
        pageSize,
      },
    },
    {
      encodeValuesOnly: true,
    }
  );

  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/packs?${query}`,
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
    throw new Error("Failed to fetch packs");
  }

  return response.json() as Promise<PackResponse>;
}
