"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { stickerService, Sticker, StickerCategory } from "@/services/sticker.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { 
  Search, 
  Download, 
  X, 
  Filter,
  Loader2,
  Link,
  Copy,
  Check,
  ExternalLink,
  StickyNote
} from "lucide-react";
import AnyPackProtection from "@/components/AnyPackProtection";
import PageLoadingBar from "@/components/page-loading-bar";

export default function StickersPage() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [categories, setCategories] = useState<StickerCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const [selectedStickerForLinks, setSelectedStickerForLinks] = useState<Sticker | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const router = useRouter();
  const { logout } = useAuth();

  const pageSize = 18;

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await stickerService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadStickers = useCallback(async (page: number, resetList: boolean = false) => {
    try {
      if (resetList) {
        setIsLoading(true);
        setStickers([]);
      } else {
        setIsLoadingMore(true);
      }

      const response = await stickerService.getStickers({
        page,
        pageSize,
        categoryId: selectedCategory,
        search: searchQuery.trim() || undefined,
      });

      if (resetList) {
        setStickers(response.data);
      } else {
        setStickers(prev => [...prev, ...response.data]);
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
        setError("Erro ao carregar os stickers");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory, searchQuery, pageSize, logout, router]);

  // Load stickers when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadStickers(1, true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchQuery, loadStickers]);

  // Load more stickers when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadStickers(currentPage, false);
    }
  }, [currentPage, loadStickers]);

  const handleDownload = async (sticker: Sticker) => {
    try {
      setIsDownloading(sticker.id);
      setDownloadProgress(0);
      
      // Fetch the image as blob to force download with progress
      const response = await fetch(sticker.image.url);
      
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
      const blob = new Blob(chunks, { type: 'image/png' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Clean title for filename (remove special characters)
      const cleanTitle = (sticker.title || 'sticker')
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim();
      
      link.download = `${cleanTitle}.png`;
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
        setIsDownloading(null);
        setDownloadProgress(0);
      }, 1000);
      
    } catch (err) {
      console.error("Error downloading sticker:", err);
      setError("Erro ao baixar o sticker");
      setIsDownloading(null);
      setDownloadProgress(0);
      
      // Fallback to direct link if fetch fails
      const link = document.createElement('a');
      link.href = sticker.image.url;
      link.download = `${sticker.title || 'sticker'}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  const getProductLinks = (sticker: Sticker) => {
    const links = [];
    if (sticker.link) {
      links.push(sticker.link);
    }
    return links;
  };

  const handleShowLinks = (sticker: Sticker) => {
    setSelectedStickerForLinks(sticker);
    setShowLinksPopup(true);
  };

  const loadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              loadStickers(1, true);
            }}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnyPackProtection>
      <div className="space-y-6">
      <PageLoadingBar isLoading={isLoading} />
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Biblioteca de Stickers</CardTitle>
          <CardDescription>
            Explore stickers para campanhas e redes sociais.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar stickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                className="pl-10 pr-8 py-2 h-9 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer w-full sm:w-48"
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
        </CardContent>
      </Card>

      {/* Stickers Grid */}
      <Card>
        <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stickers.length === 0 ? (
          <div className="text-center py-12">
            <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum sticker encontrado</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="group relative bg-card border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  onClick={() => setSelectedSticker(sticker)}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={stickerService.getOptimizedImageUrl(sticker.image, 'medium')}
                      alt={sticker.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                    
                    {/* Overlay sutil como nos vídeos */}
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Search className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Botão de Download */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(sticker);
                        }}
                        disabled={isDownloading === sticker.id}
                        size="icon-sm"
                        className="rounded-full"
                      >
                        {isDownloading === sticker.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Botão de Links */}
                      {getProductLinks(sticker).length > 0 && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowLinks(sticker);
                          }}
                          size="icon-sm"
                          className="rounded-full"
                        >
                          <Link className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {sticker.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sticker.category.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  size="lg"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <span>Carregar Mais</span>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        </CardContent>
      </Card>

      {/* Sticker Modal */}
      {selectedSticker && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg w-full max-w-4xl h-full max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedSticker.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSticker.category.name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleDownload(selectedSticker)}
                  disabled={isDownloading === selectedSticker.id}
                  size="icon-sm"
                  variant="ghost"
                >
                  {isDownloading === selectedSticker.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={() => setSelectedSticker(null)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Image Container */}
            <div className={`flex-1 flex items-center justify-center p-4 min-h-0 ${
              selectedSticker.category.name.toLowerCase().includes('sombra') ? 'bg-white' : ''
            }`}>
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={stickerService.getOptimizedImageUrl(selectedSticker.image, 'large')}
                  alt={selectedSticker.title}
                  fill
                  className="object-contain rounded-lg"
                  sizes="(max-width: 768px) 95vw, (max-width: 1200px) 80vw, 70vw"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/40 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-muted-foreground">
                <div>
                  Dimensões: {selectedSticker.image.width} x {selectedSticker.image.height}px
                </div>
                <div>
                  Tamanho: {(selectedSticker.image.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links Popup */}
      {showLinksPopup && selectedStickerForLinks && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Links do Produto</h3>
              <Button
                onClick={() => setShowLinksPopup(false)}
                size="icon-sm"
                variant="ghost"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-foreground font-medium mb-2">{selectedStickerForLinks.title}</h4>
            </div>

            <div className="space-y-3">
              {getProductLinks(selectedStickerForLinks).map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">{link}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <Button
                      onClick={() => window.open(link, '_blank')}
                      size="icon-sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      title="Abrir link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleCopyLink(link, index)}
                      size="icon-sm"
                      title="Copiar link"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Download Progress Overlay */}
      {isDownloading && (
        <div className="fixed bottom-4 right-4 bg-card border shadow-lg rounded-lg p-4 z-50 min-w-64">
          <div className="flex items-center justify-between text-foreground text-sm mb-2">
            <span>Baixando sticker...</span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      </div>
    </AnyPackProtection>
  );
} 
