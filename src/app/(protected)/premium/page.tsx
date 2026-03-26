"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Bot, Video } from "lucide-react";
import PremiumSubscriptionProtection from "@/components/PremiumSubscriptionProtection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Bombando na Shopee",
    description: "Vídeos premium com produtos em alta para acelerar a divulgação.",
    href: "/videos/bombando-na-shopee",
    icon: TrendingUp,
    badge: "Vídeos",
  },
  {
    title: "Vídeos de IA",
    description: "Conteúdos premium produzidos com IA, prontos para publicar e adaptar.",
    href: "/videos/videos-de-ia",
    icon: Bot,
    badge: "Vídeos",
  },
];

export default function PremiumPage() {
  return (
    <PremiumSubscriptionProtection>
      <div className="space-y-6">
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Premium</CardTitle>
                <CardDescription>
                  Biblioteca exclusiva do app com listagem e página de detalhe para cada vídeo.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Master Premium</Badge>
              <Badge variant="outline">Bombando na Shopee</Badge>
              <Badge variant="outline">Vídeos de IA</Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.href} className="transition-colors hover:border-primary/50">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{section.badge}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="h-4 w-4" />
                    Listagem com acesso ao detalhe do vídeo
                  </div>
                  <Button asChild>
                    <Link href={section.href} className="inline-flex items-center gap-2">
                      Acessar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PremiumSubscriptionProtection>
  );
}
