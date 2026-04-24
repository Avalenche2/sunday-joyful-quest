import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey || !authHeader) {
    return new Response(JSON.stringify({ error: "Accès refusé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: callerData, error: callerError } = await adminClient.auth.getUser(token);

  if (callerError || !callerData.user) {
    return new Response(JSON.stringify({ error: "Session invalide" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
    _user_id: callerData.user.id,
    _role: "admin",
  });

  if (roleError || !isAdmin) {
    return new Response(JSON.stringify({ error: "Action réservée aux moniteurs" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { userId } = await req.json().catch(() => ({ userId: null }));
  if (!userId || typeof userId !== "string") {
    return new Response(JSON.stringify({ error: "Compte enfant invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: isTargetAdmin } = await adminClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (isTargetAdmin) {
    return new Response(JSON.stringify({ error: "Un compte moniteur ne peut pas être supprimé ici" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await adminClient.from("attempt_answers").delete().in(
    "attempt_id",
    (await adminClient.from("quiz_attempts").select("id").eq("user_id", userId)).data?.map((a) => a.id) ?? [],
  );
  await adminClient.from("quiz_attempts").delete().eq("user_id", userId);
  await adminClient.from("daily_challenge_attempts").delete().eq("user_id", userId);
  await adminClient.from("user_roles").delete().eq("user_id", userId);
  await adminClient.from("profiles").delete().eq("id", userId);

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
