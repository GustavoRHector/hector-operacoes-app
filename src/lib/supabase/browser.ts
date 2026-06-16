import { createBrowserClient } from "@supabase/ssr";

// Cria o cliente Supabase usado apenas no navegador, com chave pública anon.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variáveis públicas do Supabase não configuradas.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
