import { CalendarCreateForm } from "@/components/CalendarCreateForm";
import { CalendarEventList } from "@/components/CalendarEventList";
import { CalendarView, type CalendarDisplayEvent } from "@/components/CalendarView";
import { GoogleConnect } from "@/components/GoogleConnect";
import { requireProfile } from "@/lib/auth";
import { listCalendarEvents, listProfiles } from "@/lib/data";
import { getGoogleAccount, listGoogleEvents } from "@/lib/google";
import { canManageOperations } from "@/lib/security";

// Traduz o retorno do fluxo Google em uma mensagem curta para o usuário.
function googleFeedback(status?: string) {
  if (status === "conectado") return { ok: true, message: "Google Calendar conectado com sucesso." };
  if (status === "desconectado") return { ok: true, message: "Conta Google desconectada." };
  if (status === "erro") return { ok: false, message: "Não foi possível conectar ao Google. Tente novamente." };
  return null;
}

// Mês e dia atuais no fuso de São Paulo, para iniciar a grade e destacar hoje.
function getTodayBR() {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const [year, month] = key.split("-").map(Number);
  return { year, month, key };
}

// Exibe agenda da empresa: visão mensal em grade + lista cronológica.
export default async function AgendaPage({
  searchParams
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const sp = await searchParams;
  const profile = await requireProfile();
  const [events, profiles, googleAccount] = await Promise.all([
    listCalendarEvents(),
    listProfiles(),
    getGoogleAccount(profile.id)
  ]);
  const today = getTodayBR();
  const canManage = canManageOperations(profile.role);
  const feedback = googleFeedback(sp?.google);

  // Busca os eventos do Google numa janela ao redor do mês atual (mês anterior
  // até +2), suficiente para a navegação típica sem recarregar a cada mês.
  const now = new Date();
  const windowMin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
  const windowMax = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 1)).toISOString();
  const googleEvents = googleAccount
    ? await listGoogleEvents(profile.id, windowMin, windowMax)
    : [];

  // Mescla eventos internos e do Google num formato único para a grade.
  // Interno abre o detalhe/edição; Google abre o evento no próprio Google.
  const displayEvents: CalendarDisplayEvent[] = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      source: "internal" as const,
      link: `/agenda/${e.id}`,
      external: false
    })),
    ...googleEvents.map((g) => ({
      id: g.id,
      title: g.title,
      starts_at: g.starts_at,
      source: "google" as const,
      link: g.htmlLink ?? "https://calendar.google.com",
      external: true
    }))
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase text-clay">Calendário interno</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Agenda</h1>
          <p className="mt-2 max-w-2xl text-sm text-moss">
            Compromissos, reuniões, visitas e prazos importantes da operação.
          </p>
        </div>
        <GoogleConnect email={googleAccount?.google_email ?? null} />
      </section>

      {feedback ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-medium ${
            feedback.ok
              ? "border-magic-green/40 bg-magic-green/15 text-magic-green"
              : "border-magic-red/40 bg-magic-red/15 text-magic-red"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <CalendarView events={displayEvents} initialCursor={today.key} todayKey={today.key} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Adicionar compromisso</h2>
        <CalendarCreateForm profiles={profiles} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Próximos e anteriores</h2>
        <CalendarEventList events={events} currentUserId={profile.id} canManage={canManage} />
      </section>
    </div>
  );
}
