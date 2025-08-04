"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchVideos } from "@/services/video.service";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";
import { ArrowLeft, Loader2, Search, Video as VideoIcon } from "lucide-react";
import { ImageInterface } from "@/interfaces/image.interface";

interface VideoFormat {
  url: string;
  ext: string;
  size: number;
  mime: string;
}

interface Category {
  id: number;
  name: string;
}

interface VideoModel {
  id: number;
  url: string;
  formats: {
    thumbnail: VideoFormat;
  };
}

interface Pack {
  id: number;
  url: string;
}

interface Video {
  id: number;
  documentId: string;
  title: string;
  link: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  video: VideoModel;
  pack: Pack;
  category: Category;
  coverImage: ImageInterface;
}

function VideosPageContent() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();

  const packId = searchParams.get("pack");
  const pageSize = 20;

  // Reset page when search or pack changes
  useEffect(() => {
    setCurrentPage(1);
    setVideos([]);
  }, [debouncedSearch, packId]);

  useEffect(() => {
    const loadVideos = async (resetList: boolean = true) => {
      try {
        if (resetList) {
          setIsLoading(true);
          setVideos([]);
        } else {
          setIsLoadingMore(true);
        }

        const response = await fetchVideos(
          currentPage,
          pageSize,
          debouncedSearch,
          undefined,
          packId || undefined
        );
        
        if (resetList) {
          setVideos(response.data);
        } else {
          setVideos(prev => [...prev, ...response.data]);
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
          setError("Erro ao carregar os vídeos");
        }
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    if (packId) {
      loadVideos(currentPage === 1);
    }
  }, [currentPage, debouncedSearch, packId, logout, router, pageSize]);

  const loadMoreVideos = async () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleBack = () => {
    router.push("/packs");
  };

  if (error) {
    return (
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!packId) {
    return (
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-gray-400 mb-4">
            Selecione um pacote para ver os vídeos
          </div>
          <button
            onClick={handleBack}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Voltar para pacotes
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
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-300 hover:text-white mr-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para pacotes
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <VideoIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Vídeos</h1>
                <p className="text-gray-300">Explore os vídeos do pacote</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar vídeos..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="bg-gray-800 shadow rounded-lg p-6">

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 mb-4">
              {searchTerm ? "Nenhum vídeo encontrado" : "Nenhum vídeo disponível"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <div
                  key={video.documentId}
                  className="group bg-gray-700 border border-gray-600 rounded-lg overflow-hidden hover:shadow-lg hover:border-indigo-500 transition-all duration-200"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {video.coverImage?.formats?.medium?.url ? (
                      <Image
                        src={video.coverImage.formats.medium.url}
                        alt={`Capa do vídeo ${video.title}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                        <VideoIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                      {video.title || 'Sem título'}
                    </h3>
                    
                    {video.category?.name && (
                      <p className="text-sm text-gray-400 mb-3">
                        {video.category.name}
                      </p>
                    )}
                    
                    <div className="flex flex-col space-y-2">
                      <a
                        href={`/videos/${video.documentId}`}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Ver detalhes
                      </a>
                      {video.link && (
                        <a
                          href={video.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Acessar vídeo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreVideos}
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
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        </div>
      </div>
    }>
      <VideosPageContent />
    </Suspense>
  );
}
