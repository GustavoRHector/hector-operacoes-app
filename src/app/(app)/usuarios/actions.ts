"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canManageSettings } from "@/lib/security";
import type { UserRole } from "@/lib/types";

const ALLOWED_ROLES: UserRole[] = ["admin", "manager", "member"];

function getStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") redirect("/usuarios?error=dados");
  return v.trim();
}

function getUuid(formData: FormData, key: string): string {
  const v = getStr(formData, key);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    redirect("/usuarios?error=dados");
  }
  return v;
}

// Envia convite por e-mail e cria o perfil na empresa do admin logado.
export async function inviteUserAction(formData: FormData) {
  const profile = await requireProfile();
  if (!canManageSettings(profile.role)) redirect("/usuarios?error=permissao");

  const email = getStr(formData, "email");
  const full_name = getStr(formData, "full_name");
  const role = getStr(formData, "role") as UserRole;

  if (!ALLOWED_ROLES.includes(role)) redirect("/usuarios?error=dados");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/usuarios?error=email");

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email);
  if (error || !data.user) redirect("/usuarios?error=convite");

  const supabase = await createClient();
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    company_id: profile.company_id,
    full_name,
    role
  });

  if (profileError) {
    // Reverte o auth user criado se o perfil falhou para não deixar usuário órfão.
    await adminClient.auth.admin.deleteUser(data.user.id);
    redirect("/usuarios?error=salvar");
  }

  revalidatePath("/usuarios");
  redirect("/usuarios?ok=convidado");
}

// Altera o papel de outro usuário da mesma empresa; admin não pode alterar a si mesmo.
export async function updateRoleAction(formData: FormData) {
  const profile = await requireProfile();
  if (!canManageSettings(profile.role)) redirect("/usuarios?error=permissao");

  const targetId = getUuid(formData, "user_id");
  const role = getStr(formData, "role") as UserRole;

  if (!ALLOWED_ROLES.includes(role)) redirect("/usuarios?error=dados");
  if (targetId === profile.id) redirect("/usuarios?error=autopromocao");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", targetId);

  if (error) redirect("/usuarios?error=salvar");

  revalidatePath("/usuarios");
  redirect("/usuarios?ok=papel");
}

// Remove o usuário do auth (cascateia exclusão do perfil via FK ON DELETE CASCADE).
export async function removeUserAction(formData: FormData) {
  const profile = await requireProfile();
  if (!canManageSettings(profile.role)) redirect("/usuarios?error=permissao");

  const targetId = getUuid(formData, "user_id");
  if (targetId === profile.id) redirect("/usuarios?error=autoremocao");

  // Verifica via RLS que o alvo pertence à mesma empresa antes de usar o admin client.
  const supabase = await createClient();
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetId)
    .single();
  if (!targetProfile) redirect("/usuarios?error=dados");

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(targetId);

  if (error) redirect("/usuarios?error=remover");

  revalidatePath("/usuarios");
  redirect("/usuarios?ok=removido");
}
