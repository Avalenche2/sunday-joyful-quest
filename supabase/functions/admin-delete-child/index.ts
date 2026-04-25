import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey || !authHeader) {
    return json({ error: "Accès refusé" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: callerData, error: callerError } = await adminClient.auth.getUser(token);

  if (callerError || !callerData.user) {
    return json({ error: "Session invalide" }, 401);
  }

  const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
    _user_id: callerData.user.id,
    _role: "admin",
  });

  if (roleError || !isAdmin) {
    return json({ error: "Action réservée aux moniteurs" }, 403);
  }

  const { userId } = await req.json().catch(() => ({ userId: null }));
  if (!userId || typeof userId !== "string") {
    return json({ error: "Compte enfant invalide" }, 400);
  }

  const { data: isTargetAdmin } = await adminClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (isTargetAdmin) {
    return json({ error: "Un compte moniteur ne peut pas être supprimé ici" }, 400);
  }

  const { data: attempts, error: attemptsError } = await adminClient
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", userId);

  if (attemptsError) {
    return json({ error: attemptsError.message }, 400);
  }

  const attemptIds = attempts?.map((attempt) => attempt.id) ?? [];

  if (attemptIds.length > 0) {
    const { error: answersError } = await adminClient
      .from("attempt_answers")
      .delete()
      .in("attempt_id", attemptIds);

    if (answersError) {
      return json({ error: answersError.message }, 400);
    }
  }

  const cleanupSteps = await Promise.all([
    adminClient.from("quiz_attempts").delete().eq("user_id", userId),
    adminClient.from("daily_challenge_attempts").delete().eq("user_id", userId),
    adminClient.from("user_roles").delete().eq("user_id", userId),
    adminClient.from("profiles").delete().eq("id", userId),
  ]);

  const cleanupError = cleanupSteps.find((result) => result.error)?.error;
  if (cleanupError) {
    return json({ error: cleanupError.message }, 400);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    return json({ error: deleteError.message }, 400);
  }

  return json({ ok: true });
});
