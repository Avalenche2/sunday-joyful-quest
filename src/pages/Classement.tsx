import { useEffect, useMemo, useState } from "react";
import { Crown, Loader2, Medal, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AttemptRow {
  user_id: string;
  score: number;
  total: number;
  completed_at: string;
}

interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
}

interface Ranked {
  userId: string;
  name: string;
  totalScore: number;
  totalQuestions: number;
  attempts: number;
  ratio: number;
}

const Classement = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: a }, { data: adminIds }] = await Promise.all([
        supabase
          .from("quiz_attempts")
          .select("user_id, score, total, completed_at"),
        supabase.rpc("get_admin_user_ids"),
      ]);

      const adminSet = new Set<string>(
        (adminIds ?? []).map((r: { get_admin_user_ids?: string } | string) =>
          typeof r === "string" ? r : (r.get_admin_user_ids as string)
        )
      );

      const list = ((a ?? []) as AttemptRow[]).filter(
        (row) => !adminSet.has(row.user_id)
      );
      setAttempts(list);

      const ids = Array.from(new Set(list.map((x) => x.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", ids);
        const map: Record<string, ProfileRow> = {};
        (profs ?? []).forEach((p) => (map[p.id] = p));
        setProfiles(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const computeRanking = (rows: AttemptRow[]): Ranked[] => {
    const agg: Record<string, Ranked> = {};
    rows.forEach((r) => {
      const p = profiles[r.user_id];
      const name = p ? `${p.first_name} ${p.last_name}`.trim() || "Anonyme" : "Anonyme";
      if (!agg[r.user_id]) {
        agg[r.user_id] = {
          userId: r.user_id,
          name,
          totalScore: 0,
          totalQuestions: 0,
          attempts: 0,
          ratio: 0,
        };
      }
      agg[r.user_id].totalScore += r.score;
      agg[r.user_id].totalQuestions += r.total;
      agg[r.user_id].attempts += 1;
    });
    return Object.values(agg)
      .map((r) => ({ ...r, ratio: r.totalQuestions ? r.totalScore / r.totalQuestions : 0 }))
      .sort((a, b) =>
        b.totalScore - a.totalScore ||
        b.ratio - a.ratio ||
        b.attempts - a.attempts
      );
  };

  const monthAttempts = useMemo(() => {
    const now = new Date();
    return attempts.filter((a) => {
      const d = new Date(a.completed_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [attempts]);

  const monthly = useMemo(() => computeRanking(monthAttempts), [monthAttempts, profiles]);
  const overall = useMemo(() => computeRanking(attempts), [attempts, profiles]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="container py-8 md:py-12 lg:py-16">
          <div className="max-w-2xl lg:max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
              Classement
            </p>
            <h1 className="mt-2 font-serif text-3xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]">
              Les meilleurs juniors
            </h1>
            <p className="mt-3 lg:mt-4 text-muted-foreground lg:text-lg">
              Découvre les enfants qui ont accumulé le plus de bonnes réponses
              ce mois-ci et depuis le début.
            </p>
            <div className="mt-5 h-px w-12 bg-accent" />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : (
            <Tabs defaultValue="month" className="mt-8">
              <TabsList className="bg-secondary/60 mb-6">
                <TabsTrigger value="month">Top du mois</TabsTrigger>
                <TabsTrigger value="all">Classement général</TabsTrigger>
              </TabsList>

              <TabsContent value="month">
                <RankingList list={monthly} currentUserId={user?.id} emptyLabel="Aucun quizz terminé ce mois-ci." />
              </TabsContent>

              <TabsContent value="all">
                <RankingList list={overall} currentUserId={user?.id} emptyLabel="Aucun quizz terminé pour l'instant." />
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

const podiumIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-4 w-4" strokeWidth={1.8} />;
  if (rank === 2 || rank === 3) return <Medal className="h-4 w-4" strokeWidth={1.8} />;
  return null;
};

const RankingList = ({
  list,
  currentUserId,
  emptyLabel,
}: {
  list: Ranked[];
  currentUserId?: string;
  emptyLabel: string;
}) => {
  if (list.length === 0) {
    return (
      <Card className="border-dashed border-border bg-secondary/30">
        <CardContent className="p-12 text-center text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-accent/60" strokeWidth={1.5} />
          <p>{emptyLabel}</p>
        </CardContent>
      </Card>
    );
  }

  const myIndex = currentUserId ? list.findIndex((r) => r.userId === currentUserId) : -1;
  const inTop = myIndex >= 0 && myIndex < 10;
  const top = list.slice(0, 10);

  return (
    <div className="space-y-3 max-w-3xl lg:max-w-4xl">
      {top.map((r, i) => (
        <RankRow key={r.userId} rank={i + 1} row={r} highlight={r.userId === currentUserId} />
      ))}

      {currentUserId && myIndex >= 10 && (
        <>
          <div className="flex items-center gap-3 my-4 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            Ta position
            <div className="flex-1 h-px bg-border" />
          </div>
          <RankRow rank={myIndex + 1} row={list[myIndex]} highlight />
        </>
      )}

      {currentUserId && !inTop && myIndex === -1 && (
        <Card className="border-dashed border-accent/40 bg-accent/5 mt-4">
          <CardContent className="p-5 text-center text-sm text-muted-foreground">
            Tu n'es pas encore classé. Termine un quizz pour apparaître ici.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const RankRow = ({
  rank,
  row,
  highlight,
}: {
  rank: number;
  row: Ranked;
  highlight: boolean;
}) => {
  const isPodium = rank <= 3;
  const initials = row.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card
      className={cn(
        "border-border/60 transition-all",
        highlight
          ? "ring-2 ring-accent shadow-gold border-accent/40"
          : "shadow-soft hover:shadow-elevated"
      )}
    >
      <CardContent className="p-4 md:p-5 flex items-center gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold",
            rank === 1 && "bg-gradient-gold text-gold-foreground shadow-gold",
            rank === 2 && "bg-secondary text-foreground border border-accent/30",
            rank === 3 && "bg-secondary text-foreground border border-accent/20",
            rank > 3 && "bg-muted text-muted-foreground"
          )}
        >
          {isPodium ? podiumIcon(rank) : rank}
        </div>

        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className={cn(
            "text-xs font-medium",
            highlight ? "bg-accent/20 text-accent-foreground" : "bg-secondary"
          )}>
            {initials || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {row.name}
            {highlight && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-accent font-semibold">
                Toi
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.attempts} quizz · {Math.round(row.ratio * 100)}% de réussite
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-serif text-2xl font-semibold text-foreground">
            {row.totalScore}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            / {row.totalQuestions} pts
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Classement;
