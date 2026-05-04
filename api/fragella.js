export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const API_KEY = process.env.FRAGELLA_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  const { endpoint, ...params } = req.query;
  const routes = {
    search: "/api/v1/fragrances",
    similar: "/api/v1/fragrances/similar",
    match: "/api/v1/fragrances/match",
    brand: `/api/v1/brands/${params.brandName || ""}`,
    notes: "/api/v1/notes",
    accords: "/api/v1/accords",
    usage: "/api/v1/usage",
  };

  const path = routes[endpoint];
  if (!path) return res.status(400).json({ error: "Invalid endpoint" });

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (k !== "brandName") queryParams.set(k, v); });
  const qs = queryParams.toString();
  const url = `https://api.fragella.com${path}${qs ? "?" + qs : ""}`;

  try {
    const response = await fetch(url, { headers: { "x-api-key": API_KEY } });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Failed to reach Fragella API" });
  }
}
