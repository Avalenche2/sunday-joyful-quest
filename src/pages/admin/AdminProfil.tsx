import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, LogOut, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { EditAdminProfileDialog } from "@/components/EditAdminProfileDialog";

const AdminProfil = () => {
  const { user, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    toast({ title: "À bientôt", description: "Tu es maintenant déconnecté." });
    navigate("/", { replace: true });
  };

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "—";

  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-serif text-xl md:text-2xl font-semibold">Mon profil moniteur</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informations liées à ton compte d'administration.
            </p>
          </div>
          {profile && (
            <EditAdminProfileDialog
              initial={{ firstName: profile.first_name, lastName: profile.last_name }}
              onSaved={(next) =>
                setProfile({ first_name: next.firstName, last_name: next.lastName })
              }
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60 bg-secondary/30">
            <UserIcon className="h-4 w-4 mt-0.5 text-accent shrink-0" strokeWidth={1.8} />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Nom</p>
              <p className="mt-0.5 text-sm font-medium truncate">{fullName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60 bg-secondary/30">
            <Mail className="h-4 w-4 mt-0.5 text-accent shrink-0" strokeWidth={1.8} />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="mt-0.5 text-sm font-medium truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60 bg-secondary/30 sm:col-span-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 text-accent shrink-0" strokeWidth={1.8} />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Rôle</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="h-5 px-2 text-[11px]">
                  Moniteur
                </Badge>
                {isSuperAdmin && (
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent gap-1 h-5 px-2 text-[10px] uppercase tracking-wider">
                    <Crown className="h-3 w-3" strokeWidth={2} />
                    Super admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <ChangePasswordDialog />
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Se déconnecter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminProfil;
