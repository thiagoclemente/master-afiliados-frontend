"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchVideos, fetchVideoCategories, type Video } from "@/services/video.service";
import { fetchPacks } from "@/services/pack.service";
import type { Pack } from "@/interfaces/pack";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";
import { ArrowLeft, Loader2, Search, Video as VideoIcon, Play, Download, Link, Copy, Check, X, Filter } from "lucide-react";
import VideoPlayer from "./components/VideoPlayer";

function VideosPageContent() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<{id: number; attributes?: {name: string}; name?: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const [selectedVideoForLinks, setSelectedVideoForLinks] = useState<Video | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadingVideoId, setDownloadingVideoId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [packInfo, setPackInfo] = useState<Pack | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();

  const packId = searchParams.get("pack");
  const pageSize = 20;

  // Load categories and pack info on mount
  useEffect(() => {
    loadCategories();
    loadPackInfo();
  }, [packId]);

  const loadCategories = async () => {
    try {
      const categoriesData = await fetchVideoCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadPackInfo = async () => {
    if (!packId) return;
    
    try {
      // Buscar o pack específico usando o packId da URL
      const response = await fetchPacks(1, 1000); // Buscar todos os packs
      const pack = response.data.find((p: Pack) => p.documentId === packId);
      if (pack) {
        setPackInfo(pack);
      }
    } catch (err) {
      console.error("Error loading pack info:", err);
    }
  };

  const loadVideos = async (page: number, resetList: boolean = true) => {
    try {
      if (resetList) {
        setIsLoading(true);
        setVideos([]);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetchVideos(
        page,
        pageSize,
        debouncedSearch,
        undefined,
        packId || undefined,
        selectedCategory > 0 ? selectedCategory : undefined,
        sortBy
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

  // Load videos when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      if (packId) {
        loadVideos(1, true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [debouncedSearch, packId, selectedCategory, sortBy]);

  // Load videos when page changes
  useEffect(() => {
    if (packId && currentPage > 1) {
      loadVideos(currentPage, false);
    }
  }, [currentPage, packId]);

  // Load videos on mount
  useEffect(() => {
    if (packId) {
      loadVideos(1, true);
    }
  }, [packId]);

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

  const handleVideoClick = (index: number) => {
    setSelectedVideoIndex(index);
  };

  const handleCloseVideo = () => {
    setSelectedVideoIndex(null);
  };

  const handleNextVideo = () => {
    if (selectedVideoIndex !== null && selectedVideoIndex < videos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };

  const handlePreviousVideo = () => {
    if (selectedVideoIndex !== null && selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };

  const handleLoadMoreInPlayer = async () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleDownload = async (video: Video) => {
    if (video.video?.url) {
      try {
        setDownloadingVideoId(video.id);
        setDownloadProgress(0);
        
        // Fetch the video as blob to force download with progress
        const response = await fetch(video.video.url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (!response.body) {
          throw new Error('No response body');
        }
        
        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let receivedLength = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          if (total > 0) {
            const progress = (receivedLength / total) * 100;
            setDownloadProgress(Math.round(progress));
          }
        }
        
        // Combine chunks into blob
        const blob = new Blob(chunks, { type: 'video/mp4' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Clean title for filename (remove special characters)
        const cleanTitle = (video.title || 'video')
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .trim();
        
        link.download = `${cleanTitle}.mp4`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        // Reset progress
        setDownloadProgress(100);
        setTimeout(() => {
          setDownloadingVideoId(null);
          setDownloadProgress(0);
        }, 1000);
        
      } catch (error) {
        console.error('Erro ao baixar vídeo:', error);
        setDownloadingVideoId(null);
        setDownloadProgress(0);
        
        // Fallback to direct link if fetch fails
        const link = document.createElement('a');
        link.href = video.video.url;
        link.download = `${video.title || 'video'}.mp4`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleCopyLink = async (link: string, index: number) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const getProductLinks = (video: Video) => {
    const links = [];
    if (video.link) {
      links.push(video.link);
    }
    return links;
  };

  const handleShowLinks = (video: Video) => {
    setSelectedVideoForLinks(video);
    setShowLinksPopup(true);
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

  if (!packId) {
    return (
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-gray-400 mb-4">
            Selecione um pacote para ver os vídeos
          </div>
          <button
            onClick={handleBack}
            className="text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
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
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={handleBack}
              className="flex items-center text-[#7d570e] hover:text-[#6b4a0c] mr-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para pacotes
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#7d570e] rounded-lg flex items-center justify-center">
                <VideoIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Vídeos</h1>
                <p className="text-gray-300">Explore os vídeos do pacote</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pack Info */}
        {packInfo && (
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-gray-700 shadow-lg">
            <div className="flex items-center space-x-4">
              {packInfo.image?.url ? (
                <div className="flex-shrink-0">
                  <Image
                    src={packInfo.image.url}
                    alt={packInfo.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover shadow-md"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-20 h-20 bg-[#7d570e] rounded-lg flex items-center justify-center shadow-md">
                  <VideoIcon className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">{packInfo.name}</h2>
                {packInfo.description && (
                  <p className="text-gray-300 text-sm mb-2 line-clamp-2">{packInfo.description}</p>
                )}
                <div className="flex items-center space-x-4">
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar vídeos..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e] text-white placeholder-gray-400"
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
                className="w-full pl-10 pr-8 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-[#7d570e] focus:border-[#7d570e] appearance-none text-white"
              >
                <option value={0}>Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.attributes?.name || category.name || `Categoria ${category.id}`}
                  </option>
                ))}
              </select>
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

      {/* Videos Grid */}
      <div className="bg-black shadow rounded-lg p-6 border border-gray-800">

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#7d570e]" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 mb-4">
              {searchTerm || selectedCategory ? "Nenhum vídeo encontrado" : "Nenhum vídeo disponível"}
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(0);
                }}
                className="text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video, index) => (
                <div
                  key={video.documentId}
                  className="group bg-black border border-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-[#7d570e] transition-all duration-200 cursor-pointer"
                  onClick={() => handleVideoClick(index)}
                >
                  <div className="relative aspect-[9/16] overflow-hidden">
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
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Download Button */}
                      {video.video?.url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(video);
                          }}
                          disabled={downloadingVideoId === video.id}
                          className="p-2 bg-[#7d570e] rounded-full text-white hover:bg-[#6b4a0c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingVideoId === video.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Links Button */}
                      {getProductLinks(video).length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowLinks(video);
                          }}
                          className="p-2 bg-[#7d570e] rounded-full text-white hover:bg-[#6b4a0c] transition-all"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#7d570e] transition-colors">
                      {video.title || 'Sem título'}
                    </h3>
                    
                    {video.category?.name && (
                      <p className="text-sm text-gray-400 mb-3">
                        {video.category.name}
                      </p>
                    )}
                    

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

      {/* Video Player Overlay */}
      {selectedVideoIndex !== null && (
        <VideoPlayer
          videos={videos}
          currentIndex={selectedVideoIndex}
          onClose={handleCloseVideo}
          onNext={handleNextVideo}
          onPrevious={handlePreviousVideo}
          onLoadMore={handleLoadMoreInPlayer}
          hasMore={currentPage < totalPages}
        />
      )}

      {/* Links Popup */}
      {showLinksPopup && selectedVideoForLinks && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Links do Produto</h3>
              <button
                onClick={() => setShowLinksPopup(false)}
                className="p-2 text-[#7d570e] hover:text-[#6b4a0c] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-white font-medium mb-2">{selectedVideoForLinks.title}</h4>
            </div>

            <div className="space-y-3">
              {getProductLinks(selectedVideoForLinks).map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{link}</p>
                  </div>
                  <button
                    onClick={() => handleCopyLink(link, index)}
                    className="ml-3 p-2 bg-[#7d570e] rounded-lg text-white hover:bg-[#6b4a0c] transition-colors flex-shrink-0"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Download Progress Overlay */}
      {downloadingVideoId && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 rounded-lg p-4 z-50 min-w-64">
          <div className="flex items-center justify-between text-white text-sm mb-2">
            <span>Baixando vídeo...</span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-[#7d570e] h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="bg-black shadow rounded-lg p-6 border border-gray-800">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#7d570e]" />
          </div>
        </div>
      </div>
    }>
      <VideosPageContent />
    </Suspense>
  );
}
