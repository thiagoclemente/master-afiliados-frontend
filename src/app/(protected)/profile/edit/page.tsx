"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services/user.service";
import { UserProfile, UserUpdateRequest } from "@/interfaces/user.interface";
import { 
  User, 
  Mail, 
  Phone, 
  Instagram, 
  Save,
  ArrowLeft
} from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    instagram: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await UserService.getCurrentUser();
        setUserProfile(profile);
        setFormData({
          name: profile.name || "",
          phone: profile.phone || "",
          instagram: profile.instagram || "",
        });
      } catch (err) {
        console.error("Error fetching user profile for edit:", err);
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UserUpdateRequest = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        instagram: formData.instagram.trim() || undefined,
      };

      if (!userProfile?.id) {
        throw new Error("ID do usuário não encontrado");
      }
      
      await UserService.updateUser(updateData, userProfile.id);
      setSuccess("Perfil atualizado com sucesso!");
      
      // Redirect back to profile after a short delay
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      setError("Erro ao atualizar perfil. Tente novamente.");
      console.error("Error updating profile:", err);
    } finally {
      setIsSaving(false);
    }
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
              <h1 className="text-2xl font-bold text-white">Editar Perfil</h1>
              <p className="text-gray-300">Atualize suas informações pessoais</p>
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

        {/* Form */}
        <div className="bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-800">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2 text-[#7d570e]" />
                  Nome *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e]"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2 text-[#7d570e]" />
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  value={userProfile?.email || ""}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-400"
                  disabled
                />
                <p className="text-sm text-gray-400 mt-1">O e-mail não pode ser alterado</p>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2 text-[#7d570e]" />
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e]"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Instagram Field */}
              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-300 mb-2">
                  <Instagram className="w-4 h-4 inline mr-2 text-pink-500" />
                  Instagram
                </label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e]"
                  placeholder="@seuusuario"
                />
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
                className="flex-1 px-4 py-2 bg-[#7d570e] text-white rounded-lg hover:bg-[#6b4a0c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
