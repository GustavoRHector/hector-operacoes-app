import { UnitCreateForm } from "@/components/UnitCreateForm";
import { UnitList } from "@/components/UnitList";
import { requireProfile } from "@/lib/auth";
import { listUnits } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Exibe casas/unidades e permite cadastro apenas para perfis de gestão.
export default async function UnitsPage() {
  const profile = await requireProfile();
  const units = await listUnits();

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium uppercase text-clay">Casas e unidades</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Casas</h1>
        <p className="mt-2 max-w-2xl text-sm text-moss">
          Cadastre as unidades que serão usadas em alvarás, licenças, processos e rotinas internas.
        </p>
      </section>

      {canManageOperations(profile.role) ? <UnitCreateForm /> : null}
      <UnitList units={units} />
    </div>
  );
}
