// Edge function: receives a postcard submission, classifies the emotion via
// Lovable AI, hashes the IP for a permissive rate-limit, and stores it as pending.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const EMOTIONS = [
  "alegria", "euforia", "gratidao", "serenidade", "paixao",
  "raiva", "melancolia", "medo", "frustracao", "saudade", "nostalgia",
] as const;

const RATE_LIMIT_PER_HOUR = 10;

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

interface ClassifyResult {
  emotion: string;
  confidence: number;
  language: string;
}

async function classify(text: string, apiKey: string): Promise<ClassifyResult> {
  const system = `És um classificador de emoções. Lês uma memória curta sobre Coimbra e devolves:
- emotion: UMA emoção dominante, escolhida APENAS desta lista: ${EMOTIONS.join(", ")}
- confidence: número entre 0 e 1
- language: código ISO 639-1 do idioma do texto (ex: "pt", "en", "es", "fr")
Responde APENAS JSON válido no formato {"emotion":"<chave>","confidence":0..1,"language":"<iso>"}. Sem markdown.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Memória: "${text}"\nDevolve só o JSON.` },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`gateway ${res.status}`);
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  const emotion = (EMOTIONS as readonly string[]).includes(parsed.emotion) ? parsed.emotion : "saudade";
  const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5;
  const language = typeof parsed.language === "string" ? parsed.language.slice(0, 8) : "pt";
  return { emotion, confidence, language };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const memory = typeof body?.memory === "string" ? body.memory.trim() : "";
    const sender = typeof body?.sender === "string" ? body.sender.trim().slice(0, 80) : null;
    const recipient = typeof body?.recipient === "string" ? body.recipient.trim().slice(0, 80) : null;
    const clientEmotion = (EMOTIONS as readonly string[]).includes(body?.emotion) ? body.emotion as typeof EMOTIONS[number] : null;
    const variantIdx = Number.isInteger(body?.variant_idx) && body.variant_idx >= 0 && body.variant_idx <= 2
      ? body.variant_idx
      : 0;

    if (!memory || memory.length < 1 || memory.length > 600) {
      return new Response(JSON.stringify({ error: "invalid memory" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const salt = Deno.env.get("IP_HASH_SALT") ?? "";

    const supabase = createClient(supabaseUrl, serviceRole);

    // Hash IP for rate limiting
    const ip = getClientIp(req);
    const ipHash = await sha256(`${salt}:${ip}`);

    // Rate limit: 10 inserts / hour per ip_hash
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("postcards")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Classify only when old clients do not send the emotion selected in the editor.
    let classified: ClassifyResult = { emotion: clientEmotion ?? "saudade", confidence: clientEmotion ? 1 : 0.5, language: "pt" };
    if (!clientEmotion && lovableKey) {
      try { classified = await classify(memory, lovableKey); }
      catch (e) { console.error("[submit-postcard] classify failed", e); }
    }

    const { data, error } = await supabase
      .from("postcards")
      .insert({
        memory,
        sender: sender || null,
        recipient: recipient || null,
        emotion: clientEmotion ?? classified.emotion,
        variant_idx: variantIdx,
        confidence: classified.confidence,
        language: classified.language,
        ip_hash: ipHash,
        status: "pending",
      })
      .select("id, emotion")
      .single();

    if (error) {
      console.error("[submit-postcard] insert error", error);
      return new Response(JSON.stringify({ error: "insert_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ id: data.id, emotion: data.emotion }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[submit-postcard] error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
