import { NextResponse, type NextRequest } from "next/server";

// ROTA TEMPORÁRIA — deletar após primeiro uso.
// Define a senha do admin inicial via REST API do Supabase (sem depender do client JS).
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Env vars ausentes" }, { status: 500 });
  }

  const res = await fetch(
    `${url}/auth/v1/admin/users/4a67638a-617e-4358-ae9e-8a60aa2ada54`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key
      },
      body: JSON.stringify({ password: "Hector2026!" })
    }
  );

  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: json }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: json.email });
}
