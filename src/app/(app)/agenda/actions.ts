"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const allowedEventTypes = ["Compromisso", "Reunião", "Prazo", "Renovação", "Visita"] as const;

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
