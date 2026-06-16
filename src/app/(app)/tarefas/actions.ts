"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageOperations } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

const allowedStatuses: TaskStatus[] = ["todo", "doing", "waiting", "done"];
const allowedPriorities = ["low", "medium", "high"] as const;

// Cria tarefa no servidor usando a empresa do perfil autenticado, nunca do formulário.
export async function createTaskAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const title = getRequiredText(formData, "title", 120);
  const description = getOptionalText(formData, "description", 2000);
  const status = getAllowedValue(formData, "status", allowedStatuses, "todo");
  const priority = getAllowedValue(formData, "priority", allowedPriorities, "medium");
  const dueDate = getOptionalDate(formData, "due_date");
  const assigneeId = getOptionalUuid(formData, "assignee_id");

  const { error } = await supabase.from("tasks").insert({
    company_id: profile.company_id,
    title,
    description,
    status,
    priority,
    due_date: dueDate,
    assignee_id: assigneeId,
    created_by: profile.id
  });

  if (error) {
    redirect("/tarefas?error=criar");
  }

  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
  redirect("/tarefas?created=1");
}

// Atualiza o status de uma tarefa respeitando as políticas RLS do Supabase.
export async function updateTaskStatusAction(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const taskId = getRequiredUuid(formData, "task_id");
  const status = getAllowedValue(formData, "status", allowedStatuses, "todo");

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) {
    redirect("/tarefas?error=atualizar");
  }

  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
  redirect("/tarefas?updated=1");
}

// Atualiza todos os campos de uma tarefa. Restrito a admin/manager, pois o
// trigger validate_task_update_scope do banco já impede usuário comum de
// alterar campos sensíveis; a edição completa fica concentrada na gestão.
export async function updateTaskAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageOperations(profile.role)) {
    redirect("/tarefas?error=permissao");
  }

  const supabase = await createClient();
  const taskId = getRequiredUuid(formData, "task_id");
  const title = getRequiredText(formData, "title", 120);
  const description = getOptionalText(formData, "description", 2000);
  const status = getAllowedValue(formData, "status", allowedStatuses, "todo");
  const priority = getAllowedValue(formData, "priority", allowedPriorities, "medium");
  const dueDate = getOptionalDate(formData, "due_date");
  const assigneeId = getOptionalUuid(formData, "assignee_id");

  const { error } = await supabase
    .from("tasks")
    .update({ title, description, status, priority, due_date: dueDate, assignee_id: assigneeId })
    .eq("id", taskId);

  if (error) {
    redirect(`/tarefas/${taskId}?error=salvar`);
  }

  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
  redirect("/tarefas?updated=1");
}

// Exclui uma tarefa. A política tasks_delete_manager_only restringe ao banco.
export async function deleteTaskAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageOperations(profile.role)) {
    redirect("/tarefas?error=permissao");
  }

  const supabase = await createClient();
  const taskId = getRequiredUuid(formData, "task_id");

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    redirect(`/tarefas/${taskId}?error=excluir`);
  }

  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
  redirect("/tarefas?deleted=1");
}

// Lê texto obrigatório e limita tamanho para evitar dados inesperados.
function getRequiredText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value || value.length > maxLength) {
    redirect("/tarefas?error=campos");
  }

  return value;
}

// Lê texto opcional e retorna null quando o campo está vazio.
function getOptionalText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value) return null;
  if (value.length > maxLength) redirect("/tarefas?error=campos");

  return value;
}

// Aceita apenas valores previstos pelo sistema para status e prioridade.
function getAllowedValue<T extends string>(
  formData: FormData,
  field: string,
  allowedValues: readonly T[],
  fallback: T
) {
  const value = String(formData.get(field) ?? "");
  return allowedValues.includes(value as T) ? (value as T) : fallback;
}

// Valida data simples no formato enviado pelo input date.
function getOptionalDate(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

// Aceita UUID opcional para responsáveis sem confiar em texto livre.
function getOptionalUuid(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value) ? value : null;
}

// Exige UUID válido para alterações em registros existentes.
function getRequiredUuid(formData: FormData, field: string) {
  const value = getOptionalUuid(formData, field);

  if (!value) {
    redirect("/tarefas?error=campos");
  }

  return value;
}
