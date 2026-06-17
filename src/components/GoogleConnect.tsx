import { disconnectGoogleAction } from "@/app/(app)/agenda/actions";

// Chip compacto de status da conexão com o Google Calendar, para o canto do cabeçalho.
// Cada usuário gerencia apenas a própria conta (a agenda é individual).
export function GoogleConnect({ email }: { email: string | null }) {
  if (email) {
    return (
      <div
        className="glass-chip flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
        title={`Conectado como ${email}`}
      >
        <span className="h-2 w-2 rounded-full bg-magic-green" />
        <span className="font-medium text-ink">Google conectado</span>
        <form action={disconnectGoogleAction}>
          <button className="text-moss underline transition hover:text-ink" type="submit">
            desconectar
          </button>
        </form>
      </div>
    );
  }

  return (
    <a
      className="btn-secondary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
      href="/api/google/connect"
    >
      <span className="h-2 w-2 rounded-full bg-moss" />
      Conectar Google
    </a>
  );
}
