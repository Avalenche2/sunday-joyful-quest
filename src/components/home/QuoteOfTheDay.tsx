import { useEffect, useState } from "react";
import { Loader2, Quote as QuoteIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Quote {
  quote: string;
  reference: string;
  commentary: string | null;
  quote_date: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export const QuoteOfTheDay = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = todayStr();
      let { data } = await supabase
        .from("daily_quotes")
        .select("quote, reference, commentary, quote_date")
        .eq("quote_date", today)
        .maybeSingle();

      if (!data) {
        const fallback = await supabase
          .from("daily_quotes")
          .select("quote, reference, commentary, quote_date")
          .lte("quote_date", today)
          .order("quote_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        data = fallback.data;
      }

      setQuote(data as Quote | null);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl bg-gradient-night text-primary-foreground shadow-elevated p-10 sm:p-12 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gold" />
      </section>
    );
  }

  if (!quote) return null;

  const formattedDate = new Date(quote.quote_date).toLocaleDateString("fr-FR", {
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
          <QuoteIcon className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-xs uppercase tracking-[0.2em] font-medium">
            Citation du jour
          </span>
        </div>

        <p className="mt-2 text-sm text-primary-foreground/60 capitalize">
          {formattedDate}
        </p>

        <blockquote className="mt-6 verse-quote text-primary-foreground/95 max-w-3xl">
          « {quote.quote} »
        </blockquote>

        <p className="mt-4 text-sm font-medium text-gold">
          — Frère William Marrion Branham, {quote.reference}
        </p>

        {quote.commentary && (
          <>
            <div className="mt-6 gold-divider" />
            <p className="mt-6 text-sm md:text-base text-primary-foreground/80 leading-relaxed max-w-2xl whitespace-pre-line">
              {quote.commentary}
            </p>
          </>
        )}
      </div>
    </section>
  );
};
