"use client";

import Link from "next/link";
import { BarChart3, Megaphone, Settings, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const masterTools = [
  {
    title: "Comissões Master",
    headline: "O segredo dos afiliados que vendem todos os dias",
    description: "Entenda onde estão suas vendas e aumente seus resultados com leitura de dados.",
    href: "/master/commissions",
    icon: BarChart3,
    accent: "from-orange-500/20 to-orange-800/10",
    badge: "Métricas e CSV",
    cta: "Comissões Master",
  },
  {
    title: "Controle Master",
    headline: "Alcance melhores resultados nas campanhas",
    description: "Controle investimento, vendas e lucro com visão mensal por anúncio e por dia.",
    href: "/master/control",
    icon: Settings,
    accent: "from-indigo-500/20 to-indigo-800/10",
    badge: "Gestão",
    cta: "Controle Master",
  },
  {
    title: "Divulgador Master",
    headline: "Dispare ofertas no WhatsApp com IA",
    description: "Gere mensagens, monte listas e programe disparos com validação de créditos.",
    href: "/master/promoter",
    icon: Megaphone,
    accent: "from-emerald-500/20 to-emerald-800/10",
    badge: "Automação",
    cta: "Divulgador Master",
  },
];

export default function MasterPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Ferramentas Master</CardTitle>
          <CardDescription>
            Acesse os módulos avançados do app no mesmo padrão de navegação.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {masterTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.href}
              className={`overflow-hidden border-border/70 bg-gradient-to-br ${tool.accent} p-0`}
            >
              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/70 bg-background/70 shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">{tool.badge}</Badge>
                </div>
                <div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <p className="mt-2 text-sm font-medium">{tool.headline}</p>
                  <CardDescription className="mt-2">{tool.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild className="w-full justify-between">
                  <Link href={tool.href} className="inline-flex items-center justify-center gap-2">
                    {tool.cta}
                    <ArrowRight className="h-4 w-4" />
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
