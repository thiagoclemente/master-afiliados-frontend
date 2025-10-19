'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
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
  LineChart,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import {
  CommissionsByChannelChart,
  CommissionsBySubIdChart,
  OrdersByChannelChart
} from '@/components/charts';
import SubscriptionProtection from '@/components/SubscriptionProtection';
import { 
  commissionsService, 
  CommissionReport, 
  ComissaoPorCanal,
  ComissaoPorSubId,
  CategoriaTopVenda,
  ProdutoTopVenda
} from "@/services/commissions.service";
import { UserService } from "@/services/user.service";
import { UserProfile } from "@/interfaces/user.interface";
import { useAuth } from "@/context/auth-context";
import { useAnalytics } from "@/hooks/use-analytics";

type DateFilter = 'yesterday' | '7' | '15' | '30';

interface DateRange {
  start: string;
  end: string;
  label: string;
}

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getYesterdayDate = () => {
  const yesterday = startOfToday();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};

const parseInputDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const clampDateToYesterday = (value: string): string => {
  if (!value) {
    return '';
  }
  const desiredDate = parseInputDate(value);
  const yesterday = getYesterdayDate();
  if (desiredDate > yesterday) {
    return formatDateForInput(yesterday);
  }
  return formatDateForInput(desiredDate);
};

const formatDateForDisplay = (value: string): string => {
  if (!value) {
    return '';
  }
  const date = parseInputDate(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

export default function ShopeeReportPage() {
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter | null>(null);
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);
  const [reportData, setReportData] = useState<CommissionReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState<DateRange | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(true);
  const router = useRouter();
  const { logout } = useAuth();
  const { trackCommissionReport, trackError } = useAnalytics();

  // Generate date ranges for predefined filters
  const getDateRange = (days: number): DateRange => {
    const end = getYesterdayDate();
    const start = new Date(end);
    if (days > 1) {
      start.setDate(end.getDate() - (days - 1));
    }
    
    return {
      start: formatDateForInput(start),
      end: formatDateForInput(end),
      label: `${days} dias`
    };
  };

  const predefinedRanges = {
    'yesterday': (() => {
      const yesterday = getYesterdayDate();
      const formattedYesterday = formatDateForInput(yesterday);
      return {
        start: formattedYesterday,
        end: formattedYesterday,
        label: 'Ontem'
      };
    })(),
    '7': getDateRange(7),
    '15': getDateRange(15),
    '30': getDateRange(30)
  };

  // Create ordered array to control filter order
  const orderedFilters = [
    { key: 'yesterday' as DateFilter, range: predefinedRanges.yesterday },
    { key: '7' as DateFilter, range: predefinedRanges['7'] },
    { key: '15' as DateFilter, range: predefinedRanges['15'] },
    { key: '30' as DateFilter, range: predefinedRanges['30'] }
  ];

  // Check user credentials on component mount
  useEffect(() => {
    const checkCredentials = async () => {
      try {
        const profile = await UserService.getCurrentUser();
        setUserProfile(profile);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Erro ao carregar perfil do usuário");
      } finally {
        setIsCheckingCredentials(false);
      }
    };

    checkCredentials();
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const sanitizeDateRange = (range: DateRange | null): DateRange | null => {
    if (!range?.start || !range?.end) {
      return null;
    }

    const normalizedStart = clampDateToYesterday(range.start);
    const normalizedEnd = clampDateToYesterday(range.end);

    if (!normalizedStart || !normalizedEnd) {
      return null;
    }

    const startDate = parseInputDate(normalizedStart);
    const endDate = parseInputDate(normalizedEnd);

    if (endDate < startDate) {
      return null;
    }

    return {
      ...range,
      start: normalizedStart,
      end: normalizedEnd
    };
  };

  const fetchReport = async (dateRange: DateRange) => {
    const sanitizedRange = sanitizeDateRange(dateRange);
    if (!sanitizedRange) {
      showErrorMessage('Selecione um período válido antes de buscar.');
      return;
    }

    // Validate 3-month limit
    const startDate = parseInputDate(sanitizedRange.start);
    const endDate = parseInputDate(sanitizedRange.end);
    const threeMonthsAgo = startOfToday();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const today = startOfToday();
    
    if (startDate < threeMonthsAgo) {
      showErrorMessage('O período máximo permitido é de 3 meses. Por favor, selecione uma data mais recente.');
      return;
    }
    
    if (endDate < startDate) {
      showErrorMessage('A data final deve ser posterior à data inicial.');
      return;
    }

    if (endDate >= today) {
      showErrorMessage('A data final não pode ser o dia atual.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasLoadedData(true);
    
    try {
      const data = await commissionsService.getShopeeConversionReport(
        sanitizedRange.start,
        sanitizedRange.end,
        300
      );
      
      setReportData(data);
      setActiveDateRange(sanitizedRange);
      trackCommissionReport('shopee_report');
      showSuccessMessage('Relatório da Shopee carregado com sucesso!');
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar relatório da Shopee. Tente novamente.';
      if (errorMessage === "Authentication failed" || errorMessage === "Authentication required") {
        logout();
        router.push("/login");
        return;
      }
      if (errorMessage === "CREDENTIALS_REQUIRED") {
        showErrorMessage("CREDENTIALS_REQUIRED");
        return;
      }
      trackError(errorMessage, 'shopee_report_error');
      showErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateFilterChange = (filter: DateFilter) => {
    setSelectedDateFilter(filter);
    setCustomDateRange(null);
    setActiveDateRange(null);
  };

  const handleCustomDateRange = () => {
    if (!customDateRange) {
      showErrorMessage('Selecione um período válido antes de buscar.');
      return;
    }
    setSelectedDateFilter(null); // Clear predefined filter
    fetchReport(customDateRange);
  };

  const handleSearch = () => {
    if (selectedDateFilter) {
      fetchReport(predefinedRanges[selectedDateFilter]);
    } else if (customDateRange) {
      fetchReport(customDateRange);
    } else {
      showErrorMessage('Selecione um filtro de data antes de buscar.');
    }
  };

  const handleRefresh = () => {
    if (activeDateRange) {
      fetchReport(activeDateRange);
      return;
    }
    if (selectedDateFilter) {
      fetchReport(predefinedRanges[selectedDateFilter]);
    }
  };


  // Check if user has Shopee credentials
  const hasShopeeCredentials = userProfile?.shoppeId && userProfile?.shoppeApiPassword;

  // Show loading while checking credentials
  if (isCheckingCredentials) {
    return (
      <SubscriptionProtection type="commissions">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Verificando credenciais da Shopee...</p>
          </div>
        </div>
      </SubscriptionProtection>
    );
  }

  // Show credentials setup if not configured
  if (!hasShopeeCredentials) {
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
                  <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Relatório Shopee</h1>
                    <p className="text-gray-400">Dados diretos da plataforma Shopee</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials Required Message */}
            <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-200 mb-2">
                    Credenciais da Shopee Necessárias
                  </h3>
                  <p className="text-orange-300 mb-4">
                    Para usar o relatório direto da Shopee, você precisa configurar suas credenciais de API.
                    Sem elas, não é possível acessar os dados da plataforma.
                  </p>
                  <div className="space-y-2 text-sm text-orange-200">
                    <p>• <strong>Shopee ID:</strong> Seu identificador de afiliado</p>
                    <p>• <strong>Senha da API:</strong> Chave fornecida pela Shopee</p>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => router.push('/profile/shopee-config')}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Configurar Credenciais
                    </button>
                    <button
                      onClick={() => router.push('/master/commissions')}
                      className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Voltar para Comissões
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SubscriptionProtection>
    );
  }

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
                <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Relatório Shopee</h1>
                  <p className="text-gray-400">Dados diretos da plataforma Shopee</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-400">Credenciais configuradas</span>
                  </div>
                </div>
              </div>
            </div>
            {selectedDateFilter && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            )}
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
                <span className="text-red-200">
                  {error === "CREDENTIALS_REQUIRED" 
                    ? "Credenciais da Shopee não configuradas. Configure suas credenciais para usar esta funcionalidade."
                    : error
                  }
                </span>
              </div>
              {error === "CREDENTIALS_REQUIRED" && (
                <div className="mt-3">
                  <button
                    onClick={() => router.push('/profile/shopee-config')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    Configurar Credenciais
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Date Filters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>Filtros de Data</span>
            </h3>
            
            {/* Predefined Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {orderedFilters.map(({ key, range }) => (
                <button
                  key={key}
                  onClick={() => handleDateFilterChange(key)}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    selectedDateFilter === key && !customDateRange
                      ? 'bg-orange-600 border-orange-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  } disabled:opacity-50`}
                >
                  {range.label}
                </button>
              ))}
              
              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isLoading || (!selectedDateFilter && !customDateRange)}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Buscando...</span>
                  </div>
                ) : (
                  'Buscar Relatório'
                )}
              </button>
            </div>

            {/* Custom Date Range */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Período Personalizado</h4>
              <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={customDateRange?.start || ''}
                  max={formatDateForInput(getYesterdayDate())}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const clampedValue = clampDateToYesterday(rawValue);
                    setCustomDateRange(prev => {
                      if (!clampedValue) {
                        return prev?.end
                          ? { ...prev, start: '' }
                          : null;
                      }
                      const baseEnd = prev?.end
                        ? clampDateToYesterday(prev.end)
                        : formatDateForInput(getYesterdayDate());
                      let endValue = baseEnd;
                      if (endValue && parseInputDate(clampedValue) > parseInputDate(endValue)) {
                        endValue = clampedValue;
                      }
                      return {
                        label: 'Período Personalizado',
                        start: clampedValue,
                        end: endValue
                      };
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Data Final</label>
                <input
                  type="date"
                  value={customDateRange?.end || ''}
                  max={formatDateForInput(getYesterdayDate())}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const clampedValue = clampDateToYesterday(rawValue);
                    setCustomDateRange(prev => {
                      if (!clampedValue) {
                        return prev?.start
                          ? { ...prev, end: '' }
                          : null;
                      }
                      const baseStart = prev?.start
                        ? clampDateToYesterday(prev.start)
                        : clampedValue;
                      let startValue = baseStart;
                      if (startValue && parseInputDate(clampedValue) < parseInputDate(startValue)) {
                        startValue = clampedValue;
                      }
                      return {
                        label: 'Período Personalizado',
                        start: startValue,
                        end: clampedValue
                      };
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCustomDateRange}
                    disabled={isLoading || !customDateRange?.start || !customDateRange?.end}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Buscando...</span>
                      </div>
                    ) : (
                      'Buscar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-200 mb-1">
                  Relatório Direto da Shopee:
                </h3>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Dados atualizados em tempo real da plataforma Shopee</li>
                  <li>• Não é necessário fazer upload de arquivos CSV</li>
                  <li>• Escolha o período desejado usando os filtros acima</li>
                  <li>• Consulta dos últimos 3 meses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-gray-800 shadow rounded-lg p-8 text-center">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando relatório da Shopee...</p>
          </div>
        )}

        {/* No Data State */}
        {!hasLoadedData && !isLoading && (
          <div className="bg-gray-800 shadow rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Selecione um período</h3>
            <p className="text-gray-400 mb-4">
              Selecione um filtro de data e clique em &quot;Buscar Relatório&quot; para carregar os dados da Shopee
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• <strong>Ontem:</strong> Relatório do dia anterior</p>
              <p>• <strong>7, 15, 30 dias:</strong> Períodos pré-definidos</p>
              <p>• <strong>Personalizado:</strong> Escolha suas próprias datas</p>
              <p>• Período máximo: 3 meses</p>
            </div>
          </div>
        )}

        {/* Report Display */}
        {reportData && !isLoading && hasLoadedData && (
          <div className="bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Relatório Shopee - {activeDateRange
                    ? (() => {
                        const startLabel = formatDateForDisplay(activeDateRange.start);
                        const endLabel = formatDateForDisplay(activeDateRange.end);
                        return startLabel === endLabel ? startLabel : `${startLabel} a ${endLabel}`;
                      })()
                    : reportData.periodo}
                </h2>
                <p className="text-gray-400">
                  Dados diretos da plataforma • Última atualização: {new Date().toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <CommissionReportDisplay report={reportData} onError={showErrorMessage} />
          </div>
        )}
      </div>
    </SubscriptionProtection>
  );
}

// Commission Report Display Component (reused from commissions page)
function CommissionReportDisplay({ report, onError }: { report: CommissionReport; onError?: (message: string) => void; }) {
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const topProduct = report.produto_top_vendas ?? null;
  const topProducts = report.produtos_top_vendas ?? [];
  const topCategories = report.categorias_top_vendas ?? [];
  const highlightCategory = report.categoria_top_vendas
    ? topCategories.find(
        (category: CategoriaTopVenda) =>
          category.categoria === report.categoria_top_vendas
      ) ?? topCategories[0] ?? null
    : topCategories[0] ?? null;

  const isLoadingProduct = (product: ProdutoTopVenda) => {
    if (!product.item_id) return false;
    return loadingProductId === String(product.item_id);
  };

  const handleProductClick = async (product: ProdutoTopVenda) => {
    if (!product.item_id) {
      onError?.('Item ID do produto não disponível.');
      return;
    }

    const productId = String(product.item_id);

    try {
      setLoadingProductId(productId);
      const productLink = await commissionsService.getShopeeProductLink(productId);
      if (typeof window !== 'undefined') {
        window.open(productLink, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível abrir o link do produto.';
      if (onError) {
        onError(message);
      } else {
        console.error(message);
      }
    } finally {
      setLoadingProductId(null);
    }
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Chart for Comissões por Canal */}
          <div>
            <CommissionsByChannelChart data={report.comissoes_por_canal} />
          </div>
        </div>

        {/* Comissões por Sub ID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Chart for Comissões por Sub ID */}
          <div>
            <CommissionsBySubIdChart data={report.comissoes_por_subid} />
          </div>
        </div>

        {/* Pedidos por Canal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Pedidos por Canal</span>
            </h3>
            <div className="space-y-3">
              {report.comissoes_por_canal.map((item: ComissaoPorCanal, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getChannelIcon(item.canal)}</span>
                    <div>
                      <p className="font-medium text-white">{item.canal}</p>
                      <p className="text-sm text-gray-400">
                        {formatCurrency(item.comissao)} em comissões
                      </p>
                    </div>
                  </div>
                  <span className="text-blue-400 font-bold">
                    {item.total_pedidos} pedidos
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart for Pedidos por Canal */}
          <div>
            <OrdersByChannelChart data={report.comissoes_por_canal} />
          </div>
        </div>
      </div>

      {/* Highlights */}
      {(topProduct || highlightCategory) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topProduct && (
            <button
              type="button"
              onClick={() => handleProductClick(topProduct)}
              disabled={isLoadingProduct(topProduct)}
              className={`bg-gray-700 rounded-lg p-6 text-left transition-colors border border-transparent ${
                topProduct.item_id ? 'hover:border-orange-500' : 'cursor-not-allowed'
              } ${isLoadingProduct(topProduct) ? 'opacity-75 cursor-wait' : ''}`}
            >
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-orange-400" />
                <span>Produto Destaque</span>
              </h3>
              {topProduct.image_url && (
                <div className="mt-4">
                  <img
                    src={topProduct.image_url}
                    alt={topProduct.nome_item}
                    className="w-28 h-28 object-cover rounded-md border border-gray-600"
                  />
                </div>
              )}
              <p className="mt-3 text-base font-medium text-gray-100">{topProduct.nome_item}</p>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Quantidade vendida</span>
                  <span className="text-white font-semibold">
                    {topProduct.quantidade.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total de pedidos</span>
                  <span className="text-white font-semibold">
                    {topProduct.total_pedidos.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Comissão gerada</span>
                  <span className="text-green-400 font-semibold">
                    {formatCurrency(topProduct.comissao)}
                  </span>
                </div>
                {typeof topProduct.item_price === 'number' && (
                  <div className="flex items-center justify-between">
                    <span>Preço unitário</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(topProduct.item_price)}
                    </span>
                  </div>
                )}
                {typeof topProduct.actual_amount === 'number' && (
                  <div className="flex items-center justify-between">
                    <span>Valor total</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(topProduct.actual_amount)}
                    </span>
                  </div>
                )}
              </div>
              {topProduct.item_id && (
                <p className="mt-4 text-xs text-gray-500">
                  Item ID: {topProduct.item_id}
                </p>
              )}
              <div className="mt-4 text-xs text-gray-400 flex items-center space-x-2">
                {isLoadingProduct(topProduct) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    <span>Abrindo produto...</span>
                  </>
                ) : (
                  <span>Clique para abrir o produto na Shopee</span>
                )}
              </div>
            </button>
          )}

          {highlightCategory && (
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span>Categoria Destaque</span>
              </h3>
              <p className="mt-3 text-base font-medium text-gray-100">
                {report.categoria_top_vendas ?? highlightCategory.categoria}
              </p>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Itens vendidos</span>
                  <span className="text-white font-semibold">
                    {highlightCategory.quantidade.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total de pedidos</span>
                  <span className="text-white font-semibold">
                    {highlightCategory.total_pedidos.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Comissão gerada</span>
                  <span className="text-green-400 font-semibold">
                    {formatCurrency(highlightCategory.comissao)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Products and Categories */}
      {(topProducts.length > 0 || topCategories.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {topProducts.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-orange-400" />
                <span>Produtos Top Vendas</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-gray-600/60 text-gray-200">
                    <tr>
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2 text-right">Qtd.</th>
                      <th className="px-3 py-2 text-right">Pedidos</th>
                      <th className="px-3 py-2 text-right">Comissão</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                <tbody>
                  {topProducts.map((item: ProdutoTopVenda, index: number) => (
                    <tr
                      key={`${item.item_id ?? item.nome_item}-${index}`}
                      className="border-b border-gray-600/40 last:border-0"
                    >
                      <td className="px-3 py-3 align-top">
                          <div className="flex items-start space-x-3">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.nome_item}
                                className="w-12 h-12 object-cover rounded-md border border-gray-600"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleProductClick(item)}
                              disabled={!item.item_id || isLoadingProduct(item)}
                              className="text-white font-medium leading-snug text-left hover:text-orange-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {item.nome_item}
                            </button>
                            {isLoadingProduct(item) && (
                              <Loader2 className="w-4 h-4 mt-0.5 text-orange-400 animate-spin" />
                            )}
                          </div>
                          {item.item_id && (
                            <div className="text-xs text-gray-400 mt-1">
                              ID: {item.item_id}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {item.quantidade.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {item.total_pedidos.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-3 text-right text-green-400">
                          {formatCurrency(item.comissao)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {typeof item.actual_amount === 'number'
                            ? formatCurrency(item.actual_amount)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {topCategories.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>Categorias Top Vendas</span>
              </h3>
              <div className="space-y-3">
                {topCategories.map((category: CategoriaTopVenda, index: number) => (
                  <div
                    key={`${category.categoria}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-600 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {index + 1}. {category.categoria}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {category.quantidade.toLocaleString('pt-BR')} itens •{' '}
                        {category.total_pedidos.toLocaleString('pt-BR')} pedidos
                      </p>
                    </div>
                    <span className="text-green-400 font-bold">
                      {formatCurrency(category.comissao)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
