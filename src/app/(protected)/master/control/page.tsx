"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Target,
  MousePointer,
  ShoppingCart,
  Eye,
  Lock
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  investment: number;
  sales: number;
  clicks: number;
  conversions: number;
  platform: string;
  isActive: boolean;
  createdAt: string;
}

interface MonthlySummary {
  investment: number;
  sales: number;
  profit: number;
  roi: number;
}

export default function ControlMasterPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false); // Mock subscription check
  
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    platform: "",
    investment: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    // Mock subscription check
    const checkSubscription = () => {
      // In real app, this would check user subscription
      setHasAccess(true); // Set to false to see paywall
      if (hasAccess) {
        loadCampaigns();
      }
    };
    checkSubscription();
  }, [hasAccess]);

  const loadCampaigns = () => {
    // Mock data
    const mockCampaigns: Campaign[] = [
      {
        id: "1",
        name: "Campanha Instagram Stories",
        startDate: "2024-11-01",
        endDate: "2024-11-30",
        investment: 2500,
        sales: 4200,
        clicks: 1580,
        conversions: 42,
        platform: "Instagram",
        isActive: true,
        createdAt: "2024-11-01"
      },
      {
        id: "2",
        name: "Google Ads - Black Friday",
        startDate: "2024-11-15",
        endDate: "2024-11-30",
        investment: 5000,
        sales: 8950,
        clicks: 3200,
        conversions: 89,
        platform: "Google Ads",
        isActive: true,
        createdAt: "2024-11-15"
      }
    ];
    setCampaigns(mockCampaigns);
  };

  const getMonthlySummary = (): MonthlySummary => {
    const monthCampaigns = campaigns.filter(campaign => {
      const campaignDate = new Date(campaign.startDate);
      return campaignDate.getMonth() === currentMonth.getMonth() &&
             campaignDate.getFullYear() === currentMonth.getFullYear();
    });

    const summary = monthCampaigns.reduce((acc, campaign) => ({
      investment: acc.investment + campaign.investment,
      sales: acc.sales + campaign.sales,
      profit: acc.profit + (campaign.sales - campaign.investment),
      roi: 0
    }), { investment: 0, sales: 0, profit: 0, roi: 0 });

    summary.roi = summary.investment > 0 ? ((summary.profit / summary.investment) * 100) : 0;
    
    return summary;
  };

  const createCampaign = () => {
    const campaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      platform: newCampaign.platform,
      investment: parseFloat(newCampaign.investment) || 0,
      sales: 0,
      clicks: 0,
      conversions: 0,
      startDate: newCampaign.startDate,
      endDate: newCampaign.endDate,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setCampaigns(prev => [campaign, ...prev]);
    setIsCreateModalOpen(false);
    setNewCampaign({
      name: "",
      platform: "",
      investment: "",
      startDate: "",
      endDate: ""
    });
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Controle Master</h1>
              <p className="text-gray-400">Controle completo das suas campanhas publicitárias</p>
            </div>
          </div>
        </div>

        {/* Paywall */}
        <div className="bg-gray-800 shadow rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Funcionalidade Premium
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            O Controle Master é uma funcionalidade exclusiva para assinantes. 
            Tenha controle total sobre suas campanhas publicitárias com métricas detalhadas.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-left">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-gray-300">Controle de investimento e retorno</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-left">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-gray-300">Métricas de performance detalhadas</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-left">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-gray-300">Relatórios mensais automáticos</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-left">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-gray-300">Análise de ROI em tempo real</span>
            </div>
          </div>
          <button 
            onClick={() => setHasAccess(true)} // Mock subscription
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Assinar Controle Master
          </button>
        </div>
      </div>
    );
  }

  const summary = getMonthlySummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Controle Master</h1>
            <p className="text-gray-400">Controle completo das suas campanhas publicitárias</p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-white capitalize">
              {getMonthName(currentMonth)}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Investimento</p>
                <p className="text-xl font-bold text-red-900">
                  {formatCurrency(summary.investment)}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Vendas</p>
                <p className="text-xl font-bold text-green-900">
                  {formatCurrency(summary.sales)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <div className={`${summary.profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${summary.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Lucro</p>
                <p className={`text-xl font-bold ${summary.profit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                  {formatCurrency(summary.profit)}
                </p>
              </div>
              <DollarSign className={`w-6 h-6 ${summary.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">ROI</p>
                <p className="text-xl font-bold text-purple-900">
                  {summary.roi.toFixed(1)}%
                </p>
              </div>
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Campanhas do Mês</h2>
        
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
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
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="border border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                      <p className="text-sm text-gray-400">{campaign.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-400"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Período</p>
                    <p className="font-medium">
                      {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Investimento</p>
                    <p className="font-medium text-red-600">
                      {formatCurrency(campaign.investment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Vendas</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(campaign.sales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Cliques</p>
                    <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Conversões</p>
                    <p className="font-medium">{campaign.conversions}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">
                          CTR: {campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">
                          ROI: {campaign.investment > 0 ? (((campaign.sales - campaign.investment) / campaign.investment) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-700 text-gray-200'
                    }`}>
                      {campaign.isActive ? 'Ativa' : 'Pausada'}
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Nova Campanha</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ex: Campanha Black Friday"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Plataforma
                </label>
                <select
                  value={newCampaign.platform}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Selecione uma plataforma</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Investimento (R$)
                </label>
                <input
                  type="number"
                  value={newCampaign.investment}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, investment: e.target.value }))}
                  className="w-full border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0,00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createCampaign}
                disabled={!newCampaign.name || !newCampaign.platform}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Criar Campanha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}