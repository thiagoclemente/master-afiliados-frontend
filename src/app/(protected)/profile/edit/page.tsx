"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services/user.service";
import { UserProfile, UserUpdateRequest } from "@/interfaces/user.interface";
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
  User,
  Mail,
  Phone,
  Instagram,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    instagram: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await UserService.getCurrentUser();
        setUserProfile(profile);
        setFormData({
          name: profile.name || "",
          phone: profile.phone || "",
          instagram: profile.instagram || "",
        });
      } catch (err) {
        console.error("Error fetching user profile for edit:", err);
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UserUpdateRequest = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        instagram: formData.instagram.trim() || undefined,
      };

      if (!userProfile?.id) {
        throw new Error("ID do usuário não encontrado");
      }

      await UserService.updateUser(updateData, userProfile.id);
      setSuccess("Perfil atualizado com sucesso!");

      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      setError("Erro ao atualizar perfil. Tente novamente.");
      console.error("Error updating profile:", err);
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle>Editar Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground/90">
                <User className="mr-2 inline h-4 w-4 text-primary" />
                Nome *
              </label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="h-11"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground/90">
                <Mail className="mr-2 inline h-4 w-4 text-primary" />
                E-mail
              </label>
              <Input type="email" id="email" value={userProfile?.email || ""} className="h-11 opacity-80" disabled />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-foreground/90">
                <Phone className="mr-2 inline h-4 w-4 text-primary" />
                Telefone
              </label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="h-11"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="instagram" className="text-sm font-medium text-foreground/90">
                <Instagram className="mr-2 inline h-4 w-4 text-pink-500" />
                Instagram
              </label>
              <Input
                type="text"
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                className="h-11"
                placeholder="@seuusuario"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
