import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Gospel {
  reference: string;
  verse: string;
  commentary: string | null;
  gospel_date: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export const GospelOfTheDay = () => {
  const [gospel, setGospel] = useState<Gospel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = todayStr();
      // Cherche d'abord celui d'aujourd'hui, sinon le plus récent <= aujourd'hui
      let { data } = await supabase
        .from("daily_gospel")
        .select("reference, verse, commentary, gospel_date")
        .eq("gospel_date", today)
        .maybeSingle();

      if (!data) {
        const fallback = await supabase
          .from("daily_gospel")
          .select("reference, verse, commentary, gospel_date")
          .lte("gospel_date", today)
          .order("gospel_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        data = fallback.data;
      }

      setGospel(data as Gospel | null);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl bg-gradient-night text-primary-foreground shadow-elevated p-5 sm:p-8 md:p-12">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded bg-primary-foreground/10" />
          <Skeleton className="h-3 w-28 bg-primary-foreground/10" />
        </div>
        <Skeleton className="mt-4 h-3 w-40 bg-primary-foreground/10" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-5 w-full bg-primary-foreground/10" />
          <Skeleton className="h-5 w-11/12 bg-primary-foreground/10" />
          <Skeleton className="h-5 w-3/4 bg-primary-foreground/10" />
        </div>
        <Skeleton className="mt-5 h-3 w-24 bg-primary-foreground/10" />
      </section>
    );
  }

  if (!gospel) return null;

  const formattedDate = new Date(gospel.gospel_date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-night text-primary-foreground shadow-elevated">
      <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gold blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-gold blur-3xl" />
      </div>

      <div className="relative p-5 sm:p-8 md:p-12">
        <div className="flex items-center gap-2 text-gold">
          <Sparkles className="h-4 w-4 animate-shimmer" strokeWidth={1.5} />
          <span className="text-xs uppercase tracking-[0.2em] font-medium">
            Évangile du jour
          </span>
        </div>

        <p className="mt-2 text-sm text-primary-foreground/60 capitalize">
          {formattedDate}
        </p>

        <blockquote className="mt-6 verse-quote text-primary-foreground/95 max-w-3xl">
          « {gospel.verse} »
        </blockquote>

        <p className="mt-4 text-sm font-medium text-gold">— {gospel.reference}</p>

        {gospel.commentary && (
          <>
            <div className="mt-6 gold-divider" />
            <p className="mt-6 text-sm md:text-base text-primary-foreground/80 leading-relaxed max-w-2xl whitespace-pre-line">
              {gospel.commentary}
            </p>
          </>
        )}
      </div>
    </section>
  );
};
