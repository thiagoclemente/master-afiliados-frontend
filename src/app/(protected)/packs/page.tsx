"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchPacks } from "@/services/pack.service";
import type { Pack } from "@/interfaces/pack";
import Image from "next/image";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  Play, 
  Calendar,
  ChevronRight,
  Loader2,
  Video
} from "lucide-react";

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  
  const router = useRouter();
  const { logout } = useAuth();

  const pageSize = 12;

  const loadPacks = useCallback(async (reset: boolean = true) => {
    try {
      if (reset) {
        setIsLoading(true);
        setCurrentPage(1);
      } else {
        setIsLoadingMore(true);
      }
      
      const response = await fetchPacks(reset ? 1 : currentPage, pageSize);
      
      if (reset) {
        setPacks(response.data);
      } else {
        setPacks(prev => [...prev, ...response.data]);
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
        setError("Erro ao carregar os pacotes");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [currentPage, pageSize, logout, router]);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const loadMorePacks = async () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        const response = await fetchPacks(currentPage + 1, pageSize);
        setPacks(prev => [...prev, ...response.data]);
        setCurrentPage(prev => prev + 1);
      } catch (err) {
        console.error("Error loading more packs:", err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handlePackClick = (packId: string) => {
    router.push(`/videos?pack=${packId}`);
  };

  const filteredPacks = packs
    .filter(pack => 
      (pack.name && pack.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pack.description && pack.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        default:
          return 0;
      }
    });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Data não disponível";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
      {/* Header */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-[#7d570e] rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vídeos</h1>
              <p className="text-gray-300">Explore nossos pacotes de vídeos</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Grid3X3 className="w-4 h-4" />
            <span>{filteredPacks.length} pacote{filteredPacks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pacotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e] text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")}
                className="w-full pl-10 pr-8 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e] appearance-none text-white"
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="name">Nome A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Packs Grid */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#7d570e]" />
          </div>
        ) : filteredPacks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 mb-4">
              {searchQuery ? "Nenhum pacote encontrado" : "Nenhum pacote disponível"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPacks.map((pack) => (
                <div
                  key={pack.documentId}
                  onClick={() => handlePackClick(pack.documentId)}
                  className="group bg-black border border-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-[#7d570e] transition-all duration-200 cursor-pointer"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {pack.image?.url ? (
                      <Image
                        src={pack.image.url}
                        alt={`Capa do pacote ${pack.name || 'sem título'}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <Video className="w-12 h-12 text-indigo-400" />
                      </div>
                    )}
                    
                    
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#7d570e] transition-colors">
                      {pack.name || 'Sem título'}
                    </h3>
                    
                    {pack.description && (
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {pack.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Play className="w-4 h-4" />
                          <span>Vídeos</span>
                        </div>
                        {pack.createdAt && (
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(pack.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[#7d570e] text-sm font-medium group-hover:text-[#6b4a0c]">
                          Ver vídeos
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7d570e] transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMorePacks}
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
    </div>
  );
}