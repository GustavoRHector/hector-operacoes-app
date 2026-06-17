import { createRecurringPendingAction } from "@/app/(app)/pendencias/actions";

type ProfileOption = {
  id: string;
  full_name: string;
};

type UnitOption = {
  id: string;
  name: string;
};

// Renderiza o cadastro de pendência recorrente com envio seguro para o servidor.
export function RecurringCreateForm({
  profiles,
  units
}: {
  profiles: ProfileOption[];
  units: UnitOption[];
}) {
  return (
    <form action={createRecurringPendingAction} className="glass-card p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Nome da pendência</span>
          <input
            className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="title"
            placeholder="Renovação do alvará"
            maxLength={140}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Categoria</span>
          <input
            className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="category"
            placeholder="Alvará"
            maxLength={80}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Unidade/Casa</span>
          <select className="w-full glass-input rounded-md px-3 py-2" name="unit_id">
            <option value="">Sem unidade</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Responsável</span>
          <select className="w-full glass-input rounded-md px-3 py-2" name="responsible_id">
            <option value="">Usuário atual</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Número do documento</span>
          <input
            className="w-full glass-input rounded-md px-3 py-2"
            name="document_number"
            maxLength={80}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Data de emissão</span>
          <input className="w-full glass-input rounded-md px-3 py-2" name="issued_at" type="date" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Data de vencimento</span>
          <input className="w-full glass-input rounded-md px-3 py-2" name="due_date" type="date" required />
        </label>
      </div>

      <button className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium">
        Criar pendência
      </button>
    </form>
  );
}
