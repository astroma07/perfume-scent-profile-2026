export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables, then redeploy." });

  /* Model is pinned server-side so a stale string in the bundled client
     can't break the Advisor. Override with ADVISOR_MODEL in Vercel. */
  const MODEL = process.env.ADVISOR_MODEL || "claude-sonnet-5-5";

  /* Vercel parses JSON bodies automatically, but be tolerant of a raw string. */
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Body is not valid JSON" }); }
  }
  const { system, messages, max_tokens } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  /* Only forward the shape the Messages API expects. */
  const clean = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content }));

  if (clean.length === 0) return res.status(400).json({ error: "No valid messages to send" });

  const payload = {
    model: MODEL,
    max_tokens: Math.min(Number(max_tokens) || 1000, 4000),
    messages: clean,
  };
  if (typeof system === "string" && system.trim()) payload.system = system;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      const detail = data?.error?.message || data?.error?.type || `API returned ${r.status}`;
      return res.status(r.status).json({ error: detail, model: MODEL });
    }

    /* Chat replies must never be cached. */
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Failed to reach the Anthropic API: " + e.message });
  }
}
