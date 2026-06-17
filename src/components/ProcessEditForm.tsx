import { deleteProcessAction, updateProcessAction } from "@/app/(app)/processos/actions";
import type { ProcessEditData } from "@/lib/types";

type ProfileOption = {
  id: string;
  full_name: string;
};

// Formulário de edição de processo com gravação e exclusão validadas no servidor.
export function ProcessEditForm({
  process,
  profiles
}: {
  process: ProcessEditData;
  profiles: ProfileOption[];
}) {
  return (
    <div className="space-y-4">
      <form action={updateProcessAction} className="glass-card p-4">
        {/* Identifica o processo a alterar; a empresa nunca vem do formulário. */}
        <input type="hidden" name="process_id" value={process.id} />

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Nome do processo</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="title"
              defaultValue={process.title}
              maxLength={140}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Categoria</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="category"
              defaultValue={process.category}
              maxLength={80}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Status</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              name="status"
              defaultValue={process.status}
              maxLength={60}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Responsável</span>
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="responsible_id"
              defaultValue={process.responsible_id ?? ""}
            >
              <option value="">Usuário atual</option>
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
              defaultValue={process.due_date ?? ""}
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">Observações</span>
            <textarea
              className="min-h-24 w-full glass-input rounded-md px-3 py-2"
              name="notes"
              defaultValue={process.notes ?? ""}
              maxLength={2000}
            />
          </label>
        </div>

        <button className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium">
          Salvar alterações
        </button>
      </form>

      {/* Exclusão isolada em outro form para não enviar os demais campos. */}
      <form action={deleteProcessAction} className="rounded-lg border border-magic-red/40 bg-magic-red/10 p-4">
        <input type="hidden" name="process_id" value={process.id} />
        <p className="text-sm text-magic-red">Excluir remove o processo definitivamente.</p>
        <button className="mt-3 rounded-md border border-magic-red/50 px-4 py-2 text-sm font-medium text-magic-red transition hover:bg-magic-red/10">
          Excluir processo
        </button>
      </form>
    </div>
  );
}
