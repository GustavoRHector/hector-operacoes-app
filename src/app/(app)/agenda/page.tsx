import { CalendarCreateForm } from "@/components/CalendarCreateForm";
import { CalendarEventList } from "@/components/CalendarEventList";
import { requireProfile } from "@/lib/auth";
import { listCalendarEvents, listProfiles } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Exibe agenda da empresa e permite criar compromissos protegidos por RLS.
export default async function AgendaPage() {
  const profile = await requireProfile();
  const [events, profiles] = await Promise.all([listCalendarEvents(), listProfiles()]);

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium uppercase text-clay">Calendário interno</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Agenda</h1>
        <p className="mt-2 max-w-2xl text-sm text-moss">
          Compromissos, reuniões, visitas e prazos importantes da operação.
        </p>
      </section>

      <CalendarCreateForm profiles={profiles} />
      <CalendarEventList
        events={events}
        currentUserId={profile.id}
        canManage={canManageOperations(profile.role)}
      />
    </div>
  );
}
