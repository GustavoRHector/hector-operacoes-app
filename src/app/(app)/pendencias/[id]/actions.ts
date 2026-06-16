"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageSettings } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

// Alterna um item de checklist quando o usuário tem permissão de gestão.
export async function toggleChecklistItemAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageSettings(profile.role)) {
    redirect("/pendencias?error=permissao");
  }

  const supabase = await createClient();
  const itemId = getRequiredUuid(formData, "item_id");
  const pendingId = getRequiredUuid(formData, "pending_id");
  const isDone = String(formData.get("is_done") ?? "") === "true";

  const { error } = await supabase
    .from("checklist_items")
    .update({
      is_done: !isDone,
      done_at: isDone ? null : new Date().toISOString()
    })
    .eq("id", itemId);

  if (error) {
    redirect(`/pendencias/${pendingId}?error=checklist`);
  }

  revalidatePath(`/pendencias/${pendingId}`);
  revalidatePath("/pendencias");
  revalidatePath("/dashboard");
  redirect(`/pendencias/${pendingId}?updated=1`);
}

// Valida UUID obrigatório antes de atualizar item de checklist.
function getRequiredUuid(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    redirect("/pendencias?error=campos");
  }

  return value;
}
