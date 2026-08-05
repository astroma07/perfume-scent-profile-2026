/*
 * crossSync.js
 * Bidirectional sync between tested scents and collection bottles.
 * Merges data when both exist, carries over when only one has it.
 */

/* Merge two comma-separated note strings, deduplicating */
function mergeNotes(a, b) {
  const notesA = (a || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
  const notesB = (b || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
  const merged = [...new Set([...notesA, ...notesB])];
  return merged.join(", ");
}

/* Merge two thought strings — combine if both exist and different */
function mergeThoughts(a, b) {
  const ta = (a || "").trim();
  const tb = (b || "").trim();
  if (!ta) return tb;
  if (!tb) return ta;
  if (ta.toLowerCase() === tb.toLowerCase()) return ta;
  /* Combine both, separated */
  return `${ta}\n${tb}`;
}

/* Merge tags objects */
function mergeTags(a, b) {
  const ta = a || {};
  const tb = b || {};
  const merged = { ...ta };
  Object.entries(tb).forEach(([cat, keys]) => {
    if (!merged[cat]) merged[cat] = [];
    if (Array.isArray(keys)) {
      merged[cat] = [...new Set([...(merged[cat] || []), ...keys])];
    }
  });
  return merged;
}

/* Pick the non-empty value, preferring the more recently edited */
function pick(a, b) {
  if (a && !b) return a;
  if (b && !a) return b;
  return a || b;
}

/*
 * syncTestedToBottle — updates a bottle with data from a tested entry.
 * Returns updated bottles array.
 */
export function syncTestedToBottles(testedEntry, bottles) {
  const name = testedEntry.name?.trim().toLowerCase();
  if (!name) return bottles;

  return bottles.map(b => {
    if (b.name?.trim().toLowerCase() !== name) return b;
    return {
      ...b,
      userNotes: mergeNotes(b.userNotes, testedEntry.notes),
      thoughts: mergeThoughts(b.thoughts, testedEntry.thoughts),
      tags: mergeTags(b.tags, testedEntry.tags),
      concentration: pick(testedEntry.concentration, b.concentration),
      hasTester: b.hasTester || testedEntry.hasTester,
    };
  });
}

/*
 * syncBottleToTested — updates a tested entry with data from a bottle.
 * Returns updated testedScents array.
 */
export function syncBottleToTested(bottle, testedScents) {
  const name = bottle.name?.trim().toLowerCase();
  if (!name) return testedScents;

  return testedScents.map(t => {
    if (t.name?.trim().toLowerCase() !== name) return t;
    return {
      ...t,
      notes: mergeNotes(t.notes, bottle.userNotes),
      thoughts: mergeThoughts(t.thoughts, bottle.thoughts),
      tags: mergeTags(t.tags, bottle.tags),
      concentration: pick(bottle.concentration, t.concentration),
      hasTester: t.hasTester || bottle.hasTester,
    };
  });
}

/*
 * fullCrossSync — sync all matching entries between bottles and tested.
 * Run once on load to merge any existing discrepancies.
 * Returns { bottles, testedScents } with merged data.
 */
export function fullCrossSync(bottles, testedScents) {
  let syncedBottles = [...bottles];
  let syncedTested = [...testedScents];

  /* For each tested entry, update matching bottle */
  syncedTested.forEach(t => {
    syncedBottles = syncTestedToBottles(t, syncedBottles);
  });

  /* For each bottle, update matching tested entry */
  syncedBottles.forEach(b => {
    syncedTested = syncBottleToTested(b, syncedTested);
  });

  return { bottles: syncedBottles, testedScents: syncedTested };
}
