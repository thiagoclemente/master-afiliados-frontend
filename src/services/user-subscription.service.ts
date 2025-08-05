import { getAuthToken } from "@/lib/auth";

export interface UserSubscription {
  id: number;
  documentId: string;
  code: string;
  plan: string;
  platform: string;
  planStatus: string;
  startDate: string;
  endDate: string;
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

export async function fetchUserSubscriptions(): Promise<UserSubscriptionResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/user-subscriptions`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
  return subscriptions.some(subscription => subscription.code === code);
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