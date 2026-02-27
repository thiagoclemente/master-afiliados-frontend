"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Mail, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Send
} from "lucide-react";
import { AuthService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await AuthService.forgotPassword(email);
      setSuccess("Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email de recuperação");
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
              <CardTitle className="text-3xl">Recuperar senha</CardTitle>
              <CardDescription className="text-base">
                Digite seu email para receber um código de recuperação
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground/90">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
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
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar código de recuperação
                  </>
                )}
              </Button>
              <div className="text-center">
                <Button asChild variant="link" className="h-auto p-0 text-sm">
                  <Link href="/login" className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o login
                  </Link>
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
