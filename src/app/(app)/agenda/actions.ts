"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getCalendarEventById } from "@/lib/data";
import { canManageOperations } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const allowedEventTypes = ["Compromisso", "Reunião", "Prazo", "Renovação", "Visita"] as const;

// Desconecta a conta Google do usuário, removendo os tokens guardados.
// A RLS garante que cada usuário só apaga o próprio registro.
export async function disconnectGoogleAction() {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("google_accounts").delete().eq("user_id", profile.id);
  revalidatePath("/agenda");
  redirect("/agenda?google=desconectado");
}

// Cria compromisso na agenda usando empresa e criador do perfil autenticado.
export async function createCalendarEventAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const title = getRequiredText(formData, "title", 140);
  const description = getOptionalText(formData, "description", 1200);
  const startsAt = getRequiredDateTime(formData, "starts_at");
  const endsAt = getOptionalDateTime(formData, "ends_at");
  const eventType = getAllowedValue(formData, "event_type", allowedEventTypes, "Compromisso");
  const responsibleId = getOptionalUuid(formData, "responsible_id") ?? profile.id;

  if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    redirect("/agenda?error=periodo");
  }

  const { error } = await supabase.from("calendar_events").insert({
    company_id: profile.company_id,
    title,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    event_type: eventType,
    responsible_id: responsibleId,
    created_by: profile.id
  });

  if (error) {
    redirect("/agenda?error=criar");
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  redirect("/agenda?created=1");
}

// Atualiza um compromisso. Pode editar: gestor, criador ou responsável.
// O campo responsável só é alterado por gestão (o trigger do banco bloqueia
// usuário comum de mexer em vínculos sensíveis); demais ainda contam com a RLS.
export async function updateCalendarEventAction(formData: FormData) {
  const profile = await requireProfile();
  const eventId = getRequiredUuid(formData, "event_id");

  const event = await getCalendarEventById(eventId);
  if (!event) {
    redirect("/agenda?error=salvar");
  }

  const isManager = canManageOperations(profile.role);
  const canEdit = isManager || event.created_by === profile.id || event.responsible_id === profile.id;
  if (!canEdit) {
    redirect("/agenda?error=permissao");
  }

  const title = getRequiredText(formData, "title", 140);
  const description = getOptionalText(formData, "description", 1200);
  const startsAt = getRequiredDateTime(formData, "starts_at");
  const endsAt = getOptionalDateTime(formData, "ends_at");
  const eventType = getAllowedValue(formData, "event_type", allowedEventTypes, "Compromisso");

  if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    redirect(`/agenda/${eventId}?error=periodo`);
  }

  // Monta o update mantendo o responsável atual quando quem edita não é gestão.
  const update: Record<string, unknown> = {
    title,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    event_type: eventType
  };
  if (isManager) {
    update.responsible_id = getOptionalUuid(formData, "responsible_id") ?? profile.id;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").update(update).eq("id", eventId);

  if (error) {
    redirect(`/agenda/${eventId}?error=salvar`);
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  redirect("/agenda?updated=1");
}

// Exclui um compromisso. A política calendar_events_delete_manager_only
// restringe a exclusão a admin/manager também no banco.
export async function deleteCalendarEventAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageOperations(profile.role)) {
    redirect("/agenda?error=permissao");
  }

  const supabase = await createClient();
  const eventId = getRequiredUuid(formData, "event_id");

  const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);

  if (error) {
    redirect(`/agenda/${eventId}?error=excluir`);
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  redirect("/agenda?deleted=1");
}

// Lê texto obrigatório e limita o tamanho aceito.
function getRequiredText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value || value.length > maxLength) {
    redirect("/agenda?error=campos");
  }

  return value;
}

// Lê texto opcional e rejeita excesso de conteúdo.
function getOptionalText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value) return null;
  if (value.length > maxLength) redirect("/agenda?error=campos");

  return value;
}

// Valida data e hora obrigatórias vindas de input datetime-local.
function getRequiredDateTime(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    redirect("/agenda?error=campos");
  }

  return parseBrazilDateTime(value);
}

// Valida data e hora opcionais vindas de input datetime-local.
function getOptionalDateTime(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    redirect("/agenda?error=campos");
  }

  return parseBrazilDateTime(value);
}

// Converte horário informado no Brasil para um valor claro de timestamptz.
function parseBrazilDateTime(value: string) {
  return `${value}:00-03:00`;
}

// Aceita apenas tipos de evento definidos pela aplicação.
function getAllowedValue<T extends string>(
  formData: FormData,
  field: string,
  allowedValues: readonly T[],
  fallback: T
) {
  const value = String(formData.get(field) ?? "");
  return allowedValues.includes(value as T) ? (value as T) : fallback;
}

// Valida UUID opcional para responsável da agenda.
function getOptionalUuid(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value) ? value : null;
}

// Exige UUID válido ao alterar ou excluir um compromisso existente.
function getRequiredUuid(formData: FormData, field: string) {
  const value = getOptionalUuid(formData, field);

  if (!value) {
    redirect("/agenda?error=campos");
  }

  return value;
}
