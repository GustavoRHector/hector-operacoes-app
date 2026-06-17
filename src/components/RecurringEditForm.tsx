import { deleteRecurringPendingAction, updateRecurringPendingAction } from "@/app/(app)/pendencias/actions";
import type { RecurringPendingEditData } from "@/lib/types";

type ProfileOption = {
  id: string;
  full_name: string;
};

type UnitOption = {
  id: string;
  name: string;
};

const statusOptions: Array<{ value: RecurringPendingEditData["status"]; label: string }> = [
  { value: "ok", label: "Em dia" },
  { value: "due_soon", label: "Vence em breve" },
  { value: "expired", label: "Vencida" },
  { value: "renewing", label: "Em renovação" },
  { value: "renewed", label: "Renovada" }
];

// Formulário de edição de pendência recorrente com gravação validada no servidor.
export function RecurringEditForm({
  pending,
  profiles,
  units
}: {
  pending: RecurringPendingEditData;
  profiles: ProfileOption[];
  units: UnitOption[];
}) {
  return (
    <div className="space-y-4">
      <form action={updateRecurringPendingAction} className="glass-card p-4">
        {/* Identifica a pendência a alterar; a empresa nunca vem do formulário. */}
        <input type="hidden" name="pending_id" value={pending.id} />

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Nome da pendência</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="title"
              defaultValue={pending.title}
              maxLength={140}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Categoria</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="category"
              defaultValue={pending.category}
              maxLength={80}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Unidade/Casa</span>
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="unit_id"
              defaultValue={pending.unit_id ?? ""}
            >
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
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="responsible_id"
              defaultValue={pending.responsible_id ?? ""}
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
            <span className="mb-1 block text-sm font-medium text-ink">Situação</span>
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="status"
              defaultValue={pending.status}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Número do documento</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              name="document_number"
              defaultValue={pending.document_number ?? ""}
              maxLength={80}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Data de emissão</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              name="issued_at"
              type="date"
              defaultValue={pending.issued_at ?? ""}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Data de vencimento</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              name="due_date"
              type="date"
              defaultValue={pending.due_date}
              required
            />
          </label>
        </div>

        <button className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium">
          Salvar alterações
        </button>
      </form>

      {/* Exclusão isolada; remove a pendência e o checklist vinculado em cascata. */}
      <form action={deleteRecurringPendingAction} className="rounded-lg border border-magic-red/40 bg-magic-red/10 p-4">
        <input type="hidden" name="pending_id" value={pending.id} />
        <p className="text-sm text-magic-red">Excluir remove a pendência e seu checklist definitivamente.</p>
        <button className="mt-3 rounded-md border border-magic-red/50 px-4 py-2 text-sm font-medium text-magic-red transition hover:bg-magic-red/10">
          Excluir pendência
        </button>
      </form>
    </div>
  );
}
