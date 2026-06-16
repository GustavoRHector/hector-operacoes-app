import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleChecklistItemAction } from "@/app/(app)/pendencias/[id]/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { requireProfile } from "@/lib/auth";
import { getRecurringPendingById } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Exibe o detalhe da pendência recorrente e seu checklist de renovação.
export default async function RecurringPendingDetailPage({
  params
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const pending = await getRecurringPendingById(params.id);

  if (!pending) {
    notFound();
  }

  const canManage = canManageOperations(profile.role);

  return (
    <div className="space-y-5">
      <section>
        <div className="flex items-center justify-between gap-3">
          <Link className="text-sm font-medium text-moss hover:text-ink" href="/pendencias">
            Voltar para pendências
          </Link>
          {canManage ? (
            <Link
              className="text-sm font-medium text-clay hover:text-ink"
              href={`/pendencias/${pending.id}/editar`}
            >
              Editar dados
            </Link>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={pending.status} />
              <span className="text-xs font-semibold uppercase text-clay">{pending.category}</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink">{pending.title}</h1>
            <p className="mt-2 text-sm text-moss">
              {pending.unit_name} · Responsável: {pending.responsible_name ?? "Sem responsável"}
            </p>
          </div>
          <div className="rounded-lg border border-moss/15 bg-white p-4 text-sm shadow-soft">
            <p className="text-moss">Vencimento</p>
            <p className="font-semibold text-ink">{formatDate(pending.due_date)}</p>
            <p className="mt-2 text-moss">Documento</p>
            <p className="font-semibold text-ink">{pending.document_number ?? "Não informado"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-moss/15 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Checklist de renovação</h2>
            <p className="text-sm text-moss">
              {pending.checklist_done} de {pending.checklist_total} itens concluídos
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {pending.checklist_items.map((item) => (
            <form action={toggleChecklistItemAction} key={item.id}>
              <input name="item_id" type="hidden" value={item.id} />
              <input name="pending_id" type="hidden" value={pending.id} />
              <input name="is_done" type="hidden" value={String(item.is_done)} />
              <button
                className="flex w-full items-center gap-3 rounded-md border border-moss/10 px-3 py-3 text-left transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManage}
              >
                {item.is_done ? (
                  <CheckCircle2 className="text-green-700" size={20} />
                ) : (
                  <Circle className="text-moss" size={20} />
                )}
                <span className={item.is_done ? "text-moss line-through" : "text-ink"}>
                  {item.label}
                </span>
              </button>
            </form>
          ))}
        </div>

        {!canManage ? (
          <p className="mt-4 rounded-md bg-mist px-3 py-2 text-sm text-moss">
            Seu perfil pode visualizar o checklist, mas apenas administradores e gestores podem marcar itens.
          </p>
        ) : null}
      </section>
    </div>
  );
}

// Formata datas da pendência no padrão brasileiro.
function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(date));
}
