"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Check,
  CircleDollarSign,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  Mic,
  MousePointerClick,
  Percent,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  User,
  Video as VideoIcon,
} from "lucide-react";
import PremiumSubscriptionProtection from "@/components/PremiumSubscriptionProtection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  fetchPremiumVideo,
  fetchPremiumVideoDownloadUrl,
  fetchPremiumVideoPlaybackUrl,
  getPremiumVideoLinks,
  getPremiumVideoTypeMeta,
  isPremiumVideoTypeSlug,
  resolvePremiumVideoCover,
  resolvePremiumVideoStreamingUrl,
  type PremiumVideoTypeSlug,
} from "@/services/premium-video.service";
import type { PremiumVideo } from "@/interfaces/premium-video";

function InfoChip({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function PremiumVideoDetailPage() {
  const params = useParams<{ type: string; documentId: string }>();
  const searchParams = useSearchParams();
  const type = params?.type;
  const documentId = params?.documentId;
  const validType = type && isPremiumVideoTypeSlug(type) ? (type as PremiumVideoTypeSlug) : null;
  const typeMeta = validType ? getPremiumVideoTypeMeta(validType) : null;
  const [video, setVideo] = useState<PremiumVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isProductImageOpen, setIsProductImageOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const pageIcon = useMemo(() => {
    if (!validType) return Sparkles;
    return validType === "bombando-na-shopee" ? TrendingUp : Bot;
  }, [validType]);

  const loadVideo = useCallback(async () => {
    if (!documentId) return;

    try {
      setIsLoading(true);
      const premiumVideo = await fetchPremiumVideo(documentId);

      if (validType && premiumVideo.type !== typeMeta?.apiType) {
        throw new Error("Este vídeo não pertence a esta seção premium.");
      }

      setVideo(premiumVideo);

      try {
        const playbackUrl = await fetchPremiumVideoPlaybackUrl(documentId);
        setVideoUrl(playbackUrl);
      } catch {
        setVideoUrl(resolvePremiumVideoStreamingUrl(premiumVideo));
      }

      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o vídeo premium."
      );
    } finally {
      setIsLoading(false);
    }
  }, [documentId, typeMeta?.apiType, validType]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  const handleDownload = useCallback(async () => {
    if (!video) return;

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const downloadUrl = await fetchPremiumVideoDownloadUrl(video.documentId);
      const response = await fetch(downloadUrl);

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
          setDownloadProgress(Math.round((receivedLength / total) * 100));
        }
      }

      const blob = new Blob(chunks, { type: "video/mp4" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanTitle = (video.title || "video")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")
        .trim();

      link.href = url;
      link.download = `${cleanTitle}.mp4`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadProgress(100);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Não foi possível baixar o vídeo premium."
      );
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 300);
    }
  }, [video]);

  const handleCopyLink = async (link: string, index: number) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setCopiedIndex(null);
    }
  };

  if (!validType || !typeMeta || !documentId) {
    return (
      <PremiumSubscriptionProtection>
        <Card>
          <CardContent className="space-y-4 py-14 text-center">
            <p className="text-muted-foreground">Vídeo premium inválido.</p>
            <Button asChild>
              <Link href="/combos">Voltar para Vídeos</Link>
            </Button>
          </CardContent>
        </Card>
      </PremiumSubscriptionProtection>
    );
  }

  const links = video ? getPremiumVideoLinks(video) : [];
  const coverUrl = video ? resolvePremiumVideoCover(video) : null;
  const backHref = `/videos/${validType}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const shopeeProductImageUrl = video?.shopeeImageProduct?.url
    ? (video.shopeeImageProduct.url.startsWith("http")
        ? video.shopeeImageProduct.url
        : `${process.env.NEXT_PUBLIC_STRAPI_URL}${video.shopeeImageProduct.url}`)
    : null;
  const PageIcon = pageIcon;

  return (
    <PremiumSubscriptionProtection>
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <Button variant="ghost" asChild className="mt-1">
                  <Link href={backHref} className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Link>
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PageIcon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <CardTitle>{video?.title || "Detalhes do vídeo premium"}</CardTitle>
                  <CardDescription>{typeMeta.title}</CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{typeMeta.shortTitle}</Badge>
                    {video?.owner ? <Badge variant="secondary">Autoral</Badge> : null}
                    {video?.narrated ? <Badge variant="secondary">Narração</Badge> : null}
                    {video?.extraCommission ? <Badge variant="outline">Comissão extra</Badge> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => videoRef.current?.play()} disabled={!videoUrl}>
                  Reproduzir
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading || !video}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {downloadProgress > 0 ? `${downloadProgress}%` : "Baixando"}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Baixar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {error ? (
          <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : video ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 space-y-6">
              <Card className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
                    <div className="flex justify-center lg:justify-start">
                      <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-border/70 bg-black shadow-sm">
                        {videoUrl ? (
                          <video
                            ref={videoRef}
                            controls
                            playsInline
                            poster={coverUrl || undefined}
                            className="aspect-[9/16] w-full bg-black object-contain"
                            src={videoUrl}
                          >
                            Seu navegador não suporta o elemento de vídeo.
                          </video>
                        ) : (
                          <div className="flex aspect-[9/16] items-center justify-center bg-muted/20">
                            <div className="text-center text-muted-foreground">
                              <VideoIcon className="mx-auto mb-3 h-10 w-10" />
                              Reprodução indisponível para este vídeo.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Informações do Vídeo
                        </h2>
                        <div className="space-y-3">
                          <InfoChip
                            icon={Tag}
                            label="Tipo"
                            value={typeMeta.title}
                            iconClassName="bg-blue-500/15 text-blue-300"
                          />
                          <InfoChip
                            icon={Mic}
                            label="Narração"
                            value={video.narrated ? "Vídeo narrado" : "Sem narração"}
                            iconClassName={
                              video.narrated
                                ? "bg-violet-500/15 text-violet-300"
                                : "bg-zinc-500/15 text-zinc-300"
                            }
                          />
                          <InfoChip
                            icon={User}
                            label="Origem"
                            value={video.owner ? "Vídeo autoral" : "Vídeo de terceiros"}
                            iconClassName={
                              video.owner
                                ? "bg-rose-500/15 text-rose-300"
                                : "bg-zinc-500/15 text-zinc-300"
                            }
                          />
                          {video.extraCommission ? (
                            <InfoChip
                              icon={Percent}
                              label="Diferencial"
                              value="Comissão extra disponível"
                              iconClassName="bg-red-500/15 text-red-300"
                            />
                          ) : null}
                        </div>

                        <div className="mt-5 space-y-5 border-t border-border/70 pt-4">
                          <div>
                            <div className="mb-2 text-sm font-medium text-muted-foreground">
                              Categorias
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(video.categories ?? []).length > 0 ? (
                                (video.categories ?? []).map((category) => (
                                  <Badge key={`${video.documentId}-${category.id}`} variant="outline">
                                    {category.name}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">Sem categorias informadas.</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 text-sm font-medium text-muted-foreground">
                              Links do Produto
                            </div>
                            <div className="space-y-3">
                              {links.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum link disponível.</p>
                              ) : (
                                links.map((link, index) => (
                                  <div
                                    key={`${video.documentId}-link-${index}`}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card p-3"
                                  >
                                    <p className="min-w-0 flex-1 truncate text-sm">{link}</p>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="icon-sm"
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={() => window.open(link, "_blank")}
                                        title="Abrir link"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon-sm"
                                        variant="outline"
                                        onClick={() => handleCopyLink(link, index)}
                                        title="Copiar link"
                                      >
                                        {copiedIndex === index ? (
                                          <Check className="h-4 w-4" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {video.type === "TRENDING_ON_SHOPPE" && video.extraCommission ? (
                        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Informações de Performance
                          </h2>
                          <div className="space-y-3">
                            <InfoChip
                              icon={TrendingUp}
                              label="Status"
                              value="Bombando na Shopee"
                              iconClassName="bg-orange-500/15 text-orange-300"
                            />
                            <InfoChip
                              icon={Percent}
                              label="Comissão"
                              value="Comissão extra"
                              iconClassName="bg-red-500/15 text-red-300"
                            />
                          </div>
                        </div>
                      ) : null}

                      {(video.averageClicks || video.cpc || video.validatedFor) ? (
                        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Métricas e Validação
                          </h2>
                          <div className="space-y-3">
                            {video.averageClicks ? (
                              <InfoChip
                                icon={MousePointerClick}
                                label="Cliques médios"
                                value={video.averageClicks}
                                iconClassName="bg-sky-500/15 text-sky-300"
                              />
                            ) : null}
                            {video.cpc ? (
                              <InfoChip
                                icon={CircleDollarSign}
                                label="CPC médio"
                                value={`R$ ${video.cpc}`}
                                iconClassName="bg-emerald-500/15 text-emerald-300"
                              />
                            ) : null}
                          </div>
                          {video.validatedFor ? (
                            <div className="mt-4">
                              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 text-amber-300" />
                                Validado para
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {video.validatedFor
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                                  .map((item) => (
                                    <Badge key={item} variant="outline">
                                      {item}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="space-y-6 sm:w-[220px] sm:shrink-0 lg:w-[240px]">
              {shopeeProductImageUrl ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Imagem do Produto</CardTitle>
                    <CardDescription>Referência visual vinda da Shopee.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <button
                      type="button"
                      onClick={() => setIsProductImageOpen(true)}
                      className="group mx-auto block"
                    >
                      <div className="relative h-36 w-36 overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                        <Image
                          src={shopeeProductImageUrl}
                          alt={`Imagem do produto para ${video.title}`}
                          fill
                          sizes="144px"
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/35">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <Maximize2 className="h-3.5 w-3.5" />
                            Ampliar
                          </span>
                        </div>
                      </div>
                    </button>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <Dialog open={isProductImageOpen} onOpenChange={setIsProductImageOpen}>
              <DialogContent className="max-w-[min(92vw,900px)] p-3 sm:p-4">
                <DialogHeader>
                  <DialogTitle>Imagem do Produto</DialogTitle>
                </DialogHeader>
                {shopeeProductImageUrl ? (
                  <div className="relative mx-auto aspect-square w-full max-w-[80vh] overflow-hidden rounded-xl bg-muted/20">
                    <Image
                      src={shopeeProductImageUrl}
                      alt={`Imagem ampliada do produto para ${video.title}`}
                      fill
                      sizes="90vw"
                      className="object-contain"
                    />
                  </div>
                ) : null}
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Card>
            <CardContent className="space-y-4 py-14 text-center">
              <p className="text-muted-foreground">Vídeo premium não encontrado.</p>
              <Button asChild>
                <Link href={`/videos/${validType}`}>Voltar para a listagem</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PremiumSubscriptionProtection>
  );
}
