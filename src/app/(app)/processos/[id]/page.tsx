import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProcessEditForm } from "@/components/ProcessEditForm";
import { requireProfile } from "@/lib/auth";
import { getProcessById, listProfiles } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Tela de edição de um processo, restrita a perfis com permissão de gestão.
export default async function ProcessEditPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();

  // Defesa em profundidade: bloqueia o acesso antes mesmo de carregar dados.
  if (!canManageOperations(profile.role)) {
    redirect("/processos?error=permissao");
  }

  const [process, profiles] = await Promise.all([getProcessById(params.id), listProfiles()]);

  if (!process) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section>
        <Link className="text-sm font-medium text-moss hover:text-ink" href="/processos">
          Voltar para processos
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Editar processo</h1>
        <p className="mt-2 text-sm text-moss">Atualize os dados ou exclua o processo.</p>
      </section>

      <ProcessEditForm process={process} profiles={profiles} />
    </div>
  );
}
