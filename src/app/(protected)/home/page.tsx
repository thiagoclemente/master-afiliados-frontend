"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
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
import {
  Palette,
  Video,
  StickyNote,
  BarChart3,
  Settings,
  Megaphone,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Artes",
      description: "Acesse nossa biblioteca de artes para suas campanhas",
      href: "/arts",
      icon: Palette,
      color: "bg-blue-500",
    },
    {
      title: "Pacotes de Vídeos",
      description: "Combos de vídeos promocionais para suas estratégias de marketing",
      href: "/combos",
      icon: Video,
      color: "bg-red-500",
    },
    {
      title: "Stickers",
      description: "Stickers personalizados para suas redes sociais",
      href: "/stickers",
      icon: StickyNote,
      color: "bg-green-500",
    },
    {
      title: "Comissões Master",
      description: "Métricas de vendas e cliques para afiliados Shopee",
      href: "/master/commissions",
      icon: BarChart3,
      color: "bg-purple-600",
    },
    {
      title: "Controle Master",
      description: "Ferramenta para controle das suas campanhas de anúncios",
      href: "/master/control",
      icon: Settings,
      color: "bg-indigo-700",
    },
    {
      title: "Divulgador Master",
      description: "Automatize divulgações e disparos em grupos com controle de créditos",
      href: "/master/promoter",
      icon: Megaphone,
      color: "bg-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Master Afiliados</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo de volta, {user?.username}!
            </p>
          </div>
          {user?.email && <Badge variant="outline">{user.email}</Badge>}
        </CardContent>
      </Card>

      <Alert className="border-primary/50 bg-gradient-to-r from-primary/30 to-primary/10">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Sua Central de Conteúdo</AlertTitle>
        <AlertDescription>
          Aqui você encontrará todo o conteúdo necessário para suas campanhas de
          afiliados. Escolha uma categoria abaixo para começar.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card key={item.href} className="transition-colors hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-white shadow-md`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  {item.description}
                </CardDescription>
                <Button asChild variant="ghost" className="px-0">
                  <Link href={item.href} className="inline-flex items-center gap-2">
                    Acessar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
