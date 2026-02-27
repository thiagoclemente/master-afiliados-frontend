const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export interface CurrentUserResponse {
  id: number;
  username?: string;
  name?: string;
  email?: string;
  documentId?: string;
  credits?: number | string | null;
  [key: string]: unknown;
}

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    name?: string;
    email: string;
    documentId: string;
    credits?: number;
  };
  jwt: string;
  refreshToken?: string;
}

export interface ForgotPasswordResponse {
  ok: boolean;
}

export interface ResetPasswordResponse {
  ok: boolean;
}

export class AuthService {
  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Erro ao fazer login");
    }

    return data;
  }

  static async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${STRAPI_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Erro ao enviar email de recuperação");
    }

    return data;
  }

  static async resetPassword(
    code: string,
    password: string,
    passwordConfirmation: string
  ): Promise<ResetPasswordResponse> {
    const response = await fetch(`${STRAPI_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        password,
        passwordConfirmation,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Erro ao redefinir senha");
    }

    return data;
  }

  static async me(jwt: string): Promise<CurrentUserResponse> {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    };

    let response = await fetch(`${STRAPI_URL}/api/users/me?populate=*`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      // Fallback compatível com backends que não aceitam populate no /users/me
      response = await fetch(`${STRAPI_URL}/api/users/me`, {
        method: "GET",
        headers,
      });
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Erro ao carregar perfil do usuário");
    }

    return data as CurrentUserResponse;
  }
} 
