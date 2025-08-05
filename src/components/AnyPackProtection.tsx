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
        console.log('Checking if user has any packs for Arts/Stickers access...');
        const response = await fetchUserPacks();
        const userPacks = response.data;
        console.log('User packs received:', userPacks);
        
        const hasPacks = userPacks.length > 0;
        console.log('User has any packs:', hasPacks);
        
        if (!hasPacks) {
          // Se não tem pacotes, redirecionar para combos com mensagem
          console.log('No packs found, redirecting to combos...');
          router.push('/combos?message=pack-required');
          return;
        }
        
        setHasAnyPack(true);
      } catch (err) {
        console.error("Error checking user packs:", err);
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