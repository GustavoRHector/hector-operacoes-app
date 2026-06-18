import { CalendarCreateForm } from "@/components/CalendarCreateForm";
import { CalendarEventList } from "@/components/CalendarEventList";
import { CalendarView, type CalendarDisplayEvent } from "@/components/CalendarView";
import { GoogleConnect } from "@/components/GoogleConnect";
import { requireProfile } from "@/lib/auth";
import { listCalendarEvents, listProfiles } from "@/lib/data";
import { getGoogleAccount, listGoogleEvents } from "@/lib/google";
import { canManageOperations } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

// Traduz o retorno do fluxo Google em uma mensagem curta para o usuário.
function googleFeedback(status?: string) {
  if (status === "conectado") return { ok: true, message: "Google Calendar conectado com sucesso." };
  if (status === "desconectado") return { ok: true, message: "Conta Google desconectada." };
  if (status === "atualizado") return { ok: true, message: "Evento atualizado no Google." };
  if (status === "excluido") return { ok: true, message: "Evento excluído do Google." };
  if (status === "erro") return { ok: false, message: "Não foi possível falar com o Google. Tente novamente." };
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
  const googleResult = googleAccount
    ? await listGoogleEvents(profile.id, windowMin, windowMax)
    : { ok: false, events: [] };
  const googleEventsRaw = googleResult.events;

  // Reconciliação Google → app (só quando a leitura do Google deu certo):
  //  - evento do app que sumiu do Google (dentro da janela) → foi excluído lá → remove no app.
  //  - evento do app que mudou no Google (título/horário/descrição) → traz a mudança para o app.
  // Assim a edição feita direto no Google volta para o painel, fechando os dois sentidos.
  let internalEvents = events;
  if (googleResult.ok) {
    const supabase = await createClient();
    const minT = new Date(windowMin).getTime();
    const maxT = new Date(windowMax).getTime();
    const googleById = new Map(googleEventsRaw.map((g) => [g.id, g]));
    const removedIds = new Set<string>();

    for (const e of events) {
      if (!e.google_event_id) continue;
      const g = googleById.get(e.google_event_id);

      if (!g) {
        const t = new Date(e.starts_at).getTime();
        if (t >= minT && t < maxT) {
          await supabase.from("calendar_events").delete().eq("id", e.id);
          removedIds.add(e.id);
        }
        continue;
      }

      // Compara por instante (formatos de fuso diferem) e por texto.
      const sameStart = new Date(e.starts_at).getTime() === new Date(g.starts_at).getTime();
      const sameEnd =
        (e.ends_at ? new Date(e.ends_at).getTime() : null) ===
        (g.ends_at ? new Date(g.ends_at).getTime() : null);
      const sameTitle = e.title === g.title;
      const sameDesc = (e.description ?? "") === (g.description ?? "");

      if (!sameStart || !sameEnd || !sameTitle || !sameDesc) {
        await supabase
          .from("calendar_events")
          .update({ title: g.title, starts_at: g.starts_at, ends_at: g.ends_at, description: g.description })
          .eq("id", e.id);
        // Reflete na hora, sem esperar o próximo carregamento.
        e.title = g.title;
        e.starts_at = g.starts_at;
        e.ends_at = g.ends_at;
        e.description = g.description;
      }
    }

    if (removedIds.size > 0) {
      internalEvents = events.filter((e) => !removedIds.has(e.id));
    }
  }

  // Remove duplicatas: eventos criados no app já aparecem como internos (com cor),
  // então não devem reaparecer pela listagem do Google. Mantém só os que existem
  // exclusivamente no Google (criados direto por lá).
  const internalGoogleIds = new Set(
    internalEvents.map((e) => e.google_event_id).filter((id): id is string => Boolean(id))
  );
  const googleEvents = googleEventsRaw.filter((g) => !internalGoogleIds.has(g.id));

  // Mescla eventos internos e do Google num formato único para a grade.
  // O clique abre um modal de detalhes; de lá, editar (interno) ou abrir no Google.
  const displayEvents: CalendarDisplayEvent[] = [
    ...internalEvents.map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      source: "internal" as const,
      color: e.color,
      event_type: e.event_type,
      responsible_name: e.responsible_name,
      description: e.description,
      editLink: `/agenda/${e.id}`,
      googleLink: null
    })),
    ...googleEvents.map((g) => ({
      id: g.id,
      title: g.title,
      starts_at: g.starts_at,
      ends_at: g.ends_at,
      source: "google" as const,
      color: "neutral" as const,
      event_type: null,
      responsible_name: null,
      description: g.description,
      editLink: null,
      googleLink: g.htmlLink
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
        <CalendarEventList events={internalEvents} currentUserId={profile.id} canManage={canManage} />
      </section>
    </div>
  );
}
