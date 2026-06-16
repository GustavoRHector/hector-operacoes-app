"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageOperations } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

// Cria processo interno somente para perfis com permissão de gestão.
export async function createProcessAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageOperations(profile.role)) {
    redirect("/processos?error=permissao");
  }

  const supabase = await createClient();
  const title = getRequiredText(formData, "title", 140);
  const category = getRequiredText(formData, "category", 80);
  const status = getOptionalText(formData, "status", 60) ?? "Aberto";
  const dueDate = getOptionalDate(formData, "due_date");
  const responsibleId = getOptionalUuid(formData, "responsible_id") ?? profile.id;
  const notes = getOptionalText(formData, "notes", 2000);

  const { error } = await supabase.from("processes").insert({
    company_id: profile.company_id,
    title,
    category,
    status,
    due_date: dueDate,
    responsible_id: responsibleId,
    notes
  });

  if (error) {
    redirect("/processos?error=criar");
  }

  revalidatePath("/processos");
  revalidatePath("/dashboard");
  redirect("/processos?created=1");
}

// Atualiza um processo existente. Só admin/manager passam pelo gate do app,
// e a política RLS processes_manage_same_company garante o isolamento por empresa.
export async function updateProcessAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageOperations(profile.role)) {
    redirect("/processos?error=permissao");
  }

  const supabase = await createClient();
  const processId = getRequiredUuid(formData, "process_id");
  const title = getRequiredText(formData, "title", 140);
  const category = getRequiredText(formData, "category", 80);
  const status = getOptionalText(formData, "status", 60) ?? "Aberto";
  const dueDate = getOptionalDate(formData, "due_date");
  const responsibleId = getOptionalUuid(formData, "responsible_id") ?? profile.id;
  const notes = getOptionalText(formData, "notes", 2000);

  const { error } = await supabase
    .from("processes")
    .update({ title, category, status, due_date: dueDate, responsible_id: responsibleId, notes })
    .eq("id", processId);

  if (error) {
    redirect(`/processos/${processId}?error=salvar`);
  }

  revalidatePath("/processos");
  revalidatePath("/dashboard");
  redirect("/processos?updated=1");
}

// Exclui um processo. Exclusão também restrita a admin/manager pelo gate e pela RLS.
export async function deleteProcessAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageOperations(profile.role)) {
    redirect("/processos?error=permissao");
  }

  const supabase = await createClient();
  const processId = getRequiredUuid(formData, "process_id");

  const { error } = await supabase.from("processes").delete().eq("id", processId);

  if (error) {
    redirect(`/processos/${processId}?error=excluir`);
  }

  revalidatePath("/processos");
  revalidatePath("/dashboard");
  redirect("/processos?deleted=1");
}

// Lê texto obrigatório com tamanho máximo definido.
function getRequiredText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value || value.length > maxLength) {
    redirect("/processos?error=campos");
  }

  return value;
}

// Lê texto opcional e rejeita conteúdo maior que o esperado.
function getOptionalText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value) return null;
  if (value.length > maxLength) redirect("/processos?error=campos");

  return value;
}

// Valida data opcional no padrão de input date.
function getOptionalDate(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

// Valida UUID opcional para vínculos internos.
function getOptionalUuid(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value) ? value : null;
}

// Exige UUID válido ao alterar ou excluir um processo existente.
function getRequiredUuid(formData: FormData, field: string) {
  const value = getOptionalUuid(formData, field);

  if (!value) {
    redirect("/processos?error=campos");
  }

  return value;
}
