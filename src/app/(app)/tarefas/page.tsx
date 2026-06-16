import { TaskCreateForm } from "@/components/TaskCreateForm";
import { TaskBoard } from "@/components/TaskBoard";
import { listProfiles, listTasks } from "@/lib/data";

// Exibe o quadro Kanban com tarefas filtradas pelas políticas do Supabase.
export default async function TasksPage() {
  const [tasks, profiles] = await Promise.all([listTasks(), listProfiles()]);

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium uppercase text-clay">Kanban operacional</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Tarefas</h1>
        <p className="mt-2 max-w-2xl text-sm text-moss">
          Primeira versão do quadro. A movimentação por arrastar será adicionada com ação segura no servidor.
        </p>
      </section>

      <TaskCreateForm profiles={profiles} />
      <TaskBoard tasks={tasks} />
    </div>
  );
}
