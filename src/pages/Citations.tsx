import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Quote as QuoteIcon, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

interface Quote {
  id: string;
  quote: string;
  reference: string;
  commentary: string | null;
  quote_date: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const Citations = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 200);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("daily_quotes")
        .select("id, quote, reference, commentary, quote_date")
        .lte("quote_date", todayStr())
        .order("quote_date", { ascending: false });
      setQuotes((data ?? []) as Quote[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (item) =>
        item.quote.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        (item.commentary?.toLowerCase().includes(q) ?? false)
    );
  }, [quotes, debounced]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="container pt-12 lg:pt-16 pb-8">
          <div className="max-w-2xl lg:max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
              Archive spirituelle
            </p>
            <h1 className="mt-3 font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]">
              Citations de Frère Branham
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed lg:text-lg">
              Retrouve toutes les citations de Frère William Marrion Branham
              partagées jour après jour.
            </p>
            <div className="mt-6 gold-divider" />
          </div>
        </section>

        <section className="container pb-16">
          <div className="relative max-w-xl mb-8">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              strokeWidth={1.8}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par mot-clé, sermon, lieu…"
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-10 text-center">
                <QuoteIcon
                  className="h-10 w-10 mx-auto text-accent mb-3"
                  strokeWidth={1.5}
                />
                <p className="font-serif text-lg">
                  {quotes.length === 0
                    ? "Aucune citation publiée pour l'instant."
                    : "Aucune citation ne correspond à ta recherche."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((q) => (
                <Card key={q.id} className="shadow-soft hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-2 text-accent">
                      <QuoteIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
                      <span className="text-[11px] uppercase tracking-wider font-semibold">
                        {format(new Date(q.quote_date), "d MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    <blockquote className="mt-4 verse-quote text-foreground/95 max-w-3xl">
                      « {q.quote} »
                    </blockquote>
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                      — Frère William Marrion Branham, {q.reference}
                    </p>
                    {q.commentary && (
                      <>
                        <div className="mt-5 h-px w-12 bg-accent/40" />
                        <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {q.commentary}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Citations;
