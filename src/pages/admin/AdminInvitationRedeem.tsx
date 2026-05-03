import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";

const AdminInvitationRedeem = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !token || !user || state !== "idle") return;
    (async () => {
      setState("loading");
      const { error } = await supabase.rpc("redeem_admin_invitation" as never, {
        _token: token,
      } as never);
      if (error) {
        setErrorMsg(error.message);
        setState("error");
        return;
      }
      setState("ok");
    })();
  }, [authLoading, token, user, state]);

  if (!token) return <Navigate to="/admin/connexion" replace />;

  if (!authLoading && !user) {
    // Pas connecté : on l'envoie créer un compte, on garde le token via redirect param
    const next = `/admin/invitation/${token}`;
    return <Navigate to={`/admin/inscription?invite=${token}&next=${encodeURIComponent(next)}`} replace />;
  }

  return (
    <AuthLayout
      title={
        state === "ok"
          ? "Bienvenue parmi les moniteurs"
          : state === "error"
            ? "Invitation invalide"
            : "Validation de ton invitation"
      }
      subtitle={
        state === "ok"
          ? "Ton accès moniteur est activé."
          : state === "error"
            ? "Le lien n'est plus utilisable."
            : "Un instant…"
      }
      footer={
        <Link
          to={state === "ok" ? "/admin" : "/admin/connexion"}
          className="text-foreground font-medium hover:text-accent transition-colors"
        >
          {state === "ok" ? "Aller à l'espace moniteur" : "Retour à la connexion"}
        </Link>
      }
    >
      <div className="text-center py-4">
        {(state === "idle" || state === "loading" || authLoading) && (
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-accent" />
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="h-10 w-10 mx-auto text-accent mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu disposes maintenant des privilèges moniteur.
            </p>
            <Button asChild className="mt-5 w-full" size="lg">
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4" />
                Entrer dans l'espace moniteur
              </Link>
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {errorMsg ?? "Cette invitation a expiré ou a déjà été utilisée."}
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default AdminInvitationRedeem;
