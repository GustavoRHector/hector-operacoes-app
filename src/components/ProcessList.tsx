import type { ProcessItem } from "@/lib/types";

// Exibe processos em cards resumidos para leitura rápida.
export function ProcessList({ processes }: { processes: ProcessItem[] }) {
  if (processes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-moss/25 bg-white p-6 text-sm text-moss">
        Nenhum processo cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {processes.map((process) => (
        <article className="rounded-lg border border-moss/15 bg-white p-4 shadow-soft" key={process.id}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-clay">{process.category}</span>
              <h2 className="mt-1 text-lg font-semibold text-ink">{process.title}</h2>
              <p className="mt-1 text-sm text-moss">
                Responsável: {process.responsible_name ?? "Sem responsável"}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-moss">Status</p>
              <p className="font-semibold text-ink">{process.status}</p>
              <p className="mt-1 text-sm text-moss">
                Prazo: {process.due_date ? formatDate(process.due_date) : "Sem prazo"}
              </p>
            </div>
          </div>

          {process.notes ? <p className="mt-3 line-clamp-3 text-sm text-moss">{process.notes}</p> : null}
        </article>
      ))}
    </div>
  );
}

// Formata datas de processo no padrão brasileiro.
function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(date));
}
