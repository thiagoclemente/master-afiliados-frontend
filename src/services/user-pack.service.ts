import { getAuthToken } from "@/lib/auth";

export interface UserPack {
  id: number;
  documentId: string;
  pack: {
    id: number;
    documentId: string;
    name: string;
    description?: string;
    link?: string;
    image?: {
      url: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPackResponse {
  data: UserPack[];
}

export async function fetchUserPacks(): Promise<UserPackResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/user-packs`,
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
    throw new Error("Failed to fetch user packs");
  }

  return response.json() as Promise<UserPackResponse>;
} 