'use client';

import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  MousePointer, 
  ArrowRight
} from 'lucide-react';

export default function CommissionsMasterPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Comissões Master</h1>
          <p className="text-gray-400">Escolha o tipo de relatório que deseja analisar</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Comissões */}
          <div 
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-green-500 hover:bg-gray-800 transition-all cursor-pointer"
            onClick={() => router.push('/master/commissions/commissions')}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">Minhas Comissões Shopee</h2>
                <p className="text-gray-400">Analise suas vendas e comissões</p>
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
              Como usar:
            </h3>
            <p className="text-sm text-blue-100">
              Clique em um dos relatórios acima para começar. Você poderá fazer upload de arquivos CSV 
              e visualizar análises detalhadas das suas métricas de afiliados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}