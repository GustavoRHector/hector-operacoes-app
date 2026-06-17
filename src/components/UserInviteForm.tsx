import { inviteUserAction } from "@/app/(app)/usuarios/actions";

// Formulário para convidar um novo usuário por e-mail (admin only).
export function UserInviteForm() {
  return (
    <form
      action={inviteUserAction}
      className="glass-card p-5"
    >
      <h2 className="mb-4 text-lg font-semibold text-ink">Convidar usuário</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="invite-name">
            Nome completo
          </label>
          <input
            className="glass-input rounded-md px-3 py-2 text-sm text-ink placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-moss/30"
            id="invite-name"
            name="full_name"
            placeholder="Nome do usuário"
            required
            type="text"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="invite-email">
            E-mail
          </label>
          <input
            className="glass-input rounded-md px-3 py-2 text-sm text-ink placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-moss/30"
            id="invite-email"
            name="email"
            placeholder="usuario@empresa.com"
            required
            type="email"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="invite-role">
            Perfil
          </label>
          <select
            className="glass-input rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-moss/30"
            id="invite-role"
            name="role"
          >
            <option value="member">Usuário</option>
            <option value="manager">Gestor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>

      <button
        className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium"
        type="submit"
      >
        Enviar convite
      </button>
      <p className="mt-2 text-xs text-moss">
        O usuário receberá um e-mail com link para definir a senha.
      </p>
    </form>
  );
}
