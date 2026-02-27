interface StoredUser {
  jwt?: string;
  refreshToken?: string;
  [key: string]: unknown;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const REFRESH_ENDPOINT = `${STRAPI_URL}/api/auth/refresh`;
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

let ongoingRefresh: Promise<string | null> | null = null;

function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as StoredUser;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
}

function saveStoredUser(user: StoredUser): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("user");
}

function dispatchSessionExpired(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
}

export function getAuthToken(): string | null {
  const user = getStoredUser();
  return typeof user?.jwt === "string" && user.jwt.length > 0 ? user.jwt : null;
}

export function getRefreshToken(): string | null {
  const user = getStoredUser();
  return typeof user?.refreshToken === "string" && user.refreshToken.length > 0
    ? user.refreshToken
    : null;
}

export function setAuthTokens(tokens: { jwt: string; refreshToken?: string }): void {
  const user = getStoredUser();
  if (!user) {
    return;
  }

  const updated: StoredUser = {
    ...user,
    jwt: tokens.jwt,
    ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
  };

  saveStoredUser(updated);
}

export async function refreshAccessToken(): Promise<string | null> {
  if (ongoingRefresh) {
    return ongoingRefresh;
  }

  ongoingRefresh = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(REFRESH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        jwt?: string;
        refreshToken?: string;
      };

      if (!data.jwt || typeof data.jwt !== "string") {
        return null;
      }

      setAuthTokens({
        jwt: data.jwt,
        refreshToken:
          typeof data.refreshToken === "string" && data.refreshToken.length > 0
            ? data.refreshToken
            : refreshToken,
      });

      return data.jwt;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return null;
    }
  })();

  try {
    return await ongoingRefresh;
  } finally {
    ongoingRefresh = null;
  }
}

type AuthFetchOptions = {
  requireAuth?: boolean;
  retryOnAuthError?: boolean;
};

function mergeHeaders(initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders || {});
  return headers;
}

export async function authFetch(
  input: string,
  init: RequestInit = {},
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { requireAuth = true, retryOnAuthError = true } = options;
  const headers = mergeHeaders(init.headers);

  if (requireAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
  };

  let response = await fetch(input, requestInit);
  const shouldAttemptRefresh =
    requireAuth &&
    retryOnAuthError &&
    (response.status === 401 || response.status === 403) &&
    !input.includes("/api/auth/refresh");

  if (!shouldAttemptRefresh) {
    return response;
  }

  const refreshedJwt = await refreshAccessToken();
  if (!refreshedJwt) {
    clearStoredAuth();
    dispatchSessionExpired();
    return response;
  }

  const retryHeaders = mergeHeaders(init.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshedJwt}`);
  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
  });

  return response;
}
