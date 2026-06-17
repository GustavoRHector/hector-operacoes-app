import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  FolderKanban,
  Kanban,
  LayoutDashboard,
  LogOut,
  Users
} from "lucide-react";
import { signOutAction } from "@/app/login/actions";
import { ROLE_LABELS, canManageSettings } from "@/lib/security";
import type { Profile } from "@/lib/types";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tarefas", label: "Tarefas", icon: Kanban },
  { href: "/processos", label: "Processos", icon: FolderKanban },
  { href: "/pendencias", label: "Pendências", icon: ClipboardCheck },
  { href: "/unidades", label: "Casas", icon: Building2 },
  { href: "/agenda", label: "Agenda", icon: CalendarDays }
];

// Monta a navegação principal apenas depois que o perfil autenticado foi carregado.
export function AppShell({ children, profile }: { children: React.ReactNode; profile: Profile }) {
  return (
    <div className="min-h-screen bg-linen">
      <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-moss/15 bg-white md:inset-y-0 md:left-0 md:right-auto md:w-64 md:border-r md:border-t-0">
        <div className="hidden px-5 py-6 md:block">
          <p className="text-lg font-semibold text-ink">Hector Operações</p>
          <p className="mt-1 text-sm text-moss">{ROLE_LABELS[profile.role]}</p>
        </div>

        <nav className="grid grid-cols-3 gap-1 p-2 sm:grid-cols-6 md:block md:space-y-1 md:px-3">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-moss transition hover:bg-mist hover:text-ink md:flex-row md:justify-start md:px-3 md:text-sm"
                href={item.href}
                key={item.label}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          {canManageSettings(profile.role) ? (
            <Link
              className="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-moss transition hover:bg-mist hover:text-ink md:flex-row md:justify-start md:px-3 md:text-sm"
              href="/usuarios"
            >
              <Users size={18} />
              Usuários
            </Link>
          ) : null}
        </nav>
      </aside>

      <div className="pb-24 md:ml-64 md:pb-0">
        <header className="sticky top-0 z-10 border-b border-moss/15 bg-linen/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-moss">Bem-vindo(a)</p>
              <h1 className="text-xl font-semibold text-ink">{profile.full_name}</h1>
            </div>

            <form action={signOutAction}>
              <button className="inline-flex items-center gap-2 rounded-md border border-moss/20 bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-mist">
                <LogOut size={16} />
                Sair
              </button>
            </form>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
