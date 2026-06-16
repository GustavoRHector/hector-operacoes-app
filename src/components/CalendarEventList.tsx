import Link from "next/link";
import type { CalendarEvent } from "@/lib/types";

// Exibe compromissos da agenda em ordem cronológica.
// O link de edição aparece para gestão, criador ou responsável de cada evento
// (a permissão real é sempre reavaliada no servidor).
export function CalendarEventList({
  events,
  currentUserId,
  canManage = false
}: {
  events: CalendarEvent[];
  currentUserId?: string;
  canManage?: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-moss/25 bg-white p-6 text-sm text-moss">
        Nenhum compromisso cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <article className="rounded-lg border border-moss/15 bg-white p-4 shadow-soft" key={event.id}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-clay">{event.event_type}</span>
              <h2 className="mt-1 text-lg font-semibold text-ink">{event.title}</h2>
              <p className="mt-1 text-sm text-moss">
                Responsável: {event.responsible_name ?? "Sem responsável"}
              </p>
            </div>
            <div className="text-left text-sm md:text-right">
              <p className="font-semibold text-ink">{formatDateTime(event.starts_at)}</p>
              {event.ends_at ? <p className="text-moss">até {formatDateTime(event.ends_at)}</p> : null}
              {canManage || event.created_by === currentUserId || event.responsible_id === currentUserId ? (
                <Link
                  className="mt-2 inline-block text-sm font-medium text-clay hover:text-ink"
                  href={`/agenda/${event.id}`}
                >
                  Editar
                </Link>
              ) : null}
            </div>
          </div>

          {event.description ? <p className="mt-3 line-clamp-3 text-sm text-moss">{event.description}</p> : null}
        </article>
      ))}
    </div>
  );
}

// Formata data e hora para leitura rápida da equipe.
function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(date));
}
