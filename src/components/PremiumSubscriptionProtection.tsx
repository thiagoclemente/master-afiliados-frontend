"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { fetchUserSubscriptions, isSubscriptionPremium } from "@/services/user-subscription.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PremiumSubscriptionProtectionProps {
  children: React.ReactNode;
}

export default function PremiumSubscriptionProtection({
  children,
}: PremiumSubscriptionProtectionProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetchUserSubscriptions();
        setHasAccess(isSubscriptionPremium(response.data || []));
      } catch {
        setHasAccess(false);
      }
    };

    checkAccess();
  }, []);

  if (hasAccess === null) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando sua assinatura premium...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
            <Lock className="h-8 w-8" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Acesso Premium
          </CardTitle>
          <CardDescription className="mx-auto max-w-xl">
            Esta área reúne os vídeos premium do app. Para acessar Bombando na Shopee,
            Vídeos de IA e os detalhes de cada conteúdo, é necessário ter a assinatura
            Master Premium ativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => window.open("https://masterafiliados.com.br", "_blank")}>
            Assinar Master Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
