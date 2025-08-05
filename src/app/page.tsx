"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Shield, Zap } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Se o usuário estiver logado, redireciona para a página home
        router.push("/home");
      } else {
        // Se o usuário não estiver logado, redireciona para a página de login
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  // Mostra um loading enquanto verifica o status de autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-white mb-2">Master Afiliados</h2>
            <p className="text-gray-400">Carregando sua experiência...</p>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-2 text-gray-500">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Verificando autenticação</span>
          </div>
        </div>
      </div>
    );
  }

  // Este componente não deve renderizar nada, pois sempre redireciona
  return null;
}
