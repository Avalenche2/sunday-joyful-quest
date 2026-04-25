import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen, CalendarClock, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const today = () => new Date().toISOString().slice(0, 10);

interface Row {
  id: string;
  reference: string;
  verse: string;
  commentary: string | null;
  gospel_date: string;
}

const AdminGospel = () => {
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState("");
  const [verse, setVerse] = useState("");
  const [commentary, setCommentary] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const resetForm = () => {
    const usedDates = new Set(recent.map((item) => item.gospel_date));
    const nextDate = Array.from({ length: 31 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() + index);
      return d.toISOString().slice(0, 10);
    }).find((candidate) => !usedDates.has(candidate)) ?? today();

    setExistingId(null);
    setDate(nextDate);
    setReference("");
    setVerse("");
    setCommentary("");
  };

  const loadForDate = async (d: string) => {
    const { data } = await supabase
      .from("daily_gospel")
      .select("*")
      .eq("gospel_date", d)
      .maybeSingle();
    if (data) {
      setExistingId(data.id);
      setReference(data.reference);
      setVerse(data.verse);
      setCommentary(data.commentary ?? "");
    } else {
      setExistingId(null);
      setReference("");
      setVerse("");
      setCommentary("");
    }
  };

  const loadRecent = async () => {
    const { data } = await supabase
      .from("daily_gospel")
      .select("*")
      .order("gospel_date", { ascending: false })
      .limit(8);
    setRecent((data ?? []) as Row[]);
  };

  useEffect(() => {
    loadForDate(date);
  }, [date]);

  useEffect(() => {
    loadRecent();
  }, []);

  const handleSave = async () => {
    if (!reference.trim() || !verse.trim()) return toast.error("Référence et verset requis");
    setSaving(true);
    const payload = {
      reference: reference.trim(),
      verse: verse.trim(),
      commentary: commentary.trim() || null,
      gospel_date: date,
    };
    const { error } = existingId
      ? await supabase.from("daily_gospel").update(payload).eq("id", existingId)
      : await supabase.from("daily_gospel").insert(payload);
    setSaving(false);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success("Évangile publié");
    loadForDate(date);
    loadRecent();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const { error } = await supabase.from("daily_gospel").delete().eq("id", deleteTarget.id);
    setDeletingId(null);
    if (error) return toast.error("Suppression impossible", { description: error.message });
    toast.success("Évangile supprimé");
    setDeleteTarget(null);
    if (existingId === deleteTarget.id) resetForm();
    loadRecent();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Évangile du jour</h2>
          <p className="text-sm text-muted-foreground mt-1">Prépare le verset visible sur l'accueil des enfants.</p>
        </div>
        <Button type="button" variant="outline" onClick={resetForm}>
          <Plus className="h-4 w-4" /> Nouvel évangile
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex. Jean 3, 16"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="verse">Verset</Label>
            <Textarea
              id="verse"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commentary">Commentaire (optionnel)</Label>
            <Textarea
              id="commentary"
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              rows={3}
            />
          </div>
          {date > today() && (
            <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs text-foreground flex items-start gap-2">
              <CalendarClock className="h-4 w-4 text-gold shrink-0 mt-0.5" strokeWidth={1.8} />
              <div>
                <strong className="text-gold">Évangile programmé.</strong> Il sera visible par les
                enfants à partir du{" "}
                <strong>
                  {new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                .
              </div>
            </div>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {existingId ? "Mettre à jour" : date > today() ? "Programmer" : "Publier"}
          </Button>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <div>
          <h3 className="font-serif text-lg font-semibold mb-3">Évangiles récents</h3>
          <div className="space-y-2">
            {recent.map((r) => {
              const scheduled = r.gospel_date > today();
              return (
              <Card key={r.id} className="shadow-soft hover:shadow-elevated transition-shadow">
                <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                  <BookOpen className="h-4 w-4 text-accent mt-1 shrink-0" strokeWidth={1.8} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs uppercase tracking-wider text-accent font-semibold">
                        {format(new Date(r.gospel_date), "d MMMM yyyy", { locale: fr })}
                      </p>
                      {scheduled && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold font-semibold">
                          <CalendarClock className="h-3 w-3" /> programmé
                        </span>
                      )}
                    </div>
                    <p className="font-medium mt-0.5">{r.reference}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.verse}</p>
                  </div>
                  <div className="flex gap-2 sm:shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDate(r.gospel_date)}>
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(r)}
                      disabled={deletingId === r.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet évangile ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l'évangile du {deleteTarget?.gospel_date ? format(new Date(deleteTarget.gospel_date), "d MMMM yyyy", { locale: fr }) : "jour sélectionné"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingId && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminGospel;
