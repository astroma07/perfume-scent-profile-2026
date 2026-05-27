export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  const API_KEY = process.env.FRAGELLA_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });
  const { endpoint, ...params } = req.query;
  const routes = { search: "/api/v1/fragrances", similar: "/api/v1/fragrances/similar", brand: `/api/v1/brands/${params.brandName || ""}`, notes: "/api/v1/notes" };
  const path = routes[endpoint];
  if (!path) return res.status(400).json({ error: "Invalid endpoint" });
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (k !== "brandName") qp.set(k, v); });
  const url = `https://api.fragella.com${path}${qp.toString() ? "?" + qp : ""}`;
  try {
    const r = await fetch(url, { headers: { "x-api-key": API_KEY } });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.setHeader("Cache-Control", "s-maxage=3600");
    return res.status(200).json(data);
  } catch { return res.status(500).json({ error: "Failed to reach Fragella API" }); }
}
