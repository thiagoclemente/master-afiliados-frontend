'use client';

import { useRouter } from 'next/navigation';
import SubscriptionProtection from '@/components/SubscriptionProtection';
import { 
  DollarSign, 
  MousePointer, 
  ArrowRight
} from 'lucide-react';

export default function CommissionsMasterPage() {
  const router = useRouter();

  return (
    <SubscriptionProtection type="commissions">
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Comissões Master</h1>
          <p className="text-gray-400">Escolha o tipo de relatório que deseja analisar</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Comissões CSV */}
          <div 
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-green-500 hover:bg-gray-800 transition-all cursor-pointer"
            onClick={() => router.push('/master/commissions/commissions')}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">Comissões Master CSV</h2>
                <p className="text-gray-400">Upload de arquivos CSV</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Upload de relatórios CSV de vendas</p>
              <p>• Análise de comissões por canal</p>
              <p>• Relatórios por Sub ID</p>
              <p>• Histórico de relatórios</p>
            </div>
          </div>

          {/* Relatório Shopee */}
          <div 
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-orange-500 hover:bg-gray-800 transition-all cursor-pointer"
            onClick={() => router.push('/master/commissions/shopee-report')}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">Comissões Shopee API</h2>
                <p className="text-gray-400">Dados diretos da plataforma</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Dados em tempo real da Shopee</p>
              <p>• Filtros de data pré-definidos</p>
              <p>• Sem necessidade de upload</p>
              <p>• Atualização automática</p>
            </div>
          </div>

          {/* Cliques */}
          <div 
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-blue-500 hover:bg-gray-800 transition-all cursor-pointer"
            onClick={() => router.push('/master/commissions/clicks')}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <MousePointer className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">Meus Cliques Shopee</h2>
                <p className="text-gray-400">Analise seus cliques e tráfego</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Upload de relatórios CSV de cliques</p>
              <p>• Análise de cliques por canal</p>
              <p>• Relatórios por horário e região</p>
              <p>• Histórico de relatórios</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <div className="text-center">
            <h3 className="text-sm font-medium text-blue-200 mb-2">
              Duas opções disponíveis:
            </h3>
            <div className="text-sm text-blue-100 space-y-1">
              <p><strong>Comissões Master CSV:</strong> Faça upload de arquivos CSV com relatórios de vendas</p>
              <p><strong>Comissões Shopee API:</strong> Acesse dados diretos da plataforma Shopee em tempo real</p>
              <p className="text-xs text-blue-200 mt-2">
                Escolha a opção que melhor se adequa às suas necessidades
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </SubscriptionProtection>
  );
}