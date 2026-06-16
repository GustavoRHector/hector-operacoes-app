import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  ListTodo
} from "lucide-react";
import { CalendarEventList } from "@/components/CalendarEventList";
import { ProcessList } from "@/components/ProcessList";
import { RecurringList } from "@/components/RecurringList";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import type { CalendarEvent, ProcessItem, RecurringPending, Task } from "@/lib/types";

const demoTasks: Task[] = [
  {
    id: "demo-task-1",
    title: "Conferir documentos do alvará da Hector Pizzaria",
    description: "Validar documentos obrigatórios antes de abrir o protocolo de renovação.",
    status: "todo",
    priority: "high",
    due_date: "2026-07-05",
    assignee_name: "Mariana"
  },
  {
    id: "demo-task-2",
    title: "Acompanhar orçamento de manutenção da Ferrovia Secreta",
    description: "Cobrar retorno do fornecedor e registrar prazo de execução.",
    status: "doing",
    priority: "medium",
    due_date: "2026-06-22",
    assignee_name: "Carlos"
  },
  {
    id: "demo-task-3",
    title: "Aguardar retorno da contabilidade sobre documentação fiscal",
    description: "Conferir se todos os anexos foram enviados corretamente.",
    status: "waiting",
    priority: "medium",
    due_date: "2026-06-28",
    assignee_name: "Bianca"
  },
  {
    id: "demo-task-4",
    title: "Atualizar checklist de renovação de licenças",
    description: "Padronizar os itens para próximos vencimentos.",
    status: "done",
    priority: "low",
    due_date: "2026-06-12",
    assignee_name: "Mariana"
  }
];

const demoPendings: RecurringPending[] = [
  {
    id: "demo-pending-1",
    title: "Alvará de funcionamento",
    category: "Alvará",
    status: "due_soon",
    due_date: "2026-08-30",
    unit_name: "Hector Pizzaria",
    responsible_name: "Mariana",
    checklist_total: 6,
    checklist_done: 2
  },
  {
    id: "demo-pending-2",
    title: "Licença de operação",
    category: "Licença",
    status: "ok",
    due_date: "2026-12-15",
    unit_name: "Ferrovia Secreta",
    responsible_name: "Carlos",
    checklist_total: 5,
    checklist_done: 5
  }
];

const demoProcesses: ProcessItem[] = [
  {
    id: "demo-process-1",
    title: "Renovação de alvará da Hector Pizzaria",
    category: "Documentação",
    status: "Em andamento",
    due_date: "2026-08-30",
    responsible_name: "Mariana",
    notes: "Processo com documentos em conferência antes de protocolo."
  },
  {
    id: "demo-process-2",
    title: "Manutenção preventiva da Ferrovia Secreta",
    category: "Manutenção",
    status: "Aguardando fornecedor",
    due_date: "2026-07-10",
    responsible_name: "Carlos",
    notes: "Fornecedor deve enviar cronograma e custo final."
  }
];

const demoEvents: CalendarEvent[] = [
  {
    id: "demo-event-1",
    title: "Reunião de alinhamento de pendências",
    description: "Revisar vencimentos, responsáveis e próximos protocolos.",
    starts_at: "2026-06-18T10:00:00-03:00",
    ends_at: "2026-06-18T11:00:00-03:00",
    event_type: "Reunião",
    responsible_name: "Mariana"
  },
  {
    id: "demo-event-2",
    title: "Prazo para enviar documentos do alvará",
    description: "Data limite interna para reunir anexos obrigatórios.",
    starts_at: "2026-07-05T17:00:00-03:00",
    ends_at: null,
    event_type: "Prazo",
    responsible_name: "Bianca"
  }
];

const columns = [
  { id: "todo", label: "A fazer" },
  { id: "doing", label: "Em andamento" },
  { id: "waiting", label: "Aguardando terceiro" },
  { id: "done", label: "Concluído" }
] as const;

// Exibe uma simulação visual do sistema depois do login, sem acessar dados reais.
export default function DemoPage() {
  const openTasks = demoTasks.filter((task) => task.status !== "done");
  const dueSoonPendings = demoPendings.filter((pending) => pending.status === "due_soon");

  return (
    <main className="min-h-screen bg-linen">
      <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-moss/15 bg-white md:inset-y-0 md:left-0 md:right-auto md:w-64 md:border-r md:border-t-0">
        <div className="hidden px-5 py-6 md:block">
          <p className="text-lg font-semibold text-ink">Hector Operações</p>
          <p className="mt-1 text-sm text-moss">Simulação visual</p>
        </div>

        <nav className="grid grid-cols-5 gap-1 p-2 md:block md:space-y-1 md:px-3">
          {[
            ["Dashboard", LayoutDashboard],
            ["Tarefas", ListTodo],
            ["Processos", FolderKanban],
            ["Pendências", ClipboardCheck],
            ["Agenda", CalendarClock]
          ].map(([label, Icon]) => (
            <a
              className="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-moss md:flex-row md:px-3 md:text-sm"
              href={`#${String(label).toLowerCase()}`}
              key={String(label)}
            >
              <Icon size={18} />
              {String(label)}
            </a>
          ))}
        </nav>
      </aside>

      <div className="pb-24 md:ml-64 md:pb-0">
        <header className="sticky top-0 z-10 border-b border-moss/15 bg-linen/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-moss">Bem-vindo(a)</p>
              <h1 className="text-xl font-semibold text-ink">Mariana - Gestora</h1>
            </div>
            <Link className="rounded-md border border-moss/20 bg-white px-3 py-2 text-sm font-medium text-ink" href="/login">
              Voltar ao login real
            </Link>
          </div>
        </header>

        <div className="space-y-8 px-4 py-6 md:px-8">
          <section id="dashboard">
            <p className="text-sm font-medium uppercase text-clay">Central de comando</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Visão geral da operação</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={ListTodo} label="Tarefas abertas" value={openTasks.length} />
              <StatCard icon={FolderKanban} label="Processos ativos" value={demoProcesses.length} />
              <StatCard icon={CalendarClock} label="Compromissos futuros" value={demoEvents.length} tone="warning" />
              <StatCard icon={AlertTriangle} label="Vencimentos próximos" value={dueSoonPendings.length} tone="danger" />
            </div>
          </section>

          <section id="tarefas">
            <h2 className="text-xl font-semibold text-ink">Tarefas estilo Trello</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {columns.map((column) => {
                const tasks = demoTasks.filter((task) => task.status === column.id);

                return (
                  <div className="rounded-lg border border-moss/15 bg-white p-3 shadow-soft" key={column.id}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-ink">{column.label}</h3>
                      <span className="rounded-full bg-mist px-2 py-1 text-xs font-semibold text-moss">
                        {tasks.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <article className="rounded-md border border-moss/10 bg-linen p-3" key={task.id}>
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <StatusBadge status={task.status} />
                            <span className="text-xs font-medium uppercase text-moss">{task.priority}</span>
                          </div>
                          <h4 className="font-semibold text-ink">{task.title}</h4>
                          <p className="mt-2 text-sm text-moss">{task.description}</p>
                          <p className="mt-3 text-xs text-moss">Responsável: {task.assignee_name}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="processos">
            <h2 className="mb-4 text-xl font-semibold text-ink">Processos internos</h2>
            <ProcessList processes={demoProcesses} />
          </section>

          <section id="pendências">
            <h2 className="mb-4 text-xl font-semibold text-ink">Pendências fixas</h2>
            <RecurringList items={demoPendings} />
          </section>

          <section id="agenda">
            <h2 className="mb-4 text-xl font-semibold text-ink">Agenda</h2>
            <CalendarEventList events={demoEvents} />
          </section>

          <section className="rounded-lg border border-ambered/30 bg-amber-50 p-4 text-sm text-amber-900">
            Esta é uma simulação com dados fictícios. O sistema real continua protegido por login e Supabase.
          </section>
        </div>
      </div>
    </main>
  );
}
