import qs from "qs";
import { authFetch } from "@/lib/auth";
import type { ComboResponse } from "@/interfaces/combo";

export async function fetchCombos(
  page: number = 1,
  pageSize: number = 20
): Promise<ComboResponse> {
  const query = qs.stringify(
    {
      populate: ["packs.image", "packs.officialPackage", "packs.plan"],
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
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/combos?${query}`,
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
    throw new Error("Failed to fetch combos");
  }

  return response.json() as Promise<ComboResponse>;
} 
