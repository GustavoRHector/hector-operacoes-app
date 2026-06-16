import { StatusBadge } from "@/components/StatusBadge";
import { updateTaskStatusAction } from "@/app/(app)/tarefas/actions";
import type { Task, TaskStatus } from "@/lib/types";

const columns: Array<{ id: TaskStatus; label: string }> = [
  { id: "todo", label: "A fazer" },
  { id: "doing", label: "Em andamento" },
  { id: "waiting", label: "Aguardando terceiro" },
  { id: "done", label: "Concluído" }
];

// Organiza tarefas em colunas no estilo Kanban sem alterar dados no navegador.
export function TaskBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id);

        return (
          <section className="rounded-lg border border-moss/15 bg-white p-3 shadow-soft" key={column.id}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">{column.label}</h2>
              <span className="rounded-full bg-mist px-2 py-1 text-xs font-semibold text-moss">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <article className="rounded-md border border-moss/10 bg-linen p-3" key={task.id}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <StatusBadge status={task.status} />
                    <span className="text-xs font-medium uppercase text-moss">{task.priority}</span>
                  </div>
                  <h3 className="font-semibold text-ink">{task.title}</h3>
                  {task.description ? (
                    <p className="mt-2 line-clamp-3 text-sm text-moss">{task.description}</p>
                  ) : null}
                  <div className="mt-4 text-xs text-moss">
                    <p>Responsável: {task.assignee_name ?? "Sem responsável"}</p>
                    <p>Prazo: {task.due_date ? formatDate(task.due_date) : "Sem prazo"}</p>
                  </div>

                  <form action={updateTaskStatusAction} className="mt-3 flex flex-wrap gap-2">
                    <input name="task_id" type="hidden" value={task.id} />
                    {columns
                      .filter((targetColumn) => targetColumn.id !== task.status)
                      .map((targetColumn) => (
                        <button
                          className="rounded-md border border-moss/20 bg-white px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-mist"
                          key={targetColumn.id}
                          name="status"
                          value={targetColumn.id}
                        >
                          {targetColumn.label}
                        </button>
                      ))}
                  </form>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Formata datas do banco para leitura brasileira.
function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(date));
}
