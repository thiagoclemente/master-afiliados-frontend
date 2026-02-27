'use client';

import { useRouter } from 'next/navigation';
import SubscriptionProtection from '@/components/SubscriptionProtection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { 
  DollarSign, 
  MousePointer, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function CommissionsMasterPage() {
  const router = useRouter();

  return (
    <SubscriptionProtection type="commissions">
      <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Comissões Master</h1>
          <p className="text-muted-foreground">Escolha o tipo de relatório que deseja analisar</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Comissões CSV */}
          <Card
            className="bg-card border rounded-lg p-6 hover:border-green-500 transition-all cursor-pointer"
            onClick={() => router.push('/master/commissions/commissions')}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-600/20 border border-green-600/40 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-green-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">Comissões Master CSV</h2>
                <p className="text-muted-foreground">Upload de arquivos CSV</p>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Upload de relatórios CSV de vendas</p>
              <p>• Análise de comissões por canal</p>
              <p>• Relatórios por Sub ID</p>
              <p>• Histórico de relatórios</p>
            </div>
          </Card>

          {/* Relatório Shopee */}
          <Card
            className="bg-card border rounded-lg p-6 hover:border-orange-500 transition-all cursor-pointer"
            onClick={() => router.push('/master/commissions/shopee-report')}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-600/20 border border-orange-600/40 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-orange-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">Comissões Shopee API</h2>
                <p className="text-muted-foreground">Dados diretos da plataforma</p>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Dados em tempo real da Shopee</p>
              <p>• Filtros de data pré-definidos</p>
              <p>• Sem necessidade de upload</p>
              <p>• Atualização automática</p>
            </div>
          </Card>

          {/* Cliques */}
          <Card
            className="bg-card border rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer"
            onClick={() => router.push('/master/commissions/clicks')}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
                <MousePointer className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">Meus Cliques Shopee</h2>
                <p className="text-muted-foreground">Analise seus cliques e tráfego</p>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Upload de relatórios CSV de cliques</p>
              <p>• Análise de cliques por canal</p>
              <p>• Relatórios por horário e região</p>
              <p>• Histórico de relatórios</p>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Alert className="mt-8 border-blue-700/60 bg-blue-950/30 text-blue-100 [&>svg]:text-blue-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Duas opções disponíveis</AlertTitle>
          <AlertDescription className="space-y-1">
            <p><strong>Comissões Master CSV:</strong> Faça upload de arquivos CSV com relatórios de vendas</p>
            <p><strong>Comissões Shopee API:</strong> Acesse dados diretos da plataforma Shopee em tempo real</p>
            <p className="text-xs text-blue-200 mt-2">
              Escolha a opção que melhor se adequa às suas necessidades
            </p>
          </AlertDescription>
        </Alert>
        </CardContent>
      </Card>
      </div>
    </SubscriptionProtection>
  );
}
