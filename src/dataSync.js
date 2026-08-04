import { supabase } from "./supabaseClient.js";

/* ─── LOAD ALL DATA FROM SUPABASE ─── */
export async function loadFromSupabase(userId) {
  if (!supabase || !userId) return null;

  try {
    const [
      { data: bottlesData },
      { data: testedData },
      { data: wearData },
      { data: ratingsData },
      { data: pairingsData },
      { data: prefsData },
    ] = await Promise.all([
      supabase.from("bottles").select("*").eq("user_id", userId).order("sort_order"),
      supabase.from("tested_scents").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("wear_log").select("*").eq("user_id", userId),
      supabase.from("bottle_ratings").select("*").eq("user_id", userId),
      supabase.from("pairings").select("*").eq("user_id", userId),
      supabase.from("user_preferences").select("*").eq("user_id", userId).single(),
    ]);

    /* Convert bottles from DB format to app format */
    const bottles = (bottlesData || []).map(b => ({
      name: b.name || "", fullName: b.full_name || b.name || "",
      house: b.house || "", status: b.status || "to test",
      cost: parseFloat(b.cost) || 0, ml: b.ml || 0, freq: b.freq || 0,
      userNotes: b.user_notes || "", thoughts: b.thoughts || "",
      tags: b.tags || {}, hasTester: b.has_tester || false,
      concentration: b.concentration || "", vibes: b.vibes || [],
      _dbId: b.id,
    }));

    /* Convert tested scents */
    const testedScents = (testedData || []).map(t => ({
      name: t.name || "", house: t.house || "",
      date: t.date_tested || "", notes: t.notes || "", thoughts: t.thoughts || "",
      overall: parseFloat(t.overall) || 0, sillage: parseFloat(t.sillage) || 0,
      longevity: parseFloat(t.longevity) || 0, scent: parseFloat(t.scent) || 0,
      avg: parseFloat(t.avg) || 0,
      tags: t.tags || {}, concentration: t.concentration || "",
      hasTester: t.has_tester || false, createdAt: new Date(t.created_at).getTime(),
      _dbId: t.id,
    }));

    /* Convert wear log: array of rows → { date: bottleName } */
    const wearLog = {};
    const wearRatings = {};
    (wearData || []).forEach(w => {
      wearLog[w.date] = w.bottle_name;
      if (w.rating) wearRatings[w.date] = w.rating;
    });

    /* Convert bottle ratings: array → { bottleName: { overall, sillage, ... } } */
    const bottleRatings = {};
    (ratingsData || []).forEach(r => {
      const obj = {};
      if (r.overall) obj.overall = parseFloat(r.overall);
      if (r.sillage) obj.sillage = parseFloat(r.sillage);
      if (r.longevity) obj.longevity = parseFloat(r.longevity);
      if (r.scent) obj.scent = parseFloat(r.scent);
      if (Object.keys(obj).length > 0) bottleRatings[r.bottle_name] = obj;
    });

    /* Convert pairings */
    const customPairings = [];
    const pairingNotes = {};
    const pairingRatings = {};
    const rejectedPairings = [];
    (pairingsData || []).forEach(p => {
      if (p.type === "custom") {
        customPairings.push({ id: p.id, fragrances: p.fragrances, rating: parseFloat(p.rating) || 0, notes: p.notes || "", createdAt: new Date(p.created_at).getTime() });
      } else {
        if (p.notes) pairingNotes[p.pairing_key] = p.notes;
        if (p.rating > 0) pairingRatings[p.pairing_key] = parseFloat(p.rating);
        if (p.rejected) rejectedPairings.push(p.pairing_key);
      }
    });

    /* Preferences */
    const prefs = prefsData || {};

    return {
      bottles,
      testedScents,
      wearLog,
      wearRatings,
      bottleRatings,
      customPairings,
      pairingNotes,
      pairingRatings,
      rejectedPairings,
      likedNotes: prefs.liked_notes || [],
      dislikedNotes: prefs.disliked_notes || [],
      noteOverrides: prefs.note_overrides || {},
      opposingPairs: prefs.opposing_pairs || [],
      vibeMap: prefs.vibe_map || {},
      purchaseData: prefs.purchase_data || {},
      visibleStats: prefs.visible_stats || { collection: true, invested: true, daysWorn: true, signature: true },
      visibleTabs: prefs.visible_tabs || { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true },
      theme: prefs.theme || { preset: "apothecary" },
    };
  } catch (err) {
    console.error("Failed to load from Supabase:", err);
    return null;
  }
}

/* ─── SYNC INDIVIDUAL DATA TYPES TO SUPABASE ─── */

let syncTimeout = {};
function debounce(key, fn, ms = 1000) {
  clearTimeout(syncTimeout[key]);
  syncTimeout[key] = setTimeout(fn, ms);
}

export function syncBottles(userId, bottles) {
  if (!supabase || !userId) return;
  debounce("bottles", async () => {
    /* Delete all and re-insert — simplest approach for array data */
    await supabase.from("bottles").delete().eq("user_id", userId);
    if (bottles.length > 0) {
      const rows = bottles.filter(b => b.name && b.name.trim()).map((b, i) => ({
        user_id: userId, name: b.name, full_name: b.fullName || b.name,
        house: b.house || "", status: b.status || "to test",
        cost: b.cost || 0, ml: b.ml || 0, freq: b.freq || 0,
        user_notes: b.userNotes || "", thoughts: b.thoughts || "",
        tags: b.tags || {}, has_tester: b.hasTester || false,
        concentration: b.concentration || "", vibes: b.vibes || [],
        sort_order: i,
      }));
      const { error } = await supabase.from("bottles").insert(rows);
      if (error) console.error("Sync bottles error:", error);
    }
  });
}

export function syncTestedScents(userId, testedScents) {
  if (!supabase || !userId) return;
  debounce("tested", async () => {
    await supabase.from("tested_scents").delete().eq("user_id", userId);
    if (testedScents.length > 0) {
      const rows = testedScents.filter(t => t.name && t.name.trim()).map(t => ({
        user_id: userId, name: t.name, house: t.house || "",
        date_tested: t.date || null, notes: t.notes || "", thoughts: t.thoughts || "",
        overall: t.overall || 0, sillage: t.sillage || 0, longevity: t.longevity || 0,
        scent: t.scent || 0, avg: t.avg || 0,
        tags: t.tags || {}, concentration: t.concentration || "",
        has_tester: t.hasTester || false,
      }));
      const { error } = await supabase.from("tested_scents").insert(rows);
      if (error) console.error("Sync tested error:", error);
    }
  });
}

export function syncWearLog(userId, wearLog, wearRatings) {
  if (!supabase || !userId) return;
  debounce("wear", async () => {
    await supabase.from("wear_log").delete().eq("user_id", userId);
    const entries = Object.entries(wearLog).filter(([, name]) => name);
    if (entries.length > 0) {
      const rows = entries.map(([date, bottle_name]) => ({
        user_id: userId, date, bottle_name,
        rating: wearRatings?.[date] || null,
      }));
      const { error } = await supabase.from("wear_log").insert(rows);
      if (error) console.error("Sync wear log error:", error);
    }
  });
}

export function syncBottleRatings(userId, bottleRatings) {
  if (!supabase || !userId) return;
  debounce("ratings", async () => {
    await supabase.from("bottle_ratings").delete().eq("user_id", userId);
    const entries = Object.entries(bottleRatings).filter(([, r]) => Object.keys(r).length > 0);
    if (entries.length > 0) {
      const rows = entries.map(([bottle_name, r]) => ({
        user_id: userId, bottle_name,
        overall: r.overall || null, sillage: r.sillage || null,
        longevity: r.longevity || null, scent: r.scent || null,
      }));
      const { error } = await supabase.from("bottle_ratings").insert(rows);
      if (error) console.error("Sync ratings error:", error);
    }
  });
}

export function syncPairings(userId, { customPairings, pairingNotes, pairingRatings, rejectedPairings }) {
  if (!supabase || !userId) return;
  debounce("pairings", async () => {
    await supabase.from("pairings").delete().eq("user_id", userId);
    const rows = [];
    (customPairings || []).forEach(p => {
      rows.push({
        user_id: userId, type: "custom", fragrances: p.fragrances,
        pairing_key: p.fragrances.join("+"), rating: p.rating || 0,
        notes: p.notes || "", rejected: false,
      });
    });
    const autoKeys = new Set([
      ...Object.keys(pairingNotes || {}),
      ...Object.keys(pairingRatings || {}),
      ...(rejectedPairings || []),
    ]);
    autoKeys.forEach(key => {
      rows.push({
        user_id: userId, type: "auto", fragrances: key.split("+"),
        pairing_key: key, rating: pairingRatings?.[key] || 0,
        notes: pairingNotes?.[key] || "",
        rejected: (rejectedPairings || []).includes(key),
      });
    });
    if (rows.length > 0) {
      const { error } = await supabase.from("pairings").insert(rows);
      if (error) console.error("Sync pairings error:", error);
    }
  });
}

export function syncPreferences(userId, prefs) {
  if (!supabase || !userId) return;
  debounce("prefs", async () => {
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: userId,
      liked_notes: prefs.likedNotes || [],
      disliked_notes: prefs.dislikedNotes || [],
      note_overrides: prefs.noteOverrides || {},
      opposing_pairs: prefs.opposingPairs || [],
      vibe_map: prefs.vibeMap || {},
      purchase_data: prefs.purchaseData || {},
      visible_stats: prefs.visibleStats || {},
      visible_tabs: prefs.visibleTabs || {},
      theme: prefs.theme || { preset: "apothecary" },
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("Sync prefs error:", error);
  });
}
