"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
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
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Master Afiliados Logo"
              width={100}
              height={100}
              className="rounded-lg"
            />
          </div>
          <div className="mx-auto h-12 w-12 bg-[#7d570e] rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Redefinir senha
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Digite sua nova senha para continuar
          </p>
          {email && (
            <p className="mt-1 text-xs text-gray-400">
              Email: {email}
            </p>
          )}
        </div>

        {/* Form */}
        {!isValidCode ? (
          <div className="mt-8 text-center">
            <div className="bg-red-900 border border-red-700 rounded-md p-4">
              <div className="text-sm text-red-300">{error}</div>
            </div>
            <div className="mt-4">
                          <Link
              href="/forgot-password"
              className="inline-flex items-center text-sm text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-600 bg-gray-900 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-600 bg-gray-900 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-4">
                <div className="text-sm text-red-300">{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-green-900 border border-green-700 rounded-md p-4">
                <div className="text-sm text-green-300">{success}</div>
              </div>
            )}

            <div>
                          <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#7d570e] hover:bg-[#6b4a0c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7d570e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Redefinindo..." : "Redefinir senha"}
            </button>
            </div>

            <div className="text-center">
                          <Link
              href="/forgot-password"
              className="inline-flex items-center text-sm text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar para recuperação de senha
            </Link>
            </div>
          </form>
        )}
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