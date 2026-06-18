"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getCalendarEventById } from "@/lib/data";
import {
  createGoogleEvent,
  deleteGoogleEvent,
  getGoogleAccount,
  moveGoogleEvent,
  updateGoogleEvent
} from "@/lib/google";
import { canManageOperations } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { toDateKeyBR } from "@/lib/utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const allowedEventTypes = ["Compromisso", "Reunião", "Prazo", "Renovação", "Visita"] as const;
const allowedColors = ["neutral", "green", "yellow", "red"] as const;

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
  const color = getAllowedValue(formData, "color", allowedColors, "neutral");
  const responsibleId = getOptionalUuid(formData, "responsible_id") ?? profile.id;

  if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    redirect("/agenda?error=periodo");
  }

  // Insere o evento interno e recupera o id para mapear ao Google.
  const { data: inserted, error } = await supabase
    .from("calendar_events")
    .insert({
      company_id: profile.company_id,
      title,
      description,
      starts_at: startsAt,
      ends_at: endsAt,
      event_type: eventType,
      color,
      responsible_id: responsibleId,
      created_by: profile.id
    })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect("/agenda?error=criar");
  }

  // Espelha no Google Calendar do criador, se ele tiver conta conectada.
  // Falha no Google não impede o evento interno: o app continua sendo a fonte.
  const account = await getGoogleAccount(profile.id);
  if (account) {
    // Sem hora de término, assume 1 hora de duração para o Google.
    const endISO = endsAt ?? new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
    const googleId = await createGoogleEvent(profile.id, {
      title,
      description,
      startISO: startsAt,
      endISO
    });
    if (googleId) {
      await supabase.from("calendar_events").update({ google_event_id: googleId }).eq("id", inserted.id);
    }
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
  const color = getAllowedValue(formData, "color", allowedColors, "neutral");

  if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    redirect(`/agenda/${eventId}?error=periodo`);
  }

  // Monta o update mantendo o responsável atual quando quem edita não é gestão.
  const update: Record<string, unknown> = {
    title,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    event_type: eventType,
    color
  };
  if (isManager) {
    update.responsible_id = getOptionalUuid(formData, "responsible_id") ?? profile.id;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").update(update).eq("id", eventId);

  if (error) {
    redirect(`/agenda/${eventId}?error=salvar`);
  }

  // Espelha a edição no Google do usuário, se ele tiver conta conectada.
  // Se o evento ainda não existia no Google, cria e guarda o id; caso contrário, atualiza.
  const account = await getGoogleAccount(profile.id);
  if (account) {
    const endISO = endsAt ?? new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
    if (event.google_event_id) {
      await updateGoogleEvent(profile.id, event.google_event_id, {
        title,
        description,
        startISO: startsAt,
        endISO
      });
    } else {
      const googleId = await createGoogleEvent(profile.id, {
        title,
        description,
        startISO: startsAt,
        endISO
      });
      if (googleId) {
        await supabase.from("calendar_events").update({ google_event_id: googleId }).eq("id", eventId);
      }
    }
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

  // Busca o mapeamento com o Google antes de remover o registro interno.
  const event = await getCalendarEventById(eventId);

  const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);

  if (error) {
    redirect(`/agenda/${eventId}?error=excluir`);
  }

  // Espelha a exclusão no Google do usuário, se houver mapeamento e conta conectada.
  if (event?.google_event_id) {
    const account = await getGoogleAccount(profile.id);
    if (account) {
      await deleteGoogleEvent(profile.id, event.google_event_id);
    }
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  redirect("/agenda?deleted=1");
}

// Move um compromisso interno para outro dia (arrastar-e-soltar), mantendo a
// hora. Recebe a nova data como chave "YYYY-MM-DD". Respeita a mesma permissão
// da edição (gestão, criador ou responsável) e espelha no Google se mapeado.
export async function moveCalendarEventAction(eventId: string, newDateKey: string) {
  const profile = await requireProfile();

  if (!UUID_RE.test(eventId) || !/^\d{4}-\d{2}-\d{2}$/.test(newDateKey)) {
    return;
  }

  const event = await getCalendarEventById(eventId);
  if (!event) return;

  const isManager = canManageOperations(profile.role);
  const canEdit = isManager || event.created_by === profile.id || event.responsible_id === profile.id;
  if (!canEdit) return;

  // Calcula a diferença de dias entre a data atual (fuso SP) e a nova data.
  const oldKey = toDateKeyBR(event.starts_at);
  if (oldKey === newDateKey) return;

  const [oy, om, od] = oldKey.split("-").map(Number);
  const [ny, nm, nd] = newDateKey.split("-").map(Number);
  const deltaDays = Math.round((Date.UTC(ny, nm - 1, nd) - Date.UTC(oy, om - 1, od)) / 86_400_000);
  if (deltaDays === 0) return;

  // Brasil não tem horário de verão: somar dias x 24h preserva a hora local.
  const shift = deltaDays * 86_400_000;
  const newStart = new Date(new Date(event.starts_at).getTime() + shift).toISOString();
  const newEnd = event.ends_at ? new Date(new Date(event.ends_at).getTime() + shift).toISOString() : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_events")
    .update({ starts_at: newStart, ends_at: newEnd })
    .eq("id", eventId);
  if (error) return;

  // Espelha a nova data no Google, se houver mapeamento e conta conectada.
  if (event.google_event_id) {
    const account = await getGoogleAccount(profile.id);
    if (account) {
      const endISO = newEnd ?? new Date(new Date(newStart).getTime() + 60 * 60 * 1000).toISOString();
      await updateGoogleEvent(profile.id, event.google_event_id, {
        title: event.title,
        description: event.description,
        startISO: newStart,
        endISO
      });
    }
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
}

// Move (arrastando) um evento que vive só no Google para outro dia, mantendo a
// hora. Recebe os horários atuais (vindos da própria leitura do app) para calcular
// o deslocamento e aplica direto no Google.
export async function moveGoogleEventAction(
  googleEventId: string,
  newDateKey: string,
  currentStartISO: string,
  currentEndISO: string | null
) {
  const profile = await requireProfile();

  if (!/^[a-zA-Z0-9_]+$/.test(googleEventId) || !/^\d{4}-\d{2}-\d{2}$/.test(newDateKey)) {
    return;
  }
  const startMs = new Date(currentStartISO).getTime();
  if (Number.isNaN(startMs)) return;

  const oldKey = toDateKeyBR(currentStartISO);
  if (oldKey === newDateKey) return;

  const [oy, om, od] = oldKey.split("-").map(Number);
  const [ny, nm, nd] = newDateKey.split("-").map(Number);
  const deltaDays = Math.round((Date.UTC(ny, nm - 1, nd) - Date.UTC(oy, om - 1, od)) / 86_400_000);
  if (deltaDays === 0) return;

  const shift = deltaDays * 86_400_000;
  const newStart = new Date(startMs + shift).toISOString();
  const endMs = currentEndISO ? new Date(currentEndISO).getTime() : NaN;
  const newEnd = Number.isNaN(endMs)
    ? new Date(startMs + shift + 60 * 60 * 1000).toISOString()
    : new Date(endMs + shift).toISOString();

  await moveGoogleEvent(profile.id, googleEventId, newStart, newEnd);
  revalidatePath("/agenda");
}

// Edita, direto pelo app, um evento que vive no Google Calendar do usuário.
// Salva via API do Google (sem abrir aba) usando os tokens do próprio usuário.
export async function updateGoogleEventAction(formData: FormData) {
  const profile = await requireProfile();

  const googleEventId = String(formData.get("google_event_id") ?? "").trim();
  if (!/^[a-zA-Z0-9_]+$/.test(googleEventId)) {
    redirect("/agenda?google=erro");
  }

  const title = getRequiredText(formData, "title", 140);
  const description = getOptionalText(formData, "description", 1200);
  const startsAt = getRequiredDateTime(formData, "starts_at");
  const endsAtRaw = getOptionalDateTime(formData, "ends_at");
  // Sem hora de término informada, assume 1 hora de duração.
  const endsAt = endsAtRaw ?? new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();

  if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    redirect("/agenda?error=periodo");
  }

  const ok = await updateGoogleEvent(profile.id, googleEventId, {
    title,
    description,
    startISO: startsAt,
    endISO: endsAt
  });
  if (!ok) {
    redirect("/agenda?google=erro");
  }

  revalidatePath("/agenda");
  redirect("/agenda?google=atualizado");
}

// Exclui, pelo app, um evento que vive no Google Calendar do usuário.
export async function deleteGoogleEventAction(formData: FormData) {
  const profile = await requireProfile();

  const googleEventId = String(formData.get("google_event_id") ?? "").trim();
  if (!/^[a-zA-Z0-9_]+$/.test(googleEventId)) {
    redirect("/agenda?google=erro");
  }

  const ok = await deleteGoogleEvent(profile.id, googleEventId);
  if (!ok) {
    redirect("/agenda?google=erro");
  }

  revalidatePath("/agenda");
  redirect("/agenda?google=excluido");
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
