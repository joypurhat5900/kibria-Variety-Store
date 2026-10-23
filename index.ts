// Supabase Edge Function: send-push
// ডাটাবেসে নতুন নোটিফিকেশন তৈরি হলে (trigger) এটা ডাকা হয় এবং গ্রাহকের ফোনে Web Push পাঠায়।
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: sec } = await sb.from("app_secrets").select("key,value")
    .in("key", ["push_secret", "vapid_private", "vapid_subject"]);
  const S: Record<string, string> = Object.fromEntries((sec || []).map((r: any) => [r.key, r.value]));
  if (!S.push_secret || req.headers.get("x-push-secret") !== S.push_secret) {
    return new Response("forbidden", { status: 403 });
  }

  const { data: pub } = await sb.from("settings").select("value").eq("key", "vapid_public").maybeSingle();
  if (!pub?.value || !S.vapid_private) return new Response(JSON.stringify({ sent: 0, reason: "no keys" }));

  webpush.setVapidDetails(S.vapid_subject || "https://example.com", pub.value, S.vapid_private);

  const b = await req.json();
  const { data: subs } = await sb.from("push_subs").select("*").eq("user_id", b.user_id);
  const payload = JSON.stringify({ title: b.title, body: b.body, id: b.id });
  let sent = 0;
  await Promise.all((subs || []).map(async (s: any) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 });
      sent++;
    } catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) await sb.from("push_subs").delete().eq("id", s.id);
    }
  }));
  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
