"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchCombos } from "@/services/combo.service";
import { fetchUserPacksRelease } from "@/services/user-pack-release.service";
import type { Combo } from "@/interfaces/combo";
import type { Pack } from "@/interfaces/pack";
import type { UserPackRelease } from "@/interfaces/user-pack-release";
import Image from "next/image";
import { ArrowLeft, Video as VideoIcon, Loader2, AlertCircle } from "lucide-react";

function CombosPageContent() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPacksRelease, setUserPacksRelease] = useState<UserPackRelease[]>([]);
  const [showPackRequiredMessage, setShowPackRequiredMessage] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  // Verificar se há mensagem de pacote necessário na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message === 'pack-required') {
      setShowPackRequiredMessage(true);
      // Limpar o parâmetro da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const pageSize = 10;

  const loadUserPacksRelease = useCallback(async () => {
    try {
      const response = await fetchUserPacksRelease();
      setUserPacksRelease(response.data);
    } catch (err) {
      console.error("Error loading user packs release:", err);
    }
  }, []);

  const loadCombos = useCallback(async (page: number, resetList: boolean = true) => {
    try {
      if (resetList) {
        setIsLoading(true);
        setCombos([]);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetchCombos(page, pageSize);
      
      if (resetList) {
        setCombos(response.data);
      } else {
        setCombos(prev => [...prev, ...response.data]);
      }
      
      setTotalPages(response.meta.pagination.pageCount);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message === "Authentication failed" ||
          err.message === "Authentication required"
        ) {
          logout();
          router.push("/login");
          return;
        }
        setError(err.message);
      } else {
        setError("Erro ao carregar os combos");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pageSize, logout, router]);

  // Load combos and user packs release on mount
  useEffect(() => {
    loadCombos(1, true);
    loadUserPacksRelease();
  }, [loadCombos, loadUserPacksRelease]);

  // Load more combos when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadCombos(currentPage, false);
    }
  }, [currentPage, loadCombos]);

  const loadMoreCombos = async () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleBack = () => {
    router.push("/home");
  };

  const isPackInReleasePeriod = (pack: Pack) => {
    // Verifica se o pack está em período de release (igual ao app Flutter)
    return userPacksRelease.some(release => release.pack.documentId === pack.documentId);
  };

  const getPackReleaseDate = (packDocumentId: string) => {
    const release = userPacksRelease.find(release => release.pack.documentId === packDocumentId);
    return release?.date;
  };

  const formatDateUTC = (dateString: string) => {
    // Criar data em UTC para evitar problemas de timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day)); // month - 1 porque Date usa 0-based months
    
    return utcDate.toLocaleDateString('pt-BR', {
      timeZone: 'UTC'
    });
  };

  if (error) {
    return (
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="text-center">
          <div className="text-red-300 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#7d570e] text-white rounded-md hover:bg-[#6b4a0c] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pack Required Message */}
      {showPackRequiredMessage && (
        <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-200 mb-2">
                Pacote Necessário
              </h3>
              <p className="text-orange-100 mb-4">
                Para acessar a <strong>Biblioteca de Artes</strong> e <strong>Biblioteca de Stickers</strong>, 
                você precisa adquirir um pacote de vídeos. Escolha um dos pacotes abaixo para começar!
              </p>
              <button
                onClick={() => setShowPackRequiredMessage(false)}
                className="text-orange-300 hover:text-orange-200 text-sm font-medium transition-colors"
              >
                Entendi, fechar mensagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={handleBack}
              className="flex items-center text-[#7d570e] hover:text-[#6b4a0c] mr-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#7d570e] rounded-lg flex items-center justify-center">
                <VideoIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Pacotes de Vídeos</h1>
                <p className="text-gray-300">Explore os combos de vídeos disponíveis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combos List */}
      {isLoading ? (
        <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-[#7d570e] animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Carregando combos...</p>
          </div>
        </div>
      ) : combos.length === 0 ? (
        <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-gray-400 mb-4">
              Nenhum combo disponível
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className="bg-black shadow rounded-lg border border-gray-800 overflow-hidden"
              >
                {/* Combo Title */}
                {combo.showTitle && (
                  <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white text-center">
                      {combo.name}
                    </h2>
                  </div>
                )}

                {/* Packs Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         {combo.packs.map((pack: Pack) => (
                      <div
                        key={pack.id}
                        className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden hover:border-[#7d570e] transition-colors"
                      >
                        {/* Pack Image */}
                        <div className="relative h-48">
                          {pack.image?.url ? (
                            <Image
                              src={pack.image.url}
                              alt={pack.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#7d570e] flex items-center justify-center">
                              <VideoIcon className="w-12 h-12 text-white" />
                            </div>
                          )}
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          
                          {/* Pack Type Badge */}
                          {pack.initialPackage && (
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                                Inicial
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Pack Info */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {pack.name}
                          </h3>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                            {pack.description}
                          </p>
                          
                          {/* Release Period Message or Access Button */}
                          {isPackInReleasePeriod(pack) ? (
                            <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                              <div className="flex items-center text-blue-300 text-sm">
                                <span className="mr-2">⏰</span>
                                <span>
                                  Disponível até {getPackReleaseDate(pack.documentId) ? 
                                    formatDateUTC(getPackReleaseDate(pack.documentId)!) : 
                                    'data não definida'
                                  }
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/videos?pack=${pack.documentId}`);
                              }}
                              className="w-full bg-[#7d570e] text-white py-2 px-4 rounded-lg hover:bg-[#6b4a0c] transition-colors font-medium"
                            >
                              Acessar Vídeos
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMoreCombos}
                disabled={isLoadingMore}
                className="flex items-center space-x-2 px-6 py-3 bg-[#7d570e] text-white rounded-lg hover:bg-[#6b4a0c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Carregando...</span>
                  </>
                ) : (
                  <span>Carregar Mais</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CombosPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7d570e] mx-auto"></div>
            <p className="mt-4 text-gray-300">Carregando...</p>
          </div>
        </div>
      </div>
    }>
      <CombosPageContent />
    </Suspense>
  );
} 