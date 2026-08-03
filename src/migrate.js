import { supabase } from "./supabaseClient.js";

/* Migrate localStorage data to Supabase for a newly logged-in user */
export async function migrateLocalToSupabase(userId) {
  const load = (key, fallback) => {
    try { const v = localStorage.getItem(`scent_${key}`); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };

  const bottles = load("bottles", []);
  const testedScents = load("testedScents", []);
  const wearLog = load("wearLog", {});
  const bottleRatings = load("bottleRatings", {});
  const wearRatings = load("wearRatings", {});

  const results = { bottles: 0, tested: 0, wearLog: 0, ratings: 0, prefs: false };

  try {
    /* Upload bottles */
    if (bottles.length > 0) {
      const rows = bottles.filter(b => b.name && b.name.trim()).map((b, i) => ({
        user_id: userId,
        name: b.name, full_name: b.fullName || b.name, house: b.house || "",
        status: b.status || "to test", cost: b.cost || 0, ml: b.ml || 0, freq: b.freq || 0,
        user_notes: b.userNotes || "", thoughts: b.thoughts || "",
        tags: b.tags || {}, has_tester: b.hasTester || false,
        concentration: b.concentration || "", vibes: b.vibes || [],
        sort_order: i,
      }));
      const { data, error } = await supabase.from("bottles").insert(rows).select();
      if (error) console.error("Bottles migration error:", error);
      else results.bottles = data.length;
    }

    /* Upload tested scents */
    if (testedScents.length > 0) {
      const rows = testedScents.filter(t => t.name && t.name.trim()).map(t => ({
        user_id: userId,
        name: t.name, house: t.house || "",
        date_tested: t.date || null, notes: t.notes || "", thoughts: t.thoughts || "",
        overall: t.overall || 0, sillage: t.sillage || 0, longevity: t.longevity || 0,
        scent: t.scent || 0, avg: t.avg || 0,
        tags: t.tags || {}, concentration: t.concentration || "",
        has_tester: t.hasTester || false,
      }));
      const { data, error } = await supabase.from("tested_scents").insert(rows).select();
      if (error) console.error("Tested migration error:", error);
      else results.tested = data.length;
    }

    /* Upload wear log */
    const wearEntries = Object.entries(wearLog).filter(([, name]) => name);
    if (wearEntries.length > 0) {
      const rows = wearEntries.map(([date, bottle_name]) => ({
        user_id: userId, date, bottle_name,
        rating: wearRatings[date] || null,
      }));
      const { data, error } = await supabase.from("wear_log").insert(rows).select();
      if (error) console.error("Wear log migration error:", error);
      else results.wearLog = data.length;
    }

    /* Upload bottle ratings */
    const ratingEntries = Object.entries(bottleRatings).filter(([, r]) => Object.keys(r).length > 0);
    if (ratingEntries.length > 0) {
      const rows = ratingEntries.map(([bottle_name, r]) => ({
        user_id: userId, bottle_name,
        overall: r.overall || null, sillage: r.sillage || null,
        longevity: r.longevity || null, scent: r.scent || null,
      }));
      const { data, error } = await supabase.from("bottle_ratings").insert(rows).select();
      if (error) console.error("Ratings migration error:", error);
      else results.ratings = data.length;
    }

    /* Upload pairings */
    const customPairings = load("customPairings", []);
    const pairingNotes = load("pairingNotes", {});
    const pairingRatings = load("pairingRatings", {});
    const rejectedPairings = load("rejectedPairings", []);

    const pairingRows = [];
    /* Custom pairings */
    customPairings.forEach(p => {
      pairingRows.push({
        user_id: userId, type: "custom",
        fragrances: p.fragrances, pairing_key: p.fragrances.join("+"),
        rating: p.rating || 0, notes: p.notes || "", rejected: false,
      });
    });
    /* Auto pairing metadata */
    Object.entries(pairingNotes).forEach(([key, note]) => {
      if (!pairingRows.find(r => r.pairing_key === key)) {
        pairingRows.push({
          user_id: userId, type: "auto",
          fragrances: key.split("+"), pairing_key: key,
          rating: pairingRatings[key] || 0, notes: note,
          rejected: rejectedPairings.includes(key),
        });
      }
    });
    Object.entries(pairingRatings).forEach(([key, rating]) => {
      if (!pairingRows.find(r => r.pairing_key === key)) {
        pairingRows.push({
          user_id: userId, type: "auto",
          fragrances: key.split("+"), pairing_key: key,
          rating, notes: pairingNotes[key] || "",
          rejected: rejectedPairings.includes(key),
        });
      }
    });
    if (pairingRows.length > 0) {
      await supabase.from("pairings").insert(pairingRows);
    }

    /* Upload preferences */
    const { error: prefError } = await supabase.from("user_preferences").upsert({
      user_id: userId,
      liked_notes: load("likedNotes", []),
      disliked_notes: load("dislikedNotes", []),
      note_overrides: load("noteOverrides", {}),
      opposing_pairs: load("opposingPairs", []),
      vibe_map: load("vibeMap", {}),
      purchase_data: load("purchaseData", {}),
      visible_stats: load("visibleStats", {}),
      visible_tabs: load("visibleTabs", {}),
      theme: load("theme", { preset: "apothecary" }),
    });
    if (prefError) console.error("Prefs migration error:", prefError);
    else results.prefs = true;

    /* Mark migration complete */
    localStorage.setItem("scent_migrated", "true");

  } catch (err) {
    console.error("Migration error:", err);
  }

  return results;
}

/* Check if localStorage has data worth migrating */
export function hasLocalData() {
  try {
    const bottles = localStorage.getItem("scent_bottles");
    if (bottles) {
      const parsed = JSON.parse(bottles);
      return Array.isArray(parsed) && parsed.length > 0;
    }
  } catch {}
  return false;
}

export function isMigrated() {
  return localStorage.getItem("scent_migrated") === "true";
}
