"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { UserService } from "@/services/user.service";
import { UserProfile } from "@/interfaces/user.interface";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Instagram, 
  ShoppingBag,
  Edit,
  Key
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await UserService.getCurrentUser();
        
        // Verificar se o perfil tem os dados necessários
        if (profile && profile.id) {
          setUserProfile(profile);
        } else {
          throw new Error("Dados do perfil inválidos");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(`Erro ao carregar dados do perfil: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleShopeeConfig = () => {
    router.push("/profile/shopee-config");
  };

  const handleChangePassword = () => {
    router.push("/profile/change-password");
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7d570e] mx-auto"></div>
          <p className="mt-4 text-gray-300">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">🔒</div>
          <p className="text-gray-300">Você precisa estar logado para acessar esta página</p>
          <button 
            onClick={() => router.push('/login')} 
            className="mt-4 px-4 py-2 bg-[#7d570e] text-white rounded-lg hover:bg-[#6b4a0c]"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-[#7d570e] text-white rounded-lg hover:bg-[#6b4a0c]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gray-900 rounded-lg shadow-sm p-6 mb-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-[#7d570e] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {userProfile?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
                <p className="text-gray-300">Gerencie suas informações pessoais</p>
                {userProfile?.email && (
                  <p className="text-sm text-gray-400 mt-1">{userProfile.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleEditProfile}
              className="flex items-center gap-2 px-4 py-2 bg-[#7d570e] text-white rounded-lg hover:bg-[#6b4a0c] transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar Perfil
            </button>
          </div>
        </div>


        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#7d570e]" />
              Informações Pessoais
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Nome</p>
                  <p className="font-medium text-white">
                    {userProfile?.name || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">E-mail</p>
                  <p className="font-medium text-white">{userProfile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Telefone</p>
                  <p className="font-medium text-white">
                    {userProfile?.phone || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Instagram</p>
                  <p className="font-medium text-white">
                    {userProfile?.instagram || "Não informado"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shopee Configuration */}
          <div className="bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              Configuração Shopee
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Shopee ID</p>
                  <p className="font-medium text-white">
                    {userProfile?.shoppeId ? "✅ Configurado" : "❌ Não configurado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Senha da API</p>
                  <p className="font-medium text-white">
                    {userProfile?.shoppeApiPassword ? "✅ Configurado" : "❌ Não configurado"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleShopeeConfig}
              className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Configurar Shopee
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Ações da Conta</h2>
          
          <div className="flex justify-center">
            <button
              onClick={handleChangePassword}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Key className="w-4 h-4" />
              Alterar Senha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}