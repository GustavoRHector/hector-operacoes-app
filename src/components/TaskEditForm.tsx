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
      <form action={updateTaskAction} className="rounded-lg border border-moss/15 bg-white p-4 shadow-soft">
        {/* Identifica a tarefa a alterar; a empresa nunca vem do formulário. */}
        <input type="hidden" name="task_id" value={task.id} />

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">Título da tarefa</span>
            <input
              className="w-full rounded-md border border-moss/20 px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="title"
              defaultValue={task.title}
              maxLength={120}
              required
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">Descrição</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-moss/20 px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="description"
              defaultValue={task.description ?? ""}
              maxLength={2000}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Status</span>
            <select
              className="w-full rounded-md border border-moss/20 px-3 py-2"
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
              className="w-full rounded-md border border-moss/20 px-3 py-2"
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
              className="w-full rounded-md border border-moss/20 px-3 py-2"
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
              className="w-full rounded-md border border-moss/20 px-3 py-2"
              name="due_date"
              type="date"
              defaultValue={task.due_date ?? ""}
            />
          </label>
        </div>

        <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-linen transition hover:bg-moss">
          Salvar alterações
        </button>
      </form>

      {/* Exclusão isolada em outro form para não enviar os demais campos. */}
      <form action={deleteTaskAction} className="rounded-lg border border-red-200 bg-red-50 p-4">
        <input type="hidden" name="task_id" value={task.id} />
        <p className="text-sm text-red-700">Excluir remove a tarefa definitivamente.</p>
        <button className="mt-3 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100">
          Excluir tarefa
        </button>
      </form>
    </div>
  );
}
