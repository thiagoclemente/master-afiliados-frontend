"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  // Este componente não deve renderizar nada, pois sempre redireciona
  return null;
}
