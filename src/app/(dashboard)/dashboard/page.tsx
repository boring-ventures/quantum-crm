import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

// Forzar renderizado dinámico para evitar errores con cookies()
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Obtener cookies primero, antes de cualquier operación asíncrona
  const cookieStore = cookies();

  // Luego crear el cliente y hacer operaciones asíncronas
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <DashboardContent />
    </div>
  );
}
