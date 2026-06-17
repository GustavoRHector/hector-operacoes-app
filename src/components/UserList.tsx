import { removeUserAction, updateRoleAction } from "@/app/(app)/usuarios/actions";
import { ROLE_LABELS } from "@/lib/security";
import type { ProfileWithEmail, UserRole } from "@/lib/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "member", label: "Usuário" },
  { value: "manager", label: "Gestor" },
  { value: "admin", label: "Administrador" }
];

// Lista todos os usuários da empresa com controles de papel e remoção.
// currentUserId impede que o admin remova ou altere a si mesmo.
export function UserList({
  users,
  currentUserId
}: {
  users: ProfileWithEmail[];
  currentUserId: string;
}) {
  if (users.length === 0) {
    return (
      <p className="glass-card px-5 py-8 text-center text-sm text-moss">
        Nenhum usuário encontrado.
      </p>
    );
  }

  return (
    <div className="overflow-hidden glass-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-moss/15 bg-white/5">
            <th className="px-4 py-3 text-left font-semibold text-ink">Nome</th>
            <th className="px-4 py-3 text-left font-semibold text-ink">E-mail</th>
            <th className="px-4 py-3 text-left font-semibold text-ink">Perfil atual</th>
            <th className="px-4 py-3 text-left font-semibold text-ink">Alterar perfil</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;

            return (
              <tr className="border-b border-moss/10 last:border-0" key={user.id}>
                <td className="px-4 py-3 font-medium text-ink">
                  {user.full_name}
                  {isSelf ? (
                    <span className="ml-2 text-xs font-normal text-moss">(você)</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-moss">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="glass-chip rounded-full px-2.5 py-0.5 text-xs font-medium text-ink">
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isSelf ? (
                    <span className="text-xs text-moss">—</span>
                  ) : (
                    <form action={updateRoleAction} className="flex items-center gap-2">
                      <input name="user_id" type="hidden" value={user.id} />
                      <select
                        className="glass-input rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-moss/30"
                        defaultValue={user.role}
                        name="role"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn-secondary rounded-md px-2.5 py-1.5 text-xs font-medium"
                        type="submit"
                      >
                        Salvar
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {isSelf ? null : (
                    <form action={removeUserAction}>
                      <input name="user_id" type="hidden" value={user.id} />
                      <button
                        className="rounded-md border border-magic-red/50 px-2.5 py-1.5 text-xs font-medium text-magic-red transition hover:bg-magic-red/10"
                        type="submit"
                      >
                        Remover
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
