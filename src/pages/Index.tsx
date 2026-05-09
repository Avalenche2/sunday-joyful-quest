import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GospelOfTheDay } from "@/components/home/GospelOfTheDay";
import { QuoteOfTheDay } from "@/components/home/QuoteOfTheDay";
import { QuizzOfTheWeek } from "@/components/home/QuizzOfTheWeek";
import { TopJuniors } from "@/components/home/TopJuniors";
import { Schedules } from "@/components/home/Schedules";
import { Announcements } from "@/components/home/Announcements";
import { RecentQuizzes } from "@/components/home/RecentQuizzes";
import { DailyChallenge } from "@/components/home/DailyChallenge";

/**
 * Wrapper qui se replie automatiquement quand son enfant ne rend rien.
 * Repose sur `:has()` (CSS) — large support sur navigateurs modernes.
 */
const Cell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`[&:not(:has(*))]:hidden ${className}`}>{children}</div>
);

const Row = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section
    className={`container px-3 sm:px-6 py-3 sm:py-6 md:py-10 lg:py-12 [&:not(:has(*>*))]:hidden ${className}`}
  >
    {children}
  </section>
);

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Bienvenue */}
        <section className="container px-3 sm:px-6 pt-5 sm:pt-8 md:pt-12 lg:pt-16 pb-2">
          <div className="text-center max-w-2xl lg:max-w-3xl mx-auto animate-fade-in-up">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-accent font-medium">
              Bienvenue
            </p>
            <h1 className="mt-2 sm:mt-3 font-serif text-3xl xs:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.1]">
              L'École du Dimanche
            </h1>
            <p className="mt-3 sm:mt-4 lg:mt-5 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
              Un espace pour grandir dans la foi, jouer aux quizz bibliques
              et découvrir chaque jour la Parole de Dieu.
            </p>
            <div className="mt-5 sm:mt-6 flex justify-center">
              <div className="gold-divider" />
            </div>
          </div>
        </section>

        {/* Hero / Évangile + défi + quizz vedette */}
        <Row className="pt-4 sm:pt-6 md:pt-8">
          <div className="grid gap-4 sm:gap-6 lg:gap-8 xl:gap-10 lg:grid-cols-3 [&:not(:has(>*>*))]:hidden">
            <Cell className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              <GospelOfTheDay />
              <QuoteOfTheDay />
              <DailyChallenge />
            </Cell>
            <Cell>
              <QuizzOfTheWeek />
            </Cell>
          </div>
        </Row>

        {/* Top juniors + Horaires */}
        <Row>
          <div className="grid gap-4 sm:gap-6 lg:gap-8 xl:gap-10 md:grid-cols-2">
            <Cell>
              <TopJuniors />
            </Cell>
            <Cell>
              <Schedules />
            </Cell>
          </div>
        </Row>

        {/* Annonces + Historique */}
        <Row className="pb-12 sm:pb-16 lg:pb-20">
          <div className="grid gap-4 sm:gap-6 lg:gap-8 xl:gap-10 md:grid-cols-2">
            <Cell>
              <Announcements />
            </Cell>
            <Cell>
              <RecentQuizzes />
            </Cell>
          </div>
        </Row>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
