import { createCalendarEventAction } from "@/app/(app)/agenda/actions";

type ProfileOption = {
  id: string;
  full_name: string;
};

// Renderiza o cadastro de compromisso com action segura no servidor.
export function CalendarCreateForm({ profiles }: { profiles: ProfileOption[] }) {
  return (
    <form action={createCalendarEventAction} className="rounded-lg border border-moss/15 bg-white p-4 shadow-soft">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Título</span>
          <input
            className="w-full rounded-md border border-moss/20 px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="title"
            maxLength={140}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Tipo</span>
          <select className="w-full rounded-md border border-moss/20 px-3 py-2" name="event_type">
            <option>Compromisso</option>
            <option>Reunião</option>
            <option>Prazo</option>
            <option>Renovação</option>
            <option>Visita</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Início</span>
          <input className="w-full rounded-md border border-moss/20 px-3 py-2" name="starts_at" type="datetime-local" required />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Fim</span>
          <input className="w-full rounded-md border border-moss/20 px-3 py-2" name="ends_at" type="datetime-local" />
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

        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink">Descrição</span>
          <textarea className="min-h-20 w-full rounded-md border border-moss/20 px-3 py-2" name="description" maxLength={1200} />
        </label>
      </div>

      <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-linen transition hover:bg-moss">
        Criar compromisso
      </button>
    </form>
  );
}
