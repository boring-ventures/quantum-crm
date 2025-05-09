import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { UserAuthForm } from "@/components/auth/sign-in/components/user-auth-form";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Quantum CRM",
  description: "Inicia sesión en tu cuenta",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  // Obtener el mensaje según el motivo de redirección
  const reason = searchParams.reason;
  let alertMessage: { title: string; description: string } | null = null;

  if (reason === "deleted") {
    alertMessage = {
      title: "Cuenta eliminada",
      description: "Tu cuenta ha sido eliminada. Contacta al administrador.",
    };
  } else if (reason === "inactive") {
    alertMessage = {
      title: "Cuenta desactivada",
      description:
        "Tu cuenta ha sido desactivada temporalmente. Contacta al administrador.",
    };
  }

  return (
    <AuthLayout>
      <Card className="p-6">
        {alertMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{alertMessage.title}</AlertTitle>
            <AlertDescription>{alertMessage.description}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu correo y contraseña para acceder a tu cuenta.
          </p>
        </div>
        <UserAuthForm />
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
          Al iniciar sesión, aceptas nuestros{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Política de Privacidad
          </Link>
          .
        </p>
      </Card>
    </AuthLayout>
  );
}
