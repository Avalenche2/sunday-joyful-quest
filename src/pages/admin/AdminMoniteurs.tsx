import { useEffect, useState } from "react";
import { Crown, Loader2, Lock, ShieldCheck, ShieldOff, History, Users, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Moniteur {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  approved_at: string | null;
  is_super_admin: boolean;
}

interface RejectedRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  reviewed_at: string | null;
  created_at: string;
}

interface Revocation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  revoked_at: string;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const AdminMoniteurs = () => {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [moniteurs, setMoniteurs] = useState<Moniteur[]>([]);
  const [rejected, setRejected] = useState<RejectedRequest[]>([]);
  const [revocations, setRevocations] = useState<Revocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Moniteur | null>(null);

  const load = async () => {
    setLoading(true);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "super_admin"]);

    const ids = [...new Set((roles ?? []).map((r) => r.user_id))];

    const [profilesRes, requestsRes, rejectedRes, revocationsRes] = await Promise.all([
      ids.length
        ? supabase.from("profiles").select("id, first_name, last_name").in("id", ids)
        : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
      ids.length
        ? supabase
            .from("admin_requests")
            .select("user_id, email, reviewed_at")
            .in("user_id", ids)
        : Promise.resolve({
            data: [] as { user_id: string; email: string; reviewed_at: string | null }[],
          }),
      supabase
        .from("admin_requests")
        .select("id, first_name, last_name, email, reviewed_at, created_at")
        .eq("status", "rejected")
        .order("reviewed_at", { ascending: false }),
      supabase
        .from("admin_role_revocations")
        .select("id, first_name, last_name, email, revoked_at")
        .order("revoked_at", { ascending: false }),
    ]);

    const list: Moniteur[] = ids.map((id) => {
      const p = profilesRes.data?.find((pr) => pr.id === id);
      const r = requestsRes.data?.find((rq) => rq.user_id === id);
      return {
        user_id: id,
        first_name: p?.first_name ?? "—",
        last_name: p?.last_name ?? "",
        email: r?.email ?? "—",
        approved_at: r?.reviewed_at ?? null,
        is_super_admin: roles?.some((role) => role.user_id === id && role.role === "super_admin") ?? false,
      };
    });

    list.sort((a, b) => {
      if (a.is_super_admin) return -1;
      if (b.is_super_admin) return 1;
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    });

    setMoniteurs(list);
    setRejected((rejectedRes.data ?? []) as RejectedRequest[]);
    setRevocations((revocationsRes.data ?? []) as Revocation[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (m: Moniteur) => {
    setRevoking(m.user_id);

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", m.user_id)
      .eq("role", "admin");

    if (error) {
      setRevoking(null);
      setConfirmTarget(null);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    // Trace dans l'historique
    await supabase.from("admin_role_revocations").insert({
      user_id: m.user_id,
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email,
      revoked_by: user?.id ?? null,
    });

    setRevoking(null);
    setConfirmTarget(null);

    toast({
      title: "Rôle révoqué",
      description: `${m.first_name} ${m.last_name} n'est plus moniteur.`,
    });

    // Recharge tout pour mettre à jour l'historique
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
          Gestion des accès
        </p>
        <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">Moniteurs</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Gère les comptes ayant les privilèges moniteur. Le super admin ne peut pas être révoqué.
        </p>
      </div>

      <Tabs defaultValue="actifs" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="actifs" className="gap-2">
            <Users className="h-3.5 w-3.5" />
            Actifs
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {moniteurs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-2">
            <History className="h-3.5 w-3.5" />
            Historique
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {rejected.length + revocations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* === Onglet Actifs === */}
        <TabsContent value="actifs" className="mt-4">
          <Card className="shadow-soft">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-10 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                </div>
              ) : moniteurs.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  Aucun moniteur pour le moment.
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {moniteurs.map((m) => {
                    const isSelf = user?.id === m.user_id;
                    return (
                      <li
                        key={m.user_id}
                        className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">
                              {m.first_name} {m.last_name}
                            </p>
                            {m.is_super_admin && (
                              <Badge className="bg-accent text-accent-foreground hover:bg-accent gap-1 h-5 px-2 text-[10px] uppercase tracking-wider">
                                <Crown className="h-3 w-3" strokeWidth={2} />
                                Super admin
                              </Badge>
                            )}
                            {isSelf && !m.is_super_admin && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-2 text-[10px] uppercase tracking-wider"
                              >
                                Vous
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                          {m.approved_at && (
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                              Validé le {fmtDate(m.approved_at)}
                            </p>
                          )}
                        </div>

                        <div>
                          {m.is_super_admin ? (
                            <Badge variant="outline" className="gap-1 text-[11px]">
                              <ShieldCheck className="h-3 w-3" strokeWidth={1.8} />
                              Protégé
                            </Badge>
                          ) : !isSuperAdmin ? (
                            <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
                              <Lock className="h-3 w-3" strokeWidth={1.8} />
                              Réservé super admin
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmTarget(m)}
                              disabled={revoking === m.user_id}
                              className="text-destructive hover:text-destructive"
                            >
                              {revoking === m.user_id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldOff className="h-3.5 w-3.5" />
                              )}
                              Révoquer
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Onglet Historique === */}
        <TabsContent value="historique" className="mt-4 space-y-6">
          {/* Révocations */}
          <Card className="shadow-soft">
            <CardContent className="p-0">
              <div className="px-4 sm:px-6 py-4 border-b border-border/60 flex items-center gap-2">
                <ShieldOff className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                <h3 className="font-serif text-base">Rôles révoqués</h3>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {revocations.length}
                </Badge>
              </div>
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                </div>
              ) : revocations.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune révocation enregistrée.
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {revocations.map((r) => (
                    <li
                      key={r.id}
                      className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Révoqué le {fmtDate(r.revoked_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Demandes refusées */}
          <Card className="shadow-soft">
            <CardContent className="p-0">
              <div className="px-4 sm:px-6 py-4 border-b border-border/60 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                <h3 className="font-serif text-base">Demandes refusées</h3>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {rejected.length}
                </Badge>
              </div>
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                </div>
              ) : rejected.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune demande refusée.
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {rejected.map((r) => (
                    <li
                      key={r.id}
                      className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Refusé le {fmtDate(r.reviewed_at ?? r.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer le rôle moniteur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget && (
                <>
                  <span className="font-medium text-foreground">
                    {confirmTarget.first_name} {confirmTarget.last_name}
                  </span>{" "}
                  perdra immédiatement l'accès à l'espace moniteur. Son compte enfant restera intact.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmTarget && revoke(confirmTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMoniteurs;
