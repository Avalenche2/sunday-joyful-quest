import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Megaphone, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

type YearFilter = number | "all";

const PAGE_SIZE = 10;

const Annonces = () => {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<YearFilter>("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    const load = async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("announcements")
        .select("id, title, content, published_at")
        .lte("published_at", nowIso)
        .order("published_at", { ascending: false });
      setList((data ?? []) as Announcement[]);
      setLoading(false);
    };
    load();
  }, []);

  // Années disponibles (triées du plus récent au plus ancien)
  const years = useMemo(() => {
    const set = new Set<number>();
    list.forEach((a) => set.add(new Date(a.published_at).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [list]);

  // Filtrage combiné : année + recherche texte (titre ou contenu) — debouncée
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return list.filter((a) => {
      if (year !== "all" && new Date(a.published_at).getFullYear() !== year) {
        return false;
      }
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
      );
    });
  }, [list, year, debouncedQuery]);

  // Reset pagination quand un filtre change
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [year, debouncedQuery]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-3xl lg:max-w-4xl py-12 md:py-16 lg:py-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-smooth mb-6"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Retour à l'accueil
        </Link>

        <div className="flex items-center gap-2 text-accent">
          <Megaphone className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-xs uppercase tracking-[0.2em] font-medium">
            Annonces
          </span>
        </div>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold">
          Toutes les annonces
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Retrouve ici l'historique complet des annonces de la paroisse.
        </p>

        {/* Recherche texte */}
        <div className="mt-8 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            strokeWidth={1.8}
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans les annonces…"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* Filtres par année (affichés uniquement si plusieurs années) */}
        {years.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">
              Filtrer :
            </span>
            <button
              type="button"
              onClick={() => setYear("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-smooth",
                year === "all"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
              )}
            >
              Toutes
            </button>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-smooth",
                  year === y
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            {list.length === 0
              ? "Aucune annonce pour le moment."
              : debouncedQuery
                ? `Aucun résultat pour « ${debouncedQuery} »${year !== "all" ? ` en ${year}` : ""}.`
                : "Aucune annonce pour cette année."}
          </p>
        ) : (
          <>
            <p className="mt-6 text-xs text-muted-foreground">
              {filtered.length} annonce{filtered.length > 1 ? "s" : ""}
              {year !== "all" && ` en ${year}`}
              {debouncedQuery && ` pour « ${debouncedQuery} »`}
            </p>

            <div className="mt-4 space-y-6">
              {shown.map((a) => (
                <article
                  key={a.id}
                  className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft transition-smooth hover:shadow-elevated"
                >
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(a.published_at)}
                  </p>
                  <h2 className="mt-1 font-serif text-xl md:text-2xl font-semibold">
                    {a.title}
                  </h2>
                  <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                    {a.content}
                  </p>
                </article>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Voir plus ({filtered.length - visible} restante
                  {filtered.length - visible > 1 ? "s" : ""})
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Annonces;
