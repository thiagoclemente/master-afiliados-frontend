import { getAuthToken } from "@/lib/auth";
import type { UserProfile, UserUpdateRequest, PasswordChangeRequest, UserUpdateResponse } from "@/interfaces/user.interface";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export class UserService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Verificar se estamos no cliente
    if (typeof window === "undefined") {
      throw new Error("This function can only be called on the client side");
    }

    const token = getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${STRAPI_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed");
      }
      if (response.status === 403) {
        throw new Error("Access denied");
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  static async getCurrentUser(): Promise<UserProfile> {
    try {
      const data = await this.makeRequest("/api/users/me");
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  static async updateUser(userData: UserUpdateRequest, userId: number): Promise<UserUpdateResponse> {
    try {
      const data = await this.makeRequest(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      });
      return data;
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  }

  static async changePassword(passwordData: PasswordChangeRequest): Promise<{ ok: boolean }> {
    try {
      const data = await this.makeRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(passwordData),
      });
      return data;
    } catch (error) {
      console.error("Error changing password:", error);
      // Se o endpoint não existir, vamos tentar uma abordagem alternativa
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('Not Found'))) {
        throw new Error("Funcionalidade de alteração de senha não está disponível no momento. Entre em contato com o suporte.");
      }
      throw error;
    }
  }
}
