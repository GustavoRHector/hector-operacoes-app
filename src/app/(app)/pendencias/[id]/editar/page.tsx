import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RecurringEditForm } from "@/components/RecurringEditForm";
import { requireProfile } from "@/lib/auth";
import { getRecurringPendingForEdit, listProfiles, listUnits } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Tela de edição dos dados da pendência recorrente, restrita a perfis de gestão.
export default async function RecurringPendingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();

  // Defesa em profundidade: bloqueia o acesso antes mesmo de carregar dados.
  if (!canManageOperations(profile.role)) {
    redirect("/pendencias?error=permissao");
  }

  const [pending, profiles, units] = await Promise.all([
    getRecurringPendingForEdit(id),
    listProfiles(),
    listUnits()
  ]);

  if (!pending) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section>
        <Link className="text-sm font-medium text-moss hover:text-ink" href={`/pendencias/${pending.id}`}>
          Voltar para a pendência
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Editar pendência</h1>
        <p className="mt-2 text-sm text-moss">Atualize os dados ou exclua a pendência.</p>
      </section>

      <RecurringEditForm pending={pending} profiles={profiles} units={units} />
    </div>
  );
}
