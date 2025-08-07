'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Target,
  ShoppingCart,
  Eye,
  MousePointer,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import SubscriptionProtection from '@/components/SubscriptionProtection';
import { 
  controlMasterService,
  UserAd,
  MonthlySummary,
  CreateAdRequest,
  ControlMasterType,
  ControlMasterTypeLabels
} from '@/services/control-master.service';
import { useAuth } from '@/context/auth-context';

export default function ControlMasterPage() {
  const [ads, setAds] = useState<UserAd[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<UserAd | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  
  const [newAd, setNewAd] = useState({
    name: '',
    date: '',
    type: ControlMasterType.PER_DAY
  });

  const router = useRouter();
  const { logout, user } = useAuth();

  useEffect(() => {
    loadAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);



  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const loadAds = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get start and end dates for the current month

      
      // For now, let's get all ads without date filter to see if we get any data
      const queryParams = `populate=items&sort=createdAt:DESC&pagination[page]=1&pagination[pageSize]=100`;
      
      const adsData = await controlMasterService.getUserAds(queryParams);
      
      setAds(adsData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar campanhas.';
      if (errorMessage === "Authentication failed" || errorMessage === "Authentication required") {
        logout();
        router.push("/login");
        return;
      }
      showErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createAd = async () => {
    try {
      if (!newAd.name || !newAd.date) {
        showErrorMessage('Preencha todos os campos obrigatórios.');
        return;
      }

      if (!user) {
        showErrorMessage('Usuário não autenticado.');
        return;
      }

      const createData: CreateAdRequest = {
        name: newAd.name,
        date: newAd.date, // Use the date directly in yyyy-MM-dd format
        user: user.documentId,
        type: newAd.type,
      };

      const createdAd = await controlMasterService.createAd(user.documentId, createData);
      setAds(prev => [createdAd, ...prev]);
      setIsCreateModalOpen(false);
      setNewAd({ name: '', date: '', type: ControlMasterType.PER_DAY });
      showSuccessMessage('Campanha criada com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar campanha.';
      showErrorMessage(errorMessage);
    }
  };

  const editAd = async (adId: string, newName: string) => {
    try {
      if (!newName.trim()) {
        showErrorMessage('O nome da campanha não pode estar vazio.');
        return;
      }

      if (!user) {
        showErrorMessage('Usuário não autenticado.');
        return;
      }

      const ad = ads.find(a => a.documentId === adId);
      if (!ad) {
        showErrorMessage('Campanha não encontrada.');
        return;
      }

      await controlMasterService.updateAd({ documentId: ad.documentId, name: newName });
      setAds(prev => prev.map(ad => 
        ad.documentId === adId ? { ...ad, name: newName } : ad
      ));
      setIsEditModalOpen(false);
      setEditingAd(null);
      showSuccessMessage('Campanha atualizada com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar campanha.';
      showErrorMessage(errorMessage);
    }
  };

  const deleteAd = async (adId: string) => {
    try {
      if (!user) {
        showErrorMessage('Usuário não autenticado.');
        return;
      }

      const ad = ads.find(a => a.documentId === adId);
      if (!ad) {
        showErrorMessage('Campanha não encontrada.');
        return;
      }

      await controlMasterService.deleteAd(ad.documentId);
      setAds(prev => prev.filter(ad => ad.documentId !== adId));
      showSuccessMessage('Campanha deletada com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar campanha.';
      showErrorMessage(errorMessage);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(controlMasterService.getPreviousMonth(currentMonth));
  };

  const nextMonth = () => {
    setCurrentMonth(controlMasterService.getNextMonth(currentMonth));
  };

  const getMonthlySummary = (): MonthlySummary => {
    const monthYear = controlMasterService.formatMonthYear(currentMonth);
    return controlMasterService.getMonthlySummary(ads, monthYear);
  };

  const getAdsByMonth = (): UserAd[] => {
    const monthYear = controlMasterService.formatMonthYear(currentMonth);
    const filteredAds = controlMasterService.getAdsByMonth(ads, monthYear);
    return filteredAds;
  };



  const summary = getMonthlySummary();
  const monthAds = getAdsByMonth();

  return (
    <SubscriptionProtection type="control">
      <div className="space-y-8">
      {/* Header */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Controle Master</h1>
            <p className="text-gray-400">Controle completo das suas campanhas publicitárias</p>
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

        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-900 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-white capitalize">
              {controlMasterService.formatMonthName(currentMonth)}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-900 rounded-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Campanha</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-400 font-medium">Investimento</p>
                <p className="text-2xl font-bold text-red-300">
                  {controlMasterService.formatCurrency(summary.totalInvestment)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400 font-medium">Vendas</p>
                <p className="text-2xl font-bold text-green-300">
                  {controlMasterService.formatCurrency(summary.totalSales)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className={`${summary.totalProfit >= 0 ? 'bg-blue-900/20 border-blue-700' : 'bg-red-900/20 border-red-700'} border rounded-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${summary.totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>Lucro</p>
                <p className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-blue-300' : 'text-red-300'}`}>
                  {controlMasterService.formatCurrency(summary.totalProfit)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${summary.totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`} />
            </div>
          </div>

          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-400 font-medium">ROI</p>
                <p className="text-2xl font-bold text-purple-300">
                  {summary.totalRoi.toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400 font-medium">Total Cliques Shopee</p>
                <p className="text-xl font-bold text-blue-300">
                  {summary.totalShoppeClicks.toLocaleString()}
                </p>
              </div>
              <MousePointer className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-400 font-medium">Total Cliques Meta</p>
                <p className="text-xl font-bold text-orange-300">
                  {summary.totalMetaClicks.toLocaleString()}
                </p>
              </div>
              <Eye className="w-6 h-6 text-orange-400" />
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400 font-medium">CPC Médio</p>
                <p className="text-xl font-bold text-yellow-300">
                  {controlMasterService.formatCurrency(summary.averageCpc)}
                </p>
              </div>
              <ShoppingCart className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Campanhas do Mês</h2>
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Carregando...</span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando campanhas...</p>
          </div>
        ) : monthAds.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 mb-4">Nenhuma campanha criada ainda</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Criar primeira campanha
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {monthAds.map((ad) => (
              <div
                key={ad.id}
                className="border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-900 hover:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-4 flex-1 cursor-pointer"
                    onClick={() => router.push(`/master/control/${ad.documentId}`)}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white hover:text-purple-300 transition-colors">
                        {ad.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-400">
                          {ad.items.length} item{ad.items.length !== 1 ? 's' : ''} • ID: {ad.documentId}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ad.type === ControlMasterType.PER_DAY 
                            ? 'bg-blue-900/20 text-blue-300 border border-blue-700' 
                            : 'bg-orange-900/20 text-orange-300 border border-orange-700'
                        }`}>
                          {ControlMasterTypeLabels[ad.type]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Total Investimento</p>
                      <p className="text-white font-medium">
                        {controlMasterService.formatCurrency(
                          ad.items.reduce((sum, item) => sum + item.valueDailyInvestment, 0)
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Total Vendas</p>
                      <p className="text-white font-medium">
                        {controlMasterService.formatCurrency(
                          ad.items.reduce((sum, item) => sum + item.valueTotalSalesDay, 0)
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const totalInvestment = ad.items.reduce((sum, item) => sum + item.valueDailyInvestment, 0);
                        const totalSales = ad.items.reduce((sum, item) => sum + item.valueTotalSalesDay, 0);
                        const profit = totalSales - totalInvestment;
                        return (
                          <>
                            <p className="text-sm text-gray-400">Lucro</p>
                            <p className={`font-medium ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {controlMasterService.formatCurrency(profit)}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAd(ad);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md transition-colors"
                        title="Editar campanha"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Tem certeza que deseja deletar esta campanha?')) {
                            deleteAd(ad.documentId);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-md transition-colors"
                        title="Deletar campanha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-6 h-6 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg max-w-md w-full p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Nova Campanha</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={newAd.name}
                  onChange={(e) => setNewAd(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ex: Campanha Black Friday"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={newAd.date}
                  onChange={(e) => setNewAd(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de Campanha
                </label>
                <select
                  value={newAd.type}
                  onChange={(e) => setNewAd(prev => ({ ...prev, type: e.target.value as ControlMasterType }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value={ControlMasterType.PER_DAY}>{ControlMasterTypeLabels[ControlMasterType.PER_DAY]}</option>
                  <option value={ControlMasterType.PER_AD}>{ControlMasterTypeLabels[ControlMasterType.PER_AD]}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewAd({ name: '', date: '', type: ControlMasterType.PER_DAY });
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createAd}
                disabled={!newAd.name || !newAd.date}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Criar Campanha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {isEditModalOpen && editingAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg max-w-md w-full p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Editar Campanha</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={editingAd.name}
                  onChange={(e) => setEditingAd(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ex: Campanha Black Friday"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAd(null);
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => editAd(editingAd.documentId, editingAd.name)}
                disabled={!editingAd.name.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SubscriptionProtection>
  );
}