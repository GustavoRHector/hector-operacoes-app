import { createClient } from "@/lib/supabase/server";

// Escopos: ler e escrever na agenda do usuário + identificar o e-mail conectado.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email"
].join(" ");

// URL de redirecionamento registrada no Google Cloud (deve bater exatamente).
function getRedirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    "https://hector-operacoes-app.vercel.app/api/google/callback"
  );
}

// Monta a URL de consentimento do Google. access_type=offline + prompt=consent
// garantem o refresh_token na primeira autorização.
export function getGoogleAuthUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID não configurado.");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
};

// Troca o código de autorização por tokens de acesso e atualização.
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code"
    })
  });

  return (await res.json()) as TokenResponse;
}

// Descobre o e-mail da conta Google conectada.
export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

// Renova o access_token a partir do refresh_token guardado.
async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token"
    })
  });

  return (await res.json()) as TokenResponse;
}

// Retorna um access_token válido para o usuário, renovando se já expirou.
// Usa o cliente com sessão do usuário; a RLS garante acesso só ao próprio token.
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("google_accounts")
    .select("access_token, refresh_token, token_expiry")
    .eq("user_id", userId)
    .single();

  if (!account?.refresh_token) return null;

  const expiry = account.token_expiry ? new Date(account.token_expiry).getTime() : 0;
  // Renova com 60s de folga para evitar uso de token prestes a vencer.
  if (account.access_token && expiry - 60_000 > Date.now()) {
    return account.access_token;
  }

  const refreshed = await refreshAccessToken(account.refresh_token);
  if (!refreshed.access_token) return null;

  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabase
    .from("google_accounts")
    .update({ access_token: refreshed.access_token, token_expiry: newExpiry, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return refreshed.access_token;
}

// Indica se o usuário já conectou uma conta Google.
export async function getGoogleAccount(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_accounts")
    .select("google_email")
    .eq("user_id", userId)
    .single();
  return data;
}
