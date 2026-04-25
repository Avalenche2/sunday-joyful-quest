import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
    return new Response(JSON.stringify({ created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
