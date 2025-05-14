import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("session", session);

  // Si no hay sesión o el usuario no tiene un rol asignado, mostrar pantalla de error
  // en lugar de redirigir para evitar bucles
  if (!session?.user?.id) {
    console.log("No hay sesión válida, mostrando error de autenticación");
    return null;
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
