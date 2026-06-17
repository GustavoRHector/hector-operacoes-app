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

export type GoogleEventDisplay = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  description: string | null;
  htmlLink: string | null;
};

type GoogleApiEvent = {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

// Lista eventos da agenda principal do Google do usuário em um intervalo.
// singleEvents=true expande eventos recorrentes em ocorrências individuais.
export async function listGoogleEvents(
  userId: string,
  timeMinISO: string,
  timeMaxISO: string
): Promise<GoogleEventDisplay[]> {
  const token = await getValidAccessToken(userId);
  if (!token) return [];

  const params = new URLSearchParams({
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250"
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];

  const data = (await res.json()) as { items?: GoogleApiEvent[] };
  const items = data.items ?? [];

  return items
    .map((it): GoogleEventDisplay | null => {
      // Evento com hora usa dateTime; evento de dia inteiro usa date (sem hora).
      const start = it.start?.dateTime ?? (it.start?.date ? `${it.start.date}T00:00:00-03:00` : null);
      if (!start) return null;
      const end = it.end?.dateTime ?? null;
      return {
        id: it.id,
        title: it.summary ?? "(sem título)",
        starts_at: start,
        ends_at: end,
        description: it.description ?? null,
        htmlLink: it.htmlLink ?? null
      };
    })
    .filter((e): e is GoogleEventDisplay => e !== null);
}

// Cria um evento no Google Calendar do usuário e retorna o id gerado, para
// mapear ao evento interno e permitir espelhar edições no futuro.
export async function createGoogleEvent(
  userId: string,
  event: { title: string; description: string | null; startISO: string; endISO: string }
): Promise<string | null> {
  const token = await getValidAccessToken(userId);
  if (!token) return null;

  const body = {
    summary: event.title,
    description: event.description ?? undefined,
    start: { dateTime: event.startISO, timeZone: "America/Sao_Paulo" },
    end: { dateTime: event.endISO, timeZone: "America/Sao_Paulo" }
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { id?: string };
  return data.id ?? null;
}

// Atualiza um evento existente no Google Calendar do usuário (PATCH parcial).
export async function updateGoogleEvent(
  userId: string,
  googleEventId: string,
  event: { title: string; description: string | null; startISO: string; endISO: string }
): Promise<boolean> {
  const token = await getValidAccessToken(userId);
  if (!token) return false;

  const body = {
    summary: event.title,
    description: event.description ?? "",
    start: { dateTime: event.startISO, timeZone: "America/Sao_Paulo" },
    end: { dateTime: event.endISO, timeZone: "America/Sao_Paulo" }
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  return res.ok;
}
