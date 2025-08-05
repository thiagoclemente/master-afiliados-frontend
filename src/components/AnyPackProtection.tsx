"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserPacks } from "@/services/user-pack.service";
import { Loader2 } from "lucide-react";

interface AnyPackProtectionProps {
  children: React.ReactNode;
}

export default function AnyPackProtection({ children }: AnyPackProtectionProps) {
  const [hasAnyPack, setHasAnyPack] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserPacks = async () => {
      try {
        const response = await fetchUserPacks();
        const userPacks = response.data;
        
        const hasPacks = userPacks.length > 0;
        
        if (!hasPacks) {
          // Se não tem pacotes, redirecionar para combos com mensagem
          router.push('/combos?message=pack-required');
          return;
        }
        
        setHasAnyPack(true);
      } catch {
        // Em caso de erro, redirecionar para combos com mensagem
        router.push('/combos?message=pack-required');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserPacks();
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#7d570e] animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Verificando seus pacotes...</p>
        </div>
      </div>
    );
  }

  // Se não tem pacotes, não renderizar nada (já foi redirecionado)
  if (hasAnyPack === false) {
    return null;
  }

  // Se tem pacotes, renderizar o conteúdo
  return <>{children}</>;
} 