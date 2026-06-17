import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ROTA TEMPORÁRIA — deletar após primeiro uso.
// Define a senha do admin inicial via API admin do Supabase.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.updateUserById(
    "4a67638a-617e-4358-ae9e-8a60aa2ada54",
    { password: "Hector2026!" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: data.user.email });
}
