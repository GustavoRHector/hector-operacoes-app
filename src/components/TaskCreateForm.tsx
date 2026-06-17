import { createTaskAction } from "@/app/(app)/tarefas/actions";

type Option = {
  id: string;
  full_name: string;
};

// Renderiza o formulário de criação de tarefa usando action segura no servidor.
export function TaskCreateForm({ profiles }: { profiles: Option[] }) {
  return (
    <form action={createTaskAction} className="glass-card p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Título da tarefa</span>
          <input
            className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="title"
            maxLength={120}
            required
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Descrição</span>
          <textarea
            className="min-h-24 w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="description"
            maxLength={2000}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Status</span>
          <select className="w-full glass-input rounded-md px-3 py-2" name="status" defaultValue="todo">
            <option value="todo">A fazer</option>
            <option value="doing">Em andamento</option>
            <option value="waiting">Aguardando terceiro</option>
            <option value="done">Concluído</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Prioridade</span>
          <select className="w-full glass-input rounded-md px-3 py-2" name="priority" defaultValue="medium">
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Responsável</span>
          <select className="w-full glass-input rounded-md px-3 py-2" name="assignee_id">
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
          <input className="w-full glass-input rounded-md px-3 py-2" name="due_date" type="date" />
        </label>
      </div>

      <button className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium">
        Criar tarefa
      </button>
    </form>
  );
}
