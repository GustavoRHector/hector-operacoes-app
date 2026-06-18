import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listCalendarEvents } from "@/lib/data";
import { getGoogleAccount, listGoogleEvents } from "@/lib/google";

// ROTA TEMPORÁRIA — deletar após diagnóstico.
// Reproduz o pipeline da agenda: internos + Google + deduplicação.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await requireUser();
  const events = await listCalendarEvents();
  const account = await getGoogleAccount(user.id);

  const now = new Date();
  const windowMin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
  const windowMax = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 1)).toISOString();
  const googleRaw = account ? await listGoogleEvents(user.id, windowMin, windowMax) : [];

  const internalGoogleIds = new Set(
    events.map((e) => e.google_event_id).filter((id): id is string => Boolean(id))
  );
  const googleDeduped = googleRaw.filter((g) => !internalGoogleIds.has(g.id));

  return NextResponse.json({
    internos: {
      total: events.length,
      amostra: events.slice(0, 5).map((e) => ({
        title: e.title,
        color: e.color,
        google_event_id: e.google_event_id
      }))
    },
    google_bruto: {
      total: googleRaw.length,
      ids: googleRaw.slice(0, 8).map((g) => ({ title: g.title, id: g.id }))
    },
    google_apos_dedup: googleDeduped.length,
    ids_internos_mapeados: Array.from(internalGoogleIds)
  });
}
