import { useEffect, useMemo, useState } from "react";
import { Loader2, PauseCircle, PlayCircle, Search, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type AccountStatus = "active" | "paused";

interface ChildAccount {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  parent_first_name: string | null;
  parent_last_name: string | null;
  parent_phone: string | null;
  created_at: string;
  account_status: AccountStatus;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const AdminChildren = () => {
  const { toast } = useToast();
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChildAccount | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const load = async () => {
    setLoading(true);

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "enfant");

    if (rolesError) {
      toast({ title: "Erreur", description: rolesError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
    if (ids.length === 0) {
      setChildren([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, age, parent_first_name, parent_last_name, parent_phone, created_at, account_status")
      .in("id", ids)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setChildren((data ?? []) as unknown as ChildAccount[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return children;
    return children.filter((child) =>
      `${child.first_name} ${child.last_name} ${child.parent_first_name ?? ""} ${child.parent_last_name ?? ""} ${child.parent_phone ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [children, query]);

  const toggleStatus = async (child: ChildAccount) => {
    const nextStatus: AccountStatus = child.account_status === "paused" ? "active" : "paused";
    setBusyId(child.id);

    const { error } = await supabase
      .from("profiles")
      .update({ account_status: nextStatus } as never)
      .eq("id", child.id);

    setBusyId(null);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    setChildren((items) =>
      items.map((item) => (item.id === child.id ? { ...item, account_status: nextStatus } : item)),
    );
    toast({
      title: nextStatus === "paused" ? "Compte mis en pause" : "Compte réactivé",
      description: `${child.first_name} ${child.last_name}`,
    });
  };

  const deleteChild = async () => {
    if (!deleteTarget) return;
    const expected = deleteTarget.first_name.trim().toLowerCase();
    if (deleteConfirm.trim().toLowerCase() !== expected) {
      toast({
        title: "Confirmation requise",
        description: `Tape "${deleteTarget.first_name}" pour confirmer.`,
        variant: "destructive",
      });
      return;
    }
    setBusyId(deleteTarget.id);

    const { error } = await supabase.functions.invoke("admin-delete-child", {
      body: { userId: deleteTarget.id },
    });

    setBusyId(null);

    if (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
      return;
    }

    setChildren((items) => items.filter((item) => item.id !== deleteTarget.id));
    toast({ title: "Compte supprimé", description: `${deleteTarget.first_name} ${deleteTarget.last_name}` });
    setDeleteTarget(null);
    setDeleteConfirm("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Comptes enfants</p>
          <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">Gestion des enfants</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mets un compte en pause, réactive-le ou supprime-le définitivement.
          </p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
              Aucun compte enfant trouvé.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((child) => {
                const paused = child.account_status === "paused";
                return (
                  <li key={child.id} className="px-4 sm:px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm">
                          {child.first_name} {child.last_name}
                        </p>
                        <Badge variant={paused ? "destructive" : "secondary"} className="h-5 px-2 text-[10px] uppercase tracking-wider">
                          {paused ? "En pause" : "Actif"}
                        </Badge>
                      </div>
                      <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                        <span>Âge : {child.age ?? "—"}</span>
                        <span>Parent : {[child.parent_first_name, child.parent_last_name].filter(Boolean).join(" ") || "—"}</span>
                        <span>Tél. : {child.parent_phone || "—"}</span>
                        <span>Inscrit le {fmtDate(child.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(child)}
                        disabled={busyId === child.id}
                      >
                        {busyId === child.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : paused ? (
                          <PlayCircle className="h-3.5 w-3.5" />
                        ) : (
                          <PauseCircle className="h-3.5 w-3.5" />
                        )}
                        {paused ? "Réactiver" : "Pause"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(child)}
                        disabled={busyId === child.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte enfant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprime le compte, son profil et ses participations aux quizz. Elle est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteChild} disabled={!!busyId}>
              {busyId && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminChildren;
