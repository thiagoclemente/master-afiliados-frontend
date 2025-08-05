"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Key
} from "lucide-react";
import { AuthService } from "@/services/auth.service";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);

  // Verificar se o código está presente na URL
  useEffect(() => {
    if (!code) {
      setError("Código de recuperação não encontrado na URL. Verifique se o link está correto.");
    } else {
      setIsValidCode(true);
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validações
    if (!code) {
      setError("Código de recuperação não encontrado");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.resetPassword(code, password, confirmPassword);
      setSuccess("Senha redefinida com sucesso! Você será redirecionado para o login.");
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Master Afiliados Logo"
              width={120}
              height={120}
              className="rounded-lg"
              priority
              unoptimized
            />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">
            Redefinir senha
          </h2>
          <p className="text-gray-400">
            Digite sua nova senha para continuar
          </p>
          {email && (
            <p className="mt-1 text-xs text-gray-400">
              Email: {email}
            </p>
          )}
        </div>

        {/* Formulário */}
        {!isValidCode ? (
          <div className="mt-8 text-center">
            <div className="bg-red-900 border border-red-700 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="text-sm text-red-300">{error}</div>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/forgot-password"
                className="inline-flex items-center text-sm text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Solicitar novo código
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="bg-[#7d570e] border border-[#6b4a0c] rounded-md p-4">
              <div className="text-sm text-white">
                <strong>Código de recuperação:</strong> {code}
              </div>
            </div>

            <div className="space-y-4">
              {/* Nova Senha */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-600 bg-gray-900 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e] focus:z-10 sm:text-sm transition-colors"
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-600 bg-gray-900 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e] focus:z-10 sm:text-sm transition-colors"
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              </div>
            )}

            {/* Mensagem de Sucesso */}
            {success && (
              <div className="bg-green-900 border border-green-700 rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="text-sm text-green-300">{success}</div>
                </div>
              </div>
            )}

            {/* Botão de Redefinir */}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#7d570e] hover:bg-[#6b4a0c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7d570e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redefinindo...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span>Redefinir senha</span>
                  </div>
                )}
              </button>
            </div>

            {/* Link de Volta */}
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="inline-flex items-center text-sm text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para recuperação de senha
              </Link>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 Master Afiliados. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7d570e] mx-auto"></div>
          <p className="mt-4 text-gray-300">Carregando...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
} 