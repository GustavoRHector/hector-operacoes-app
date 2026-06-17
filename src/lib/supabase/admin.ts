import { createClient } from "@supabase/supabase-js";

// Cliente com privilégio service_role — usar APENAS em Server Actions, nunca no cliente.
// A chave não tem prefixo NEXT_PUBLIC_ e nunca é exposta ao navegador.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente servidor.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
