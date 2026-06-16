import { createProcessAction } from "@/app/(app)/processos/actions";

type ProfileOption = {
  id: string;
  full_name: string;
};

// Renderiza o formulário de processo com gravação validada no servidor.
export function ProcessCreateForm({ profiles }: { profiles: ProfileOption[] }) {
  return (
    <form action={createProcessAction} className="rounded-lg border border-moss/15 bg-white p-4 shadow-soft">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Nome do processo</span>
          <input
            className="w-full rounded-md border border-moss/20 px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="title"
            maxLength={140}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Categoria</span>
          <input
            className="w-full rounded-md border border-moss/20 px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="category"
            placeholder="Documentação, manutenção, contrato..."
            maxLength={80}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Status</span>
          <input
            className="w-full rounded-md border border-moss/20 px-3 py-2"
            name="status"
            defaultValue="Aberto"
            maxLength={60}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Responsável</span>
          <select className="w-full rounded-md border border-moss/20 px-3 py-2" name="responsible_id">
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
          <input className="w-full rounded-md border border-moss/20 px-3 py-2" name="due_date" type="date" />
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Observações</span>
          <textarea className="min-h-24 w-full rounded-md border border-moss/20 px-3 py-2" name="notes" maxLength={2000} />
        </label>
      </div>

      <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-linen transition hover:bg-moss">
        Criar processo
      </button>
    </form>
  );
}
