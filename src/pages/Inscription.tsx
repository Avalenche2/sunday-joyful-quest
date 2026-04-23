import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { signUpSchema } from "@/lib/validation";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Inscription = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  if (!authLoading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submitLockRef.current || authLoading) return;
    setErrors({});

    const parsed = signUpSchema.safeParse({
      firstName,
      lastName,
      age: age ? Number(age) : undefined,
      parentFirstName,
      parentLastName,
      parentPhone,
      email,
      password,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: parsed.data.firstName,
            last_name: parsed.data.lastName,
            age: parsed.data.age,
            parent_first_name: parsed.data.parentFirstName,
            parent_last_name: parsed.data.parentLastName,
            parent_phone: parsed.data.parentPhone,
          },
        },
      });

      if (error) {
        const msg = error.message.includes("already registered")
          ? "Cet email est déjà inscrit. Connecte-toi."
          : error.status === 429 || error.message.toLowerCase().includes("rate limit")
            ? "Trop de tentatives d'inscription. Patiente quelques minutes puis réessaie."
            : error.message;
        toast({ title: "Inscription impossible", description: msg, variant: "destructive" });
        return;
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      toast({
        title: "Compte créé ! 🎉",
        description: "Connecte-toi maintenant pour accéder à ton espace enfant.",
      });
      navigate("/connexion", { replace: true });
    } finally {
      setSubmitting(false);
      window.setTimeout(() => {
        submitLockRef.current = false;
      }, 1500);
    }
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Rejoins l'École du Dimanche et joue aux quizz bibliques."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link to="/connexion" className="text-foreground font-medium hover:text-accent transition-colors">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="age">Âge</Label>
          <Input
            id="age"
            type="number"
            min={4}
            max={18}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
          {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
        </div>

        <div className="pt-2 mt-2 border-t border-border/60">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent font-medium mb-3">
            Coordonnées du parent
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="parentFirstName">Prénom du parent</Label>
              <Input
                id="parentFirstName"
                value={parentFirstName}
                onChange={(e) => setParentFirstName(e.target.value)}
                autoComplete="off"
                required
              />
              {errors.parentFirstName && (
                <p className="text-xs text-destructive">{errors.parentFirstName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parentLastName">Nom du parent</Label>
              <Input
                id="parentLastName"
                value={parentLastName}
                onChange={(e) => setParentLastName(e.target.value)}
                autoComplete="off"
                required
              />
              {errors.parentLastName && (
                <p className="text-xs text-destructive">{errors.parentLastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mt-3">
            <Label htmlFor="parentPhone">Téléphone du parent</Label>
            <Input
              id="parentPhone"
              type="tel"
              inputMode="tel"
              placeholder="06 12 34 56 78"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              autoComplete="tel"
              required
            />
            {errors.parentPhone && (
              <p className="text-xs text-destructive">{errors.parentPhone}</p>
            )}
          </div>
        </div>

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
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer mon compte
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Inscription;
