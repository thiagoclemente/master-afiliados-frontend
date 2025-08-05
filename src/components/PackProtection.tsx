"use client";

import { useEffect, useState } from "react";
import { fetchUserPacks } from "@/services/user-pack.service";
import { fetchPacks } from "@/services/pack.service";
import type { Pack } from "@/interfaces/pack";
import { Loader2, Video as VideoIcon } from "lucide-react";

interface PackProtectionProps {
  children: React.ReactNode;
  packId?: string | null;
}

export default function PackProtection({ children, packId }: PackProtectionProps) {
  const [hasUserPacks, setHasUserPacks] = useState<boolean | null>(null);
  const [packInfo, setPackInfo] = useState<Pack | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserPacks = async () => {
      try {
        // Verificar se o usuário tem pacotes
        const userPacksResponse = await fetchUserPacks();
        const userPacks = userPacksResponse.data;
        const hasPacks = userPacks.length > 0;
        
        // Se não tem pacotes, buscar informações do pack para mostrar na mensagem
        if (!hasPacks && packId) {
          try {
            const packsResponse = await fetchPacks(1, 1000);
            const pack = packsResponse.data.find((p: Pack) => p.documentId === packId);
            if (pack) {
              setPackInfo(pack);
            }
          } catch (err) {
            console.error("Error loading pack info:", err);
          }
          setHasUserPacks(false);
        } else if (hasPacks && packId) {
          // Verificar se o usuário tem acesso ao pacote específico
          const hasAccessToPack = userPacks.some(userPack => 
            userPack.pack.documentId === packId
          );
          
          if (!hasAccessToPack) {
            // Usuário não tem acesso ao pacote específico, buscar informações do pack
            try {
              const packsResponse = await fetchPacks(1, 1000);
              const pack = packsResponse.data.find((p: Pack) => p.documentId === packId);
              if (pack) {
                setPackInfo(pack);
              }
            } catch (err) {
              console.error("Error loading pack info:", err);
            }
            setHasUserPacks(false);
          } else {
            setHasUserPacks(true);
          }
        } else {
          setHasUserPacks(hasPacks);
        }
      } catch (err) {
        console.error("Error checking user packs:", err);
        setHasUserPacks(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserPacks();
  }, [packId]);

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

  // Se não tem pacotes, mostrar mensagem de acesso negado
  if (hasUserPacks === false) {
    return (
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-white text-lg font-semibold mb-2">
            Acesso Negado
          </div>
          <div className="text-gray-400 mb-4 max-w-md mx-auto">
            Você precisa adquirir um pacote para acessar os vídeos.
          </div>
          
          {packInfo && (
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-gray-700">
              <div className="text-white font-medium mb-2">
                Pacote: {packInfo.name}
              </div>
              {packInfo.description && (
                <div className="text-gray-300 text-sm mb-3">
                  {packInfo.description}
                </div>
              )}
              {packInfo.price && (
                <div className="text-[#7d570e] font-semibold">
                  Preço: {packInfo.price}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={() => {
              const purchaseLink = packInfo?.link || 'https://masterafiliados.com.br';
              window.open(purchaseLink, '_blank');
            }}
            className="px-6 py-3 bg-[#7d570e] text-white rounded-lg hover:bg-[#6b4a0c] transition-colors font-medium"
          >
            Comprar Pacote
          </button>
        </div>
      </div>
    );
  }

  // Se tem pacotes, renderizar o conteúdo
  return <>{children}</>;
} 