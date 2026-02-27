"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { artService, Art, ArtCategory } from "@/services/art.service";
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
  Grid3X3,
  Loader2,
  Link,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import AnyPackProtection from "@/components/AnyPackProtection";

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
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const [selectedArtForLinks, setSelectedArtForLinks] = useState<Art | null>(null);
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
      const categoriesData = await artService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadArts = useCallback(async (page: number, resetList: boolean = false) => {
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
  }, [selectedCategory, searchQuery, pageSize, logout, router]);

  // Load arts when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadArts(1, true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchQuery, loadArts]);

  // Load more arts when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadArts(currentPage, false);
    }
  }, [currentPage, loadArts]);

  const handleDownload = async (art: Art) => {
    try {
      setIsDownloading(art.id);
      setDownloadProgress(0);
      
      // Fetch the image as blob to force download with progress
      const response = await fetch(art.image.url);
      
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
      const blob = new Blob(chunks, { type: 'image/jpeg' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Clean title for filename (remove special characters)
      const cleanTitle = (art.title || 'arte')
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim();
      
      link.download = `${cleanTitle}.jpg`;
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
      console.error("Error downloading art:", err);
      setError("Erro ao baixar a arte");
      setIsDownloading(null);
      setDownloadProgress(0);
      
      // Fallback to direct link if fetch fails
      const link = document.createElement('a');
      link.href = art.image.url;
      link.download = `${art.title || 'arte'}.jpg`;
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

  const getProductLinks = (art: Art) => {
    const links = [];
    if (art.link) {
      links.push(art.link);
    }
    return links;
  };

  const handleShowLinks = (art: Art) => {
    setSelectedArtForLinks(art);
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
              loadArts(1, true);
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
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Biblioteca de Artes</CardTitle>
          <CardDescription>
            Explore artes para campanhas e materiais promocionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar artes..."
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

      {/* Arts Grid */}
      <Card>
        <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : arts.length === 0 ? (
          <div className="text-center py-12">
            <Grid3X3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma arte encontrada</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {arts.map((art) => (
                <div
                  key={art.id}
                  className="group relative bg-card border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  onClick={() => setSelectedArt(art)}
                >
                  <div className="aspect-[9/16] relative">
                    <Image
                      src={artService.getOptimizedImageUrl(art.image, 'medium')}
                      alt={art.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
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
                          handleDownload(art);
                        }}
                        disabled={isDownloading === art.id}
                        size="icon-sm"
                        className="rounded-full"
                      >
                        {isDownloading === art.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Botão de Links */}
                      {getProductLinks(art).length > 0 && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowLinks(art);
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
                      {art.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {art.category.name}
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

      {/* Art Modal */}
      {selectedArt && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg w-full max-w-4xl h-full max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedArt.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedArt.category.name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleDownload(selectedArt)}
                  disabled={isDownloading === selectedArt.id}
                  size="icon-sm"
                  variant="ghost"
                >
                  {isDownloading === selectedArt.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={() => setSelectedArt(null)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={artService.getOptimizedImageUrl(selectedArt.image, 'large')}
                  alt={selectedArt.title}
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

      {/* Links Popup */}
      {showLinksPopup && selectedArtForLinks && (
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
              <h4 className="text-foreground font-medium mb-2">{selectedArtForLinks.title}</h4>
            </div>

            <div className="space-y-3">
              {getProductLinks(selectedArtForLinks).map((link, index) => (
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
            <span>Baixando arte...</span>
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
