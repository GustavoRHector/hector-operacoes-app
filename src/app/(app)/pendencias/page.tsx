import { RecurringCreateForm } from "@/components/RecurringCreateForm";
import { RecurringList } from "@/components/RecurringList";
import { requireProfile } from "@/lib/auth";
import { listProfiles, listRecurringPendings, listUnits } from "@/lib/data";
import { canManageSettings } from "@/lib/security";

// Exibe pendências fixas e recorrentes com dados protegidos por empresa.
export default async function PendingsPage() {
  const profile = await requireProfile();
  const [pendings, profiles, units] = await Promise.all([
    listRecurringPendings(),
    listProfiles(),
    listUnits()
  ]);

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium uppercase text-clay">Controle recorrente</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Pendências fixas</h1>
        <p className="mt-2 max-w-2xl text-sm text-moss">
          Alvarás, licenças, contratos, seguros e documentos com prazo precisam nascer com checklist,
          responsável e alerta de vencimento.
        </p>
      </section>

      {canManageSettings(profile.role) ? <RecurringCreateForm profiles={profiles} units={units} /> : null}
      <RecurringList items={pendings} />
    </div>
  );
}
