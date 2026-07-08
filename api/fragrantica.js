export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const API_KEY = process.env.PARSE_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Parse API key not configured" });

  const { endpoint, ...params } = req.query;
  const BASE = "https://api.parse.bot/scraper/d2c369a4-db4f-46ae-829d-562361126109";

  const routes = {
    search: "/search_perfumes",
    details: "/get_perfume_details",
    brands: "/list_brands",
    notes: "/list_notes",
  };

  const path = routes[endpoint];
  if (!path) return res.status(400).json({ error: "Invalid endpoint: " + endpoint });

  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (k !== "endpoint") qp.set(k, v); });
  const url = `${BASE}${path}${qp.toString() ? "?" + qp : ""}`;

  try {
    const r = await fetch(url, { headers: { "X-API-Key": API_KEY } });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.message || data?.error || `API returned ${r.status}`, data });
    res.setHeader("Cache-Control", "s-maxage=3600");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Failed to reach Parse API: " + e.message });
  }
}
