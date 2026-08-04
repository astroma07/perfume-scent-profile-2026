import { supabase } from "./supabaseClient.js";
import { normalizeBottles, normalizeTestedScents, normalizeWearLog, normalizeWearRatings, normalizeBottleRatings, normalizeCustomPairings, normalizeObj, normalizeStringArr, normalizeArr, toWearArray } from "./normalizeData.js";

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

    /* Convert bottles: DB columns → app fields, then normalize */
    const bottles = normalizeBottles((bottlesData || []).map(b => ({
      name: b.name, fullName: b.full_name, house: b.house, status: b.status,
      cost: b.cost, ml: b.ml, freq: b.freq, userNotes: b.user_notes,
      thoughts: b.thoughts, tags: b.tags, hasTester: b.has_tester,
      concentration: b.concentration, vibes: b.vibes, _dbId: b.id,
    })));

    /* Convert tested scents */
    const testedScents = normalizeTestedScents((testedData || []).map(t => ({
      name: t.name, house: t.house, date: t.date_tested, notes: t.notes,
      thoughts: t.thoughts, overall: t.overall, sillage: t.sillage,
      longevity: t.longevity, scent: t.scent, avg: t.avg,
      tags: t.tags, concentration: t.concentration, hasTester: t.has_tester,
      createdAt: t.created_at, _dbId: t.id,
    })));

    /* Convert wear log: multiple rows → { date: [names] } */
    const rawWearLog = {};
    const rawWearRatings = {};
    (wearData || []).forEach(w => {
      if (!rawWearLog[w.date]) rawWearLog[w.date] = [];
      if (w.bottle_name) rawWearLog[w.date].push(w.bottle_name);
      if (w.rating && typeof w.rating === "object") rawWearRatings[w.date] = w.rating;
    });

    /* Convert bottle ratings: rows → { name: { overall, ... } } */
    const rawRatings = {};
    (ratingsData || []).forEach(r => {
      const obj = {};
      if (r.overall) obj.overall = r.overall;
      if (r.sillage) obj.sillage = r.sillage;
      if (r.longevity) obj.longevity = r.longevity;
      if (r.scent) obj.scent = r.scent;
      if (Object.keys(obj).length > 0) rawRatings[r.bottle_name] = obj;
    });

    /* Convert pairings */
    const customPairings = [];
    const pairingNotes = {};
    const pairingRatings = {};
    const rejectedPairings = [];
    (pairingsData || []).forEach(p => {
      if (p.type === "custom") {
        customPairings.push({ id: p.id, fragrances: p.fragrances, rating: p.rating, notes: p.notes, createdAt: p.created_at });
      } else {
        if (p.notes) pairingNotes[p.pairing_key] = p.notes;
        if (p.rating > 0) pairingRatings[p.pairing_key] = p.rating;
        if (p.rejected) rejectedPairings.push(p.pairing_key);
      }
    });

    const prefs = prefsData || {};

    /* Normalize everything through the single pipeline */
    return {
      bottles,
      testedScents,
      wearLog: normalizeWearLog(rawWearLog),
      wearRatings: normalizeWearRatings(rawWearRatings),
      bottleRatings: normalizeBottleRatings(rawRatings),
      customPairings: normalizeCustomPairings(customPairings),
      pairingNotes: normalizeObj(pairingNotes),
      pairingRatings: normalizeObj(pairingRatings),
      rejectedPairings: normalizeArr(rejectedPairings),
      likedNotes: normalizeStringArr(prefs.liked_notes),
      dislikedNotes: normalizeStringArr(prefs.disliked_notes),
      noteOverrides: normalizeObj(prefs.note_overrides),
      opposingPairs: normalizeArr(prefs.opposing_pairs),
      vibeMap: normalizeObj(prefs.vibe_map),
      purchaseData: normalizeObj(prefs.purchase_data),
      visibleStats: normalizeObj(prefs.visible_stats, { collection: true, invested: true, daysWorn: true, signature: true }),
      visibleTabs: normalizeObj(prefs.visible_tabs, { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true }),
      theme: normalizeObj(prefs.theme, { preset: "apothecary" }),
    };
  } catch (err) {
    console.error("Failed to load from Supabase:", err);
    return null;
  }
}

/* ─── DEBOUNCED SYNC ─── */
let syncTimeout = {};
function debounce(key, fn, ms = 1000) {
  clearTimeout(syncTimeout[key]);
  syncTimeout[key] = setTimeout(fn, ms);
}

export function syncBottles(userId, bottles) {
  if (!supabase || !userId) return;
  debounce("bottles", async () => {
    await supabase.from("bottles").delete().eq("user_id", userId);
    const rows = bottles.filter(b => b.name?.trim()).map((b, i) => ({
      user_id: userId, name: b.name, full_name: b.fullName || b.name,
      house: b.house || "", status: b.status || "to test",
      cost: b.cost || 0, ml: b.ml || 0, freq: b.freq || 0,
      user_notes: b.userNotes || "", thoughts: b.thoughts || "",
      tags: b.tags || {}, has_tester: b.hasTester || false,
      concentration: b.concentration || "", vibes: b.vibes || [],
      sort_order: i,
    }));
    if (rows.length > 0) await supabase.from("bottles").insert(rows);
  });
}

export function syncTestedScents(userId, testedScents) {
  if (!supabase || !userId) return;
  debounce("tested", async () => {
    await supabase.from("tested_scents").delete().eq("user_id", userId);
    const rows = testedScents.filter(t => t.name?.trim()).map(t => ({
      user_id: userId, name: t.name, house: t.house || "",
      date_tested: t.date || null, notes: t.notes || "", thoughts: t.thoughts || "",
      overall: t.overall || 0, sillage: t.sillage || 0, longevity: t.longevity || 0,
      scent: t.scent || 0, avg: t.avg || 0,
      tags: t.tags || {}, concentration: t.concentration || "",
      has_tester: t.hasTester || false,
    }));
    if (rows.length > 0) await supabase.from("tested_scents").insert(rows);
  });
}

export function syncWearLog(userId, wearLog, wearRatings) {
  if (!supabase || !userId) return;
  debounce("wear", async () => {
    await supabase.from("wear_log").delete().eq("user_id", userId);
    const rows = [];
    Object.entries(wearLog).forEach(([date, val]) => {
      toWearArray(val).forEach(bottle_name => {
        rows.push({ user_id: userId, date, bottle_name, rating: wearRatings?.[date] || null });
      });
    });
    if (rows.length > 0) await supabase.from("wear_log").insert(rows);
  });
}

export function syncBottleRatings(userId, bottleRatings) {
  if (!supabase || !userId) return;
  debounce("ratings", async () => {
    await supabase.from("bottle_ratings").delete().eq("user_id", userId);
    const rows = Object.entries(bottleRatings)
      .filter(([, r]) => r && Object.keys(r).length > 0)
      .map(([bottle_name, r]) => ({
        user_id: userId, bottle_name,
        overall: r.overall || null, sillage: r.sillage || null,
        longevity: r.longevity || null, scent: r.scent || null,
      }));
    if (rows.length > 0) await supabase.from("bottle_ratings").insert(rows);
  });
}

export function syncPairings(userId, { customPairings, pairingNotes, pairingRatings, rejectedPairings }) {
  if (!supabase || !userId) return;
  debounce("pairings", async () => {
    await supabase.from("pairings").delete().eq("user_id", userId);
    const rows = [];
    (customPairings || []).forEach(p => {
      rows.push({ user_id: userId, type: "custom", fragrances: p.fragrances, pairing_key: p.fragrances.join("+"), rating: p.rating || 0, notes: p.notes || "", rejected: false });
    });
    const autoKeys = new Set([...Object.keys(pairingNotes || {}), ...Object.keys(pairingRatings || {}), ...(rejectedPairings || [])]);
    autoKeys.forEach(key => {
      rows.push({ user_id: userId, type: "auto", fragrances: key.split("+"), pairing_key: key, rating: pairingRatings?.[key] || 0, notes: pairingNotes?.[key] || "", rejected: (rejectedPairings || []).includes(key) });
    });
    if (rows.length > 0) await supabase.from("pairings").insert(rows);
  });
}

export function syncPreferences(userId, prefs) {
  if (!supabase || !userId) return;
  debounce("prefs", async () => {
    await supabase.from("user_preferences").upsert({
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
  });
}
