"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services/user.service";
import { UserUpdateRequest, UserProfile } from "@/interfaces/user.interface";
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
  ShoppingBag,
  Key,
  Save,
  ArrowLeft,
  Info,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ShopeeConfigPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    shoppeId: "",
    shoppeApiPassword: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await UserService.getCurrentUser();
        setUserProfile(profile);
        setFormData({
          shoppeId: profile.shoppeId || "",
          shoppeApiPassword: profile.shoppeApiPassword || "",
        });
      } catch (err) {
        console.error("Error fetching user profile for shopee config:", err);
        setError(
          `Erro ao carregar dados do perfil: ${
            err instanceof Error ? err.message : "Erro desconhecido"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UserUpdateRequest = {
        shoppeId: formData.shoppeId.trim() || undefined,
        shoppeApiPassword: formData.shoppeApiPassword.trim() || undefined,
      };

      if (!userProfile?.id) {
        throw new Error("ID do usuário não encontrado");
      }

      await UserService.updateUser(updateData, userProfile.id);
      setSuccess("Configurações da Shopee atualizadas com sucesso!");

      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      setError("Erro ao atualizar configurações. Tente novamente.");
      console.error("Error updating shopee config:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const openShopeeAffiliatePage = () => {
    window.open("https://affiliate.shopee.com.br/open_api", "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
          <p className="mt-3 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle>Configuração Shopee</CardTitle>
              <CardDescription>Configure suas credenciais para gerar links de afiliado</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-200 [&>svg]:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-emerald-200">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive/90">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Alert className="border-orange-500/50 bg-orange-500/10 text-orange-100 [&>svg]:text-orange-300">
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-2 text-orange-100">
          <p className="font-medium">Como obter suas credenciais?</p>
          <p className="text-sm text-orange-100/90">
            Para usar a funcionalidade de conversão de links da Shopee, configure suas credenciais de API.
          </p>
          <Button variant="outline" className="border-orange-400/50 hover:bg-orange-500/10" onClick={openShopeeAffiliatePage}>
            <ExternalLink className="h-4 w-4" />
            Acesse a página de afiliados da Shopee
          </Button>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label htmlFor="shoppeId" className="text-sm font-medium text-foreground/90">
                <ShoppingBag className="mr-2 inline h-4 w-4 text-orange-500" />
                Shopee ID
              </label>
              <Input
                type="text"
                id="shoppeId"
                name="shoppeId"
                value={formData.shoppeId}
                onChange={handleInputChange}
                className="h-11"
                placeholder="Digite seu Shopee ID"
              />
              <p className="text-xs text-muted-foreground">Seu ID de afiliado da Shopee.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="shoppeApiPassword" className="text-sm font-medium text-foreground/90">
                <Key className="mr-2 inline h-4 w-4 text-orange-500" />
                Senha da API Shopee
              </label>
              <Input
                type="password"
                id="shoppeApiPassword"
                name="shoppeApiPassword"
                value={formData.shoppeApiPassword}
                onChange={handleInputChange}
                className="h-11"
                placeholder="Digite a senha da API"
              />
              <p className="text-xs text-muted-foreground">Senha fornecida pela Shopee para acesso à API.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-orange-600 text-white hover:bg-orange-700" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por que preciso dessas credenciais?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Conversão automática de links:</strong> links da Shopee são convertidos com seu ID de afiliado.</li>
            <li>• <strong>Relatórios de comissão:</strong> geração de relatórios detalhados de vendas e comissões.</li>
            <li>• <strong>Rastreamento de cliques:</strong> acompanhamento de cliques e conversões dos seus links.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
