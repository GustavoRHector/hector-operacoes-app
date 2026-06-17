import { LockKeyhole } from "lucide-react";
import { signInAction } from "@/app/login/actions";

// Exibe a tela pública de login sem carregar dados internos da empresa.
export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string; redirectTo?: string };
}) {
  const errorMessage = getLoginErrorMessage(searchParams.error);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md glass-card p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-grad text-white">
            <LockKeyhole size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink">Hector Operações</h1>
            <p className="text-sm text-moss">Acesso interno da equipe</p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-md border border-magic-red/40 bg-magic-red/15 px-3 py-2 text-sm text-magic-red">
            {errorMessage}
          </p>
        ) : null}

        <form action={signInAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={searchParams.redirectTo ?? "/dashboard"} />

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">E-mail</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 transition focus:ring-4"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Senha</span>
            <input
              className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 transition focus:ring-4"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="btn-primary w-full rounded-md px-4 py-2.5 font-medium">
            Entrar com segurança
          </button>
        </form>
      </section>
    </main>
  );
}

// Traduz códigos simples de erro em mensagens claras para o usuário.
function getLoginErrorMessage(error?: string) {
  if (error === "campos") return "Informe e-mail e senha para continuar.";
  if (error === "credenciais") return "E-mail ou senha inválidos.";
  if (error === "perfil") return "Seu usuário ainda não possui perfil interno.";
  return null;
}
