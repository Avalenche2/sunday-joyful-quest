import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export const Announcements = () => {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("announcements")
        .select("id, title, content, published_at")
        .lte("published_at", nowIso)
        .order("published_at", { ascending: false })
        .limit(5);
      setList((data ?? []) as Announcement[]);
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
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 md:p-8 shadow-soft">
      <div className="flex items-center gap-2 text-accent">
        <Megaphone className="h-4 w-4" strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-[0.2em] font-medium">
          Annonces
        </span>
      </div>
      <h2 className="mt-2 font-serif text-2xl font-semibold">À venir</h2>

      <div className="mt-6 space-y-4">
        {list.map((a) => (
          <article
            key={a.id}
            className="group relative pl-5 border-l-2 border-accent/30 transition-smooth hover:border-accent"
          >
            <p className="text-xs text-muted-foreground">{fmtDate(a.published_at)}</p>
            <h3 className="mt-1 font-serif text-lg font-semibold">{a.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {a.content}
            </p>
          </article>
        ))}
      </div>

      <Link
        to="/annonces"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:gap-2 transition-all"
      >
        Voir toutes les annonces
        <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
      </Link>
    </section>
  );
};
