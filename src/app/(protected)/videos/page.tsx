"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  fetchVideos,
  fetchVideoCategories,
  fetchProtectedVideoDownloadUrl,
  isPackRenewalRequiredError,
  type Video,
} from "@/services/video.service";
import { fetchPacks } from "@/services/pack.service";
import {
  fetchUserSubscriptions,
  isSubscriptionPremium,
} from "@/services/user-subscription.service";
import type { Pack } from "@/interfaces/pack";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";
import { useAnalytics } from "@/hooks/use-analytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Search,
  Video as VideoIcon,
  Play,
  Download,
  Link,
  Copy,
  Check,
  X,
  Filter,
  ExternalLink,
} from "lucide-react";
import VideoPlayer from "./components/VideoPlayer";

function VideosPageContent() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<{ id: number; attributes?: { name: string }; name?: string }[]>([]);
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
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [downloadRenewalPackId, setDownloadRenewalPackId] = useState<string | null>(
    null,
  );
  const [packInfo, setPackInfo] = useState<Pack | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [totalVideos, setTotalVideos] = useState<number>(0);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const { trackPackAccess, trackVideoPlay, trackVideoDownload, trackSearch, trackError } = useAnalytics();

  const packId = searchParams.get("pack");
  const pageSize = 20;

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await fetchVideoCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }, []);

  const loadPackInfo = useCallback(async () => {
    if (!packId) return;

    try {
      const response = await fetchPacks(1, 1000);
      const pack = response.data.find((p: Pack) => p.documentId === packId);
      if (pack) {
        setPackInfo(pack);
        trackPackAccess(pack.name, pack.documentId);
      }
    } catch (err) {
      console.error("Error loading pack info:", err);
      trackError("Error loading pack info", "pack_info_error");
    }
  }, [packId, trackPackAccess, trackError]);

  const loadVideos = useCallback(
    async (page: number, resetList: boolean = true) => {
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
          setTotalVideos(response.meta.pagination.total);
        } else {
          setVideos((prev) => [...prev, ...response.data]);
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
          setError("Erro ao carregar os vídeos");
        }
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, packId, selectedCategory, sortBy, pageSize, logout, router]
  );

  useEffect(() => {
    const checkAccess = async () => {
      if (!packId) {
        setHasAccess(false);
        return;
      }

      try {
        const subscriptionsResponse = await fetchUserSubscriptions();
        const hasPremium = isSubscriptionPremium(subscriptionsResponse.data || []);

        if (hasPremium) {
          setHasAccess(true);
          loadCategories();
          loadPackInfo();
          return;
        }

        const { fetchUserPacks } = await import("@/services/user-pack.service");
        const response = await fetchUserPacks();
        const userPacks = response.data;

        const hasAccessToPack = userPacks.some((userPack) => userPack.pack.documentId === packId);

        setHasAccess(hasAccessToPack);

        if (hasAccessToPack) {
          loadCategories();
          loadPackInfo();
        }
      } catch (err) {
        console.error("Error checking pack access:", err);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [packId, loadCategories, loadPackInfo]);

  useEffect(() => {
    if (!hasAccess) return;

    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      if (packId) {
        if (debouncedSearch.length === 0 || debouncedSearch.length >= 3) {
          loadVideos(1, true);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [debouncedSearch, packId, selectedCategory, sortBy, hasAccess, loadVideos]);

  useEffect(() => {
    if (!hasAccess) return;

    if (packId && currentPage > 1) {
      loadVideos(currentPage, false);
    }
  }, [currentPage, packId, hasAccess, loadVideos]);

  useEffect(() => {
    if (!hasAccess) return;

    if (packId) {
      loadVideos(1, true);
    }
  }, [packId, hasAccess, loadVideos]);

  const loadMoreVideos = async () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      setTimeout(() => {
        trackSearch(value, "videos");
      }, 500);
    }
  };

  const handleBack = () => {
    router.push("/home");
  };

  const handleVideoClick = (index: number) => {
    setSelectedVideoIndex(index);
    if (videos[index]) {
      trackVideoPlay(videos[index].title, videos[index].id.toString());
    }
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
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleDownload = async (video: Video) => {
    try {
      setDownloadNotice(null);
      setDownloadRenewalPackId(null);
      setDownloadingVideoId(video.id);
      setDownloadProgress(0);

      const protectedDownloadUrl = await fetchProtectedVideoDownloadUrl(video.documentId);
      const response = await fetch(protectedDownloadUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error("No response body");
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

      const blob = new Blob(chunks, { type: "video/mp4" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const cleanTitle = (video.title || "video")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")
        .trim();

      link.download = `${cleanTitle}.mp4`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
      trackVideoDownload(video.title, video.id.toString());

      setDownloadProgress(100);
      setTimeout(() => {
        setDownloadingVideoId(null);
        setDownloadProgress(0);
      }, 1000);
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : "Não foi possível baixar o vídeo no momento.";
      const renewalPackId = isPackRenewalRequiredError(downloadError)
        ? downloadError.details.packDocumentId || packId
        : null;
      const isLimitRule =
        /limite diário de downloads/i.test(message) ||
        /limite de downloads/i.test(message);

      if (!isLimitRule) {
        console.error("Erro ao baixar vídeo:", downloadError);
        trackError("Erro ao baixar vídeo", "video_download_error");
      }
      setDownloadingVideoId(null);
      setDownloadProgress(0);
      setDownloadRenewalPackId(renewalPackId);
      setDownloadNotice(message);
    }
  };

  const dismissDownloadNotice = () => {
    setDownloadNotice(null);
    setDownloadRenewalPackId(null);
  };

  const handleOpenRenewal = () => {
    const targetPackId = downloadRenewalPackId || packId;
    dismissDownloadNotice();
    router.push(targetPackId ? `/billing?pack=${targetPackId}` : "/billing");
  };

  const handleCopyLink = async (link: string, index: number) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
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
      <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
        <AlertTitle>Erro ao carregar vídeos</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasAccess === null) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando acesso ao pacote...</p>
        </CardContent>
      </Card>
    );
  }

  if (!packId) {
    return (
      <Card>
        <CardContent className="py-14 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <VideoIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Selecione um pacote para ver os vídeos.</p>
          <Button variant="outline" onClick={handleBack}>
            Voltar para pacotes
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (hasAccess === false) {
    return (
      <Card>
        <CardContent className="py-14 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <VideoIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Acesso Negado</h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Você não tem acesso a este pacote de vídeos.
          </p>
          <Button onClick={handleBack}>Voltar para pacotes</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleBack} className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para pacotes
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <VideoIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Vídeos</CardTitle>
                  <CardDescription>Explore os vídeos do pacote</CardDescription>
                </div>
              </div>
            </div>
          </div>

          {packInfo && (
            <Card className="border-border/70 bg-muted/20">
              <CardContent className="flex items-center gap-4">
                {packInfo.image?.url ? (
                  <Image
                    src={packInfo.image.url}
                    alt={packInfo.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <VideoIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-semibold">{packInfo.name}</h2>
                  {packInfo.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{packInfo.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px_220px]">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar vídeos..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="h-10 pl-9"
                />
              </div>
              {!isLoading && (searchTerm.length >= 3 || selectedCategory > 0) && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">{videos.length}</span>{" "}
                  {videos.length === 1 ? "vídeo encontrado" : "vídeos encontrados"}
                  <span className="ml-1 text-muted-foreground/80">de {totalVideos} total</span>
                </p>
              )}
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value={0}>Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.attributes?.name || category.name || `Categoria ${category.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")}
                className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="name">Nome A-Z</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          {downloadNotice && (
            <Alert variant="destructive" className="mb-4 border-destructive/60 bg-destructive/10">
              <AlertTitle>Download bloqueado</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{downloadNotice}</p>
                {downloadRenewalPackId && (
                  <Button variant="outline" onClick={handleOpenRenewal}>
                    Renovar pacote
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videos.length === 0 ? (
            <div className="space-y-4 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <VideoIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchTerm.length >= 3 || selectedCategory ? "Nenhum vídeo encontrado" : "Nenhum vídeo disponível"}
              </p>
              {(searchTerm.length >= 3 || selectedCategory > 0) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory(0);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video, index) => (
                  <Card
                    key={video.documentId}
                    className="group cursor-pointer overflow-hidden border-border/70 transition-colors hover:border-primary/60"
                    onClick={() => handleVideoClick(index)}
                  >
                    <div className="relative aspect-[9/16] overflow-hidden border-b border-border/70 bg-muted/20">
                      {video.coverImage?.formats?.medium?.url ? (
                        <Image
                          src={video.coverImage.formats.medium.url}
                          alt={`Capa do vídeo ${video.title}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <VideoIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}

                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition-all duration-200 group-hover:bg-black/20">
                        <Play className="h-12 w-12 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      </div>

                      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
                        <span className="select-none text-white/20 text-lg sm:text-xl font-semibold tracking-wide">
                          Master Afiliados
                        </span>
                      </div>

                      <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(video);
                          }}
                          disabled={downloadingVideoId === video.id}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {downloadingVideoId === video.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>

                        {getProductLinks(video).length > 0 && (
                          <Button
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowLinks(video);
                            }}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <CardContent className="space-y-2">
                      <h3 className="line-clamp-2 font-semibold transition-colors group-hover:text-primary">
                        {video.title || "Sem título"}
                      </h3>
                      {video.category?.name && <Badge variant="outline">{video.category.name}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {currentPage < totalPages && (
                <div className="mt-8 flex justify-center">
                  <Button onClick={loadMoreVideos} disabled={isLoadingMore} className="min-w-40">
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Carregar Mais"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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

      {showLinksPopup && selectedVideoForLinks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Links do Produto</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowLinksPopup(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <CardDescription>{selectedVideoForLinks.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {getProductLinks(selectedVideoForLinks).map((itemLink, index) => (
                <div key={index} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="min-w-0 flex-1 truncate text-sm">{itemLink}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => window.open(itemLink, "_blank")}
                      title="Abrir link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      onClick={() => handleCopyLink(itemLink, index)}
                      title="Copiar link"
                    >
                      {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {downloadingVideoId && (
        <div className="fixed bottom-4 right-4 z-50 min-w-64 rounded-lg border border-border/70 bg-card/95 p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Baixando vídeo...</span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
          </div>
        </div>
      )}

      <Dialog open={Boolean(downloadNotice)} onOpenChange={(open) => !open && dismissDownloadNotice()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download bloqueado</DialogTitle>
            <DialogDescription>{downloadNotice}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {downloadRenewalPackId && (
              <Button variant="outline" onClick={handleOpenRenewal}>
                Renovar pacote
              </Button>
            )}
            <Button onClick={dismissDownloadNotice}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-14 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      }
    >
      <VideosPageContent />
    </Suspense>
  );
}
