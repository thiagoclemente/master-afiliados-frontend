"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services/user.service";
import { PasswordChangeRequest } from "@/interfaces/user.interface";
import { 
  Key, 
  Save,
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Form data
  const [formData, setFormData] = useState({
    currentPassword: "",
    password: "",
    passwordConfirmation: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      setError("Senha atual é obrigatória");
      return false;
    }

    if (!formData.password.trim()) {
      setError("Nova senha é obrigatória");
      return false;
    }

    if (formData.password.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError("As senhas não coincidem");
      return false;
    }

    if (formData.currentPassword === formData.password) {
      setError("A nova senha deve ser diferente da senha atual");
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
      const passwordData: PasswordChangeRequest = {
        currentPassword: formData.currentPassword,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
      };

      await UserService.changePassword(passwordData);
      setSuccess("Senha alterada com sucesso!");
      
      // Clear form
      setFormData({
        currentPassword: "",
        password: "",
        passwordConfirmation: "",
      });

      // Redirect back to profile after a short delay
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao alterar senha. Verifique se a senha atual está correta.";
      setError(errorMessage);
      console.error("Error changing password:", err);
    } finally {
      setIsSaving(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-white">Alterar Senha</h1>
              <p className="text-gray-300">Atualize sua senha de acesso</p>
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
              {/* Current Password Field */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  <Key className="w-4 h-4 inline mr-2 text-[#7d570e]" />
                  Senha Atual *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e]"
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  <Key className="w-4 h-4 inline mr-2 text-[#7d570e]" />
                  Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e]"
                    placeholder="Digite sua nova senha"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Mínimo de 6 caracteres
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-300 mb-2">
                  <Key className="w-4 h-4 inline mr-2 text-[#7d570e]" />
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    value={formData.passwordConfirmation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e]"
                    placeholder="Confirme sua nova senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                    Alterando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Alterar Senha
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-3">Dicas de Segurança</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Use uma senha forte com pelo menos 6 caracteres</li>
            <li>• Combine letras maiúsculas, minúsculas, números e símbolos</li>
            <li>• Evite usar informações pessoais óbvias</li>
            <li>• Não compartilhe sua senha com outras pessoas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
