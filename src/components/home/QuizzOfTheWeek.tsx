import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookMarked } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeaturedQuiz {
  id: string;
  title: string;
  description: string | null;
  bible_reference: string | null;
  questionCount: number;
}

export const QuizzOfTheWeek = () => {
  const [quiz, setQuiz] = useState<FeaturedQuiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, description, bible_reference, publish_date, questions(count)")
        .eq("is_published", true)
        .order("publish_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const q = data as unknown as {
          id: string;
          title: string;
          description: string | null;
          bible_reference: string | null;
          questions: { count: number }[];
        };
        setQuiz({
          id: q.id,
          title: q.title,
          description: q.description,
          bible_reference: q.bible_reference,
          questionCount: q.questions?.[0]?.count ?? 0,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 md:p-8 shadow-soft space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-11 w-full rounded-md mt-4" />
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 md:p-8 shadow-soft transition-smooth hover:shadow-elevated">
      <div className="absolute top-0 right-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-gold/10 blur-2xl" aria-hidden />

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
            <BookMarked className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </span>
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">
            Nouveau
          </Badge>
        </div>

        <h3 className="mt-5 font-serif text-2xl font-semibold">
          Dernier quizz publié
        </h3>
        <p className="mt-1 font-serif text-lg text-accent italic line-clamp-2">
          {quiz.title}
        </p>

        {quiz.description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {quiz.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {quiz.questionCount > 0 && (
            <span className="flex items-center gap-1.5">
              <BookMarked className="h-3.5 w-3.5" strokeWidth={1.5} />
              {quiz.questionCount} question{quiz.questionCount > 1 ? "s" : ""}
            </span>
          )}
          {quiz.bible_reference && (
            <span className="text-accent font-medium">{quiz.bible_reference}</span>
          )}
        </div>

        <Button asChild className="mt-6 w-full group" size="lg">
          <Link to={`/quizz/${quiz.id}`}>
            Commencer le quizz
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
