import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TaskEditForm } from "@/components/TaskEditForm";
import { requireProfile } from "@/lib/auth";
import { getTaskById, listProfiles } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Tela de edição completa de tarefa, restrita a perfis de gestão.
// Usuário comum continua movendo o status pelos botões do quadro Kanban.
export default async function TaskEditPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();

  // Defesa em profundidade: bloqueia o acesso antes mesmo de carregar dados.
  if (!canManageOperations(profile.role)) {
    redirect("/tarefas?error=permissao");
  }

  const [task, profiles] = await Promise.all([getTaskById(params.id), listProfiles()]);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section>
        <Link className="text-sm font-medium text-moss hover:text-ink" href="/tarefas">
          Voltar para tarefas
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Editar tarefa</h1>
        <p className="mt-2 text-sm text-moss">Atualize os dados ou exclua a tarefa.</p>
      </section>

      <TaskEditForm task={task} profiles={profiles} />
    </div>
  );
}
