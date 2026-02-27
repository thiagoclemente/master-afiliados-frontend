"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchCombos } from "@/services/combo.service";
import { fetchUserPacksRelease } from "@/services/user-pack-release.service";
import {
  fetchUserSubscriptions,
  isSubscriptionPremium,
} from "@/services/user-subscription.service";
import type { Combo } from "@/interfaces/combo";
import type { Pack } from "@/interfaces/pack";
import type { UserPackRelease } from "@/interfaces/user-pack-release";
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
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
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

  const loadPremiumAccess = useCallback(async () => {
    try {
      const response = await fetchUserSubscriptions();
      setHasPremiumAccess(isSubscriptionPremium(response.data || []));
    } catch {
      setHasPremiumAccess(false);
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
    loadPremiumAccess();
  }, [loadCombos, loadPremiumAccess, loadUserPacksRelease]);

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
    if (hasPremiumAccess) {
      return false;
    }

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
      <Card>
        <CardContent className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pack Required Message */}
      {showPackRequiredMessage && (
        <Alert className="border-amber-700/60 bg-amber-950/40 text-amber-100 [&>svg]:text-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pacote Necessário</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Para acessar a <strong>Biblioteca de Artes</strong> e{" "}
              <strong>Biblioteca de Stickers</strong>, você precisa adquirir um
              pacote de vídeos ou ter assinatura <strong>Master Premium</strong>.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="px-0 text-amber-200 hover:text-amber-100 hover:bg-transparent"
              onClick={() => setShowPackRequiredMessage(false)}
            >
              Entendi, fechar mensagem
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <VideoIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Pacotes de Vídeos</h1>
                <p className="text-sm text-muted-foreground">
                  Explore os combos de vídeos disponíveis
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combos List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando combos...</p>
          </CardContent>
        </Card>
      ) : combos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <VideoIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum combo disponível</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {combos.map((combo) => (
              <Card key={combo.id} className="py-0 gap-0 overflow-hidden">
                {/* Combo Title */}
                {combo.showTitle && (
                  <CardHeader className="border-b pt-6 pb-5">
                    <CardTitle className="text-xl text-center">{combo.name}</CardTitle>
                  </CardHeader>
                )}

                {/* Packs Grid */}
                <CardContent className="p-6">
                  <div
                    className={`grid gap-6 ${
                      combo.packs.length <= 1 ? "grid-cols-1" : "grid-cols-2"
                    }`}
                  >
                    {combo.packs.map((pack: Pack) => (
                      <Card
                        key={pack.id}
                        className="py-0 gap-0 overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        {/* Pack Image */}
                        <div className="relative h-48 bg-muted/30">
                          {pack.image?.url ? (
                            <Image
                              src={pack.image.url}
                              alt={pack.name}
                              fill
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                              <VideoIcon className="w-12 h-12 text-primary" />
                            </div>
                          )}
                          
                          {/* Pack Type Badge */}
                          {pack.initialPackage && (
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                                Inicial
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Pack Info */}
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-2">
                            <CardTitle className="text-lg">{pack.name}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {pack.description}
                            </CardDescription>
                          </div>
                          
                          {/* Release Period Message or Access Button */}
                          {isPackInReleasePeriod(pack) ? (
                            <div className="p-3 bg-blue-950/50 border border-blue-700/60 rounded-lg">
                              <div className="flex items-center text-blue-200 text-sm">
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
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/videos?pack=${pack.documentId}`);
                              }}
                              className="w-full"
                            >
                              Acessar Vídeos
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={loadMoreCombos}
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
    </div>
  );
}

export default function CombosPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    }>
      <CombosPageContent />
    </Suspense>
  );
}
