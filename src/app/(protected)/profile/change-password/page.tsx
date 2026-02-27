"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/services/user.service";
import { PasswordChangeRequest } from "@/interfaces/user.interface";
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
  Key,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    password: "",
    passwordConfirmation: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      setError("Senha atual é obrigatória");
      return false;
    }

    if (!formData.password.trim()) {
      setError("Nova senha é obrigatória");
      return false;
    }

    if (formData.password.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError("As senhas não coincidem");
      return false;
    }

    if (formData.currentPassword === formData.password) {
      setError("A nova senha deve ser diferente da senha atual");
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
      const passwordData: PasswordChangeRequest = {
        currentPassword: formData.currentPassword,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
      };

      await UserService.changePassword(passwordData);
      setSuccess("Senha alterada com sucesso!");

      setFormData({
        currentPassword: "",
        password: "",
        passwordConfirmation: "",
      });

      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erro ao alterar senha. Verifique se a senha atual está correta.";
      setError(errorMessage);
      console.error("Error changing password:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha de acesso</CardDescription>
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
              <label htmlFor="currentPassword" className="text-sm font-medium text-foreground/90">
                <Key className="mr-2 inline h-4 w-4 text-primary" />
                Senha Atual *
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="h-11 pr-10"
                  placeholder="Digite sua senha atual"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground/90">
                <Key className="mr-2 inline h-4 w-4 text-primary" />
                Nova Senha *
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="h-11 pr-10"
                  placeholder="Digite sua nova senha"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="passwordConfirmation" className="text-sm font-medium text-foreground/90">
                <Key className="mr-2 inline h-4 w-4 text-primary" />
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  value={formData.passwordConfirmation}
                  onChange={handleInputChange}
                  className="h-11 pr-10"
                  placeholder="Confirme sua nova senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dicas de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use uma senha forte com pelo menos 6 caracteres.</li>
            <li>• Combine letras maiúsculas, minúsculas, números e símbolos.</li>
            <li>• Evite usar informações pessoais óbvias.</li>
            <li>• Não compartilhe sua senha com outras pessoas.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
