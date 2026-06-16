"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/security";

// Autentica o usuário com e-mail e senha sem expor lógica sensível no cliente.
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = getSafeRedirectPath(String(formData.get("redirectTo") ?? ""));

  if (!email || !password) {
    redirect("/login?error=campos");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=credenciais");
  }

  redirect(redirectTo);
}

// Encerra a sessão atual no servidor e remove o acesso às rotas protegidas.
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
