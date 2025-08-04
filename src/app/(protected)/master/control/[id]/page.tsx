"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { controlMasterService, UserAd, UserAdItem, MonthlySummary } from '@/services/control-master.service';

export default function CampaignDetailsPage() {
  const [campaign, setCampaign] = useState<UserAd | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<UserAdItem | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    valueDailyInvestment: '',
    valueTotalSalesDay: '',
    valueTotalCpc: '',
    totalClicks: '',
    totalImpressions: '',
    notes: ''
  });

  const router = useRouter();
  const params = useParams();
  const { logout } = useAuth();
  const campaignId = params.id as string;

  useEffect(() => {
    loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const loadCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get specific campaign by documentId with items populated
      const campaign = await controlMasterService.getUserAdByDocumentId(campaignId, 'populate=items');
      
      console.log('Campaign loaded:', campaign);
      console.log('Campaign items:', campaign?.items);
      console.log('Items count:', campaign?.items?.length);
      console.log('Campaign date:', campaign?.date);
      console.log('First item date:', campaign?.items?.[0]?.date);
      console.log('Last item date:', campaign?.items?.[campaign?.items?.length - 1]?.date);
      
      if (!campaign) {
        showErrorMessage('Campanha não encontrada.');
        router.push('/master/control');
        return;
      }
      
      setCampaign(campaign);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar campanha.';
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

  const startEditing = (item: UserAdItem) => {
    setEditingItem(item);
    setEditForm({
      date: item.date,
      valueDailyInvestment: item.valueDailyInvestment.toString(),
      valueTotalSalesDay: item.valueTotalSalesDay.toString(),
      valueTotalCpc: item.valueTotalCpc.toString(),
      totalClicks: item.totalClicks,
      totalImpressions: item.totalImpressions,
      notes: item.notes
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({
      date: '',
      valueDailyInvestment: '',
      valueTotalSalesDay: '',
      valueTotalCpc: '',
      totalClicks: '',
      totalImpressions: '',
      notes: ''
    });
  };

  const saveItem = async () => {
    if (!editingItem || !campaign) return;

    try {
      const updatedItem = await controlMasterService.updateAdItem(editingItem.documentId, {
        date: editForm.date,
        valueDailyInvestment: parseFloat(editForm.valueDailyInvestment) || 0,
        valueTotalSalesDay: parseFloat(editForm.valueTotalSalesDay) || 0,
        valueTotalCpc: parseFloat(editForm.valueTotalCpc) || 0,
        totalClicks: editForm.totalClicks,
        totalImpressions: editForm.totalImpressions,
        notes: editForm.notes
      });

      // Update the campaign with the edited item
      setCampaign(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item => 
            item.id === editingItem.id ? updatedItem : item
          )
        };
      });

      setEditingItem(null);
      showSuccessMessage('Item atualizado com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar item.';
      showErrorMessage(errorMessage);
    }
  };

  const getCampaignSummary = (): MonthlySummary => {
    if (!campaign) {
      return {
        totalInvestment: 0,
        totalSales: 0,
        totalProfit: 0,
        totalRoi: 0,
        totalClicks: 0,
        totalImpressions: 0,
        averageCpc: 0
      };
    }

    let totalInvestment = 0;
    let totalSales = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalCpc = 0;
    let itemCount = 0;

    campaign.items.forEach(item => {
      totalInvestment += item.valueDailyInvestment;
      totalSales += item.valueTotalSalesDay;
      totalClicks += parseInt(item.totalClicks) || 0;
      totalImpressions += parseInt(item.totalImpressions) || 0;
      totalCpc += item.valueTotalCpc;
      itemCount++;
    });

    const totalProfit = totalSales - totalInvestment;
    const totalRoi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    const averageCpc = itemCount > 0 ? totalCpc / itemCount : 0;

    return {
      totalInvestment,
      totalSales,
      totalProfit,
      totalRoi,
      totalClicks,
      totalImpressions,
      averageCpc,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando campanha...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-400">Campanha não encontrada.</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = getCampaignSummary();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/master/control')}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
                  <p className="text-gray-400">ID: {campaign.documentId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 bg-green-900 border border-green-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-900 rounded-full"></div>
                </div>
                <span className="text-green-200">{successMessage}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-red-900" />
                </div>
                <span className="text-red-200">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-400 font-medium">Investimento</p>
                <p className="text-xl font-bold text-red-300">
                  {controlMasterService.formatCurrency(summary.totalInvestment)}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400 font-medium">Vendas</p>
                <p className="text-xl font-bold text-green-300">
                  {controlMasterService.formatCurrency(summary.totalSales)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>

          <div className={`${summary.totalProfit >= 0 ? 'bg-blue-900/20 border-blue-700' : 'bg-red-900/20 border-red-700'} border rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${summary.totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>Lucro</p>
                <p className={`text-xl font-bold ${summary.totalProfit >= 0 ? 'text-blue-300' : 'text-red-300'}`}>
                  {controlMasterService.formatCurrency(summary.totalProfit)}
                </p>
              </div>
              <DollarSign className={`w-6 h-6 ${summary.totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`} />
            </div>
          </div>

          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-400 font-medium">ROI</p>
                <p className="text-xl font-bold text-purple-300">
                  {summary.totalRoi.toFixed(2)}%
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">Total Cliques</p>
                <p className="text-xl font-bold text-white">
                  {summary.totalClicks.toLocaleString()}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">Total Impressões</p>
                <p className="text-xl font-bold text-white">
                  {summary.totalImpressions.toLocaleString()}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">CPC Médio</p>
                <p className="text-xl font-bold text-white">
                  {controlMasterService.formatCurrency(summary.averageCpc)}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Itens da Campanha</h2>
            <div className="text-sm text-gray-400">
              {campaign.items.length} item{campaign.items.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {campaign.items.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum item registrado nesta campanha</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaign.items.map((item) => (
                <div key={item.documentId} className="border border-gray-600 rounded-lg p-4">
                  {editingItem?.documentId === item.documentId ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Data</label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Investimento</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.valueDailyInvestment}
                            onChange={(e) => setEditForm(prev => ({ ...prev, valueDailyInvestment: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Vendas</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.valueTotalSalesDay}
                            onChange={(e) => setEditForm(prev => ({ ...prev, valueTotalSalesDay: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">CPC</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.valueTotalCpc}
                            onChange={(e) => setEditForm(prev => ({ ...prev, valueTotalCpc: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Cliques</label>
                          <input
                            type="text"
                            value={editForm.totalClicks}
                            onChange={(e) => setEditForm(prev => ({ ...prev, totalClicks: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Impressões</label>
                          <input
                            type="text"
                            value={editForm.totalImpressions}
                            onChange={(e) => setEditForm(prev => ({ ...prev, totalImpressions: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Observações</label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveItem}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Salvar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-white">
                            {controlMasterService.formatDate(item.date)}
                          </span>
                        </div>
                        <button
                          onClick={() => startEditing(item)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-md transition-colors"
                          title="Editar item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Investimento</p>
                          <p className="text-white font-medium">
                            {controlMasterService.formatCurrency(item.valueDailyInvestment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Vendas</p>
                          <p className="text-white font-medium">
                            {controlMasterService.formatCurrency(item.valueTotalSalesDay)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">CPC</p>
                          <p className="text-white font-medium">
                            {controlMasterService.formatCurrency(item.valueTotalCpc)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Cliques</p>
                          <p className="text-white font-medium">{item.totalClicks}</p>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mt-3 p-3 bg-gray-700 rounded-md">
                          <p className="text-sm text-gray-300">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 