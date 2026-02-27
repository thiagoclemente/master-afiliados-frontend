"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { UserService } from "@/services/user.service";
import { UserProfile } from "@/interfaces/user.interface";
import { useRouter } from "next/navigation";
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
  User,
  Mail,
  Phone,
  Instagram,
  ShoppingBag,
  Edit,
  Key,
  MessageCircle,
  Loader2,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await UserService.getCurrentUser();

        if (profile && profile.id) {
          setUserProfile(profile);
        } else {
          throw new Error("Dados do perfil inválidos");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(
          `Erro ao carregar dados do perfil: ${
            err instanceof Error ? err.message : "Erro desconhecido"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleShopeeConfig = () => {
    router.push("/profile/shopee-config");
  };

  const handleChangePassword = () => {
    router.push("/profile/change-password");
  };

  const handleWhatsAppConfig = () => {
    router.push("/profile/whatsapp");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para acessar esta página.
            </p>
            <Button onClick={() => router.push("/login")}>Fazer Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
          <AlertTitle>Falha ao carregar perfil</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {userProfile?.name?.charAt(0).toUpperCase() ||
                user?.username?.charAt(0).toUpperCase() ||
                "U"}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Meu Perfil</h1>
              <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
              {userProfile?.email && <p className="mt-1 text-sm text-muted-foreground">{userProfile.email}</p>}
            </div>
          </div>
          <Button onClick={handleEditProfile} className="inline-flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar Perfil
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{userProfile?.name || "Não informado"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{userProfile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{userProfile?.phone || "Não informado"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Instagram</p>
                <p className="font-medium">{userProfile?.instagram || "Não informado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              Configuração Shopee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Shopee ID</p>
                {userProfile?.shoppeId ? (
                  <Badge variant="outline" className="border-emerald-500/60 text-emerald-300">
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-rose-500/60 text-rose-300">
                    Não configurado
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Senha da API</p>
                {userProfile?.shoppeApiPassword ? (
                  <Badge variant="outline" className="border-emerald-500/60 text-emerald-300">
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-rose-500/60 text-rose-300">
                    Não configurado
                  </Badge>
                )}
              </div>
            </div>

            <Button onClick={handleShopeeConfig} className="w-full bg-orange-600 text-white hover:bg-orange-700">
              Configurar Shopee
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
              Configuração WhatsApp
            </CardTitle>
            <CardDescription>Configure contas, grupos e disparos automáticos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Integração</p>
                <Badge variant="outline" className="border-emerald-500/60 text-emerald-300">
                  Disponível
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">Configure contas, grupos e disparos automáticos.</p>
              </div>
            </div>

            <Button onClick={handleWhatsAppConfig} className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
              Configurar WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleChangePassword} variant="outline" className="inline-flex items-center gap-2">
            <Key className="h-4 w-4" />
            Alterar Senha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
