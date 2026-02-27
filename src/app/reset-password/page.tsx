"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AuthService } from "@/services/auth.service";
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
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  KeyRound,
} from "lucide-react";

function maskRecoveryCode(code: string) {
  if (code.length <= 24) return code;
  return `${code.slice(0, 14)}...${code.slice(-10)}`;
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const queryCode = searchParams.get("code")?.trim();
    if (queryCode) {
      setRecoveryCode(queryCode);
      setError("");
      return;
    }

    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    let fallbackCode = url.searchParams.get("code")?.trim();

    // Some providers may append code in hash fragment instead of query string.
    if (!fallbackCode && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      fallbackCode = hashParams.get("code")?.trim();
    }

    if (fallbackCode) {
      setRecoveryCode(fallbackCode);
      setError("");
    } else {
      setRecoveryCode("");
      setError("Código de recuperação não encontrado no link. Solicite um novo código.");
    }
  }, [searchParams]);

  const maskedRecoveryCode = useMemo(
    () => maskRecoveryCode(recoveryCode),
    [recoveryCode]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!recoveryCode) {
      setError("Código de recuperação não encontrado.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.resetPassword(recoveryCode, password, confirmPassword);
      setSuccess("Senha redefinida com sucesso. Você será redirecionado para o login.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha.");
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
              <CardTitle className="text-3xl">Redefinir senha</CardTitle>
              <CardDescription className="text-base">
                Digite sua nova senha para continuar
              </CardDescription>
              {email && (
                <p className="text-xs text-muted-foreground">Email: {email}</p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!recoveryCode ? (
              <div className="space-y-4">
                <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive/90">
                    {error || "Código de recuperação inválido."}
                  </AlertDescription>
                </Alert>
                <div className="text-center">
                  <Button asChild variant="link" className="h-auto p-0 text-sm">
                    <Link href="/forgot-password" className="inline-flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Solicitar novo código
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <Alert className="border-primary/40 bg-primary/10">
                  <KeyRound className="h-4 w-4" />
                  <AlertDescription className="max-w-full text-left">
                    <span className="block text-xs text-muted-foreground">Código carregado do link</span>
                    <span className="block break-all font-mono text-xs">{maskedRecoveryCode}</span>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground/90">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="h-11 pl-9 pr-10"
                      placeholder="Digite sua nova senha"
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/90">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="h-11 pl-9 pr-10"
                      placeholder="Confirme sua nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-destructive/90">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-200 [&>svg]:text-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-emerald-200">{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Redefinir senha
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button asChild variant="link" className="h-auto p-0 text-sm">
                    <Link href="/forgot-password" className="inline-flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para recuperação de senha
                    </Link>
                  </Button>
                </div>
              </form>
            )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
            <Card className="w-full border-border/70 bg-card/80">
              <CardContent className="py-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
