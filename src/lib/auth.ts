import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Busca o usuário autenticado e força login quando a sessão não existe.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

// Carrega o perfil interno do usuário sem confiar em dados vindos do navegador.
export async function requireProfile(): Promise<Profile> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_id, full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    redirect("/login?error=perfil");
  }

  return data as Profile;
}
