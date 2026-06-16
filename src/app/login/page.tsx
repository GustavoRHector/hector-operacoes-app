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
    <main className="flex min-h-screen items-center justify-center bg-linen px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-moss/15 bg-white p-6 shadow-soft">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-linen">
            <LockKeyhole size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink">Hector Operações</h1>
            <p className="text-sm text-moss">Acesso interno da equipe</p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <form action={signInAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={searchParams.redirectTo ?? "/dashboard"} />

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">E-mail</span>
            <input
              className="w-full rounded-md border border-moss/20 px-3 py-2 outline-none ring-ambered/30 transition focus:ring-4"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Senha</span>
            <input
              className="w-full rounded-md border border-moss/20 px-3 py-2 outline-none ring-ambered/30 transition focus:ring-4"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="w-full rounded-md bg-ink px-4 py-2.5 font-medium text-linen transition hover:bg-moss">
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
