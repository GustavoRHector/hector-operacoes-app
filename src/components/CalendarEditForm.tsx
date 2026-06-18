import { deleteCalendarEventAction, updateCalendarEventAction } from "@/app/(app)/agenda/actions";
import type { CalendarEventEditData } from "@/lib/types";
import { toDateTimeLocalBR } from "@/lib/utils";

type ProfileOption = {
  id: string;
  full_name: string;
};

// Formulário de edição de compromisso com gravação validada no servidor.
// canManage indica se o usuário pode trocar o responsável e excluir o evento;
// criador e responsável editam os demais campos mesmo sem ser gestão.
export function CalendarEditForm({
  event,
  profiles,
  canManage
}: {
  event: CalendarEventEditData;
  profiles: ProfileOption[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-4">
      <form action={updateCalendarEventAction} className="glass-card p-4">
        {/* Identifica o compromisso a alterar; a empresa nunca vem do formulário. */}
        <input type="hidden" name="event_id" value={event.id} />

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Título</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
              name="title"
              defaultValue={event.title}
              maxLength={140}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Tipo</span>
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="event_type"
              defaultValue={event.event_type}
            >
              <option>Compromisso</option>
              <option>Reunião</option>
              <option>Prazo</option>
              <option>Renovação</option>
              <option>Visita</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Início</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              name="starts_at"
              type="datetime-local"
              defaultValue={toDateTimeLocalBR(event.starts_at)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Fim</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2"
              name="ends_at"
              type="datetime-local"
              defaultValue={toDateTimeLocalBR(event.ends_at)}
            />
          </label>

          {/* O responsável só aparece para gestão; o banco bloqueia que usuário
              comum altere esse vínculo, então não exibimos o campo para eles. */}
          {canManage ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Responsável</span>
              <select
                className="w-full glass-input rounded-md px-3 py-2"
                name="responsible_id"
                defaultValue={event.responsible_id ?? ""}
              >
                <option value="">Usuário atual</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Cor</span>
            <select
              className="w-full glass-input rounded-md px-3 py-2"
              name="color"
              defaultValue={event.color}
            >
              <option value="neutral">Neutro</option>
              <option value="green">Leve</option>
              <option value="yellow">Médio</option>
              <option value="red">Alta</option>
            </select>
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">Descrição</span>
            <textarea
              className="min-h-20 w-full glass-input rounded-md px-3 py-2"
              name="description"
              defaultValue={event.description ?? ""}
              maxLength={1200}
            />
          </label>
        </div>

        <button className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium">
          Salvar alterações
        </button>
      </form>

      {/* Exclusão restrita a gestão (admin/manager), conforme a RLS. */}
      {canManage ? (
        <form action={deleteCalendarEventAction} className="rounded-lg border border-magic-red/40 bg-magic-red/10 p-4">
          <input type="hidden" name="event_id" value={event.id} />
          <p className="text-sm text-magic-red">Excluir remove o compromisso definitivamente.</p>
          <button className="mt-3 rounded-md border border-magic-red/50 px-4 py-2 text-sm font-medium text-magic-red transition hover:bg-magic-red/10">
            Excluir compromisso
          </button>
        </form>
      ) : null}
    </div>
  );
}
