import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Crown,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Menu,
  Quote,
  ScrollText,
  ShieldCheck,
  Sun,
  UsersRound,
  UserCircle,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/quizz", label: "Quizz", icon: ScrollText },
  { to: "/admin/defi", label: "Défi du jour", icon: Sun },
  { to: "/admin/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/admin/evangile", label: "Évangile du jour", icon: BookOpen },
  { to: "/admin/citations", label: "Citation du jour", icon: Quote },
  { to: "/admin/annonces", label: "Annonces", icon: Megaphone },
  { to: "/admin/horaires", label: "Horaires", icon: CalendarDays },
  { to: "/admin/enfants", label: "Enfants", icon: UsersRound },
  { to: "/admin/moniteurs", label: "Moniteurs", icon: UserCog },
  { to: "/admin/profil", label: "Mon profil", icon: UserCircle },
];

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export const AdminLayout = () => {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [navMounted, setNavMounted] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Close drawer on route change
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Mount drawer in DOM whenever it opens; unmount after exit transition completes
  useEffect(() => {
    if (navOpen) {
      setNavMounted(true);
      return;
    }
    if (!navMounted) return;
    const t = setTimeout(() => setNavMounted(false), 320);
    return () => clearTimeout(t);
  }, [navOpen, navMounted]);

  // Mobile drawer behaviour: outside click, escape, swipe-left to close, body lock
  useEffect(() => {
    if (!navOpen) return;
    const isMobile = () => window.matchMedia("(max-width: 1023px)").matches;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!isMobile()) return;
      const target = e.target as Node | null;
      if (asideRef.current && target && !asideRef.current.contains(target)) {
        setNavOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartX.current = t.clientX;
      touchStartY.current = t.clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current == null || touchStartY.current == null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      if (dx < -50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        setNavOpen(false);
      }
    };

    const prevOverflow = document.body.style.overflow;
    if (isMobile()) document.body.style.overflow = "hidden";

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKey);
    const aside = asideRef.current;
    aside?.addEventListener("touchstart", onTouchStart, { passive: true });
    aside?.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
      aside?.removeEventListener("touchstart", onTouchStart);
      aside?.removeEventListener("touchend", onTouchEnd);
    };
  }, [navOpen]);

  if (loading) {
    return (
      <Shell>
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return <Navigate to="/admin/connexion" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <Shell>
        <section className="container py-16 max-w-xl">
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-10 text-center">
              <ShieldCheck className="h-10 w-10 mx-auto text-accent mb-3" strokeWidth={1.5} />
              <h2 className="font-serif text-2xl">Accès réservé</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cet espace est réservé aux moniteurs.
              </p>
              <Button asChild className="mt-6">
                <Link to="/">Retour à l'accueil</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </Shell>
    );
  }

  const activeLink =
    links.find((l) => location.pathname === l.to) ||
    links.find((l) => !l.end && location.pathname.startsWith(l.to)) ||
    links[0];


  return (
    <Shell>
      <section className="container py-6 md:py-12 px-4 md:px-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] md:tracking-[0.3em] text-accent font-medium">
              Espace moniteur
            </p>
            {isSuperAdmin && (
              <Badge className="bg-accent text-accent-foreground hover:bg-accent gap-1 h-5 px-2 text-[10px] uppercase tracking-wider">
                <Crown className="h-3 w-3" strokeWidth={2} />
                Super admin
              </Badge>
            )}
          </div>
          <h1 className="mt-2 font-serif text-2xl md:text-4xl font-semibold leading-[1.1]">
            Administration
          </h1>
          <div className="mt-4 md:mt-5 h-px w-12 bg-accent" />
        </div>

        {/* Mobile trigger button (above content, not inside aside) */}
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="lg:hidden w-full mb-4 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border/60 bg-secondary/40 text-sm font-medium hover:bg-secondary/60 transition-colors"
          aria-expanded={navOpen}
          aria-controls="admin-nav"
          aria-haspopup="menu"
          aria-label="Ouvrir le menu d'administration"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Menu className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <activeLink.icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden="true" />
            <span className="truncate">{activeLink.label}</span>
          </span>
          <ChevronDown
            className="h-4 w-4 -rotate-90"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>

        {/* Mobile overlay (mounted while drawer is open OR animating out) */}
        {navMounted && (
          <div
            className={cn(
              "lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm",
              "transition-opacity duration-300 ease-out motion-reduce:transition-none",
              navOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[200px_1fr] xl:grid-cols-[240px_1fr]">
          <aside
            ref={asideRef}
            className={cn(
              // Desktop: in-flow sidebar
              "lg:relative lg:translate-x-0 lg:w-auto lg:max-w-none lg:bg-transparent lg:shadow-none lg:border-0 lg:p-0 lg:z-auto lg:transition-none lg:visible lg:opacity-100",
              // Mobile: fixed drawer from left
              "fixed inset-y-0 left-0 z-50 w-[80vw] max-w-[300px] bg-background border-r border-border/60 shadow-2xl p-4 overflow-y-auto",
              "will-change-transform transform-gpu",
              "transition-[transform,opacity,visibility] duration-300 ease-out motion-reduce:transition-none",
              navOpen
                ? "translate-x-0 opacity-100 visible"
                : "-translate-x-full opacity-0 invisible lg:visible lg:opacity-100"
            )}
            aria-hidden={!navOpen ? true : undefined}
            aria-label="Navigation administration"
          >
            {/* Mobile drawer header */}
            <div className="lg:hidden flex items-center justify-between mb-4 pb-3 border-b border-border/60">
              <p className="text-[10px] uppercase tracking-[0.25em] text-accent font-medium">
                Navigation
              </p>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-label="Fermer le menu"
              >
                Fermer
              </button>
            </div>

            <nav
              id="admin-nav"
              role="menu"
              aria-label="Navigation administration"
              className="flex flex-col gap-1"
            >
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    onClick={() => setNavOpen(false)}
                    role="menuitem"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-2.5 lg:py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{l.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </section>
    </Shell>
  );
};
