import { authFetch } from "@/lib/auth";
import type { UserPackReleaseResponse } from "@/interfaces/user-pack-release";

export async function fetchUserPacksRelease(): Promise<UserPackReleaseResponse> {
  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/user-packs-release`,
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
    throw new Error("Failed to fetch user packs release");
  }

  return response.json() as Promise<UserPackReleaseResponse>;
} 
