const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    documentId: string;
  };
  jwt: string;
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
} 