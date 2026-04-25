import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Megaphone,
  Quote,
  ScrollText,
  Sparkles,
  Sun,
  Users,
  UserX,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PendingAdminRequests } from "@/components/admin/PendingAdminRequests";

interface Stats {
  quizzes: number;
  scheduledQuizzes: number;
  attempts: number;
  announcements: number;
  schedules: number;
  users: number;
  pausedChildren: number;
  gospel: number;
  quotes: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [q, sq, a, an, s, u, paused, gospel, quotes] = await Promise.all([
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase
          .from("quizzes")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true)
          .gt("publish_date", today),
        supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("schedules").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "enfant"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "paused"),
        supabase.from("daily_gospel").select("id", { count: "exact", head: true }),
        supabase.from("daily_quotes").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        quizzes: q.count ?? 0,
        scheduledQuizzes: sq.count ?? 0,
        attempts: a.count ?? 0,
        announcements: an.count ?? 0,
        schedules: s.count ?? 0,
        users: u.count ?? 0,
        pausedChildren: paused.count ?? 0,
        gospel: gospel.count ?? 0,
        quotes: quotes.count ?? 0,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "Quizz", value: stats?.quizzes, icon: ScrollText, to: "/admin/quizz", detail: "bibliques créés" },
    {
      label: "Quizz programmés",
      value: stats?.scheduledQuizzes,
      icon: CalendarClock,
      to: "/admin/quizz",
      detail: "à venir",
      accent: true,
    },
    { label: "Participations", value: stats?.attempts, icon: Users, to: "/admin/statistiques", detail: "réponses enfants" },
    { label: "Annonces", value: stats?.announcements, icon: Megaphone, to: "/admin/annonces", detail: "publiées" },
    { label: "Horaires", value: stats?.schedules, icon: CalendarDays, to: "/admin/horaires", detail: "créneaux" },
    { label: "Enfants inscrits", value: stats?.users, icon: BookOpen, to: "/admin/enfants", detail: "comptes actifs ou pause" },
    { label: "Comptes en pause", value: stats?.pausedChildren, icon: UserX, to: "/admin/enfants", detail: "à surveiller" },
    { label: "Évangiles", value: stats?.gospel, icon: Sun, to: "/admin/evangile", detail: "jours préparés" },
    { label: "Citations", value: stats?.quotes, icon: Quote, to: "/admin/citations", detail: "jours préparés" },
  ];

  const quickActions = [
    { label: "Publier un quizz", to: "/admin/quizz/nouveau", icon: ScrollText },
    { label: "Ajouter une annonce", to: "/admin/annonces", icon: Megaphone },
    { label: "Préparer l'évangile", to: "/admin/evangile", icon: Sun },
    { label: "Gérer les enfants", to: "/admin/enfants", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <PendingAdminRequests />

      <Card className="overflow-hidden border-border/60 bg-gradient-night text-primary-foreground shadow-elevated">
        <CardContent className="p-6 md:p-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> Centre de mission
            </div>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl font-semibold leading-tight">
              Pilote l'école du dimanche en un coup d'œil.
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/75">
              Accède vite aux contenus du jour, aux enfants inscrits et aux actions importantes.
            </p>
          </div>
          <Button asChild variant="secondary" className="w-full md:w-auto">
            <Link to="/admin/statistiques">
              Voir les statistiques <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const highlight = c.accent && (c.value ?? 0) > 0;
          return (
            <Link key={c.label} to={c.to}>
              <Card
                className={
                  "shadow-soft hover:shadow-elevated transition-shadow " +
                  (highlight ? "border-gold/40 bg-gold/5" : "")
                }
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Icon
                      className={"h-4 w-4 " + (highlight ? "text-gold" : "text-accent")}
                      strokeWidth={1.8}
                    />
                    {highlight && <CheckCircle2 className="h-4 w-4 text-gold" strokeWidth={1.8} />}
                  </div>
                  <p className="mt-3 font-serif text-3xl font-semibold leading-none">{c.value ?? "—"}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    {c.label}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{c.detail}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-serif text-xl font-semibold">Actions rapides</h3>
              <p className="text-sm text-muted-foreground mt-1">Les raccourcis les plus utilisés par les moniteurs.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full md:w-auto">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button key={action.to} asChild variant="outline" className="justify-start">
                    <Link to={action.to}>
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
