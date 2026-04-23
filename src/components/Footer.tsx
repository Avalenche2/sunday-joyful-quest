import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Footer = () => {
  const { isAdmin } = useAuth();
  return (
    <footer className="border-t border-border/60 bg-gradient-soft">
      <div className="container py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="gold-divider" />
          <p className="font-serif text-lg italic text-muted-foreground">
            « Laissez venir à moi les petits enfants. »
          </p>
          <p className="text-xs text-muted-foreground/80">— Marc 10:14</p>
          {isAdmin && (
            <Link
              to="/admin"
              className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-accent transition-colors"
            >
              Espace moniteur
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};
