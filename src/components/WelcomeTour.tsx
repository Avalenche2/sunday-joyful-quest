import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Megaphone, Sparkles, Trophy, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeTourProps {
  open: boolean;
  onClose: () => void;
  firstName?: string;
}

const steps = [
  {
    icon: Sparkles,
    title: "Bienvenue dans ton espace !",
    description:
      "Ici tu retrouveras tout ton parcours : tes quizz, tes badges et ton classement. On te montre l'essentiel en quelques étapes.",
  },
  {
    icon: BookOpen,
    title: "Joue aux quizz bibliques",
    description:
      "Va dans le menu \"Quizz\" pour découvrir les quizz de la semaine. Chaque bonne réponse te rapporte des points et débloque des badges !",
    cta: { label: "Voir les quizz", to: "/quizz" },
  },
  {
    icon: Megaphone,
    title: "Reste informé(e)",
    description:
      "Les annonces du moniteur (sorties, événements, prières) sont dans l'onglet \"Annonces\". Pense à les consulter régulièrement.",
    cta: { label: "Voir les annonces", to: "/annonces" },
  },
  {
    icon: Trophy,
    title: "Gagne ta place au classement",
    description:
      "Plus tu joues et réussis, plus tu montes dans le classement mensuel. Reviens chaque jour pour le défi du jour !",
  },
  {
    icon: User,
    title: "Tout est prêt 🎉",
    description:
      "Ton profil est ici, tu peux modifier tes infos à tout moment. Bonne aventure dans la Parole !",
  },
];

export const WelcomeTour = ({ open, onClose, firstName }: WelcomeTourProps) => {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Icon className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <DialogTitle className="font-serif text-2xl">
            {step === 0 && firstName ? `Salut ${firstName} !` : current.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {step === 0 && firstName ? current.description : current.description}
          </DialogDescription>
        </DialogHeader>

        {current.cta && (
          <div className="flex justify-center">
            <Button asChild variant="outline" size="sm" onClick={onClose}>
              <Link to={current.cta.to}>{current.cta.label}</Link>
            </Button>
          </div>
        )}

        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-accent" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Passer
          </Button>
          <Button type="button" size="sm" onClick={handleNext}>
            {isLast ? "C'est parti !" : "Suivant"}
            {!isLast && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
