import { AlertTriangle, CalendarClock, CheckCircle2, FolderKanban, ListTodo } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { RecurringList } from "@/components/RecurringList";
import { listProcesses, listRecurringPendings, listTasks, listUpcomingCalendarEvents } from "@/lib/data";

// Carrega os principais indicadores operacionais da empresa autenticada.
export default async function DashboardPage() {
  const [tasks, pendings, processes, upcomingEvents] = await Promise.all([
    listTasks(),
    listRecurringPendings(),
    listProcesses(),
    listUpcomingCalendarEvents()
  ]);
  const openTasks = tasks.filter((task) => task.status !== "done");
  const expiredPendings = pendings.filter((item) => item.status === "expired");
  const dueSoonPendings = pendings.filter((item) => item.status === "due_soon");

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium uppercase text-clay">Central de comando</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Agenda, processos e pendências</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ListTodo} label="Tarefas abertas" value={openTasks.length} />
        <StatCard icon={FolderKanban} label="Processos ativos" value={processes.length} />
        <StatCard icon={CalendarClock} label="Compromissos futuros" value={upcomingEvents.length} tone="warning" />
        <StatCard icon={AlertTriangle} label="Pendências vencidas" value={expiredPendings.length} tone="danger" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard icon={CheckCircle2} label="Tarefas concluídas" value={tasks.length - openTasks.length} />
        <StatCard icon={CalendarClock} label="Vencimentos próximos" value={dueSoonPendings.length} tone="warning" />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Pendências críticas</h2>
            <p className="text-sm text-moss">Itens com vencimento próximo ou já vencidos.</p>
          </div>
        </div>
        <RecurringList items={[...expiredPendings, ...dueSoonPendings].slice(0, 5)} />
      </section>
    </div>
  );
}
