// Edge function: detect emotion from text using Lovable AI Gateway (Gemini)
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const EMOTIONS = [
  "alegria", "euforia", "gratidao", "serenidade", "paixao",
  "raiva", "melancolia", "medo", "frustracao", "saudade", "nostalgia",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "missing text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `És um classificador de emoções em português europeu. Lês uma memória curta sobre Coimbra e devolves UMA emoção dominante, escolhida APENAS desta lista: ${EMOTIONS.join(", ")}. Responde apenas com JSON válido no formato {"emotion":"<chave>","confidence":0..1}. Sem comentários, sem markdown.`;

    const userMsg = `Memória: "${text}"\nDevolve só o JSON.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[detect-emotion] gateway error", res.status, body);
      return new Response(JSON.stringify({ error: "gateway", status: res.status }), {
        status: res.status === 429 || res.status === 402 ? res.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { emotion?: string; confidence?: number } = {};
    try { parsed = JSON.parse(content); } catch { /* ignore */ }

    const emotion = (EMOTIONS as readonly string[]).includes(parsed.emotion ?? "")
      ? parsed.emotion!
      : "saudade";
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;

    return new Response(JSON.stringify({ emotion, confidence }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[detect-emotion] error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
