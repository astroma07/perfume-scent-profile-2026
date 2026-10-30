/*
 * normalizeData.js
 * Single source of truth for data shapes.
 * Every piece of data passes through here when loaded from ANY source
 * (localStorage, Supabase, JSON import). Downstream code can trust these shapes.
 */

/* ─── BOTTLE ─── */
export function normalizeBottle(b, index = 0) {
  if (!b || typeof b !== "object") return null;
  const name = String(b.name || "").trim();
  if (!name) return null;
  let status = String(b.status || "to test");
  let hasTester = Boolean(b.hasTester || b.has_tester);
  /* Migrate old statuses */
  if (status === "want to try") status = "to test";
  if (status === "want") status = "wishlist";
  if (status === "tester") { status = "wishlist"; hasTester = true; }
  return {
    name,
    fullName: String(b.fullName || b.full_name || name),
    house: String(b.house || ""),
    status,
    cost: Number(b.cost) || 0,
    ml: Number(b.ml) || 0,
    freq: Number(b.freq) || 0,
    userNotes: String(b.userNotes || b.user_notes || ""),
    thoughts: String(b.thoughts || ""),
    tags: (b.tags && typeof b.tags === "object") ? b.tags : {},
    hasTester,
    concentration: String(b.concentration || ""),
    vibes: Array.isArray(b.vibes) ? b.vibes : [],
    _dbId: b._dbId || b.id || null,
  };
}

export function normalizeBottles(raw) {
  if (!Array.isArray(raw)) return [];
  const normalized = raw.map((b, i) => normalizeBottle(b, i)).filter(Boolean);
  /* Deduplicate by name+house — keep the last occurrence (most recently added/edited) */
  const seen = new Map();
  normalized.forEach(b => {
    const key = `${b.name.toLowerCase()}|||${b.house.toLowerCase()}`;
    seen.set(key, b);
  });
  return [...seen.values()];
}

/* ─── TESTED SCENT ─── */
export function normalizeTestedScent(t) {
  if (!t || typeof t !== "object") return null;
  const name = String(t.name || "").trim();
  if (!name) return null;
  return {
    name,
    house: String(t.house || ""),
    date: String(t.date || t.date_tested || ""),
    notes: String(t.notes || ""),
    thoughts: String(t.thoughts || ""),
    overall: Number(t.overall) || 0,
    sillage: Number(t.sillage) || 0,
    longevity: Number(t.longevity) || 0,
    scent: Number(t.scent) || 0,
    avg: Number(t.avg) || 0,
    tags: (t.tags && typeof t.tags === "object") ? t.tags : {},
    concentration: String(t.concentration || ""),
    hasTester: Boolean(t.hasTester || t.has_tester),
    createdAt: Number(t.createdAt) || (t.created_at ? new Date(t.created_at).getTime() : Date.now()),
    _dbId: t._dbId || t.id || null,
  };
}

export function normalizeTestedScents(raw) {
  if (!Array.isArray(raw)) return [];
  const normalized = raw.map(normalizeTestedScent).filter(Boolean);
  const seen = new Map();
  normalized.forEach(t => {
    const key = `${t.name.toLowerCase()}|||${t.house.toLowerCase()}`;
    seen.set(key, t);
  });
  return [...seen.values()];
}

/* ─── WEAR LOG ─── 
 * Canonical format: { "2026-07-15": ["Nosferatu", "Tam Dao"] }
 * Always arrays. Handles: string, array, null, undefined.
 */
/* Turn a wear-log value into a flat list of bottle names.
 *
 * Values can arrive JSON-encoded — a bad migration wrote whole arrays into
 * the single-name bottle_name column, so a "name" can literally be the text
 * ["Velvet Violet"], and each save/load cycle wrapped it again. Treating
 * such a string as a name is what put those brackets on screen, so unwrap
 * anything that parses as an array or string and flatten the result. This
 * repairs existing rows on load; nothing has to be cleaned up by hand. */
export function toWearArray(val, depth = 0) {
  if (!val) return [];
  if (depth > 6) return [];

  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return [];
    /* Only attempt a parse when it looks encoded — a real name like
       "Angel's Share on the Rocks" must never go near JSON.parse. */
    if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith('"') && s.endsWith('"'))) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) || typeof parsed === "string") return toWearArray(parsed, depth + 1);
      } catch { /* not encoded after all — fall through and treat as a name */ }
    }
    return [s];
  }

  if (Array.isArray(val)) {
    const out = [];
    val.forEach(v => { toWearArray(v, depth + 1).forEach(n => out.push(n)); });
    /* De-duplicate: unwrapping often reveals the same name twice, once
       plain and once from inside its encoded copy. */
    return [...new Set(out)];
  }

  return [];
}

export function normalizeWearLog(raw) {
  if (!raw || typeof raw !== "object") return {};
  const log = {};
  Object.entries(raw).forEach(([date, val]) => {
    const arr = toWearArray(val);
    if (arr.length > 0) log[date] = arr;
  });
  return log;
}

/* ─── RATINGS ───
 * Canonical: { bottleName: { overall: 7.5, sillage: 8, longevity: 6, scent: 9 } }
 */
export function normalizeRatingObj(r) {
  if (!r || typeof r !== "object") return {};
  const out = {};
  ["overall", "sillage", "longevity", "scent"].forEach(k => {
    const v = Number(r[k]);
    if (v > 0) out[k] = v;
  });
  return Object.keys(out).length > 0 ? out : {};
}

export function normalizeBottleRatings(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  Object.entries(raw).forEach(([name, r]) => {
    const nr = normalizeRatingObj(r);
    if (Object.keys(nr).length > 0) out[name] = nr;
  });
  return out;
}

export function normalizeWearRatings(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  Object.entries(raw).forEach(([date, r]) => {
    const nr = normalizeRatingObj(r);
    if (Object.keys(nr).length > 0) out[date] = nr;
  });
  return out;
}

/* ─── PAIRINGS ─── */
export function normalizeCustomPairings(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(p => p && Array.isArray(p.fragrances) && p.fragrances.length >= 2).map(p => ({
    id: p.id || Date.now(),
    fragrances: p.fragrances,
    rating: Number(p.rating) || 0,
    notes: String(p.notes || ""),
    createdAt: Number(p.createdAt) || (p.created_at ? new Date(p.created_at).getTime() : Date.now()),
  }));
}

/* ─── SIMPLE OBJECTS / ARRAYS ─── */
export function normalizeObj(raw, fallback = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  return raw;
}

export function normalizeArr(raw, fallback = []) {
  if (!Array.isArray(raw)) return fallback;
  return raw;
}

export function normalizeStringArr(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(v => typeof v === "string" && v);
}

/* ─── FULL DATA BUNDLE ───
 * Normalize an entire data bundle from any source.
 */
export function normalizeAll(data) {
  if (!data || typeof data !== "object") return null;
  return {
    bottles: normalizeBottles(data.bottles),
    testedScents: normalizeTestedScents(data.testedScents),
    wearLog: normalizeWearLog(data.wearLog),
    wearRatings: normalizeWearRatings(data.wearRatings),
    bottleRatings: normalizeBottleRatings(data.bottleRatings),
    customPairings: normalizeCustomPairings(data.customPairings),
    pairingNotes: normalizeObj(data.pairingNotes),
    pairingRatings: normalizeObj(data.pairingRatings),
    rejectedPairings: normalizeArr(data.rejectedPairings),
    likedNotes: normalizeStringArr(data.likedNotes),
    dislikedNotes: normalizeStringArr(data.dislikedNotes),
    noteOverrides: normalizeObj(data.noteOverrides),
    opposingPairs: normalizeArr(data.opposingPairs),
    vibeMap: normalizeObj(data.vibeMap),
    purchaseData: normalizeObj(data.purchaseData),
    visibleStats: normalizeObj(data.visibleStats, { collection: true, invested: true, daysWorn: true, signature: true }),
    visibleTabs: normalizeObj(data.visibleTabs, { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true }),
    theme: normalizeObj(data.theme, { preset: "apothecary" }),
    notes: normalizeArr(data.notes),
  };
}
