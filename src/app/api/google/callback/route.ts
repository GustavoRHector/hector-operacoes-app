import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, fetchGoogleEmail } from "@/lib/google";

// Recebe o retorno do Google, troca o código por tokens e salva no perfil do usuário.
export async function GET(request: NextRequest) {
  const user = await requireUser();
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Confere que o consentimento voltou para o mesmo usuário que iniciou o fluxo.
  if (error || !code || state !== user.id) {
    return NextResponse.redirect(`${origin}/agenda?google=erro`);
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(`${origin}/agenda?google=erro`);
  }

  const email = await fetchGoogleEmail(tokens.access_token);
  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // upsert: a RLS garante que o usuário só grava o próprio registro.
  const supabase = await createClient();
  const { error: dbError } = await supabase.from("google_accounts").upsert(
    {
      user_id: user.id,
      google_email: email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: expiry,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (dbError) {
    return NextResponse.redirect(`${origin}/agenda?google=erro`);
  }

  return NextResponse.redirect(`${origin}/agenda?google=conectado`);
}
