"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageSettings } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const defaultPermitChecklist = [
  "Conferir data de vencimento do alvará atual",
  "Separar documentos da unidade",
  "Validar exigências do órgão responsável",
  "Protocolar solicitação de renovação",
  "Acompanhar retorno e pendências externas",
  "Anexar comprovante do alvará renovado"
];

// Cria pendência recorrente com checklist inicial sem aceitar empresa vinda do formulário.
export async function createRecurringPendingAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!canManageSettings(profile.role)) {
    redirect("/pendencias?error=permissao");
  }

  const title = getRequiredText(formData, "title", 140);
  const category = getRequiredText(formData, "category", 80);
  const documentNumber = getOptionalText(formData, "document_number", 80);
  const issuedAt = getOptionalDate(formData, "issued_at");
  const dueDate = getRequiredDate(formData, "due_date");
  const unitId = getOptionalUuid(formData, "unit_id");
  const responsibleId = getOptionalUuid(formData, "responsible_id") ?? profile.id;

  const { data, error } = await supabase
    .from("recurring_pendings")
    .insert({
      company_id: profile.company_id,
      unit_id: unitId,
      title,
      category,
      document_number: documentNumber,
      issued_at: issuedAt,
      due_date: dueDate,
      status: getInitialStatus(dueDate),
      responsible_id: responsibleId
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/pendencias?error=criar");
  }

  await createDefaultChecklist(profile.company_id, data.id, category);

  revalidatePath("/pendencias");
  revalidatePath("/dashboard");
  redirect("/pendencias?created=1");
}

// Cria checklist padrão quando a categoria indica alvará ou licença.
async function createDefaultChecklist(companyId: string, recurringPendingId: string, category: string) {
  const normalizedCategory = category.toLowerCase();

  if (!normalizedCategory.includes("alvar") && !normalizedCategory.includes("licen")) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("checklist_items").insert(
    defaultPermitChecklist.map((label, index) => ({
      company_id: companyId,
      recurring_pending_id: recurringPendingId,
      label,
      position: index + 1
    }))
  );
}

// Calcula o status inicial conforme proximidade do vencimento.
function getInitialStatus(dueDate: string) {
  const today = new Date();
  const due = new Date(`${dueDate}T00:00:00`);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  if (daysUntilDue < 0) return "expired";
  if (daysUntilDue <= 90) return "due_soon";
  return "ok";
}

// Lê texto obrigatório com limite de tamanho.
function getRequiredText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value || value.length > maxLength) {
    redirect("/pendencias?error=campos");
  }

  return value;
}

// Lê texto opcional com limite de tamanho.
function getOptionalText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value) return null;
  if (value.length > maxLength) redirect("/pendencias?error=campos");

  return value;
}

// Valida data obrigatória no formato usado pelo input date.
function getRequiredDate(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    redirect("/pendencias?error=campos");
  }

  return value;
}

// Valida data opcional no formato usado pelo input date.
function getOptionalDate(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

// Aceita UUID opcional para vínculos internos e ignora valores inválidos.
function getOptionalUuid(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value) ? value : null;
}
