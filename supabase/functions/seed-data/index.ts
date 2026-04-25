import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "create_children") {
    const children = [
      { email: "lucas.martin@kt-test.fr", first_name: "Lucas", last_name: "Martin", age: 9 },
      { email: "emma.dubois@kt-test.fr", first_name: "Emma", last_name: "Dubois", age: 10 },
      { email: "noah.bernard@kt-test.fr", first_name: "Noah", last_name: "Bernard", age: 8 },
      { email: "lea.petit@kt-test.fr", first_name: "Léa", last_name: "Petit", age: 11 },
      { email: "louis.moreau@kt-test.fr", first_name: "Louis", last_name: "Moreau", age: 9 },
    ];
    const created: any[] = [];
    for (const c of children) {
      const { data, error } = await admin.auth.admin.createUser({
        email: c.email,
        password: "Catechese2026!",
        email_confirm: true,
        user_metadata: {
          first_name: c.first_name,
          last_name: c.last_name,
          age: String(c.age),
          parent_first_name: "Marie",
          parent_last_name: c.last_name,
          parent_phone: "+33600000000",
        },
      });
      created.push({ email: c.email, id: data?.user?.id, error: error?.message });
    }
    return json({ created });
  }

  if (action === "test_delete") {
    // Create a temporary admin, sign in, call admin-delete-child for 2 children
    const tmpEmail = `tmp.admin.${Date.now()}@kt-test.fr`;
    const tmpPwd = "TmpAdmin2026!";
    const { data: u, error: ue } = await admin.auth.admin.createUser({
      email: tmpEmail,
      password: tmpPwd,
      email_confirm: true,
      user_metadata: { first_name: "Test", last_name: "Admin" },
    });
    if (ue) return json({ step: "create_admin", error: ue.message }, 500);
    await admin.from("user_roles").insert({ user_id: u.user!.id, role: "admin" });

    const userClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: signin, error: se } = await userClient.auth.signInWithPassword({ email: tmpEmail, password: tmpPwd });
    if (se) return json({ step: "signin", error: se.message }, 500);
    const token = signin.session!.access_token;

    const targetEmails = body.targets as string[];
    const { data: targets } = await admin
      .from("profiles")
      .select("id, first_name")
      .in("first_name", ["Lucas", "Emma"]);

    const results: any[] = [];
    for (const t of targets ?? []) {
      const r = await fetch(`${supabaseUrl}/functions/v1/admin-delete-child`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": anonKey,
        },
        body: JSON.stringify({ userId: t.id }),
      });
      const text = await r.text();
      results.push({ target: t.first_name, id: t.id, status: r.status, body: text });
    }

    // Cleanup tmp admin
    await admin.from("user_roles").delete().eq("user_id", u.user!.id);
    await admin.auth.admin.deleteUser(u.user!.id);

    return json({ results });
  }

  if (action === "seed_quizzes") {
    const adminId = body.adminId as string;
    const quizzes = [
      {
        title: "Découvrir Jésus dans les Évangiles",
        description: "Un quiz pour explorer les rencontres et paroles de Jésus.",
        bible_reference: "Évangiles synoptiques",
        publish_date: new Date().toISOString().slice(0, 10),
        is_published: true,
        questions: [
          { prompt: "Dans quelle ville Jésus est-il né ?", options: ["Nazareth", "Bethléem", "Jérusalem", "Capharnaüm"], correct_index: 1, bible_reference: "Luc 2,4-7" },
          { prompt: "Qui a baptisé Jésus dans le Jourdain ?", options: ["Pierre", "Jean-Baptiste", "Paul", "André"], correct_index: 1, bible_reference: "Matthieu 3,13-17" },
          { prompt: "Combien d'apôtres Jésus a-t-il choisis ?", options: ["7", "10", "12", "70"], correct_index: 2, bible_reference: "Marc 3,13-19" },
          { prompt: "Quel premier miracle Jésus a-t-il fait à Cana ?", options: ["Guérir un aveugle", "Marcher sur l'eau", "Changer l'eau en vin", "Multiplier les pains"], correct_index: 2, bible_reference: "Jean 2,1-11" },
          { prompt: "Comment s'appelle la prière que Jésus a enseignée ?", options: ["Je vous salue Marie", "Notre Père", "Credo", "Gloire à Dieu"], correct_index: 1, bible_reference: "Matthieu 6,9-13" },
          { prompt: "Qui a renié Jésus trois fois ?", options: ["Judas", "Pierre", "Thomas", "Jean"], correct_index: 1, bible_reference: "Luc 22,54-62" },
          { prompt: "Sur quelle montagne eut lieu le Sermon ?", options: ["Sinaï", "Béatitudes", "Tabor", "Carmel"], correct_index: 1, bible_reference: "Matthieu 5-7" },
          { prompt: "Combien de pains pour nourrir la foule ?", options: ["3 pains", "5 pains", "7 pains", "12 pains"], correct_index: 1, bible_reference: "Jean 6,1-15" },
          { prompt: "Qui a trahi Jésus ?", options: ["Pierre", "Judas Iscariote", "Thomas", "Matthieu"], correct_index: 1, bible_reference: "Matthieu 26,14-16" },
          { prompt: "Quel jour Jésus est-il ressuscité ?", options: ["Vendredi", "Samedi", "Dimanche", "Lundi"], correct_index: 2, bible_reference: "Marc 16,1-8" },
        ],
      },
      {
        title: "Les sacrements de l'Église",
        description: "Découvre les 7 sacrements et leur signification.",
        bible_reference: "Catéchisme de l'Église catholique",
        publish_date: new Date().toISOString().slice(0, 10),
        is_published: true,
        questions: [
          { prompt: "Combien y a-t-il de sacrements ?", options: ["5", "6", "7", "8"], correct_index: 2, bible_reference: "CEC 1113" },
          { prompt: "Quel est le premier sacrement reçu ?", options: ["Eucharistie", "Baptême", "Confirmation", "Réconciliation"], correct_index: 1, bible_reference: "Matthieu 28,19" },
          { prompt: "Le sacrement du pardon s'appelle aussi…", options: ["Onction", "Réconciliation", "Mariage", "Ordre"], correct_index: 1, bible_reference: "Jean 20,22-23" },
          { prompt: "Quel sacrement nourrit l'âme ?", options: ["Baptême", "Eucharistie", "Confirmation", "Mariage"], correct_index: 1, bible_reference: "Jean 6,53-58" },
          { prompt: "La Confirmation reçoit le don de…", options: ["Eau", "Esprit Saint", "Pain", "Huile sainte"], correct_index: 1, bible_reference: "Actes 8,14-17" },
          { prompt: "Le sacrement des malades se fait avec…", options: ["Le pain", "L'huile sainte", "L'eau", "Le vin"], correct_index: 1, bible_reference: "Jacques 5,14-15" },
          { prompt: "Le mariage chrétien unit…", options: ["Deux amis", "Un homme et une femme", "Une famille", "Une communauté"], correct_index: 1, bible_reference: "Genèse 2,24" },
          { prompt: "Le sacrement de l'Ordre concerne…", options: ["Les laïcs", "Les évêques, prêtres et diacres", "Les religieuses", "Les enfants"], correct_index: 1, bible_reference: "Luc 22,19" },
          { prompt: "L'eau du baptême symbolise…", options: ["La pluie", "La purification et la nouvelle vie", "La mer", "La rivière"], correct_index: 1, bible_reference: "Romains 6,3-4" },
          { prompt: "Qui est le ministre habituel de l'Eucharistie ?", options: ["Le diacre", "Le prêtre", "Le laïc", "Le sacristain"], correct_index: 1, bible_reference: "CEC 1411" },
        ],
      },
      {
        title: "Les paraboles de Jésus",
        description: "Quiz spécial — programmé pour le 28 avril 2026.",
        bible_reference: "Évangiles",
        publish_date: "2026-04-28",
        is_published: true,
        questions: [
          { prompt: "La parabole du Bon Samaritain se trouve dans…", options: ["Matthieu", "Marc", "Luc", "Jean"], correct_index: 2, bible_reference: "Luc 10,25-37" },
          { prompt: "Le fils prodigue revient vers…", options: ["Sa mère", "Son frère", "Son père", "Son ami"], correct_index: 2, bible_reference: "Luc 15,11-32" },
          { prompt: "Le grain de moutarde devient…", options: ["Une fleur", "Un arbre", "Une herbe", "Un fruit"], correct_index: 1, bible_reference: "Matthieu 13,31-32" },
          { prompt: "Le bon berger laisse 99 brebis pour chercher…", options: ["Une brebis perdue", "Le loup", "Un agneau", "Sa maison"], correct_index: 0, bible_reference: "Luc 15,4-7" },
          { prompt: "Sur quel terrain le bon grain donne du fruit ?", options: ["Le chemin", "Les pierres", "Les ronces", "La bonne terre"], correct_index: 3, bible_reference: "Matthieu 13,1-23" },
          { prompt: "Les dix vierges attendent…", options: ["Le prêtre", "L'époux", "Le roi", "Le maître"], correct_index: 1, bible_reference: "Matthieu 25,1-13" },
          { prompt: "Qui a été récompensé dans la parabole des talents ?", options: ["Celui qui a caché", "Ceux qui ont fait fructifier", "Personne", "Le maître"], correct_index: 1, bible_reference: "Matthieu 25,14-30" },
          { prompt: "Le riche et… (Lazare). Que devient Lazare ?", options: ["Il est riche", "Il va dans le sein d'Abraham", "Il est ignoré", "Il devient roi"], correct_index: 1, bible_reference: "Luc 16,19-31" },
          { prompt: "Le pharisien et le publicain : qui est justifié ?", options: ["Le pharisien", "Le publicain", "Les deux", "Aucun"], correct_index: 1, bible_reference: "Luc 18,9-14" },
          { prompt: "Qu'est-ce que le Royaume des cieux dans la parabole du trésor ?", options: ["Une rivière", "Un trésor caché", "Une montagne", "Une étoile"], correct_index: 1, bible_reference: "Matthieu 13,44" },
        ],
      },
    ];

    const out: any[] = [];
    for (const q of quizzes) {
      const { data: quiz, error } = await admin.from("quizzes").insert({
        title: q.title, description: q.description, bible_reference: q.bible_reference,
        publish_date: q.publish_date, is_published: q.is_published, created_by: adminId,
      }).select().single();
      if (error) { out.push({ title: q.title, error: error.message }); continue; }
      const rows = q.questions.map((qq, idx) => ({
        quiz_id: quiz.id, prompt: qq.prompt, options: qq.options,
        correct_index: qq.correct_index, bible_reference: qq.bible_reference, position: idx + 1,
      }));
      const { error: qe } = await admin.from("questions").insert(rows);
      out.push({ title: q.title, id: quiz.id, questions_error: qe?.message });
    }
    return json({ quizzes: out });
  }

  if (action === "seed_daily") {
    const adminId = body.adminId as string;
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const quotes = [
      { quote: "Aimez-vous les uns les autres comme je vous ai aimés.", reference: "Jean 13,34", commentary: "Le commandement nouveau de Jésus." },
      { quote: "Heureux les cœurs purs, car ils verront Dieu.", reference: "Matthieu 5,8", commentary: "Une des Béatitudes." },
      { quote: "Demandez et vous recevrez.", reference: "Matthieu 7,7", commentary: "Confiance dans la prière." },
      { quote: "Je suis le chemin, la vérité et la vie.", reference: "Jean 14,6", commentary: "Jésus se révèle." },
      { quote: "Ne crains pas, crois seulement.", reference: "Marc 5,36", commentary: "Parole de réconfort." },
      { quote: "Le Seigneur est mon berger, je ne manque de rien.", reference: "Psaume 22,1", commentary: "Psaume de confiance." },
      { quote: "Tout est possible à celui qui croit.", reference: "Marc 9,23", commentary: "La force de la foi." },
    ];
    const gospels = [
      { verse: "Jésus dit : « Je suis la lumière du monde. Celui qui me suit ne marchera pas dans les ténèbres. »", reference: "Jean 8,12", commentary: "Jésus est notre lumière dans toutes nos journées." },
      { verse: "« Venez à moi, vous tous qui peinez, et je vous donnerai le repos. »", reference: "Matthieu 11,28", commentary: "Une invitation à se reposer en Dieu." },
      { verse: "« Là où deux ou trois sont réunis en mon nom, je suis au milieu d'eux. »", reference: "Matthieu 18,20", commentary: "La présence de Jésus dans la communauté." },
      { verse: "« Je vous donne ma paix. »", reference: "Jean 14,27", commentary: "La paix de Jésus, différente de celle du monde." },
      { verse: "« Faites ceci en mémoire de moi. »", reference: "Luc 22,19", commentary: "Institution de l'Eucharistie." },
      { verse: "« Allez, de toutes les nations faites des disciples. »", reference: "Matthieu 28,19", commentary: "L'envoi en mission." },
      { verse: "« Voici ma mère et mes frères : celui qui fait la volonté de mon Père. »", reference: "Matthieu 12,50", commentary: "La famille selon Jésus." },
    ];
    const challenges = [
      { prompt: "Combien de jours a duré le Carême avant Pâques ?", options: ["20", "30", "40", "50"], correct_index: 2, bible_reference: "Matthieu 4,1-2" },
      { prompt: "Qui a écrit le 4ème Évangile ?", options: ["Pierre", "Jean", "Luc", "Marc"], correct_index: 1, bible_reference: "Jean 21,24" },
      { prompt: "Quelle fête célèbre la venue de l'Esprit Saint ?", options: ["Noël", "Pâques", "Pentecôte", "Toussaint"], correct_index: 2, bible_reference: "Actes 2,1-4" },
      { prompt: "Combien de béatitudes y a-t-il ?", options: ["5", "7", "8", "10"], correct_index: 2, bible_reference: "Matthieu 5,3-12" },
      { prompt: "Quel est le premier livre de la Bible ?", options: ["Exode", "Genèse", "Lévitique", "Nombres"], correct_index: 1, bible_reference: "Genèse 1" },
      { prompt: "Marie a dit oui à l'ange…", options: ["Raphaël", "Michel", "Gabriel", "Uriel"], correct_index: 2, bible_reference: "Luc 1,26-38" },
      { prompt: "Quel apôtre fut appelé « le Roc » ?", options: ["André", "Pierre", "Jean", "Jacques"], correct_index: 1, bible_reference: "Matthieu 16,18" },
    ];

    const out: any = { quotes: [], gospels: [], challenges: [] };
    for (let i = 0; i < 7; i++) {
      const d = dates[i];
      const q = quotes[i];
      const { error: qe } = await admin.from("daily_quotes").insert({ ...q, quote_date: d });
      out.quotes.push({ date: d, error: qe?.message });

      const g = gospels[i];
      const { error: ge } = await admin.from("daily_gospel").insert({ ...g, gospel_date: d });
      out.gospels.push({ date: d, error: ge?.message });

      const c = challenges[i];
      const { error: ce } = await admin.from("daily_challenges").insert({ ...c, challenge_date: d, created_by: adminId });
      out.challenges.push({ date: d, error: ce?.message });
    }
    return json(out);
  }

  return json({ error: "unknown action" }, 400);
});
