import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarEditForm } from "@/components/CalendarEditForm";
import { requireProfile } from "@/lib/auth";
import { getCalendarEventById, listProfiles } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Tela de edição de compromisso. Pode editar quem é gestão, criador ou responsável.
export default async function CalendarEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const [event, profiles] = await Promise.all([getCalendarEventById(id), listProfiles()]);

  if (!event) {
    notFound();
  }

  const isManager = canManageOperations(profile.role);
  const canEdit = isManager || event.created_by === profile.id || event.responsible_id === profile.id;

  // Defesa em profundidade: bloqueia quem não pode editar antes de mostrar o formulário.
  if (!canEdit) {
    redirect("/agenda?error=permissao");
  }

  return (
    <div className="space-y-5">
      <section>
        <Link className="text-sm font-medium text-moss hover:text-ink" href="/agenda">
          Voltar para agenda
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Editar compromisso</h1>
        <p className="mt-2 text-sm text-moss">Atualize os dados do compromisso.</p>
      </section>

      <CalendarEditForm event={event} profiles={profiles} canManage={isManager} />
    </div>
  );
}
