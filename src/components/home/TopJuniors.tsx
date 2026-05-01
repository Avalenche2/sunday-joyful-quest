import { useEffect, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Junior {
  rank: number;
  name: string;
  points: number;
}

const rankColors: Record<number, string> = {
  1: "bg-gradient-gold text-primary shadow-gold",
  2: "bg-secondary text-secondary-foreground",
  3: "bg-accent/30 text-accent-foreground",
};

export const TopJuniors = () => {
  const [list, setList] = useState<Junior[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [{ data: attempts }, { data: profiles }, { data: adminIds }] = await Promise.all([
        supabase
          .from("quiz_attempts")
          .select("user_id, score, completed_at")
          .gte("completed_at", monthStart),
        supabase.from("profiles").select("id, first_name, last_name"),
        supabase.rpc("get_admin_user_ids"),
      ]);

      const adminSet = new Set<string>(
        (adminIds ?? []).map((r: { get_admin_user_ids?: string } | string) =>
          typeof r === "string" ? r : (r.get_admin_user_ids as string)
        )
      );

      const totals = new Map<string, number>();
      (attempts ?? []).forEach((a: { user_id: string; score: number }) => {
        if (adminSet.has(a.user_id)) return;
        totals.set(a.user_id, (totals.get(a.user_id) ?? 0) + a.score);
      });

      const profileMap = new Map<string, string>();
      (profiles ?? []).forEach(
        (p: { id: string; first_name: string; last_name: string }) => {
          const last = p.last_name ? ` ${p.last_name[0]}.` : "";
          profileMap.set(p.id, `${p.first_name}${last}`.trim());
        }
      );

      const ranked = Array.from(totals.entries())
        .map(([uid, points]) => ({
          name: profileMap.get(uid) ?? "Junior",
          points,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)
        .map((j, i) => ({ ...j, rank: i + 1 }));

      setList(ranked);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 shadow-soft flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </section>
    );
  }

  if (list.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <Trophy className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-[0.2em] font-medium">
              Top juniors
            </span>
          </div>
          <h2 className="mt-2 font-serif text-2xl font-semibold">
            Les meilleurs du mois
          </h2>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {list.map((j) => (
          <li
            key={j.rank}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/40 p-3 transition-smooth hover:border-accent/40 hover:bg-secondary/40"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                rankColors[j.rank] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {j.rank}
            </span>
            <span className="flex-1 font-medium">{j.name}</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{j.points}</span> pts
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
