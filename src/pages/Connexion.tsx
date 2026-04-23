import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { signInSchema } from "@/lib/validation";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Connexion = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) return <Navigate to="/profil" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setSubmitting(false);
      const msg = error.message.includes("Invalid login credentials")
        ? "Email ou mot de passe incorrect."
        : error.message;
      toast({ title: "Connexion impossible", description: msg, variant: "destructive" });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if ((profile as { account_status?: string } | null)?.account_status === "paused") {
      await supabase.auth.signOut();
      setSubmitting(false);
      toast({
        title: "Compte en pause",
        description: "Ce compte enfant a été mis en pause par un moniteur.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(false);

    toast({ title: "Heureux de te revoir !", description: "Connexion réussie." });
    navigate("/profil", { replace: true });
  };

  return (
    <AuthLayout
      title="Se connecter"
      subtitle="Retrouve tes quizz et ton classement."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="text-foreground font-medium hover:text-accent transition-colors">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              to="/mot-de-passe-oublie"
              className="text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              Oublié ?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Connexion;
