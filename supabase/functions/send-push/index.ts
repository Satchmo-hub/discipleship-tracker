// supabase/functions/send-push/index.ts
import { serve } from "https://deno.land/std@0.177.1/http/server.ts";

serve(async (req) => {
  try {
    // Read JSON request body
    const { user_id, title, body, data } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
      });
    }

    // === Load secrets from environment ===
    const supabaseUrl = Deno.env.get("PROJECT_URL")!;
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing secrets: PROJECT_URL or SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Missing server configuration" }),
        { status: 500 }
      );
    }

    // === Fetch all Expo push tokens for this user ===
    const tokenRes = await fetch(
      `${supabaseUrl}/rest/v1/device_push_tokens?user_id=eq.${user_id}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const tokens = await tokenRes.json();

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No device tokens found for this user" }),
        { status: 200 }
      );
    }

    console.log(`Found ${tokens.length} token(s) for user ${user_id}`);

    // === Build Expo push messages ===
    const messages = tokens.map((t: any) => ({
      to: t.expo_token,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

    // === Send push notifications via Expo Push API ===
    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const result = await expoRes.json();

    console.log("Expo push API result:", result);

    return new Response(
      JSON.stringify({ success: true, sent: messages.length, result }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Push function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
