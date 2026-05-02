import { useEffect, useState } from "react";
import { CalendarClock, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Schedule {
  id: string;
  day_of_week: string;
  time: string;
  description: string | null;
  location: string | null;
  position: number;
}

export const Schedules = () => {
  const [list, setList] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("schedules")
        .select("*")
        .order("position", { ascending: true });
      setList((data ?? []) as Schedule[]);
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
        <CalendarClock className="h-4 w-4" strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-[0.2em] font-medium">
          Horaires
        </span>
      </div>
      <h2 className="mt-2 font-serif text-2xl font-semibold">
        Nos rendez-vous
      </h2>

      <div className="mt-6 space-y-3">
        {list.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-border/60 bg-background/40 p-4 transition-smooth hover:border-accent/40"
          >
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <p className="font-serif text-lg font-semibold">{s.day_of_week}</p>
              <p className="text-sm font-medium text-accent">{s.time}</p>
            </div>
            {s.description && (
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            )}
            {s.location && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                {s.location}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
