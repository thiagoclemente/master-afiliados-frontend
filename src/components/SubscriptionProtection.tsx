"use client";

import { useEffect, useState } from "react";
import { fetchUserSubscriptions, hasCommissionsMasterSubscription, hasControlMasterSubscription } from "@/services/user-subscription.service";
import { Loader2, TrendingUp, BarChart3 } from "lucide-react";

interface SubscriptionProtectionProps {
  children: React.ReactNode;
  type: "commissions" | "control";
}

export default function SubscriptionProtection({ children, type }: SubscriptionProtectionProps) {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetchUserSubscriptions();
        const subscriptions = response.data;
        
        let hasAccess = false;
        if (type === "commissions") {
          hasAccess = hasCommissionsMasterSubscription(subscriptions);
        } else if (type === "control") {
          hasAccess = hasControlMasterSubscription(subscriptions);
        }
        
        setHasSubscription(hasAccess);
      } catch {
        // Em caso de erro, assumir que não tem acesso
        setHasSubscription(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [type]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#7d570e] animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Verificando sua assinatura...</p>
        </div>
      </div>
    );
  }

  // Se não tem assinatura, mostrar mensagem de acesso negado
  if (hasSubscription === false) {
    const isCommissions = type === "commissions";
    const Icon = isCommissions ? BarChart3 : TrendingUp;
    const title = isCommissions ? "Comissões Master" : "Controle Master";
    const description = isCommissions 
      ? "Acesse relatórios detalhados de comissões e cliques para otimizar suas vendas."
      : "Gerencie suas campanhas publicitárias e acompanhe o desempenho em tempo real.";

    return (
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-white text-lg font-semibold mb-2">
            Acesso Restrito
          </div>
          <div className="text-gray-400 mb-4 max-w-md mx-auto">
            Você precisa de uma assinatura {title} para acessar esta funcionalidade.
          </div>
          
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-gray-700">
            <div className="text-white font-medium mb-2">
              {title}
            </div>
            <div className="text-gray-300 text-sm mb-3">
              {description}
            </div>
            <div className="text-[#7d570e] font-semibold">
              Assinatura Premium
            </div>
          </div>
          
          <button
            onClick={() => {
              window.open('https://masterafiliados.com.br', '_blank');
            }}
            className="px-6 py-3 bg-[#7d570e] text-white rounded-lg hover:bg-[#6b4a0c] transition-colors font-medium"
          >
            Assinar {title}
          </button>
        </div>
      </div>
    );
  }

  // Se tem assinatura, renderizar o conteúdo
  return <>{children}</>;
} 