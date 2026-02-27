"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { useAnalytics } from "@/hooks/use-analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Shield, 
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { trackLogin, trackError } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      trackLogin('email');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(errorMessage);
      trackError(errorMessage, 'login_failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <Card className="w-full border-border/70 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-5 text-center">
            <div className="flex justify-center">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <Image
                  src="/logo.png"
                  alt="Master Afiliados Logo"
                  width={88}
                  height={88}
                  className="rounded-lg"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Entre na sua conta</CardTitle>
              <CardDescription className="text-base">
                Acesse sua central de conteúdo
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email-address" className="text-sm font-medium text-foreground/90">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="h-11 pl-9"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground/90">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="h-11 pl-9 pr-10"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive/90">{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Entrar na Conta
                  </>
                )}
              </Button>
              <div className="text-center">
                <Button asChild variant="link" className="h-auto p-0 text-sm">
                  <Link href="/forgot-password">Esqueceu sua senha?</Link>
                </Button>
              </div>
            </form>
            <div className="mt-6 border-t border-border/60 pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                © 2024 Master Afiliados. Todos os direitos reservados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
