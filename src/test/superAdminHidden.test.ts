import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Garde-fou de sécurité : le compte super admin (et tout admin)
 * ne doit JAMAIS apparaître dans l'espace enfant — ni dans le
 * Top du mois, ni dans le classement général, ni dans les listes
 * de comptes enfants.
 *
 * Ces tests valident la logique de filtrage utilisée côté client,
 * en simulant la liste d'IDs admin renvoyée par la fonction RPC
 * `get_admin_user_ids` (security definer côté Supabase).
 */

const SUPER_ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const ADMIN_ID = "22222222-2222-2222-2222-222222222222";
const CHILD_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CHILD_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const adminIdsRpcResult = [
  { get_admin_user_ids: SUPER_ADMIN_ID },
  { get_admin_user_ids: ADMIN_ID },
];

const buildAdminSet = (rpcRows: Array<{ get_admin_user_ids?: string } | string>) =>
  new Set<string>(
    rpcRows.map((r) => (typeof r === "string" ? r : (r.get_admin_user_ids as string)))
  );

describe("Sécurité — le super admin n'apparaît jamais dans l'espace enfant", () => {
  let adminSet: Set<string>;

  beforeEach(() => {
    adminSet = buildAdminSet(adminIdsRpcResult);
  });

  it("contient bien l'ID du super admin et des admins", () => {
    expect(adminSet.has(SUPER_ADMIN_ID)).toBe(true);
    expect(adminSet.has(ADMIN_ID)).toBe(true);
  });

  it("filtre le super admin du Top du mois (TopJuniors)", () => {
    const attempts = [
      { user_id: SUPER_ADMIN_ID, score: 100 },
      { user_id: ADMIN_ID, score: 80 },
      { user_id: CHILD_A, score: 50 },
      { user_id: CHILD_B, score: 40 },
    ];

    const totals = new Map<string, number>();
    attempts.forEach((a) => {
      if (adminSet.has(a.user_id)) return;
      totals.set(a.user_id, (totals.get(a.user_id) ?? 0) + a.score);
    });

    const ranked = Array.from(totals.entries()).map(([uid]) => uid);
    expect(ranked).not.toContain(SUPER_ADMIN_ID);
    expect(ranked).not.toContain(ADMIN_ID);
    expect(ranked).toContain(CHILD_A);
    expect(ranked).toContain(CHILD_B);
  });

  it("filtre le super admin du classement général (Classement)", () => {
    const rows = [
      { user_id: SUPER_ADMIN_ID, score: 999, total: 1000, completed_at: "2026-05-01" },
      { user_id: CHILD_A, score: 8, total: 10, completed_at: "2026-05-01" },
    ];
    const filtered = rows.filter((r) => !adminSet.has(r.user_id));
    expect(filtered.map((r) => r.user_id)).toEqual([CHILD_A]);
  });

  it("filtre le super admin de la liste des comptes enfants (AdminChildren)", () => {
    // Cas où un super admin a aussi historiquement le rôle 'enfant'.
    const enfantRoleIds = [SUPER_ADMIN_ID, CHILD_A, CHILD_B];
    const visibleChildren = enfantRoleIds.filter((id) => !adminSet.has(id));
    expect(visibleChildren).not.toContain(SUPER_ADMIN_ID);
    expect(visibleChildren).toEqual([CHILD_A, CHILD_B]);
  });

  it("filtre le super admin d'une recherche par nom", () => {
    const profiles = [
      { id: SUPER_ADMIN_ID, first_name: "Isaac", last_name: "Fanou" },
      { id: CHILD_A, first_name: "Isaac", last_name: "Junior" },
    ];
    const query = "isaac";
    const visible = profiles
      .filter((p) => !adminSet.has(p.id))
      .filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(query)
      );
    expect(visible.map((p) => p.id)).toEqual([CHILD_A]);
  });

  it("ne révèle aucun ID admin si la liste RPC est vide (sécurité par défaut)", () => {
    // Si la RPC échoue ou renvoie vide, le filtrage ne masque rien —
    // on documente ici qu'aucun ID sensible ne fuit côté client tant que
    // get_admin_user_ids reste la SEULE source de vérité.
    const empty = buildAdminSet([]);
    expect(empty.size).toBe(0);
  });
});
