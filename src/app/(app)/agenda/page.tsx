import { CalendarCreateForm } from "@/components/CalendarCreateForm";
import { CalendarEventList } from "@/components/CalendarEventList";
import { CalendarMonth } from "@/components/CalendarMonth";
import { GoogleConnect } from "@/components/GoogleConnect";
import { requireProfile } from "@/lib/auth";
import { listCalendarEvents, listProfiles } from "@/lib/data";
import { getGoogleAccount } from "@/lib/google";
import { canManageOperations } from "@/lib/security";

// Traduz o retorno do fluxo Google em uma mensagem curta para o usuário.
function googleFeedback(status?: string) {
  if (status === "conectado") return { ok: true, message: "Google Calendar conectado com sucesso." };
  if (status === "desconectado") return { ok: true, message: "Conta Google desconectada." };
  if (status === "erro") return { ok: false, message: "Não foi possível conectar ao Google. Tente novamente." };
  return null;
}

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
  searchParams: Promise<{ month?: string; google?: string }>;
}) {
  const sp = await searchParams;
  const profile = await requireProfile();
  const [events, profiles, googleAccount] = await Promise.all([
    listCalendarEvents(),
    listProfiles(),
    getGoogleAccount(profile.id)
  ]);
  const { year, month } = resolveMonth(sp?.month);
  const canManage = canManageOperations(profile.role);
  const feedback = googleFeedback(sp?.google);

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium uppercase text-clay">Calendário interno</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Agenda</h1>
        <p className="mt-2 max-w-2xl text-sm text-moss">
          Compromissos, reuniões, visitas e prazos importantes da operação.
        </p>
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

      <GoogleConnect email={googleAccount?.google_email ?? null} />

      <CalendarCreateForm profiles={profiles} />
      <CalendarMonth events={events} year={year} month={month} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Próximos e anteriores</h2>
        <CalendarEventList events={events} currentUserId={profile.id} canManage={canManage} />
      </section>
    </div>
  );
}
