'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ChevronLeft,
  Users,
  Globe,
  Layers,
  BarChart3,
  AlertCircle,
  Instagram,
  Facebook,
  MessageCircle,
  Youtube,
  Send,
  Mail,
  Search,
  Smartphone,
  Apple,
  Chrome,
  ExternalLink,
  Hash,
  ShoppingCart,
  Monitor,
  Tablet,
  Tv,
  Radio,
  Newspaper,
  BookOpen,
  Share2,
  Link,
  Zap,
  Target,
  TrendingUp,
  Activity,
  PieChart,
  BarChart,
  LineChart
} from 'lucide-react';
import SubscriptionProtection from '@/components/SubscriptionProtection';
import { 
  commissionsService, 
  CommissionReport, 
  ReportHistory,
  ComissaoPorCanal,
  ComissaoPorSubId
} from "@/services/commissions.service";
import { useAuth } from "@/context/auth-context";

export default function CommissionsPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { logout } = useAuth();

  // Load report history on component mount
  useEffect(() => {
    const history = commissionsService.getReportHistory();
    const commissionsHistory = history.filter(h => h.type === 'commissions');
    setReportHistory(commissionsHistory);
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      showErrorMessage('Por favor, selecione um arquivo CSV válido.');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const reportData = await commissionsService.uploadCommissionsFile(file);

      const newReport: ReportHistory = {
        id: Date.now().toString(),
        fileName: file.name,
        filePath: URL.createObjectURL(file),
        type: 'commissions',
        createdAt: new Date().toISOString(),
        data: reportData
      };

      commissionsService.saveReportHistory(newReport);
      const history = commissionsService.getReportHistory();
      const commissionsHistory = history.filter(h => h.type === 'commissions');
      setReportHistory(commissionsHistory);
      setSelectedReport(newReport);
      showSuccessMessage('Relatório de comissões processado com sucesso!');
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar o arquivo. Tente novamente.';
      if (errorMessage === "Authentication failed" || errorMessage === "Authentication required") {
        logout();
        router.push("/login");
        return;
      }
      showErrorMessage(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // const deleteReport = (id: string) => {
  //   commissionsService.deleteReportHistory(id);
  //   const history = commissionsService.getReportHistory();
  //   const commissionsHistory = history.filter(h => h.type === 'commissions');
  //   setReportHistory(commissionsHistory);
  //   if (selectedReport?.id === id) {
  //     setSelectedReport(null);
  //   }
  // };

  const clearAllData = () => {
    const history = commissionsService.getReportHistory();
    const nonCommissionsHistory = history.filter(h => h.type !== 'commissions');
    commissionsService.clearReportHistory();
    nonCommissionsHistory.forEach(h => commissionsService.saveReportHistory(h));
    setReportHistory([]);
    setSelectedReport(null);
    showSuccessMessage('Todos os relatórios de comissões foram removidos.');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // Criar data em UTC para evitar problemas de timezone
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  return (
    <SubscriptionProtection type="commissions">
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/master/commissions')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Minhas Comissões Shopee</h1>
                <p className="text-gray-400">Analise suas vendas e comissões</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-900 border border-green-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-200">{successMessage}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!selectedReport && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-green-400 bg-green-900/20"
                : "border-gray-600 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-green-400 animate-spin mb-4" />
                <p className="text-gray-400">Processando arquivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-white mb-2">
                  Faça upload do seu arquivo CSV de comissões
                </p>
                <p className="text-gray-400 mb-4">
                  Arraste e solte um arquivo CSV com relatório de vendas da Shopee
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Selecionar arquivo CSV
                </label>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-200 mb-1">
                Como usar:
              </h3>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>1. Baixe o relatório CSV de comissões da sua plataforma de afiliados</li>
                <li>2. Faça upload do arquivo aqui</li>
                <li>3. Visualize suas métricas e insights automaticamente</li>
                <li>4. Acesse o histórico para comparar relatórios anteriores</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {selectedReport && (
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Relatório: {selectedReport.fileName}
              </h2>
              <p className="text-gray-400">
                {formatDate(selectedReport.createdAt)} • Comissões
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Novo Relatório
              </button>
            </div>
          </div>

          <CommissionReportDisplay report={selectedReport.data as CommissionReport} />
        </div>
      )}

      {/* History */}
      {!selectedReport && reportHistory.length > 0 && (
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Histórico de Relatórios de Comissões</h2>
            <button
              onClick={clearAllData}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar tudo</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportHistory.slice(0, 6).map((report) => (
              <div
                key={report.id}
                className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-gray-500 cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-400">Comissões</span>
                </div>
                <p className="font-medium text-white text-sm mb-1 truncate">
                  {report.fileName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(report.createdAt)}
                </p>
                {report.type === 'commissions' && 'total_comissoes' in report.data && (
                  <p className="text-sm text-green-400 mt-2">
                    {formatCurrency(report.data.total_comissoes as number)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </SubscriptionProtection>
  );
}

// Commission Report Display Component
function CommissionReportDisplay({ report }: { report: CommissionReport }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-400 font-medium">Total de Comissões</p>
              <p className="text-2xl font-bold text-green-300">
                {formatCurrency(report.total_comissoes)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-400 font-medium">Total de Pedidos</p>
              <p className="text-2xl font-bold text-blue-300">
                {report.total_pedidos.toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-400 font-medium">Canal Top Vendas</p>
              <p className="text-lg font-bold text-purple-300">
                {report.canal_top_vendas}
              </p>
            </div>
            <Globe className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-400 font-medium">Sub ID Top Vendas</p>
              <p className="text-lg font-bold text-orange-300">
                {report.subid_top_vendas}
              </p>
            </div>
            <Layers className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Period */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">{report.periodo}</h3>
      </div>

      {/* Detailed Reports */}
      <div className="space-y-6">
        {/* Comissões por Canal */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Comissões por Canal</span>
          </h3>
          <div className="space-y-4">
            {report.comissoes_por_canal.map((item: ComissaoPorCanal, index: number) => (
              <div key={index} className="bg-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getChannelIcon(item.canal)}</span>
                    <span className="font-medium text-white">{item.canal}</span>
                  </div>
                  <span className="text-green-400 font-bold">
                    {formatCurrency(item.comissao)}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-3">
                  {item.total_pedidos} pedidos
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">Status dos Pedidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.por_status && Object.entries(item.por_status).map(([status, count]) => (
                      <span
                        key={status}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)} bg-gray-800`}
                      >
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comissões por Sub ID */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Comissões por Sub ID</span>
          </h3>
          <div className="space-y-3">
            {report.comissoes_por_subid.map((item: ComissaoPorSubId, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <div>
                  <p className="font-medium text-white">{item.sub_id}</p>
                  <p className="text-sm text-gray-400">{item.total_pedidos} pedidos</p>
                </div>
                <span className="text-green-400 font-bold">
                  {formatCurrency(item.comissao)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getChannelIcon(channel: string) {
  const channelLower = channel.toLowerCase();
  
  // Redes Sociais
  if (channelLower.includes('instagram') || channelLower.includes('ig')) {
    return <Instagram className="w-5 h-5 text-pink-500" />;
  }
  if (channelLower.includes('facebook') || channelLower.includes('fb')) {
    return <Facebook className="w-5 h-5 text-blue-600" />;
  }
  if (channelLower.includes('whatsapp') || channelLower.includes('wa')) {
    return <MessageCircle className="w-5 h-5 text-green-500" />;
  }
  if (channelLower.includes('youtube') || channelLower.includes('yt')) {
    return <Youtube className="w-5 h-5 text-red-600" />;
  }
  if (channelLower.includes('telegram') || channelLower.includes('tg')) {
    return <Send className="w-5 h-5 text-blue-500" />;
  }
  if (channelLower.includes('pinterest') || channelLower.includes('pin')) {
    return <Target className="w-5 h-5 text-red-500" />;
  }
  
  // Email e Comunicação
  if (channelLower.includes('email') || channelLower.includes('mail')) {
    return <Mail className="w-5 h-5 text-gray-500" />;
  }
  
  // Busca e Navegadores
  if (channelLower.includes('google search') || channelLower.includes('google') || channelLower.includes('search')) {
    return <Search className="w-5 h-5 text-blue-500" />;
  }
  if (channelLower.includes('chrome') || channelLower.includes('browser')) {
    return <Chrome className="w-5 h-5 text-green-500" />;
  }
  if (channelLower.includes('edge') || channelLower.includes('edgebrowser')) {
    return <ExternalLink className="w-5 h-5 text-blue-600" />;
  }
  if (channelLower.includes('safari')) {
    return <Globe className="w-5 h-5 text-blue-500" />;
  }
  if (channelLower.includes('firefox')) {
    return <Globe className="w-5 h-5 text-orange-500" />;
  }
  
  // Apps e Plataformas
  if (channelLower.includes('google play') || channelLower.includes('android')) {
    return <Smartphone className="w-5 h-5 text-green-600" />;
  }
  if (channelLower.includes('app store') || channelLower.includes('ios')) {
    return <Apple className="w-5 h-5 text-gray-800" />;
  }
  if (channelLower.includes('shopee') || channelLower.includes('shopeevideo')) {
    return <ShoppingCart className="w-5 h-5 text-orange-500" />;
  }
  
  // Dispositivos
  if (channelLower.includes('mobile') || channelLower.includes('celular')) {
    return <Smartphone className="w-5 h-5 text-blue-500" />;
  }
  if (channelLower.includes('desktop') || channelLower.includes('computador')) {
    return <Monitor className="w-5 h-5 text-gray-500" />;
  }
  if (channelLower.includes('tablet')) {
    return <Tablet className="w-5 h-5 text-purple-500" />;
  }
  if (channelLower.includes('tv') || channelLower.includes('televisão')) {
    return <Tv className="w-5 h-5 text-blue-500" />;
  }
  
  // Mídia e Conteúdo
  if (channelLower.includes('radio')) {
    return <Radio className="w-5 h-5 text-yellow-500" />;
  }
  if (channelLower.includes('newspaper') || channelLower.includes('jornal')) {
    return <Newspaper className="w-5 h-5 text-gray-600" />;
  }
  if (channelLower.includes('blog') || channelLower.includes('artigo')) {
    return <BookOpen className="w-5 h-5 text-green-600" />;
  }
  
  // Sites e Web
  if (channelLower.includes('website') || channelLower.includes('site') || channelLower.includes('web')) {
    return <Globe className="w-5 h-5 text-blue-500" />;
  }
  if (channelLower.includes('link') || channelLower.includes('url')) {
    return <Link className="w-5 h-5 text-blue-400" />;
  }
  if (channelLower.includes('referral') || channelLower.includes('referência')) {
    return <Share2 className="w-5 h-5 text-purple-500" />;
  }
  
  // Marketing e Performance
  if (channelLower.includes('cpc') || channelLower.includes('ads') || channelLower.includes('anúncio')) {
    return <Target className="w-5 h-5 text-red-500" />;
  }
  if (channelLower.includes('organic') || channelLower.includes('orgânico')) {
    return <TrendingUp className="w-5 h-5 text-green-500" />;
  }
  if (channelLower.includes('direct') || channelLower.includes('direto')) {
    return <Zap className="w-5 h-5 text-yellow-500" />;
  }
  
  // Analytics e Métricas
  if (channelLower.includes('analytics') || channelLower.includes('métricas')) {
    return <Activity className="w-5 h-5 text-blue-500" />;
  }
  if (channelLower.includes('conversion') || channelLower.includes('conversão')) {
    return <PieChart className="w-5 h-5 text-green-500" />;
  }
  if (channelLower.includes('traffic') || channelLower.includes('tráfego')) {
    return <BarChart className="w-5 h-5 text-purple-500" />;
  }
  if (channelLower.includes('trend') || channelLower.includes('tendência')) {
    return <LineChart className="w-5 h-5 text-orange-500" />;
  }
  
  // Outros e Padrão
  if (channelLower.includes('other') || channelLower.includes('outro') || channelLower.includes('others')) {
    return <Hash className="w-5 h-5 text-gray-500" />;
  }
  
  // Padrão para canais não identificados
  return <Globe className="w-5 h-5 text-gray-400" />;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'concluído': return 'text-green-400';
    case 'cancelado': return 'text-red-400';
    case 'pendente': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
} 