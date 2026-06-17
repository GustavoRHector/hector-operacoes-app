import { redirect } from "next/navigation";
import { UserInviteForm } from "@/components/UserInviteForm";
import { UserList } from "@/components/UserList";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canManageSettings } from "@/lib/security";
import type { ProfileWithEmail, UserRole } from "@/lib/types";

// Página exclusiva para admin: lista, convida e remove usuários da empresa.
export default async function UsuariosPage({
  searchParams
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const profile = await requireProfile();
  if (!canManageSettings(profile.role)) redirect("/dashboard");

  // Busca perfis da empresa (RLS garante isolamento por company_id).
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  // Busca todos os auth users e cruza com os perfis da empresa para obter e-mails.
  const adminClient = createAdminClient();
  const {
    data: { users: authUsers }
  } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const usersWithEmail: ProfileWithEmail[] = authUsers
    .filter((u) => profileMap.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      full_name: profileMap.get(u.id)!.full_name,
      role: profileMap.get(u.id)!.role as UserRole
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));

  const feedback = searchParams.ok
    ? {
        type: "ok" as const,
        message:
          searchParams.ok === "convidado"
            ? "Convite enviado com sucesso."
            : searchParams.ok === "papel"
              ? "Perfil atualizado."
              : searchParams.ok === "removido"
                ? "Usuário removido."
                : null
      }
    : searchParams.error
      ? {
          type: "error" as const,
          message:
            searchParams.error === "permissao"
              ? "Sem permissão para esta ação."
              : searchParams.error === "convite"
                ? "Erro ao enviar convite. Verifique se o e-mail já está cadastrado."
                : searchParams.error === "autopromocao"
                  ? "Você não pode alterar seu próprio perfil aqui."
                  : searchParams.error === "autoremocao"
                    ? "Você não pode remover a si mesmo."
                    : "Ocorreu um erro. Tente novamente."
        }
      : null;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium uppercase text-clay">Administração</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Usuários</h1>
        <p className="mt-2 max-w-2xl text-sm text-moss">
          Gerencie quem tem acesso ao sistema e quais permissões cada pessoa possui.
        </p>
      </section>

      {feedback?.message ? (
        <div
          className={`rounded-md px-4 py-3 text-sm font-medium ${
            feedback.type === "ok"
              ? "bg-green-50 text-magic-green"
              : "bg-magic-red/15 text-magic-red border border-magic-red/40"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <UserInviteForm />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Usuários ativos ({usersWithEmail.length})
        </h2>
        <UserList currentUserId={profile.id} users={usersWithEmail} />
      </section>
    </div>
  );
}
