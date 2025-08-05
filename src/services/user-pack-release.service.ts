import { getAuthToken } from "@/lib/auth";
import type { UserPackReleaseResponse } from "@/interfaces/user-pack-release";

export async function fetchUserPacksRelease(): Promise<UserPackReleaseResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/user-packs-release`,
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
    throw new Error("Failed to fetch user packs release");
  }

  return response.json() as Promise<UserPackReleaseResponse>;
} 