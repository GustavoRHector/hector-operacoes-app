import { CalendarCreateForm } from "@/components/CalendarCreateForm";
import { CalendarEventList } from "@/components/CalendarEventList";
import { CalendarMonth } from "@/components/CalendarMonth";
import { requireProfile } from "@/lib/auth";
import { listCalendarEvents, listProfiles } from "@/lib/data";
import { canManageOperations } from "@/lib/security";

// Resolve o mês exibido a partir do parâmetro ?month=YYYY-MM, com o mês atual
// (fuso de São Paulo) como padrão e proteção contra valores inválidos.
function resolveMonth(monthParam?: string) {
  const now = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit"
  }).format(new Date());

  const value = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? (monthParam as string) : now;
  const [year, month] = value.split("-").map(Number);

  if (month < 1 || month > 12) {
    const [fy, fm] = now.split("-").map(Number);
    return { year: fy, month: fm };
  }

  return { year, month };
}

// Exibe agenda da empresa: visão mensal em grade + lista cronológica.
export default async function AgendaPage({
  searchParams
}: {
  searchParams: { month?: string };
}) {
  const profile = await requireProfile();
  const [events, profiles] = await Promise.all([listCalendarEvents(), listProfiles()]);
  const { year, month } = resolveMonth(searchParams?.month);
  const canManage = canManageOperations(profile.role);

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
      <CalendarMonth events={events} year={year} month={month} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Próximos e anteriores</h2>
        <CalendarEventList events={events} currentUserId={profile.id} canManage={canManage} />
      </section>
    </div>
  );
}
