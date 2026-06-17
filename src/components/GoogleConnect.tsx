import { disconnectGoogleAction } from "@/app/(app)/agenda/actions";

// Mostra o estado da conexão com o Google Calendar e permite conectar/desconectar.
// Cada usuário gerencia apenas a própria conta (a agenda é individual).
export function GoogleConnect({ email }: { email: string | null }) {
  if (email) {
    return (
      <div className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink">Google Calendar conectado</p>
          <p className="text-sm text-moss">{email}</p>
        </div>
        <form action={disconnectGoogleAction}>
          <button className="btn-secondary rounded-md px-3 py-2 text-sm font-medium" type="submit">
            Desconectar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-ink">Conecte sua agenda do Google</p>
        <p className="text-sm text-moss">
          Seus compromissos do Google aparecem aqui e os criados no app vão para sua agenda.
        </p>
      </div>
      <a className="btn-primary rounded-md px-4 py-2 text-sm font-medium" href="/api/google/connect">
        Conectar Google
      </a>
    </div>
  );
}
