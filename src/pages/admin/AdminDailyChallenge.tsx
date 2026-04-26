import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Sun, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Challenge {
  id: string;
  challenge_date: string;
  prompt: string;
  options: string[];
  correct_index: number;
  bible_reference: string | null;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const AdminDailyChallenge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [date, setDate] = useState<Date>(new Date());
  const [prompt, setPrompt] = useState("");
  const [reference, setReference] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_challenges")
      .select("*")
      .order("challenge_date", { ascending: false })
      .limit(60);
    setList(
      ((data ?? []) as Array<Omit<Challenge, "options"> & { options: unknown }>).map((c) => ({
        ...c,
        options: Array.isArray(c.options) ? (c.options as string[]) : [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setDate(new Date());
    setPrompt("");
    setReference("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
  };

  const handleSave = async () => {
    if (!user) return;
    const cleaned = options.map((o) => o.trim());
    if (!prompt.trim() || cleaned.some((o) => !o)) {
      toast({
        title: "Champs manquants",
        description: "Renseigne l'énoncé et les 4 options.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    // Format local YYYY-MM-DD pour éviter le décalage UTC qui pouvait
    // enregistrer le défi sur le jour précédent selon le fuseau horaire.
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const { error } = await supabase.from("daily_challenges").upsert(
      {
        challenge_date: dateStr,
        prompt: prompt.trim(),
        options: cleaned,
        correct_index: correct,
        bible_reference: reference.trim() || null,
        created_by: user.id,
      },
      { onConflict: "challenge_date" }
    );
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Enregistré", description: `Défi du ${format(date, "d MMMM", { locale: fr })} sauvegardé.` });
    reset();
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("daily_challenges").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Défi supprimé" });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
          <Sun className="h-5 w-5 text-accent" strokeWidth={1.8} />
          Défi du jour
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Une question bonus par jour pour récompenser la régularité des enfants.
        </p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-serif text-lg font-semibold">Programmer un défi</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "d MMMM yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-[11px] text-muted-foreground">
                Si un défi existe déjà pour cette date, il sera remplacé.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Référence biblique (optionnel)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex : Jean 3, 16"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Question</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Énoncé de la question bonus du jour"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Options (coche la bonne réponse)</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrect(i)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0 border transition-colors",
                    correct === i
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:border-accent/60"
                  )}
                  aria-label={`Marquer l'option ${String.fromCharCode(65 + i)} comme correcte`}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={reset}>
              Réinitialiser
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Enregistrer le défi
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-5">
          <h3 className="font-serif text-lg font-semibold mb-4">Défis récents</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun défi enregistré.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((c) => {
                const isToday = c.challenge_date === todayStr();
                return (
                  <li
                    key={c.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40"
                  >
                    <div className="flex flex-col items-center justify-center w-14 shrink-0 py-1 rounded-md bg-card border border-border">
                      <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                        {format(parseISO(c.challenge_date), "MMM", { locale: fr })}
                      </span>
                      <span className="font-serif text-xl leading-none">
                        {format(parseISO(c.challenge_date), "d")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isToday && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] uppercase tracking-wider font-semibold">
                            Aujourd'hui
                          </span>
                        )}
                        {c.bible_reference && (
                          <span className="text-[11px] text-accent font-medium">
                            {c.bible_reference}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 leading-snug">{c.prompt}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Bonne réponse : <span className="text-foreground font-medium">{c.options[c.correct_index]}</span>
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce défi ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Les tentatives associées seront aussi supprimées. Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDailyChallenge;
