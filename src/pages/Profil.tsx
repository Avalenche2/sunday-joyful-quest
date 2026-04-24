import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BadgeGrid } from "@/components/BadgeGrid";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { WelcomeTour } from "@/components/WelcomeTour";
import {
  BADGES,
  computeUnlockedBadges,
  type AttemptLite,
  type DailyChallengeAttemptLite,
} from "@/lib/badges";

interface ProfileRow {
  first_name: string;
  last_name: string;
  age: number | null;
}

interface AttemptWithQuiz extends AttemptLite {
  quizzes: { title: string } | null;
}

const Profil = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithQuiz[]>([]);
  const [challengeAttempts, setChallengeAttempts] = useState<DailyChallengeAttemptLite[]>([]);
  const [monthlyRank, setMonthlyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const state = location.state as { welcome?: boolean } | null;
    if (state?.welcome) {
      setShowWelcome(true);
      // Nettoie le state pour ne pas rejouer le tour au refresh
      navigate(location.pathname, { replace: true, state: {} });
    } else if (user && typeof window !== "undefined") {
      // Affiche aussi le tour à la 1ère visite (fallback si state perdu)
      const key = `welcome_tour_seen_${user.id}`;
      if (!localStorage.getItem(key)) {
        setShowWelcome(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const closeWelcome = () => {
    setShowWelcome(false);
    if (user) {
      localStorage.setItem(`welcome_tour_seen_${user.id}`, "1");
    }
  };

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      const [profileRes, attemptsRes, challengeRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name, last_name, age")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("quiz_attempts")
          .select("id, quiz_id, score, total, completed_at, quizzes(title)")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false }),
        supabase
          .from("daily_challenge_attempts")
          .select("challenge_date, is_correct")
          .eq("user_id", user.id),
      ]);

      setProfile(profileRes.data ?? null);
      setAttempts((attemptsRes.data ?? []) as unknown as AttemptWithQuiz[]);
      setChallengeAttempts((challengeRes.data ?? []) as DailyChallengeAttemptLite[]);

      // Rang mensuel : agrège par utilisateur sur le mois en cours
      const now = new Date();
      const allMonth = (
        await supabase
          .from("quiz_attempts")
          .select("user_id, score, completed_at")
      ).data ?? [];
      const monthAgg: Record<string, number> = {};
      allMonth.forEach((a) => {
        const d = new Date(a.completed_at);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          monthAgg[a.user_id] = (monthAgg[a.user_id] ?? 0) + a.score;
        }
      });
      const ranking = Object.entries(monthAgg)
        .sort((a, b) => b[1] - a[1])
        .map(([uid]) => uid);
      const idx = ranking.indexOf(user.id);
      setMonthlyRank(idx >= 0 ? idx + 1 : null);

      setLoading(false);
    };
    load();
  }, [user]);

  const stats = useMemo(() => {
    const total = attempts.length;
    const totalScore = attempts.reduce((s, a) => s + a.score, 0);
    const totalQuestions = attempts.reduce((s, a) => s + a.total, 0);
    const avgPct = totalQuestions ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const best = attempts.reduce<AttemptWithQuiz | null>((b, a) => {
      const ratio = a.total ? a.score / a.total : 0;
      const bRatio = b && b.total ? b.score / b.total : -1;
      if (!b || ratio > bRatio || (ratio === bRatio && a.score > b.score)) return a;
      return b;
    }, null);
    return { total, totalScore, avgPct, best };
  }, [attempts]);

  const unlocked = useMemo(
    () => computeUnlockedBadges(attempts, { rank: monthlyRank }, challengeAttempts),
    [attempts, monthlyRank, challengeAttempts]
  );

  if (!authLoading && !user) {
    return <Navigate to="/connexion" replace />;
  }

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";
  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="container py-8 md:py-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
            Mon profil
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-5xl font-semibold leading-[1.1]">
            Mon parcours
          </h1>
          <div className="mt-5 h-px w-12 bg-accent" />

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              {/* Colonne identité + stats */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="shadow-soft">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarFallback className="bg-gradient-night text-gold font-serif text-2xl">
                        {initials || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="font-serif text-2xl font-semibold">
                      {fullName || "Profil"}
                    </h2>
                    {profile?.age != null && (
                      <p className="text-sm text-muted-foreground">{profile.age} ans</p>
                    )}
                    {monthlyRank && (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                        <Trophy className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {monthlyRank}{monthlyRank === 1 ? "er" : "ème"} ce mois-ci
                      </div>
                    )}
                    {profile && (
                      <div className="mt-4 flex flex-col items-center gap-2 w-full">
                        <EditProfileDialog
                          initial={{
                            firstName: profile.first_name,
                            lastName: profile.last_name,
                            age: profile.age,
                          }}
                          onSaved={(next) =>
                            setProfile({
                              first_name: next.firstName,
                              last_name: next.lastName,
                              age: next.age,
                            })
                          }
                        />
                        <ChangePasswordDialog
                          triggerVariant="outline"
                          triggerSize="sm"
                          triggerClassName="mt-0"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={CheckCircle2} label="Quizz faits" value={String(stats.total)} />
                  <StatCard icon={TrendingUp} label="Réussite" value={`${stats.avgPct}%`} />
                  <StatCard icon={Target} label="Points totaux" value={String(stats.totalScore)} />
                  <StatCard icon={Sparkles} label="Badges" value={`${unlocked.size}/${BADGES.length}`} />
                </div>

                {stats.best && (
                  <Card className="shadow-soft border-accent/30">
                    <CardContent className="p-5">
                      <p className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-2">
                        Meilleur quizz
                      </p>
                      <p className="font-medium leading-tight">
                        {stats.best.quizzes?.title ?? "Quizz"}
                      </p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-serif text-3xl font-semibold">
                          {stats.best.score}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {stats.best.total}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Colonne badges + historique */}
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-2xl font-semibold flex items-center gap-2">
                      <Award className="h-5 w-5 text-accent" strokeWidth={1.8} />
                      Mes badges
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {unlocked.size} sur {BADGES.length}
                    </span>
                  </div>
                  <BadgeGrid unlocked={unlocked} />
                </section>

                <section>
                  <h3 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" strokeWidth={1.8} />
                    Historique récent
                  </h3>
                  {attempts.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-10 text-center text-muted-foreground">
                        <p>Tu n'as encore terminé aucun quizz.</p>
                        <Button asChild className="mt-4">
                          <Link to="/quizz">Voir les quizz</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {attempts.slice(0, 8).map((a) => {
                        const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
                        return (
                          <Link
                            key={a.id}
                            to={`/quizz/${a.quiz_id}/recap`}
                            className="block"
                          >
                            <Card className="shadow-soft hover:shadow-elevated transition-shadow">
                              <CardContent className="p-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {a.quizzes?.title ?? "Quizz"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(a.completed_at), "d MMMM yyyy", { locale: fr })}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-serif text-xl font-semibold">
                                    {a.score}/{a.total}
                                  </p>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {pct}% de réussite
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
}) => (
  <Card className="shadow-soft">
    <CardContent className="p-4">
      <Icon className="h-4 w-4 text-accent mb-2" strokeWidth={1.8} />
      <p className="font-serif text-2xl font-semibold leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </p>
    </CardContent>
  </Card>
);

export default Profil;
