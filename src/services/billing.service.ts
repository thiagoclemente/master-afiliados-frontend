import { authFetch } from "@/lib/auth";

export interface PackRenewalOffer {
  kind: string;
  enabled: boolean;
  durationYears: number;
  durationLabel: string;
  productName: string;
  description?: string | null;
  hasSavedPrice: boolean;
  priceId?: string | null;
  amount?: number | null;
  currency?: string | null;
  priceLabel?: string | null;
}

export interface PackRenewalAccessInfo {
  packDocumentId?: string | null;
  packName?: string | null;
  downloadAccessExpired?: boolean;
  hasActiveDownloadAccess?: boolean;
  downloadAccessExpiresAt?: string | null;
  lastRenewedAt?: string | null;
  supportMessage?: string | null;
}

export interface PackRenewalCheckoutSessionResponse {
  data: {
    sessionId: string;
    url: string;
    expiresAt?: string | null;
    userPackDocumentId: string;
    offer: PackRenewalOffer;
  };
}

export interface PackRenewalSessionStatusResponse {
  data: {
    sessionId: string;
    sessionStatus?: string | null;
    paymentStatus?: string | null;
    fulfilled: boolean;
    userPackDocumentId?: string | null;
    packDocumentId?: string | null;
    packName?: string | null;
    accessInfo?: PackRenewalAccessInfo | null;
    offer: PackRenewalOffer;
  };
}

export async function fetchPackRenewalOffer(): Promise<{
  data: PackRenewalOffer;
}> {
  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/purchases/pack-renewal/offer`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    throw new Error("Failed to fetch pack renewal offer");
  }

  return response.json() as Promise<{ data: PackRenewalOffer }>;
}

export async function createPackRenewalCheckoutSession(
  userPackDocumentId: string,
): Promise<PackRenewalCheckoutSessionResponse> {
  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/purchases/pack-renewal/checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userPackDocumentId,
      }),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }

    let errorMessage = "Não foi possível iniciar o checkout da renovação.";
    try {
      const errorData = (await response.json()) as {
        error?: {
          message?: string;
        };
        message?: string;
      };
      errorMessage =
        errorData?.error?.message || errorData?.message || errorMessage;
    } catch {
      // noop
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<PackRenewalCheckoutSessionResponse>;
}

export async function fetchPackRenewalSessionStatus(
  sessionId: string,
): Promise<PackRenewalSessionStatusResponse> {
  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/purchases/pack-renewal/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }

    let errorMessage = "Não foi possível consultar a renovação do pacote.";
    try {
      const errorData = (await response.json()) as {
        error?: {
          message?: string;
        };
        message?: string;
      };
      errorMessage =
        errorData?.error?.message || errorData?.message || errorMessage;
    } catch {
      // noop
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<PackRenewalSessionStatusResponse>;
}
