import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import type { RecurringPending } from "@/lib/types";

// Exibe pendências recorrentes com o progresso do checklist de renovação.
export function RecurringList({ items }: { items: RecurringPending[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const progress =
          item.checklist_total === 0
            ? 0
            : Math.round((item.checklist_done / item.checklist_total) * 100);

        return (
          <article className="glass-card p-4" key={item.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-xs font-semibold uppercase text-clay">{item.category}</span>
                </div>
                <h2 className="text-lg font-semibold text-ink">{item.title}</h2>
                <p className="mt-1 text-sm text-moss">
                  {item.unit_name} · Responsável: {item.responsible_name ?? "Sem responsável"}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm text-moss">Vencimento</p>
                <p className="font-semibold text-ink">{formatDate(item.due_date)}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs font-medium text-moss">
                <span>Checklist</span>
                <span>
                  {item.checklist_done}/{item.checklist_total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-mist">
                <div className="h-2 rounded-full bg-ambered" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <Link
              className="mt-4 btn-secondary inline-flex rounded-md px-3 py-2 text-sm font-medium"
              href={`/pendencias/${item.id}`}
            >
              Abrir checklist
            </Link>
          </article>
        );
      })}
    </div>
  );
}

// Formata a data de vencimento mantendo consistência visual no sistema.
function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(date));
}
