"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/utils/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ReauthenticationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  reason?: "expired" | "forbidden" | "invalid";
  lastEmail?: string;
}

export function ReauthenticationModal({
  isOpen,
  onClose,
  reason = "expired",
  lastEmail = "",
}: ReauthenticationModalProps) {
  const [email, setEmail] = useState(lastEmail);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const router = useRouter();

  const getReasonMessage = () => {
    switch (reason) {
      case "expired":
        return {
          title: "Sesión Expirada",
          description: "Tu sesión ha expirado por seguridad. Por favor, vuelve a iniciar sesión para continuar.",
          icon: <RefreshCw className="h-5 w-5 text-amber-500" />,
        };
      case "forbidden":
        return {
          title: "Acceso Denegado",
          description: "No tienes permisos suficientes. Inicia sesión nuevamente o contacta al administrador.",
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        };
      case "invalid":
        return {
          title: "Sesión Inválida",
          description: "Hemos detectado un problema con tu sesión. Por favor, inicia sesión nuevamente.",
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        };
      default:
        return {
          title: "Reautenticación Requerida",
          description: "Por favor, inicia sesión para continuar.",
          icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
        };
    }
  };

  const handleReauth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await signIn(email, password);

      toast({
        title: "Reautenticación exitosa",
        description: "Has iniciado sesión correctamente. Continuando...",
      });

      // Cerrar modal y recargar la página para refrescar el estado
      if (onClose) onClose();
      router.refresh();

    } catch (error: any) {
      console.error("Error de reautenticación:", error);
      setError(
        error.message ||
        "Error al iniciar sesión. Verifica tus credenciales e intenta nuevamente."
      );

      toast({
        title: "Error de reautenticación",
        description: error.message || "No se pudo iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push("/sign-in");
  };

  const reasonMessage = getReasonMessage();

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" hideCloseButton>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            {reasonMessage.icon}
          </div>
          <DialogTitle className="text-xl">{reasonMessage.title}</DialogTitle>
          <DialogDescription className="text-center">
            {reasonMessage.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReauth} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoToLogin}
              disabled={isLoading}
              className="w-full"
            >
              Ir a Página de Inicio de Sesión
            </Button>
          </div>
        </form>

        <div className="text-center text-xs text-muted-foreground mt-4">
          Por tu seguridad, las sesiones expiran automáticamente después de un período de inactividad.
        </div>
      </DialogContent>
    </Dialog>
  );
}