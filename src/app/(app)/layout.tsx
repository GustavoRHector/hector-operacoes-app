import { AppShell } from "@/components/AppShell";
import { requireProfile } from "@/lib/auth";

// Protege o grupo de páginas internas exigindo perfil autenticado.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
