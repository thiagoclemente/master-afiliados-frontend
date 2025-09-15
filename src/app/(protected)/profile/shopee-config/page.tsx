"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services/user.service";
import { UserUpdateRequest, UserProfile } from "@/interfaces/user.interface";
import { 
  ShoppingBag, 
  Key, 
  Save,
  ArrowLeft,
  Info,
  ExternalLink
} from "lucide-react";

export default function ShopeeConfigPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    shoppeId: "",
    shoppeApiPassword: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await UserService.getCurrentUser();
        setUserProfile(profile);
        setFormData({
          shoppeId: profile.shoppeId || "",
          shoppeApiPassword: profile.shoppeApiPassword || "",
        });
      } catch (err) {
        console.error("Error fetching user profile for shopee config:", err);
        setError(`Erro ao carregar dados do perfil: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UserUpdateRequest = {
        shoppeId: formData.shoppeId.trim() || undefined,
        shoppeApiPassword: formData.shoppeApiPassword.trim() || undefined,
      };

      if (!userProfile?.id) {
        throw new Error("ID do usuário não encontrado");
      }
      
      await UserService.updateUser(updateData, userProfile.id);
      setSuccess("Configurações da Shopee atualizadas com sucesso!");
      
      // Redirect back to profile after a short delay
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      setError("Erro ao atualizar configurações. Tente novamente.");
      console.error("Error updating shopee config:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const openShopeeAffiliatePage = () => {
    window.open("https://affiliate.shopee.com.br/open_api", "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gray-900 rounded-lg shadow-sm p-6 mb-6 border border-gray-800">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Configuração Shopee</h1>
              <p className="text-gray-300">Configure suas credenciais para gerar links de afiliado</p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-900 border border-green-600 text-green-300 rounded-lg">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-900 border border-red-600 text-red-300 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-orange-900 border border-orange-700 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-200 mb-2">Como obter suas credenciais?</h3>
              <p className="text-orange-300 text-sm mb-3">
                Para usar a funcionalidade de conversão de links da Shopee, você precisa configurar suas credenciais de API.
              </p>
              <button
                onClick={openShopeeAffiliatePage}
                className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium text-sm"
              >
                Acesse a página de afiliados da Shopee
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-800">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-6">
              {/* Shopee ID Field */}
              <div>
                <label htmlFor="shoppeId" className="block text-sm font-medium text-gray-300 mb-2">
                  <ShoppingBag className="w-4 h-4 inline mr-2 text-orange-500" />
                  Shopee ID
                </label>
                <input
                  type="text"
                  id="shoppeId"
                  name="shoppeId"
                  value={formData.shoppeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Digite seu Shopee ID"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Seu ID de afiliado da Shopee
                </p>
              </div>

              {/* API Password Field */}
              <div>
                <label htmlFor="shoppeApiPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  <Key className="w-4 h-4 inline mr-2 text-orange-500" />
                  Senha da API Shopee
                </label>
                <input
                  type="password"
                  id="shoppeApiPassword"
                  name="shoppeApiPassword"
                  value={formData.shoppeApiPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Digite a senha da API"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Senha fornecida pela Shopee para acesso à API
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="font-semibold text-white mb-3">Por que preciso dessas credenciais?</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• <strong>Conversão automática de links:</strong> Links da Shopee são convertidos automaticamente para incluir seu ID de afiliado</li>
            <li>• <strong>Relatórios de comissão:</strong> Geração de relatórios detalhados de suas vendas e comissões</li>
            <li>• <strong>Rastreamento de cliques:</strong> Acompanhamento de cliques e conversões dos seus links</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
