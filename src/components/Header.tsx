import { Link, NavLink } from "react-router-dom";
import { BookOpen, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { to: "/", label: "Accueil" },
  { to: "/quizz", label: "Quizz" },
  { to: "/citations", label: "Citations" },
  { to: "/classement", label: "Classement" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setFirstName("");
      return;
    }
    supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setFirstName(data?.first_name ?? ""));
  }, [user]);

  const navItems = user
    ? [
        ...baseNavItems,
        { to: "/profil", label: "Mon profil" },
        ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
      ]
    : baseNavItems;

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "À bientôt !", description: "Tu es déconnecté." });
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-night shadow-soft">
            <BookOpen className="h-4 w-4 text-gold" strokeWidth={1.5} />
          </span>
          <span className="font-serif text-base sm:text-xl font-semibold tracking-tight truncate">
            <span className="hidden xs:inline sm:inline">École du Dimanche</span>
            <span className="inline xs:hidden sm:hidden">EDD</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors relative py-1",
                  isActive
                    ? "text-foreground after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:bg-accent"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" strokeWidth={1.5} />
                {firstName || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link to="/inscription">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="lg:hidden flex h-11 w-11 -mr-2 items-center justify-center rounded-md hover:bg-secondary/60 active:bg-secondary transition-colors"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80 sm:w-96 p-0 flex flex-col">
          <SheetHeader className="border-b border-border/60 px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-night shadow-soft">
                <BookOpen className="h-4 w-4 text-gold" strokeWidth={1.5} />
              </span>
              <span className="font-serif text-base font-semibold">
                École du Dimanche
              </span>
            </SheetTitle>
          </SheetHeader>

          {user && (
            <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" strokeWidth={1.5} />
              <span className="truncate">{firstName || user.email}</span>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-border/60 px-6 py-4 flex flex-col gap-2">
            {user ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/connexion" onClick={() => setOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/inscription" onClick={() => setOpen(false)}>
                    S'inscrire
                  </Link>
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
