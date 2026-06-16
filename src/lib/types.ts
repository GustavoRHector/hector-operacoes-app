export type UserRole = "admin" | "manager" | "member";

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
};
