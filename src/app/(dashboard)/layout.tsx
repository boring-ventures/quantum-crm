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

<<<<<<< HEAD
    console.log("session", session);

    // Si no hay sesión o el usuario no tiene un rol asignado, mostrar pantalla de error
    // en lugar de redirigir para evitar bucles
    if (!session?.user?.roleId) {
      console.log("No hay sesión válida, mostrando error de autenticación");
      return <AuthError />;
    }

    // Si llegamos aquí, la sesión es válida
    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
  } catch (error) {
    console.error("Error al obtener sesión:", error);
    return <AuthError />;
=======
  if (!session) {
    redirect("/sign-in");
>>>>>>> parent of 2bfa236 (Merge pull request #4 from boring-ventures/users_section)
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
