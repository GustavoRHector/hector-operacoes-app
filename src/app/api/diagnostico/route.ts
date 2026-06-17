import { NextResponse, type NextRequest } from "next/server";

// ROTA TEMPORÁRIA — deletar após diagnóstico.
// Testa cada conexão entre Vercel e Supabase sem expor chaves.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const result: Record<string, unknown> = {
    supabase_url: url || "AUSENTE",
    anon_key: anonKey ? `${anonKey.slice(0, 20)}...` : "AUSENTE",
    service_key: serviceKey ? `${serviceKey.slice(0, 20)}...` : "AUSENTE"
  };

  // Testa conexão com anon key (leitura pública)
  try {
    const r = await fetch(`${url}/rest/v1/companies?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    });
    result.anon_db = r.ok ? `ok (${r.status})` : `erro ${r.status}: ${await r.text()}`;
  } catch (e) {
    result.anon_db = `falha: ${String(e)}`;
  }

  // Testa conexão com service_role key (admin)
  try {
    const r = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    });
    result.service_auth = r.ok ? `ok (${r.status})` : `erro ${r.status}: ${await r.text()}`;
  } catch (e) {
    result.service_auth = `falha: ${String(e)}`;
  }

  return NextResponse.json(result);
}
