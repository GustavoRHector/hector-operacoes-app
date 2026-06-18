import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ROTA TEMPORÁRIA — deletar após diagnóstico.
// Mostra se a consulta interna de eventos funciona e qual erro retorna.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = await createClient();

  // Testa exatamente os campos que a listagem usa.
  const full = await supabase
    .from("calendar_events")
    .select("id, color, google_event_id")
    .limit(3);

  // Testa só o básico, para comparar.
  const basic = await supabase.from("calendar_events").select("id, title").limit(3);

  return NextResponse.json({
    com_color_e_google_id: {
      erro: full.error?.message ?? null,
      quantidade: full.data?.length ?? 0,
      amostra: full.data ?? null
    },
    so_basico: {
      erro: basic.error?.message ?? null,
      quantidade: basic.data?.length ?? 0
    }
  });
}
