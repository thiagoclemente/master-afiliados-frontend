"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { artService, Art, ArtCategory } from "@/services/art.service";
import Image from "next/image";
import { 
  Search, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Grid3X3,
  Loader2
} from "lucide-react";

export default function ArtsPage() {
  const [arts, setArts] = useState<Art[]>([]);
  const [categories, setCategories] = useState<ArtCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArt, setSelectedArt] = useState<Art | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  const router = useRouter();
  const { logout } = useAuth();

  const pageSize = 20;

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load arts when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadArts(1, true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchQuery]);

  // Load more arts when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadArts(currentPage, false);
    }
  }, [currentPage]);

  const loadCategories = async () => {
    try {
      const categoriesData = await artService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadArts = async (page: number, resetList: boolean = false) => {
    try {
      if (resetList) {
        setIsLoading(true);
        setArts([]);
      } else {
        setIsLoadingMore(true);
      }

      const response = await artService.getArts({
        page,
        pageSize,
        categoryId: selectedCategory,
        search: searchQuery.trim() || undefined,
      });

      if (resetList) {
        setArts(response.data);
      } else {
        setArts(prev => [...prev, ...response.data]);
      }

      setTotalPages(response.meta.pagination.pageCount);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "Authentication failed" || err.message === "Authentication required") {
          logout();
          router.push("/login");
          return;
        }
        setError(err.message);
      } else {
        setError("Erro ao carregar as artes");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleDownload = async (art: Art) => {
    try {
      setIsDownloading(art.id);
      await artService.downloadArt(art.image);
    } catch (err) {
      console.error("Error downloading art:", err);
      setError("Erro ao baixar a arte");
    } finally {
      setIsDownloading(null);
    }
  };

  const loadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (error) {
    return (
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null);
              loadArts(1, true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0">
            Artes
          </h1>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Grid3X3 className="w-4 h-4" />
            <span>{arts.length} arte{arts.length !== 1 ? 's' : ''}</span>
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
                placeholder="Buscar artes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                className="w-full pl-10 pr-8 py-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              >
                <option value={0}>Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Arts Grid */}
      <div className="bg-gray-800 shadow rounded-lg p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : arts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {searchQuery || selectedCategory ? "Nenhuma arte encontrada" : "Nenhuma arte disponível"}
            </div>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(0);
                }}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {arts.map((art) => (
                <div
                  key={art.id}
                  className="group relative bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={artService.getOptimizedImageUrl(art.image, 'small')}
                      alt={art.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                      className="object-cover cursor-pointer"
                      onClick={() => setSelectedArt(art)}
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArt(art);
                          }}
                          className="p-2 bg-white rounded-full text-gray-300 hover:bg-gray-700"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(art);
                          }}
                          disabled={isDownloading === art.id}
                          className="p-2 bg-white rounded-full text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                        >
                          {isDownloading === art.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white truncate">
                      {art.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {art.category.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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

      {/* Art Modal */}
      {selectedArt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedArt.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedArt.category.name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(selectedArt)}
                  disabled={isDownloading === selectedArt.id}
                  className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-50"
                >
                  {isDownloading === selectedArt.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedArt(null)}
                  className="p-2 text-gray-400 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <div className="relative max-w-full max-h-full">
                <Image
                  src={artService.getOptimizedImageUrl(selectedArt.image, 'large')}
                  alt={selectedArt.title}
                  width={selectedArt.image.width}
                  height={selectedArt.image.height}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-700">
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-400">
                <div>
                  Dimensões: {selectedArt.image.width} x {selectedArt.image.height}px
                </div>
                <div>
                  Tamanho: {(selectedArt.image.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
