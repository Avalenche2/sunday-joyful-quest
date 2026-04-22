// Rôle serveur du super administrateur — ne dépend pas d'un email codé en dur.
export const SUPER_ADMIN_ROLE = "super_admin";

export const hasSuperAdminRole = (roles?: string[] | null) =>
  !!roles?.includes(SUPER_ADMIN_ROLE);
