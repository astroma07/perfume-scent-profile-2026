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
  const WORKSPACE_ID = process.env.ANTHROPIC_WORKSPACE_ID;

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Body is not valid JSON" }); }
  }
  const { system, messages, max_tokens } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  const clean = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content }));

  if (clean.length === 0) return res.status(400).json({ error: "No valid messages to send" });

  const headers = {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
  if (WORKSPACE_ID) headers["anthropic-workspace-id"] = WORKSPACE_ID;

  const basePayload = {
    model: MODEL,
    max_tokens: Math.min(Number(max_tokens) || 2000, 8000),
    messages: clean,
  };

  /* The collection context is long and identical across a conversation, so
     cache it. Sonnet 5.5 caches from 512 tokens and reads at 0.05x base. */
  if (typeof system === "string" && system.trim()) {
    basePayload.system = [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
  }

  /* Sonnet 5.5 has thinking ON by default and rejects {type:"disabled"}.
     between_tools turns off up-front thinking, which is what stops the model
     spending its whole output budget thinking and returning no text. */
  const payload = { ...basePayload, thinking: { type: "between_tools" } };

  const callApi = async (p) => {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers, body: JSON.stringify(p),
    });
    return { r, data: await r.json() };
  };

  try {
    let { r, data } = await callApi(payload);

    /* If this model won't take the thinking shape, fall back to the default
       (adaptive) with a much larger ceiling so thinking can finish and still
       leave room for text. */
    if (!r.ok && r.status === 400 && /thinking|effort/i.test(JSON.stringify(data?.error || ""))) {
      const fallback = { ...basePayload, max_tokens: 8000 };
      console.warn("advisor: thinking param rejected, retrying without it", data?.error);
      ({ r, data } = await callApi(fallback));
    }

    if (!r.ok) {
      const detail = data?.error?.message || data?.error?.type || `API returned ${r.status}`;
      return res.status(r.status).json({ error: detail, model: MODEL });
    }

    /* content can hold text, thinking, tool_use and other block types.
       Take only the text blocks rather than assuming block 0. */
    const blocks = Array.isArray(data?.content) ? data.content : [];
    const text = blocks
      .filter(b => b && b.type === "text" && typeof b.text === "string")
      .map(b => b.text)
      .join("")
      .trim();

    res.setHeader("Cache-Control", "no-store");

    if (!text) {
      console.warn("advisor: no text block", {
        stop_reason: data?.stop_reason,
        block_types: blocks.map(b => b?.type),
        usage: data?.usage,
      });
      return res.status(200).json({
        text: "",
        stop_reason: data?.stop_reason || null,
        stop_details: data?.stop_details || null,
        block_types: blocks.map(b => b?.type),
        model: MODEL,
        usage: data?.usage || null,
      });
    }

    return res.status(200).json({
      text,
      stop_reason: data?.stop_reason || null,
      model: MODEL,
      usage: data?.usage || null,
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to reach the Anthropic API: " + e.message });
  }
}
