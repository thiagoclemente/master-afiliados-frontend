import { authFetch } from "@/lib/auth";

export interface UserSubscription {
  id: number;
  documentId: string;
  code?: string | null;
  plan?: string | null;
  platform?: string | null;
  planStatus?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  planRelationship?: {
    id: number;
    documentId: string;
    name: string;
    code: string;
    description?: string;
    price?: string;
    link?: string;
  };
}

export interface UserSubscriptionResponse {
  data: UserSubscription[];
}

function normalizeSubscriptionCode(value?: string | null): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function isSubscriptionActive(subscription: UserSubscription): boolean {
  const status = normalizeSubscriptionCode(subscription.planStatus);
  return status === "" || status === "ACTIVE";
}

function getSubscriptionCodes(subscription: UserSubscription): string[] {
  return [
    normalizeSubscriptionCode(subscription.code),
    normalizeSubscriptionCode(subscription.plan),
    normalizeSubscriptionCode(subscription.planRelationship?.code),
  ].filter(Boolean);
}

export async function fetchUserSubscriptions(): Promise<UserSubscriptionResponse> {
  const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/user-subscriptions`;

  try {
    const response = await authFetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed");
      }
      throw new Error(`Failed to fetch user subscriptions: ${response.status}`);
    }

    // Verificar se a resposta tem conteúdo
    const text = await response.text();

    if (!text || text.trim() === '') {
      return { data: [] };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { data: [] };
    }
    
    // Se a API retorna null (sem assinaturas), retornar array vazio
    if (data === null) {
      return { data: [] };
    }
    
    // Se a API retorna um objeto com data: null e error, verificar se é erro de auth
    if (data && typeof data === 'object' && data.data === null && data.error) {
      if (data.error.status === 401) {
        throw new Error("Authentication failed");
      }
      // Para outros erros, retornar array vazio
      return { data: [] };
    }
    
    return data as UserSubscriptionResponse;
  } catch (error) {
    throw error;
  }
}

// Função para verificar se o usuário tem uma assinatura específica
export function hasSubscription(subscriptions: UserSubscription[], code: string): boolean {
  const expectedCode = normalizeSubscriptionCode(code);

  if (!expectedCode) {
    return false;
  }

  return subscriptions.some((subscription) => {
    if (!isSubscriptionActive(subscription)) {
      return false;
    }

    return getSubscriptionCodes(subscription).includes(expectedCode);
  });
}

// Função para verificar se o usuário tem assinatura premium
export function isSubscriptionPremium(subscriptions: UserSubscription[]): boolean {
  return hasSubscription(subscriptions, 'MASTER_PREMIUM');
}

// Função para verificar se o usuário tem assinatura de comissões master
export function hasCommissionsMasterSubscription(subscriptions: UserSubscription[]): boolean {
  return hasSubscription(subscriptions, 'COMMISSIONS_MASTER') || isSubscriptionPremium(subscriptions);
}

// Função para verificar se o usuário tem assinatura de control master
export function hasControlMasterSubscription(subscriptions: UserSubscription[]): boolean {
  return hasSubscription(subscriptions, 'CONTROL_MASTER') || isSubscriptionPremium(subscriptions);
}

// Função para verificar se o usuário tem assinatura de divulgador (promoter)
export function hasPromoterSubscription(subscriptions: UserSubscription[]): boolean {
  return hasSubscription(subscriptions, 'MASTER_PROMOTER') || isSubscriptionPremium(subscriptions);
}
