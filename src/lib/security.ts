import type { UserRole } from "@/lib/types";

export const PROTECTED_ROUTES = ["/dashboard", "/tarefas", "/pendencias"];

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

// Mantém a regra de permissão centralizada para ações administrativas.
export function canManageSettings(role: UserRole) {
  return role === "admin";
}
