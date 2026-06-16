import type { UserRole } from "@/lib/types";

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/tarefas",
  "/processos",
  "/pendencias",
  "/unidades",
  "/agenda"
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Gestor",
  member: "Usuário"
};

// Evita redirecionamentos para domínios externos após login.
export function getSafeRedirectPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

// Libera a gestão de cadastros operacionais (processos, pendências, unidades,
// checklists). Espelha a função can_manage_company do banco: admin e manager.
export function canManageOperations(role: UserRole) {
  return role === "admin" || role === "manager";
}

// Reservado para ações exclusivas de administração (ex: gestão de usuários).
export function canManageSettings(role: UserRole) {
  return role === "admin";
}
