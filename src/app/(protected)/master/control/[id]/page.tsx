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
  X,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { controlMasterService, UserAd, UserAdItem, MonthlySummary, ControlMasterType, ControlMasterTypeLabels } from '@/services/control-master.service';

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
    notes: '',
    subId: '',
    productLink: '',
    shoppeClicks: '',
    metaClicks: ''
  });
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [isAddingLoading, setIsAddingLoading] = useState(false);
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    date: new Date().toISOString().split('T')[0], // Data de hoje como padrão
    valueDailyInvestment: '',
    valueTotalSalesDay: '',
    valueTotalCpc: '',
    notes: '',
    subId: '',
    productLink: '',
    shoppeClicks: '',
    metaClicks: ''
  });

  const router = useRouter();
  const params = useParams();
  const { logout, user } = useAuth();
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
    console.log('showErrorMessage called with:', message);
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Função para limpar formatação monetária
  const cleanCurrency = (value: string): string => {
    if (!value) return '0';
    
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    
    // Converte vírgula para ponto
    const number = parseFloat(cleanValue.replace(',', '.'));
    return isNaN(number) ? '0' : number.toString();
  };

  const loadCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get specific campaign by documentId with items populated
      const campaign = await controlMasterService.getUserAdByDocumentId(campaignId, 'populate=items');
      

      
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
      notes: item.notes || '',
      subId: item.subId || '',
      productLink: item.productLink || '',
      shoppeClicks: item.shoppeClicks || '',
      metaClicks: item.metaClicks || ''
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({
      date: '',
      valueDailyInvestment: '',
      valueTotalSalesDay: '',
      valueTotalCpc: '',
      notes: '',
      subId: '',
      productLink: '',
      shoppeClicks: '',
      metaClicks: ''
    });
  };

  const saveItem = async () => {
    console.log('saveItem called');
    console.log('editingItem:', editingItem);
    console.log('campaign:', campaign);
    
    if (!editingItem || !campaign) {
      console.log('No editingItem or campaign found');
      return;
    }

    setIsEditingLoading(true);

    try {
      console.log('editForm:', editForm);
      
      // Para campanhas PER_DAY, manter a data original do item
      let itemDate = editingItem.date;
      
      if (campaign.type === ControlMasterType.PER_AD) {
        // Validar se a data está dentro do mês da campanha para PER_AD
        // A data da campanha está no formato "YYYY-MM-DD", podemos usar diretamente
        const campaignDate = new Date(campaign.date);
        const newItemDate = new Date(editForm.date);

        console.log('Campaign date:', campaignDate);
        console.log('Item date:', newItemDate);
        console.log('Campaign month:', campaignDate.getMonth());
        console.log('Item month:', newItemDate.getMonth());
        console.log('Campaign year:', campaignDate.getFullYear());
        console.log('Item year:', newItemDate.getFullYear());
        
        if (campaignDate.getMonth() !== newItemDate.getMonth() || 
            campaignDate.getFullYear() !== newItemDate.getFullYear()) {
          console.log('Date validation failed - showing error message');
          showErrorMessage('A data deve estar dentro do mês da campanha.');
          return;
        }
        
        console.log('Date validation passed');
        itemDate = editForm.date;
      }

      const updateData = {
        date: itemDate,
        valueDailyInvestment: parseFloat(cleanCurrency(editForm.valueDailyInvestment)) || 0,
        valueTotalSalesDay: parseFloat(cleanCurrency(editForm.valueTotalSalesDay)) || 0,
        valueTotalCpc: parseFloat(cleanCurrency(editForm.valueTotalCpc)) || 0,
        notes: editForm.notes || '',
        subId: editForm.subId || '',
        productLink: editForm.productLink || '',
        shoppeClicks: editForm.shoppeClicks || '0',
        metaClicks: editForm.metaClicks || '0'
      };

      console.log('Update data:', updateData);
      console.log('Document ID:', editingItem.documentId);

      const updatedItem = await controlMasterService.updateAdItem(editingItem.documentId, updateData);

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
    } finally {
      setIsEditingLoading(false);
    }
  };

  const addNewItem = async () => {
    console.log('addNewItem called');
    console.log('campaign:', campaign);
    
    if (!campaign) {
      console.log('No campaign found');
      return;
    }

    setIsAddingLoading(true);

    // Verificar se é uma campanha PER_AD (única que permite adição)
    if (campaign.type !== ControlMasterType.PER_AD) {
      console.log('Campaign type is not PER_AD:', campaign.type);
      showErrorMessage('Adição de itens não permitida para campanhas do tipo "Por Dia".');
      return;
    }

    try {
      console.log('newItemForm:', newItemForm);
      
      // Validar campos obrigatórios
      if (!newItemForm.date) {
        console.log('Date is missing');
        showErrorMessage('A data é obrigatória.');
        return;
      }
      
      // Validar se a data está dentro do mês da campanha para PER_AD
      if (campaign.type === ControlMasterType.PER_AD) {
        // A data da campanha está no formato "YYYY-MM-DD", podemos usar diretamente
        const campaignDate = new Date(campaign.date);
        const itemDate = new Date(newItemForm.date);

        console.log('Campaign date:', campaignDate);
        console.log('Item date:', itemDate);
        console.log('Campaign month:', campaignDate.getMonth());
        console.log('Item month:', itemDate.getMonth());
        console.log('Campaign year:', campaignDate.getFullYear());
        console.log('Item year:', itemDate.getFullYear());
        
        if (campaignDate.getMonth() !== itemDate.getMonth() || 
            campaignDate.getFullYear() !== itemDate.getFullYear()) {
          console.log('Date validation failed - showing error message');
          showErrorMessage('A data deve estar dentro do mês da campanha.');
          return;
        }
        
        console.log('Date validation passed');
      }

      console.log('User check passed');
      
      if (!user) {
        console.log('No user found');
        showErrorMessage('Usuário não autenticado.');
        return;
      }

      console.log('User:', user);

      // Garantir valores padrão para campos obrigatórios
      const itemData = {
        date: newItemForm.date,
        valueDailyInvestment: parseFloat(cleanCurrency(newItemForm.valueDailyInvestment)) || 0,
        valueTotalSalesDay: parseFloat(cleanCurrency(newItemForm.valueTotalSalesDay)) || 0,
        valueTotalCpc: parseFloat(cleanCurrency(newItemForm.valueTotalCpc)) || 0,
        notes: newItemForm.notes || '',
        subId: newItemForm.subId || '',
        productLink: newItemForm.productLink || '',
        shoppeClicks: newItemForm.shoppeClicks || '0',
        metaClicks: newItemForm.metaClicks || '0',
        user: user.documentId
      };

      console.log('Item data to send:', itemData);
      console.log('Campaign documentId:', campaign.documentId);
      console.log('User documentId:', user.documentId);
      console.log('Campaign documentId:', campaign.documentId);

      await controlMasterService.createAdItem(campaign.documentId, itemData);

      // Reload campaign to get updated data
      await loadCampaign();
      setIsAddingNewItem(false);
      setNewItemForm({
        date: new Date().toISOString().split('T')[0], // Data de hoje como padrão
        valueDailyInvestment: '',
        valueTotalSalesDay: '',
        valueTotalCpc: '',
        notes: '',
        subId: '',
        productLink: '',
        shoppeClicks: '',
        metaClicks: ''
      });
      showSuccessMessage('Item adicionado com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar item.';
      showErrorMessage(errorMessage);
    } finally {
      setIsAddingLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!campaign) return;

    // Verificar se é uma campanha PER_AD (única que permite exclusão)
    if (campaign.type !== ControlMasterType.PER_AD) {
      showErrorMessage('Exclusão não permitida para campanhas do tipo "Por Dia".');
      return;
    }

    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await controlMasterService.deleteAdItem(itemId);
        await loadCampaign();
        showSuccessMessage('Item excluído com sucesso!');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir item.';
        showErrorMessage(errorMessage);
      }
    }
  };

  const getCampaignSummary = (): MonthlySummary => {
    if (!campaign) {
      return {
        totalInvestment: 0,
        totalSales: 0,
        totalProfit: 0,
        totalRoi: 0,
        totalShoppeClicks: 0,
        totalMetaClicks: 0,
        averageCpc: 0
      };
    }

    let totalInvestment = 0;
    let totalSales = 0;
    let totalShoppeClicks = 0;
    let totalMetaClicks = 0;
    let totalCpc = 0;
    let itemCount = 0;

    campaign.items.forEach(item => {
      totalInvestment += item.valueDailyInvestment;
      totalSales += item.valueTotalSalesDay;
      totalShoppeClicks += parseInt(item.shoppeClicks || '0') || 0;
      totalMetaClicks += parseInt(item.metaClicks || '0') || 0;
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
      totalShoppeClicks,
      totalMetaClicks,
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
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-400">ID: {campaign.documentId}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.type === ControlMasterType.PER_DAY 
                        ? 'bg-blue-900/20 text-blue-300 border border-blue-700' 
                        : 'bg-orange-900/20 text-orange-300 border border-orange-700'
                    }`}>
                      {ControlMasterTypeLabels[campaign.type]}
                    </span>
                  </div>
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
                <p className="text-sm text-gray-400 font-medium">Total Cliques Shopee</p>
                <p className="text-xl font-bold text-white">
                  {summary.totalShoppeClicks.toLocaleString()}
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
                <p className="text-sm text-gray-400 font-medium">Total Cliques Meta</p>
                <p className="text-xl font-bold text-white">
                  {summary.totalMetaClicks.toLocaleString()}
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
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                {campaign.items.length} item{campaign.items.length !== 1 ? 's' : ''}
              </div>
              {campaign.type === ControlMasterType.PER_AD && (
                <button
                  onClick={() => setIsAddingNewItem(true)}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Item</span>
                </button>
              )}
            </div>
          </div>
          
          {campaign.items.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum item registrado nesta campanha</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaign.items
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ordenar por data (mais recente primeiro)
                .map((item) => (
                <div key={item.documentId} className="border border-gray-600 rounded-lg p-4">
                  {editingItem?.documentId === item.documentId ? (
                    // Edit Form
                    <div className="space-y-4">
                      {/* Error Message */}
                      {error && (
                        <div className="mb-4 bg-red-900 border border-red-700 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                              <X className="w-3 h-3 text-red-900" />
                            </div>
                            <span className="text-red-200">{error}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Data {campaign.type === ControlMasterType.PER_DAY ? '(Fixa)' : '*'}
                          </label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            disabled={campaign.type === ControlMasterType.PER_DAY}
                            className={`w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500 ${
                              campaign.type === ControlMasterType.PER_DAY ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          {campaign.type === ControlMasterType.PER_DAY && (
                            <p className="text-xs text-gray-400 mt-1">
                              Data não pode ser alterada para campanhas do tipo &quot;Por Dia&quot;
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Investimento</label>
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.valueDailyInvestment}
                              onChange={(e) => setEditForm(prev => ({ ...prev, valueDailyInvestment: e.target.value }))}
                              placeholder="0,00"
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Vendas</label>
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.valueTotalSalesDay}
                              onChange={(e) => setEditForm(prev => ({ ...prev, valueTotalSalesDay: e.target.value }))}
                              placeholder="0,00"
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">CPC</label>
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.valueTotalCpc}
                              onChange={(e) => setEditForm(prev => ({ ...prev, valueTotalCpc: e.target.value }))}
                              placeholder="0,00"
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Cliques Shopee</label>
                          <input
                            type="text"
                            value={editForm.shoppeClicks}
                            onChange={(e) => setEditForm(prev => ({ ...prev, shoppeClicks: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Cliques Meta</label>
                          <input
                            type="text"
                            value={editForm.metaClicks}
                            onChange={(e) => setEditForm(prev => ({ ...prev, metaClicks: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Sub ID</label>
                          <input
                            type="text"
                            value={editForm.subId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, subId: e.target.value }))}
                            placeholder="Digite o Sub ID"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Link do Produto</label>
                          <input
                            type="text"
                            value={editForm.productLink}
                            onChange={(e) => setEditForm(prev => ({ ...prev, productLink: e.target.value }))}
                            placeholder="Digite o link"
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
                          disabled={isEditingLoading}
                          className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                            isEditingLoading 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {isEditingLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Salvar</span>
                            </>
                          )}
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditing(item)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-md transition-colors"
                            title="Editar item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {campaign.type === ControlMasterType.PER_AD && (
                            <button
                              onClick={() => deleteItem(item.documentId)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-md transition-colors"
                              title="Excluir item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
                          <p className="text-gray-400">Lucro</p>
                          <p className={`font-medium ${(item.valueTotalSalesDay - item.valueDailyInvestment) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {controlMasterService.formatCurrency(item.valueTotalSalesDay - item.valueDailyInvestment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">CPC</p>
                          <p className="text-white font-medium">
                            {controlMasterService.formatCurrency(item.valueTotalCpc)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                          <p className="text-gray-400">Cliques Shopee</p>
                          <p className="text-white font-medium">{item.shoppeClicks || '0'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Cliques Meta</p>
                          <p className="text-white font-medium">{item.metaClicks || '0'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Sub ID</p>
                          <p className="text-white font-medium">{item.subId || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Link do Produto</p>
                          <p className="text-white font-medium break-all">
                            {item.productLink ? (
                              <a 
                                href={item.productLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline"
                              >
                                {item.productLink}
                              </a>
                            ) : (
                              '-'
                            )}
                          </p>
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

        {/* Add New Item Modal */}
        {isAddingNewItem && campaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Adicionar Novo Item</h3>
              
              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-900 border border-red-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-red-900" />
                    </div>
                    <span className="text-red-200">{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Data {campaign.type === ControlMasterType.PER_DAY ? '(Fixa)' : '*'}
                    </label>
                    <input
                      type="date"
                      value={newItemForm.date}
                      onChange={(e) => setNewItemForm(prev => ({ ...prev, date: e.target.value }))}
                      disabled={campaign.type === ControlMasterType.PER_DAY}
                      className={`w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500 ${
                        campaign.type === ControlMasterType.PER_DAY ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                    {campaign.type === ControlMasterType.PER_DAY && (
                                             <p className="text-xs text-gray-400 mt-1">
                         Data fixa para campanhas do tipo &quot;Por Dia&quot;
                       </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Investimento *</label>
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newItemForm.valueDailyInvestment}
                        onChange={(e) => setNewItemForm(prev => ({ ...prev, valueDailyInvestment: e.target.value }))}
                        placeholder="0,00"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Vendas</label>
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newItemForm.valueTotalSalesDay}
                        onChange={(e) => setNewItemForm(prev => ({ ...prev, valueTotalSalesDay: e.target.value }))}
                        placeholder="0,00"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">CPC</label>
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newItemForm.valueTotalCpc}
                        onChange={(e) => setNewItemForm(prev => ({ ...prev, valueTotalCpc: e.target.value }))}
                        placeholder="0,00"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cliques Shopee</label>
                    <input
                      type="text"
                      value={newItemForm.shoppeClicks}
                      onChange={(e) => setNewItemForm(prev => ({ ...prev, shoppeClicks: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cliques Meta</label>
                    <input
                      type="text"
                      value={newItemForm.metaClicks}
                      onChange={(e) => setNewItemForm(prev => ({ ...prev, metaClicks: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Sub ID</label>
                    <input
                      type="text"
                      value={newItemForm.subId}
                      onChange={(e) => setNewItemForm(prev => ({ ...prev, subId: e.target.value }))}
                      placeholder="Digite o Sub ID"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Link do Produto</label>
                    <input
                      type="text"
                      value={newItemForm.productLink}
                      onChange={(e) => setNewItemForm(prev => ({ ...prev, productLink: e.target.value }))}
                      placeholder="Digite o link"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
                  <textarea
                    value={newItemForm.notes}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsAddingNewItem(false);
                    setNewItemForm({
                      date: new Date().toISOString().split('T')[0], // Data de hoje como padrão
                      valueDailyInvestment: '',
                      valueTotalSalesDay: '',
                      valueTotalCpc: '',
                      notes: '',
                      subId: '',
                      productLink: '',
                      shoppeClicks: '',
                      metaClicks: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    console.log('Button clicked!');
                    addNewItem();
                  }}
                  disabled={isAddingLoading}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                    isAddingLoading 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isAddingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Adicionando...</span>
                    </>
                  ) : (
                    <span>Adicionar Item</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 