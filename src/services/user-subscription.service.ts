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
  console.log('Fetching user subscriptions from:', url);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed");
      }
      throw new Error(`Failed to fetch user subscriptions: ${response.status}`);
    }

    // Verificar se a resposta tem conteúdo
    const text = await response.text();
    console.log('Response text:', text);

    if (!text || text.trim() === '') {
      console.log('Empty response, returning empty array');
      return { data: [] };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Invalid JSON response:', text);
      return { data: [] };
    }
    
    // Se a API retorna null (sem assinaturas), retornar array vazio
    if (data === null) {
      console.log('API returned null, returning empty array');
      return { data: [] };
    }
    
    // Se a API retorna um objeto com data: null e error, verificar se é erro de auth
    if (data && typeof data === 'object' && data.data === null && data.error) {
      console.log('API returned error object:', data.error);
      if (data.error.status === 401) {
        throw new Error("Authentication failed");
      }
      // Para outros erros, retornar array vazio
      return { data: [] };
    }
    
    console.log('Parsed data:', data);
    return data as UserSubscriptionResponse;
  } catch (error) {
    console.error('Error in fetchUserSubscriptions:', error);
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