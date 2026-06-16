"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageOperations } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

// Cria uma unidade/casa usando a empresa do perfil autenticado.
export async function createUnitAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageOperations(profile.role)) {
    redirect("/unidades?error=permissao");
  }

  const supabase = await createClient();
  const name = getRequiredText(formData, "name", 120);
  const city = getOptionalText(formData, "city", 80);

  const { error } = await supabase.from("units").insert({
    company_id: profile.company_id,
    name,
    city
  });

  if (error) {
    redirect("/unidades?error=criar");
  }

  revalidatePath("/unidades");
  revalidatePath("/pendencias");
  redirect("/unidades?created=1");
}

// Lê texto obrigatório com limite de tamanho.
function getRequiredText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value || value.length > maxLength) {
    redirect("/unidades?error=campos");
  }

  return value;
}

// Lê texto opcional com limite de tamanho.
function getOptionalText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value) return null;
  if (value.length > maxLength) redirect("/unidades?error=campos");

  return value;
}
