import { ProcessCreateForm } from "@/components/ProcessCreateForm";
import { ProcessList } from "@/components/ProcessList";
import { requireProfile } from "@/lib/auth";
import { listProcesses, listProfiles } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Exibe processos internos e mostra cadastro apenas para quem pode gerenciar.
export default async function ProcessesPage() {
  const profile = await requireProfile();
  const [processes, profiles] = await Promise.all([listProcesses(), listProfiles()]);

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium uppercase text-clay">Fluxos internos</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Processos</h1>
        <p className="mt-2 max-w-2xl text-sm text-moss">
          Use esta área para acompanhar renovações, contratos, manutenções, treinamentos e rotinas com histórico.
        </p>
      </section>

      {canManageOperations(profile.role) ? <ProcessCreateForm profiles={profiles} /> : null}
      <ProcessList processes={processes} canManage={canManageOperations(profile.role)} />
    </div>
  );
}
