import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, CheckCircle2, Circle, Loader2, Search, Sparkles } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  publish_date: string;
  bible_reference: string | null;
  is_published: boolean;
}

type FilterStatus = "all" | "done" | "todo";
const PAGE_SIZE = 6;

const Quizz = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [searchDate, setSearchDate] = useState<string>("");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data: q } = await supabase
        .from("quizzes")
        .select("id, title, description, publish_date, bible_reference, is_published")
        .eq("is_published", true)
        .lte("publish_date", today)
        .order("publish_date", { ascending: false });

      setQuizzes(q ?? []);

      if (user) {
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("quiz_id")
          .eq("user_id", user.id);
        setDoneIds(new Set((attempts ?? []).map((a) => a.quiz_id)));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      if (searchDate && q.publish_date !== searchDate) return false;
      if (status === "done" && !doneIds.has(q.id)) return false;
      if (status === "todo" && doneIds.has(q.id)) return false;
      return true;
    });
  }, [quizzes, searchDate, status, doneIds]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const isCurrent = (dateStr: string) => {
    const d = parseISO(dateStr);
    return d >= weekStart && d <= weekEnd;
  };

  const resetFilters = () => {
    setSearchDate("");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* En-tête */}
        <section className="container py-8 md:py-12 lg:py-16">
          <div className="max-w-2xl lg:max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
              Calendrier
            </p>
            <h1 className="mt-2 font-serif text-3xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]">
              Tous les quizz bibliques
            </h1>
            <p className="mt-3 lg:mt-4 text-muted-foreground lg:text-lg">
              Retrouve tous les quizz publiés. Filtre par date ou par statut
              pour voir ceux que tu n'as pas encore faits.
            </p>
            <div className="mt-5 h-px w-12 bg-accent" />
          </div>

          {/* Filtres */}
          <Card className="mt-8 border-border/60 shadow-soft">
            <CardContent className="p-5 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="search-date" className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <Search className="h-3.5 w-3.5" /> Recherche par date
                </Label>
                <Input
                  id="search-date"
                  type="date"
                  value={searchDate}
                  onChange={(e) => {
                    setSearchDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Statut
                </Label>
                <Select
                  value={status}
                  onValueChange={(v: FilterStatus) => {
                    setStatus(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="done">Déjà faits</SelectItem>
                    <SelectItem value="todo">À faire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={resetFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Réinitialiser
              </Button>
            </CardContent>
          </Card>

          {!user && (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/connexion" className="text-foreground underline hover:text-accent">Connecte-toi</Link>{" "}
              pour suivre les quizz que tu as faits.
            </p>
          )}
        </section>

        {/* Liste */}
        <section className="container pb-16">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : visible.length === 0 ? (
            <Card className="border-dashed border-border bg-secondary/30">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-accent/60" strokeWidth={1.5} />
                <p className="font-serif text-xl text-foreground">Aucun quizz trouvé</p>
                <p className="text-sm mt-1">Essaye un autre filtre ou une autre date.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:gap-6 xl:gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((q) => {
                const done = doneIds.has(q.id);
                const fresh = isCurrent(q.publish_date);
                return (
                  <Link
                    key={q.id}
                    to={`/quizz/${q.id}`}
                    className="group block"
                  >
                    <Card
                      className={cn(
                        "h-full border-border/60 shadow-soft transition-all duration-300",
                        "group-hover:shadow-elevated group-hover:-translate-y-0.5",
                        fresh && "ring-1 ring-accent/40"
                      )}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <time className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {format(parseISO(q.publish_date), "EEEE d MMMM yyyy", { locale: fr })}
                          </time>
                          {fresh && (
                            <Badge className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1 shrink-0">
                              <Sparkles className="h-3 w-3" /> Nouveau
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-serif text-xl font-semibold leading-snug group-hover:text-accent transition-colors">
                          {q.title}
                        </h3>

                        {q.bible_reference && (
                          <p className="mt-1 text-xs text-accent font-medium tracking-wide">
                            {q.bible_reference}
                          </p>
                        )}

                        {q.description && (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                            {q.description}
                          </p>
                        )}

                        <div className="mt-auto pt-5 flex items-center justify-between border-t border-border/60 mt-5">
                          {done ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
                              <CheckCircle2 className="h-4 w-4" /> Quizz terminé
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Circle className="h-4 w-4" /> À faire
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                            Ouvrir →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && pageCount > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {Array.from({ length: pageCount }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(pageCount, p + 1));
                    }}
                    className={cn(currentPage === pageCount && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Quizz;
