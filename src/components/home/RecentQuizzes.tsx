import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RecentQuiz {
  id: string;
  title: string;
  publish_date: string;
  participants: number;
}

const fmtShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

export const RecentQuizzes = () => {
  const [list, setList] = useState<RecentQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: quizzes }, { data: attempts }] = await Promise.all([
        supabase
          .from("quizzes")
          .select("id, title, publish_date")
          .eq("is_published", true)
          .lte("publish_date", today)
          .order("publish_date", { ascending: false })
          .limit(5),
        supabase.from("quiz_attempts").select("quiz_id, user_id"),
      ]);

      // Compte des participants uniques par quiz
      const uniques = new Map<string, Set<string>>();
      (attempts ?? []).forEach((a: { quiz_id: string; user_id: string }) => {
        const set = uniques.get(a.quiz_id) ?? new Set<string>();
        set.add(a.user_id);
        uniques.set(a.quiz_id, set);
      });

      setList(
        ((quizzes ?? []) as { id: string; title: string; publish_date: string }[]).map((q) => ({
          ...q,
          participants: uniques.get(q.id)?.size ?? 0,
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </section>
    );
  }

  if (list.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-3 sm:p-6 md:p-8 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-accent">
            <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium">
              Historique
            </span>
          </div>
          <h2 className="mt-1.5 sm:mt-2 font-serif text-xl sm:text-2xl font-semibold leading-tight">
            Les derniers quizz
          </h2>
        </div>
        <Link
          to="/quizz"
          className="shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm text-accent hover:text-accent/80 transition-colors mt-1"
          aria-label="Voir tous les quizz"
        >
          <span className="hidden xs:inline">Tout voir</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-4 sm:mt-6 divide-y divide-border/60">
        {list.map((q) => (
          <li key={q.id}>
            <Link
              to={`/quizz/${q.id}`}
              className="flex items-center gap-3 sm:gap-4 py-2.5 sm:py-3 group transition-smooth active:bg-muted/40 sm:hover:pl-2 -mx-1 px-1 rounded-md min-h-11"
            >
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground w-12 sm:w-16 shrink-0 tabular-nums">
                {fmtShortDate(q.publish_date)}
              </span>
              <span className="flex-1 text-sm sm:text-base font-medium group-hover:text-accent transition-colors truncate">
                {q.title}
              </span>
              {q.participants > 0 && (
                <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 tabular-nums">
                  {q.participants}<span className="hidden sm:inline"> junior{q.participants > 1 ? "s" : ""}</span>
                  <span className="sm:hidden"> j.</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
