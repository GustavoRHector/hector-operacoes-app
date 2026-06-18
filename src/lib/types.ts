export type UserRole = "admin" | "manager" | "member";

// Perfil com e-mail do auth, usado apenas na tela de gestão de usuários (admin).
export type ProfileWithEmail = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
};

export type TaskStatus = "todo" | "doing" | "waiting" | "done";

export type RecurringStatus = "ok" | "due_soon" | "expired" | "renewing" | "renewed";

export type Profile = {
  id: string;
  company_id: string;
  full_name: string;
  role: UserRole;
};

export type Unit = {
  id: string;
  name: string;
  city: string | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  assignee_name: string | null;
};

export type RecurringPending = {
  id: string;
  title: string;
  category: string;
  status: RecurringStatus;
  due_date: string;
  unit_name: string;
  responsible_name: string | null;
  checklist_total: number;
  checklist_done: number;
};

export type ChecklistItem = {
  id: string;
  label: string;
  is_done: boolean;
  done_at: string | null;
  position: number;
};

export type RecurringPendingDetail = RecurringPending & {
  document_number: string | null;
  issued_at: string | null;
  checklist_items: ChecklistItem[];
};

// Campos crus de uma pendência recorrente para o formulário de edição.
// status aqui é o valor gravado no banco, não o status calculado na leitura.
export type RecurringPendingEditData = {
  id: string;
  title: string;
  category: string;
  document_number: string | null;
  issued_at: string | null;
  due_date: string;
  unit_id: string | null;
  responsible_id: string | null;
  status: RecurringStatus;
};

export type ProcessItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  due_date: string | null;
  responsible_name: string | null;
  notes: string | null;
};

// Campos crus de uma tarefa para preencher o formulário de edição.
export type TaskEditData = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  assignee_id: string | null;
};

// Campos crus de um processo para preencher o formulário de edição.
export type ProcessEditData = {
  id: string;
  title: string;
  category: string;
  status: string;
  due_date: string | null;
  responsible_id: string | null;
  notes: string | null;
};

// Cor visual do evento no app (não sincroniza com o Google).
// green = leve, yellow = médio, red = alta; neutral = sem prioridade definida.
export type EventColor = "neutral" | "green" | "yellow" | "red";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  event_type: string;
  responsible_name: string | null;
  responsible_id: string | null;
  created_by: string | null;
  color: EventColor;
};

// Campos crus de um compromisso para preencher o formulário de edição.
export type CalendarEventEditData = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  event_type: string;
  responsible_id: string | null;
  created_by: string | null;
  google_event_id: string | null;
  color: EventColor;
};
