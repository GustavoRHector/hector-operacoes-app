import { deleteTaskAction, updateTaskAction } from "@/app/(app)/tarefas/actions";
import type { TaskEditData } from "@/lib/types";

type Option = {
  id: string;
  full_name: string;
};

// Formulário de edição de tarefa com gravação e exclusão validadas no servidor.
export function TaskEditForm({ task, profiles }: { task: TaskEditData; profiles: Option[] }) {
  return (
    <div className="space-y-4">
      <form action={updateTaskAction} className="glass-card p-4">
        {/* Identifica a tarefa a alterar; a empresa nunca vem do formulário. */}
        <input type="hidden" name="task_id" value={task.id} />

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">Título da tarefa</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="title"
              defaultValue={task.title}
              maxLength={120}
              required
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">Descrição</span>
            <textarea
              className="min-h-24 w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="description"
              defaultValue={task.description ?? ""}
              maxLength={2000}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Status</span>
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="status"
              defaultValue={task.status}
            >
              <option value="todo">A fazer</option>
              <option value="doing">Em andamento</option>
              <option value="waiting">Aguardando terceiro</option>
              <option value="done">Concluído</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Prioridade</span>
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="priority"
              defaultValue={task.priority}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Responsável</span>
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="assignee_id"
              defaultValue={task.assignee_id ?? ""}
            >
              <option value="">Sem responsável</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Prazo</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              name="due_date"
              type="date"
              defaultValue={task.due_date ?? ""}
            />
          </label>
        </div>

        <button className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium">
          Salvar alterações
        </button>
      </form>

      {/* Exclusão isolada em outro form para não enviar os demais campos. */}
      <form action={deleteTaskAction} className="rounded-lg border border-magic-red/40 bg-magic-red/10 p-4">
        <input type="hidden" name="task_id" value={task.id} />
        <p className="text-sm text-magic-red">Excluir remove a tarefa definitivamente.</p>
        <button className="mt-3 rounded-md border border-magic-red/50 px-4 py-2 text-sm font-medium text-magic-red transition hover:bg-magic-red/10">
          Excluir tarefa
        </button>
      </form>
    </div>
  );
}
