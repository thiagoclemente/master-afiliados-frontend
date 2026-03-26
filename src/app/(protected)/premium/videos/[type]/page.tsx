"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bot, Loader2, Search, TrendingUp, Video as VideoIcon } from "lucide-react";
import PremiumSubscriptionProtection from "@/components/PremiumSubscriptionProtection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import {
  fetchPremiumVideos,
  getPremiumVideoTypeMeta,
  isPremiumVideoTypeSlug,
  resolvePremiumVideoCover,
  type PremiumVideoTypeSlug,
} from "@/services/premium-video.service";
import type { PremiumVideo } from "@/interfaces/premium-video";

export default function PremiumVideoTypePage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = params?.type;
  const validType = type && isPremiumVideoTypeSlug(type) ? (type as PremiumVideoTypeSlug) : null;
  const typeMeta = validType ? getPremiumVideoTypeMeta(validType) : null;
  const [videos, setVideos] = useState<PremiumVideo[]>([]);
  const querySearch = searchParams.get("search") ?? "";
  const parsedPage = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 400);

  const headerIcon = useMemo(() => {
    if (!validType) return VideoIcon;
    return validType === "bombando-na-shopee" ? TrendingUp : Bot;
  }, [validType]);

  const loadVideos = useCallback(
    async (page: number, searchValue?: string) => {
      if (!validType) return;

      try {
        setIsLoading(true);
        setVideos([]);

        const response = await fetchPremiumVideos({
          page,
          pageSize: 20,
          search: searchValue || undefined,
          typeSlug: validType,
        });

        setVideos(response.data);
        setTotalPages(response.meta.pagination.pageCount);
        setTotalVideos(response.meta.pagination.total);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar os vídeos premium."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [validType]
  );

  useEffect(() => {
    setSearchTerm(querySearch);
  }, [querySearch]);

  const updateListUrl = useCallback(
    (page: number, searchValue: string, method: "push" | "replace" = "push") => {
      if (!validType) return;

      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }

      const normalizedSearch = searchValue.trim();
      if (normalizedSearch) {
        params.set("search", normalizedSearch);
      } else {
        params.delete("search");
      }

      const query = params.toString();
      const href = query
        ? `/videos/${validType}?${query}`
        : `/videos/${validType}`;

      if (method === "replace") {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [router, searchParams, validType]
  );

  useEffect(() => {
    const normalizedDebouncedSearch = debouncedSearch.trim();
    const normalizedQuerySearch = querySearch.trim();

    if (normalizedDebouncedSearch === normalizedQuerySearch) {
      return;
    }

    updateListUrl(1, normalizedDebouncedSearch, "replace");
  }, [debouncedSearch, querySearch, updateListUrl]);

  useEffect(() => {
    if (!validType) return;
    loadVideos(currentPage, querySearch);
  }, [currentPage, loadVideos, querySearch, validType]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  if (!validType || !typeMeta) {
    return (
      <PremiumSubscriptionProtection>
        <Card>
          <CardContent className="space-y-4 py-14 text-center">
            <p className="text-muted-foreground">Tipo de vídeo premium inválido.</p>
            <Button asChild>
              <Link href="/combos">Voltar para Vídeos</Link>
            </Button>
          </CardContent>
        </Card>
      </PremiumSubscriptionProtection>
    );
  }

  const HeaderIcon = headerIcon;

  return (
    <PremiumSubscriptionProtection>
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => router.push("/combos")} className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HeaderIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{typeMeta.title}</CardTitle>
                  <CardDescription>{typeMeta.description}</CardDescription>
                </div>
              </div>
              <Badge variant="outline">{totalVideos} vídeos</Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={`Buscar em ${typeMeta.shortTitle.toLowerCase()}...`}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" asChild>
                <Link href="/combos">Ver pacotes de vídeos</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {error ? (
          <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
            <AlertTitle>Erro ao carregar vídeos premium</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : videos.length === 0 ? (
              <div className="space-y-4 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <VideoIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Nenhum vídeo premium encontrado.</p>
                {searchTerm ? (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Limpar busca
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Mostrando <span className="font-semibold text-primary">{videos.length}</span> de {totalVideos} vídeos
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {videos.map((video) => {
                    const coverUrl = resolvePremiumVideoCover(video);
                    return (
                      <Link
                        key={video.documentId}
                        href={`/videos/${validType}/${video.documentId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                      >
                        <Card className="group h-full overflow-hidden border-border/70 transition-colors hover:border-primary/60">
                          <div className="relative aspect-[9/16] overflow-hidden border-b border-border/70 bg-muted/20">
                            {coverUrl ? (
                              <Image
                                src={coverUrl}
                                alt={`Capa do vídeo ${video.title}`}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 20vw"
                                className="object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                <VideoIcon className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <p className="text-xs text-white/80">Master Premium</p>
                            </div>
                          </div>

                          <CardContent className="space-y-2 p-3">
                            <h3 className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">
                              {video.title}
                            </h3>

                            <div className="flex flex-wrap gap-2">
                              {(video.categories ?? []).slice(0, 2).map((category) => (
                                <Badge key={`${video.documentId}-${category.id}`} variant="outline" className="text-[10px]">
                                  {category.name}
                                </Badge>
                              ))}
                              {video.owner ? <Badge variant="secondary" className="text-[10px]">Autoral</Badge> : null}
                              {video.narrated ? <Badge variant="secondary" className="text-[10px]">Narração</Badge> : null}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updateListUrl(Math.max(1, currentPage - 1), querySearch)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>

                    {visiblePages[0] > 1 ? (
                      <>
                        <Button variant={currentPage === 1 ? "default" : "outline"} onClick={() => updateListUrl(1, querySearch)}>
                          1
                        </Button>
                        {visiblePages[0] > 2 ? <span className="px-1 text-sm text-muted-foreground">...</span> : null}
                      </>
                    ) : null}

                    {visiblePages.map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => updateListUrl(page, querySearch)}
                      >
                        {page}
                      </Button>
                    ))}

                    {visiblePages[visiblePages.length - 1] < totalPages ? (
                      <>
                        {visiblePages[visiblePages.length - 1] < totalPages - 1 ? (
                          <span className="px-1 text-sm text-muted-foreground">...</span>
                        ) : null}
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          onClick={() => updateListUrl(totalPages, querySearch)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    ) : null}

                    <Button
                      variant="outline"
                      onClick={() => updateListUrl(Math.min(totalPages, currentPage + 1), querySearch)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PremiumSubscriptionProtection>
  );
}
