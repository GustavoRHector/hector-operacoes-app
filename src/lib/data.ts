import { createClient } from "@/lib/supabase/server";
import type {
  CalendarEvent,
  CalendarEventEditData,
  ProcessEditData,
  ProcessItem,
  RecurringPending,
  RecurringPendingDetail,
  RecurringPendingEditData,
  Task,
  TaskEditData,
  Unit
} from "@/lib/types";

// Lista tarefas visíveis ao usuário; a proteção final fica nas políticas RLS.
export async function listTasks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, due_date, assignee:profiles(full_name)"
    )
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    return [] satisfies Task[];
  }

  return data.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    assignee_name: getRelationText(task.assignee, "full_name")
  })) satisfies Task[];
}

// Busca uma tarefa específica com campos crus para a tela de edição.
// O isolamento por empresa continua garantido pela política RLS de leitura.
export async function getTaskById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, status, priority, due_date, assignee_id")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data satisfies TaskEditData;
}

// Lista perfis da mesma empresa para seleção de responsáveis.
export async function listProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  if (error) {
    return [];
  }

  return data;
}

// Lista unidades/casas da empresa autenticada para vincular documentos.
export async function listUnits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("id, name, city")
    .order("name", { ascending: true });

  if (error) {
    return [] satisfies Unit[];
  }

  return data satisfies Unit[];
}

// Lista pendências recorrentes com progresso de checklist, sempre filtradas por RLS.
export async function listRecurringPendings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_pendings")
    .select(
      "id, title, category, status, due_date, unit:units(name), responsible:profiles(full_name), checklist_items(id, is_done)"
    )
    .order("due_date", { ascending: true });

  if (error) {
    return [] satisfies RecurringPending[];
  }

  return data.map((item) => {
    const checklist = item.checklist_items ?? [];

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      status: getComputedRecurringStatus(item.status, item.due_date),
      due_date: item.due_date,
      unit_name: getRelationText(item.unit, "name") ?? "Sem unidade",
      responsible_name: getRelationText(item.responsible, "full_name"),
      checklist_total: checklist.length,
      checklist_done: checklist.filter((check) => check.is_done).length
    };
  }) satisfies RecurringPending[];
}

// Busca uma pendência específica com checklist completo para tela de detalhe.
export async function getRecurringPendingById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_pendings")
    .select(
      "id, title, category, document_number, issued_at, status, due_date, unit:units(name), responsible:profiles(full_name), checklist_items(id, label, is_done, done_at, position)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const checklist = [...(data.checklist_items ?? [])].sort((a, b) => a.position - b.position);

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    document_number: data.document_number,
    issued_at: data.issued_at,
    status: getComputedRecurringStatus(data.status, data.due_date),
    due_date: data.due_date,
    unit_name: getRelationText(data.unit, "name") ?? "Sem unidade",
    responsible_name: getRelationText(data.responsible, "full_name"),
    checklist_total: checklist.length,
    checklist_done: checklist.filter((item) => item.is_done).length,
    checklist_items: checklist
  } satisfies RecurringPendingDetail;
}

// Busca uma pendência com campos crus (incluindo o status gravado) para edição.
// O isolamento por empresa continua garantido pela política RLS de leitura.
export async function getRecurringPendingForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_pendings")
    .select("id, title, category, document_number, issued_at, due_date, unit_id, responsible_id, status")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data satisfies RecurringPendingEditData;
}

// Calcula status de vencimento na leitura para manter alertas atualizados.
function getComputedRecurringStatus(storedStatus: RecurringPending["status"], dueDate: string) {
  if (storedStatus === "renewing" || storedStatus === "renewed") {
    return storedStatus;
  }

  const today = new Date();
  const due = new Date(`${dueDate}T00:00:00-03:00`);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  if (daysUntilDue < 0) return "expired";
  if (daysUntilDue <= 90) return "due_soon";
  return "ok";
}

// Lista processos internos da empresa autenticada.
export async function listProcesses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processes")
    .select("id, title, category, status, due_date, notes, responsible:profiles(full_name)")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    return [] satisfies ProcessItem[];
  }

  return data.map((process) => ({
    id: process.id,
    title: process.title,
    category: process.category,
    status: process.status,
    due_date: process.due_date,
    notes: process.notes,
    responsible_name: getRelationText(process.responsible, "full_name")
  })) satisfies ProcessItem[];
}

// Busca um processo específico com campos crus para a tela de edição.
// O isolamento por empresa continua garantido pela política RLS de leitura.
export async function getProcessById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processes")
    .select("id, title, category, status, due_date, responsible_id, notes")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data satisfies ProcessEditData;
}

// Lista compromissos da agenda da empresa autenticada.
export async function listCalendarEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, description, starts_at, ends_at, event_type, responsible_id, created_by, responsible:profiles(full_name)")
    .order("starts_at", { ascending: true });

  if (error) {
    return [] satisfies CalendarEvent[];
  }

  return data.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    event_type: event.event_type,
    responsible_name: getRelationText(event.responsible, "full_name"),
    responsible_id: event.responsible_id,
    created_by: event.created_by
  })) satisfies CalendarEvent[];
}

// Busca um compromisso específico com campos crus para a tela de edição.
// O isolamento por empresa continua garantido pela política RLS de leitura.
export async function getCalendarEventById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, description, starts_at, ends_at, event_type, responsible_id, created_by")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data satisfies CalendarEventEditData;
}

// Lista apenas compromissos futuros para indicadores do dashboard.
export async function listUpcomingCalendarEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, description, starts_at, ends_at, event_type, responsible_id, created_by, responsible:profiles(full_name)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    return [] satisfies CalendarEvent[];
  }

  return data.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    event_type: event.event_type,
    responsible_name: getRelationText(event.responsible, "full_name"),
    responsible_id: event.responsible_id,
    created_by: event.created_by
  })) satisfies CalendarEvent[];
}

// Extrai texto de relacionamento do Supabase quando ele vem como objeto ou lista.
function getRelationText(value: unknown, field: string) {
  const relation = Array.isArray(value) ? value[0] : value;

  if (!relation || typeof relation !== "object") {
    return null;
  }

  const text = (relation as Record<string, unknown>)[field];
  return typeof text === "string" && text.trim() ? text : null;
}
