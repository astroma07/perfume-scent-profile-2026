import { NOTE_TO_FRAGRANCES } from "./noteMap.js";

export const NOTE_FAMILIES = {
  citrus: ["bergamot","lemon","orange","grapefruit","mandarin","lime","yuzu","blood orange","bitter orange","citrus","citrusy","kumquat","tangerine","petitgrain","clementine"],
  fruity: ["apple","pear","peach","plum","raspberry","blackberry","cherry","fig","mango","coconut","pineapple","blackcurrant","apricot","pomegranate","date","tamarind","quince","passion fruit","lychee","cassis","berry","african marigold","fruity","fruit","grape","melon","banana","strawberry","litchi","lychee nut"],
  green: ["green notes","green","grass","basil","mint","galbanum","ivy","tomato leaf","green tea","tea","herbs","herbal","herbaceous","violet leaf","mate","thyme","rosemary","sage","clary sage","bamboo","hemp","green pepper","bay leaf","tarragon","artemisia","wormwood","absinthe","black tea","pine","palm leaves","aromatic","lavender","fougere","conifer","eucalyptus","camphor","matcha","hojicha","sencha","gyokuro","oolong tea","white tea","darjeeling tea","hay","sweet grass","dry green notes","oat","wheat","barley","laurel","bay","blue yarrow","yarrow","seagrass","fig leaf","cucumber","linen","nettle","fennel","dill","lemongrass","myrtle leaf","green stems","vine","pu'er tea","puer tea","pu-erh tea"],
  aquatic: ["sea salt","sea notes","ozone","seaweed","water","rain","marine","driftwood","ambergris","calone","fresh","clean","watery","ozonic","mineral","aldehyde","aldehydic","crisp","cool","cold air","wet air","sea air","mountain air","cold mountain air","salt","iodine","wet slate","slate","cold vapor","snow","glacier","spring water","air","sea spray","steam accord","steam","cotton flower","cold vapour"],
  floral: ["rose","jasmine","iris","tuberose","violet","magnolia","ylang-ylang","orange blossom","gardenia","lily","orchid","geranium","carnation","peony","freesia","heliotrope","osmanthus","chamomile","honeysuckle","neroli","davana","jasmine sambac","frangipani","mimosa","white floral","lotus","champaca","chrysanthemum","floral","powdery","soft","delicate","ylang ylang","orris","orris root","narcissus","jonquil","lilac","bluebell","mountain bluebell","pollen","cyclamen","lily of the valley","wisteria","carrot seeds","carrot seed","carrot heart","lipstick","jonquille"],
  spicy: ["cardamom","pepper","pink pepper","black pepper","cinnamon","saffron","nutmeg","ginger","clove","cumin","coriander","anise","star anise","juniper","oregano","angelica","red pepper","sichuan pepper","spicy","spice","spices","hot","pungent","peppery"],
  oriental: ["amber","vanilla","tonka","benzoin","labdanum","honey","resins","copal","styrax","balsam","ambrette","musk","cashmeran","iso e super","ambroxan","marshmallow","sweet","warm","creamy","musky","sensual","opulent","rich","velvety","balmy","ambery","beeswax","skin","gum acacia","acacia","opoponax","tolu balsam"],
  resinous: ["frankincense","myrrh","incense","opopanax","olibanum","elemi","dragon's blood","balsamic","resinous","sacred","cistus","mastic","sacred resin"],
  woody: ["sandalwood","cedar","cedarwood","vetiver","oud","rosewood","hinoki","guaiac wood","cypress","birch","mahogany","teak","agarwood","amyris","akigalawood","palo santo","woody","wood","oakwood","dry","cryptomeria","lenga beech","beech","bark","resin-streaked bark","cypriol","fir","fir balsam","spruce","larch","white cedar","juniper wood","paper","varnish accord","varnish","old furniture","imbuia wood","imbuia","dry wood","blonde tobacco"],
  earthy: ["patchouli","oakmoss","moss","earth","mushroom","soil","truffle","myrtle","helichrysum","immortelle","cave moss","stone","earthy","mossy","damp","loamy","petrichor","dirt","leaf litter","twisted roots","roots","lichen","bearded lichen","humus","desert sand","sand","wet stone","flint","chypre notes","chypre","old house","peat"],
  smoky: ["leather","suede","smoke","tobacco","birch tar","cade","gunpowder","tar","civet","castoreum","cannabis","neon","copper","peat","smoky","smokey","leathery","metallic","animalic","dark","rugged","industrial","lapsang souchong","smoked tea","smouldering wood","ash","charcoal","lava","horse skin","horse","varnish"],
  gourmand: ["chocolate","coffee","cacao","caramel","almond","praline","sugar","chestnut","whiskey","rum","bourbon","milk","sesame","popcorn","apple brandy","cookie","hazelnut","gourmand","edible","buttery","nutty","roasted","toasted","baked","syrupy","boozy","dessert","scotch whisky","whisky","cognac","merlot","wine","brandy","malt","sugar cane","vanillin","maltol","butter","coumarin","rice"],
};

export const FAMILY_COLORS = {
  citrus: "#a8c256", fruity: "#c49bd4", green: "#6b9e6b", aquatic: "#7bafc4",
  floral: "#d4849a", spicy: "#d4944a", oriental: "#c47a6b", resinous: "#a35a5a",
  woody: "#8a9e7a", earthy: "#7a8a5a", smoky: "#8a6a4a", gourmand: "#9a6a8a",
};

export const FAMILY_LABELS = {
  citrus: "Citrus", fruity: "Fruity", green: "Green & Herbal",
  aquatic: "Aquatic & Fresh", floral: "Floral", spicy: "Spicy",
  oriental: "Oriental & Amber", resinous: "Resinous & Incense",
  woody: "Woody", earthy: "Earthy & Mossy",
  smoky: "Smoky & Leather", gourmand: "Gourmand",
};

export const FAMILY_ORDER = ["floral","oriental","resinous","spicy","smoky","woody","earthy","gourmand","fruity","citrus","green","aquatic"];

export function getNoteFamily(note, overrides) {
  const nl = note.toLowerCase().trim();
  if (overrides && overrides[nl]) return overrides[nl];
  for (const [family, notes] of Object.entries(NOTE_FAMILIES)) {
    if (notes.includes(nl)) return family;
  }
  for (const [family, notes] of Object.entries(NOTE_FAMILIES)) {
    if (notes.some(n => nl.includes(n) || n.includes(nl))) return family;
  }
  return "oriental";
}

export const isValidBottle = (b) => b.name && b.name.trim() && b.name.trim().toLowerCase() !== "new fragrance";

export function computeNotesProfile(bottles, testedScents) {
  const counts = {};

  /* Status weights: what you own/wear matters most */
  const statusWeight = (b) => {
    if (b.status === "owned") return 4;
    if (b.status === "had") return 2.5;
    if (b.status === "tester") return 3;
    if (b.hasTester) return 2;
    if (b.status === "wishlist") return 1;
    return 0.5;
  };

  /* Frequency bonus: bottles worn more often define your profile more */
  const freqBonus = (b) => 1 + Math.min((b.freq || 0) * 0.15, 2);

  /* Position weighting: first-listed notes are typically most prominent */
  const positionWeight = (idx, total) => total <= 1 ? 1 : 1 - (idx / total) * 0.5;

  /* Process collection bottles */
  bottles.filter(b => isValidBottle(b)).forEach(b => {
    const notes = (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
    if (notes.length === 0) return;
    const base = statusWeight(b) * freqBonus(b);
    notes.forEach((n, idx) => {
      counts[n] = (counts[n] || 0) + base * positionWeight(idx, notes.length);
    });
  });

  /* Tested scents */
  (testedScents || []).forEach(t => {
    const notes = (t.notes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
    notes.forEach((n, idx) => {
      counts[n] = (counts[n] || 0) + 2 * positionWeight(idx, notes.length);
    });
  });

  /* Fallback: match bottles without notes against NOTE_TO_FRAGRANCES */
  bottles.filter(b => isValidBottle(b) && (!b.userNotes || b.userNotes.trim() === "")).forEach(b => {
    const bName = (b.fullName || b.name).toLowerCase();
    Object.entries(NOTE_TO_FRAGRANCES).forEach(([note, frags]) => {
      frags.forEach(f => {
        if (bName.includes(f.split(" — ")[0].toLowerCase()) || f.toLowerCase().includes(bName.split(" — ")[0].toLowerCase())) {
          counts[note] = (counts[note] || 0) + statusWeight(b) * 0.5;
        }
      });
    });
  });

  /* Normalize: percentages relative to TOTAL, not just top N */
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return [];
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  return sorted.map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    pct: Math.round((count / total) * 100),
    raw: Math.round(count * 10) / 10,
  }));
}

export function scoreFragranceFit(bottle, ownedBottles, notesProfile) {
  let score = 0;
  const matchedNotes = [];
  const reasons = [];
  const ownedNoteSet = new Set();
  Object.entries(NOTE_TO_FRAGRANCES).forEach(([note, frags]) => {
    frags.forEach(f => {
      if (ownedBottles.some(ob => {
        const fn = (ob.fullName || ob.name).toLowerCase();
        const ff2 = f.toLowerCase();
        return fn.includes(ff2.split(" — ")[0].toLowerCase()) || ff2.includes(fn.split(" — ")[0].toLowerCase());
      })) { ownedNoteSet.add(note); }
    });
  });
  const profileNotes = {};
  (notesProfile || []).forEach(n => { profileNotes[n.name.toLowerCase()] = n.pct; });
  const candidateName = (bottle.fullName || bottle.name).toLowerCase();
  const candidateNotes = new Set();
  Object.entries(NOTE_TO_FRAGRANCES).forEach(([note, frags]) => {
    frags.forEach(f => {
      if (candidateName.includes(f.split(" — ")[0].toLowerCase()) || f.toLowerCase().includes(candidateName.split(" — ")[0].toLowerCase())) {
        candidateNotes.add(note);
      }
    });
  });
  let profileScore = 0;
  candidateNotes.forEach(note => { if (profileNotes[note]) { profileScore += profileNotes[note]; matchedNotes.push(note); } });
  Object.keys(profileNotes).forEach(pn => { if (candidateName.includes(pn) && !matchedNotes.includes(pn)) { profileScore += profileNotes[pn] * 0.5; matchedNotes.push(pn); } });
  score += Math.min(50, profileScore * 0.8);
  if (matchedNotes.length > 0) reasons.push("Matches your top notes: " + matchedNotes.slice(0, 3).join(", "));
  let overlapCount = 0;
  candidateNotes.forEach(note => { if (ownedNoteSet.has(note)) overlapCount++; });
  score += candidateNotes.size > 0 ? (overlapCount / candidateNotes.size) * 30 : 0;
  if (overlapCount > 2) reasons.push(overlapCount + " notes overlap with your collection");
  if (bottle.house && ownedBottles.some(ob => ob.house && ob.house.toLowerCase() === bottle.house.toLowerCase())) {
    score += 15; reasons.push("You already love " + bottle.house);
  }
  if (bottle.status === "wishlist") score += 5;
  return { score: Math.min(100, Math.round(score)), matchedNotes: [...new Set(matchedNotes)], reason: reasons.length > 0 ? reasons[0] : "Expand your horizons", isWildcard: score < 20 };
}

/* ─── Purchase prioritization: family coverage, gaps and neighbours ───
   These answer two questions about a wishlist candidate: which family it
   fills, and what it already resembles in the collection. */

const splitNotes = (b) => (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);

/* A bottle's family makeup as fractions summing to 1. */
export function familyBreakdown(bottle, overrides) {
  const notes = splitNotes(bottle);
  if (notes.length === 0) return [];
  const counts = {};
  notes.forEach(n => { const f = getNoteFamily(n, overrides); counts[f] = (counts[f] || 0) + 1; });
  return Object.entries(counts)
    .map(([family, c]) => ({ family, weight: c / notes.length }))
    .sort((a, b) => b.weight - a.weight);
}

/* What the owned collection actually looks like by family, as percentages.
   Weighted by wear frequency so daily drivers count more than shelf sitters. */
export function computeFamilyProfile(bottles, overrides) {
  const owned = (bottles || []).filter(b => isValidBottle(b) && b.status === "owned");
  const acc = {};
  let total = 0;
  owned.forEach(b => {
    const freqWeight = 1 + Math.min((b.freq || 0) * 0.15, 2);
    familyBreakdown(b, overrides).forEach(({ family, weight }) => {
      const add = weight * freqWeight;
      acc[family] = (acc[family] || 0) + add;
      total += add;
    });
  });
  const shares = {};
  FAMILY_ORDER.forEach(f => { shares[f] = total > 0 ? ((acc[f] || 0) / total) * 100 : 0; });
  return { shares, total, ownedCount: owned.length };
}

/* Positive when a candidate leans into families the collection is short on,
   negative when it piles onto saturated ones. Measured against an even
   spread across the 12 families. */
export function scoreGapFill(bottle, shares, overrides) {
  const fams = familyBreakdown(bottle, overrides);
  if (fams.length === 0) return { gap: 0, fams: [], verdict: "unknown" };
  const even = 100 / Object.keys(FAMILY_LABELS).length;
  let gap = 0;
  const detail = fams.map(({ family, weight }) => {
    const share = shares?.[family] ?? 0;
    gap += weight * (even - share);
    return { family, weight, share };
  });
  return { gap, fams: detail };
}

/* Closest things already owned, by shared-note overlap (Jaccard). */
export function findNearestOwned(bottle, bottles, limit = 3, overrides) {
  const candidate = new Set(splitNotes(bottle));
  if (candidate.size === 0) return [];
  const owned = (bottles || []).filter(b => isValidBottle(b) && b.status === "owned" && b.name !== bottle.name);
  return owned
    .map(o => {
      const theirs = new Set(splitNotes(o));
      const shared = [...candidate].filter(n => theirs.has(n));
      const unionSize = new Set([...candidate, ...theirs]).size;
      return {
        name: o.name,
        house: o.house || "",
        overlap: unionSize > 0 ? shared.length / unionSize : 0,
        shared,
      };
    })
    .filter(r => r.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit);
}

/* One label for the whole picture.

   The verdict reads off how saturated the candidate's own families already
   are — a directly interpretable number ("its main family is 26% of what you
   own") rather than a distance from an even 12-family spread, which no real
   collection resembles and which labelled three quarters of a wishlist
   "saturated". A high-overlap neighbour outranks the family maths: a
   near-duplicate is a near-duplicate however rare its family. */
export function gapVerdict(gap, nearest, fams) {
  const top = nearest?.[0]?.overlap ?? 0;
  if (top >= 0.5) return { key: "duplicate", label: "Near-duplicate", tone: "bad" };
  if (!fams || fams.length === 0) return { key: "unknown", label: "No notes yet", tone: "neutral" };

  /* Share of the collection already occupied by this candidate's families,
     weighted by how much of the candidate each one is. */
  const weighted = fams.reduce((s, f) => s + f.weight * f.share, 0);
  if (weighted < 7) return { key: "gap", label: "Fills a gap", tone: "good", saturation: weighted };
  if (weighted > 14) return { key: "saturated", label: "Doubles down", tone: "warn", saturation: weighted };
  return { key: "balanced", label: "Balanced", tone: "neutral", saturation: weighted };
}

/* ─── Purchase ranking: value, match and uniqueness ───
   Three deliberately independent axes. They disagree on purpose — a
   near-twin of a favourite scores high on match and low on uniqueness —
   and the UI shows all three rather than collapsing them into one number.

   All of these read userNotes, not the NOTE_TO_FRAGRANCES name lookup that
   scoreFragranceFit uses: that table holds a few dozen fragrances, so it
   returns an identical floor score for most of a real wishlist. */

/* Price per millilitre, or null when either figure is missing. */
export function pricePerMl(bottle) {
  const cost = Number(bottle?.cost) || 0;
  const ml = Number(bottle?.ml) || 0;
  if (cost <= 0 || ml <= 0) return null;
  return cost / ml;
}

/* 0–100, cheapest per-mL in the list scoring 100. Relative to the list
   rather than an absolute price, so it stays meaningful whatever the band. */
export function scoreValue(bottle, allBottles) {
  const ppm = pricePerMl(bottle);
  if (ppm === null) return null;
  const rates = (allBottles || []).map(pricePerMl).filter(r => r !== null);
  if (rates.length === 0) return null;
  const best = Math.min(...rates), worst = Math.max(...rates);
  if (worst === best) return 100;
  return Math.round((1 - (ppm - best) / (worst - best)) * 100);
}

/* 0–100: how much this looks like what she already wears. Blends affinity
   with her weighted note profile, family-mix similarity, and concrete
   note overlap with owned bottles. */
export function scoreCollectionMatch(bottle, bottles, notesProfile, shares, overrides) {
  const notes = splitNotes(bottle);
  if (notes.length === 0) return { score: null, reason: "No notes yet" };

  /* 1. Affinity with the top-note profile. */
  const profile = {};
  (notesProfile || []).forEach(n => { profile[n.name.toLowerCase()] = n.pct; });
  const matched = notes.filter(n => profile[n]);
  const profileHit = matched.reduce((s, n) => s + profile[n], 0);
  const profileMax = Object.values(profile).slice(0, notes.length).reduce((s, v) => s + v, 0) || 1;
  const affinity = Math.min(1, profileHit / profileMax);

  /* 2. Family-mix similarity against the collection's distribution. */
  const fams = familyBreakdown(bottle, overrides);
  const totalShare = Object.values(shares || {}).reduce((s, v) => s + v, 0) || 1;
  const famSim = fams.reduce((s, f) => s + f.weight * ((shares?.[f.family] || 0) / totalShare), 0) * Object.keys(FAMILY_LABELS).length;

  /* 3. Strongest concrete overlap with something owned. */
  const nearest = findNearestOwned(bottle, bottles, 1, overrides);
  const overlap = nearest[0]?.overlap || 0;

  const score = Math.round(Math.min(100, (0.45 * affinity + 0.35 * Math.min(1, famSim) + 0.20 * Math.min(1, overlap * 2)) * 100));
  const reason = matched.length
    ? `Shares ${matched.slice(0, 3).join(", ")} with your profile`
    : nearest[0]
      ? `Closest to ${nearest[0].name}`
      : "Little in common with your collection";
  return { score, reason, matched, nearest: nearest[0] || null };
}

/* 0–100: how unlike everything owned. High gap plus nothing close.
   Gap alone isn't enough — a bottle can fill an empty family and still be
   a near-twin of something on the shelf. */
export function scoreUniqueness(bottle, bottles, shares, overrides) {
  const notes = splitNotes(bottle);
  if (notes.length === 0) return { score: null, reason: "No notes yet" };

  const { gap, fams } = scoreGapFill(bottle, shares, overrides);
  const nearest = findNearestOwned(bottle, bottles, 1, overrides);
  const overlap = nearest[0]?.overlap || 0;

  /* Gap runs roughly -11..+4 on a real collection; map onto 0..1. */
  const gapNorm = Math.max(0, Math.min(1, (gap + 11) / 15));
  const distinct = 1 - Math.min(1, overlap * 2);

  const score = Math.round((0.5 * gapNorm + 0.5 * distinct) * 100);
  /* Name the family driving this bottle's gap — its own weight times how
     scarce it is — rather than the collection's rarest family overall,
     which would give every candidate the same sentence. */
  const even = 100 / Object.keys(FAMILY_LABELS).length;
  const rarest = fams.length
    ? fams.slice().sort((a, b) => (b.weight * (even - b.share)) - (a.weight * (even - a.share)))[0]
    : null;
  /* The sentence has to agree with the score: naming a scarce family under
     a low score reads as a pitch for something the number is arguing
     against. Below the midpoint, say what makes it familiar instead. */
  const heaviest = fams.length
    ? fams.slice().sort((a, b) => (b.weight * b.share) - (a.weight * a.share))[0]
    : null;
  let reason;
  if (overlap >= 0.5) reason = `Close twin of ${nearest[0].name}`;
  else if (score < 45 && heaviest) reason = `Leans ${FAMILY_LABELS[heaviest.family] || heaviest.family}, already ${heaviest.share.toFixed(0)}% of your collection`;
  else if (rarest) reason = `${FAMILY_LABELS[rarest.family] || rarest.family} is only ${rarest.share.toFixed(0)}% of your collection`;
  else reason = "Nothing comparable owned";
  return { score, reason, overlap, nearest: nearest[0] || null };
}

/* ─── Register: clean ↔ dark, independent of family ───
   Family says what a fragrance is made of; register says how it carries.
   Cedar-vetiver-sandalwood and vetiver-tobacco-birch-tar are both "woody",
   and a collection can be saturated in the family while empty in one
   register — which is why a clean woody can fill a real hole in a
   26%-woody collection. 0 = darkest, 100 = cleanest. */

/* Darkness is opacity, not warmth. A vanilla-amber is warm and legible;
   a birch-tar leather is opaque. So the sweet resins and balsams sit near
   the middle, and the bottom of the scale is reserved for smoke, tar,
   leather, earth and animalics. Frankincense is cool and airy, which is
   why it sits well above myrrh despite both being "incense". */
const REGISTER_SCALE = {
  95: ["sea salt", "salt", "marine", "cold vapor", "mineral", "petrichor", "iodine", "ozone",
       "aldehydes", "white musk", "air", "water","habanolide","galaxolide","cosmone","steam accord"],
  85: ["yuzu", "bergamot", "citrus", "lemon", "grapefruit", "lime", "petitgrain", "neroli", "mint",
       "violet leaf", "green stems", "galbanum", "seagrass", "tomato leaf", "fig leaf", "matcha",
       "oolong tea", "green tea", "mate", "green", "cucumber", "bamboo","cotton flower","cotton"],
  72: ["iris", "orris", "tea", "darjeeling tea", "black tea", "white tea", "chamomile", "pollen",
       "lilac", "rhubarb", "ginger flower", "ginger", "basil", "thyme", "rosemary", "clary sage",
       "sage", "artemisia", "myrtle", "juniper", "cypress", "hemlock", "pine", "conifers", "fig",
       "narcissus", "geranium", "lavender", "anise", "coriander", "wheat", "barley", "hay", "linen","paper","papyrus"],
  60: ["cedar", "cedarwood", "rosewood", "cypriol", "musk", "ambrette", "floral", "white floral",
       "gardenia", "jasmine", "jasmine sambac", "orange blossom", "tuberose", "orchid", "violet",
       "rose", "peony", "magnolia", "mimosa", "heliotrope", "pink pepper", "cardamom", "sesame",
       "coconut", "plum", "raspberry", "pear", "apple", "peach", "pineapple", "blackcurrant",
       "cassis", "fruity", "angelica", "almond", "milk", "rice","carrot seeds","carrot seed","carrot heart","lipstick","jonquille"],
  50: ["sandalwood", "vetiver", "guaiac wood", "guaiac", "akigalawood", "woods", "wood", "spice",
       "saffron", "vanilla", "tonka", "benzoin", "amber", "ambergris", "ambroxan", "cashmeran",
       "moss", "oakmoss", "chestnut", "fir balsam", "suede", "nutmeg", "black pepper", "pepper",
       "honey", "beeswax", "caramel", "praline", "whiskey", "buchu","chypre notes","chypre"],
  40: ["incense", "resin", "resins", "labdanum", "opoponax", "styrax", "elemi", "copal",
       "cinnamon", "clove", "cumin", "oregano", "coffee", "cocoa", "chocolate", "cognac",
       "rum", "merlot", "wine", "immortelle", "mastic","sugar cane","vanillin","maltol","butter","coumarin","pu'er tea","puer tea","pu-erh tea"],
  48: ["frankincense", "olibanum", "myrrh"],
  28: ["smoked tea", "lapsang souchong", "hinoki", "mushroom", "truffle", "humus","varnish accord","varnish","old furniture","old house","imbuia wood","imbuia"],
  20: ["tobacco", "pipe tobacco", "leather", "green leather", "cade", "birch",
       "patchouli", "raw patchouli", "earth", "earthy", "damp earth", "soil", "smoke", "smoky",
       "oud", "agarwood", "cannabis", "ink", "asphalt", "gunpowder", "metal","lava","blonde tobacco"],
  6: ["birch tar", "tar", "creosote", "animalic", "castoreum", "civet", "hyraceum", "musk deer","horse skin"],
};

const NOTE_REGISTER = {};
Object.entries(REGISTER_SCALE).forEach(([value, notes]) => {
  notes.forEach(n => { NOTE_REGISTER[n] = Number(value); });
});

/* Longest key first, so "fig leaf" and "white cedar" resolve to their own
   entries instead of whichever shorter key happens to be reached first. */
const REGISTER_KEYS = Object.keys(NOTE_REGISTER).sort((a, b) => b.length - a.length);

/* A note's position on the scale. Falls back to its family's typical
   register so an unmapped note still contributes rather than silently
   skewing the average. */
const FAMILY_REGISTER = {
  citrus: 85, aquatic: 88, green: 78, fruity: 60, floral: 58, spicy: 48,
  woody: 54, earthy: 24, oriental: 46, resinous: 42, smoky: 16, gourmand: 46,
};

export function noteRegister(note, overrides) {
  const nl = (note || "").toLowerCase().trim();
  if (!nl) return null;
  if (NOTE_REGISTER[nl] !== undefined) return NOTE_REGISTER[nl];
  /* Partial match before falling back — "smoked vanilla", "white cedar". */
  for (const key of REGISTER_KEYS) {
    if (nl.includes(key) || key.includes(nl)) return NOTE_REGISTER[key];
  }
  return FAMILY_REGISTER[getNoteFamily(nl, overrides)] ?? 50;
}

/* "Mid", not "Balanced" — the gap verdict already uses Balanced for a
   different idea, and two chips on one row reading BALANCED at each other
   is worse than a slightly plainer word. */
export function registerLabel(score) {
  if (score === null || score === undefined) return "—";
  if (score >= 72) return "Clean";
  if (score >= 56) return "Bright";
  if (score >= 42) return "Mid";
  if (score >= 28) return "Deep";
  return "Dark";
}

/* A bottle's register.
 *
 * Not a plain average: one dark material dominates how a fragrance reads
 * far beyond its share of the note list. Averaging put Sycomore (which has
 * tobacco in it) above Cedrus, which is backwards, and collapsed everything
 * into a narrow middle band. So the darkest note pulls the mean down — but
 * only in proportion to how dark it actually is, because a drop of birch
 * tar changes a fragrance and a note of coconut does not. Later notes also
 * weigh more, since the drydown is what a wearing settles into. */
export function scoreRegister(bottle, overrides) {
  const notes = splitNotes(bottle);
  if (notes.length === 0) return null;
  let total = 0, weight = 0, darkest = null;
  notes.forEach((n, i) => {
    const r = noteRegister(n, overrides);
    if (r === null) return;
    const w = 1 + (i / Math.max(1, notes.length - 1)) * 0.6;
    total += r * w;
    weight += w;
    if (darkest === null || r < darkest) darkest = r;
  });
  if (weight === 0) return null;
  const mean = total / weight;
  /* No pull from a darkest note at or above the midpoint; full pull from
     tar and animalics at the floor. */
  const pull = Math.max(0, Math.min(1, (50 - darkest) / 40)) * 0.5;
  return Math.round(mean * (1 - pull) + darkest * pull);
}

/* The owned collection's register within each family, with its spread.
   The spread is the part that matters: a family can be 26% of a collection
   and still sit entirely in one register, which is the hole that family
   share alone cannot show. Only families carried by at least two bottles
   get a range, since one bottle has no spread to report. */
export function computeFamilyRegister(bottles, overrides) {
  const owned = (bottles || []).filter(b => isValidBottle(b) && b.status === "owned");
  const acc = {};
  owned.forEach(b => {
    const reg = scoreRegister(b, overrides);
    if (reg === null) return;
    const freqWeight = 1 + Math.min((b.freq || 0) * 0.15, 2);
    familyBreakdown(b, overrides).forEach(({ family, weight }) => {
      /* A trace of a family shouldn't vote on that family's register. */
      if (weight < 0.15) return;
      const w = weight * freqWeight;
      if (!acc[family]) acc[family] = { total: 0, weight: 0, regs: [] };
      acc[family].total += reg * w;
      acc[family].weight += w;
      acc[family].regs.push(reg);
    });
  });
  const out = {};
  Object.entries(acc).forEach(([family, { total, weight, regs }]) => {
    out[family] = {
      mean: weight > 0 ? Math.round(total / weight) : null,
      min: Math.min(...regs),
      max: Math.max(...regs),
      n: regs.length,
    };
  });
  return out;
}

/* Where a candidate sits against what she already owns in its own family.
   This is the whole point of the axis: "woody" is 26% of the collection and
   a clean woody can still be the emptiest shelf in it. Measured against the
   candidate's heaviest family, because that is the one it will read as. */
export function registerGap(bottle, familyRegister, overrides) {
  const reg = scoreRegister(bottle, overrides);
  if (reg === null) return { register: null, delta: null, label: "—", reason: "Add notes to place it on the scale" };

  const fams = familyBreakdown(bottle, overrides);
  const home = fams.find(f => familyRegister[f.family]?.mean !== null && familyRegister[f.family] !== undefined)
            || fams[0] || null;
  const owned = home ? familyRegister[home.family] : null;

  if (!owned || owned.mean === null) {
    return { register: reg, delta: null, family: home?.family || null,
      label: registerLabel(reg), reason: `Nothing owned in ${FAMILY_LABELS[home?.family] || "this family"} to compare against` };
  }

  const delta = reg - owned.mean;
  const fam = (FAMILY_LABELS[home.family] || home.family).toLowerCase();
  const inRange = reg >= owned.min && reg <= owned.max;
  /* One bottle is a data point, not a pattern — say so rather than calling it
     "your woody", which reads as a settled habit built on a sample of one. */
  const one = owned.n < 2;
  let reason;
  if (one) {
    reason = `Your only ${fam} bottle sits at ${owned.mean}; this is ${reg}`;
  } else if (!inRange) {
    reason = `Your ${owned.n} ${fam} bottles all sit ${owned.min}–${owned.max}; this is ${reg}`;
  } else if (Math.abs(delta) < 8) {
    reason = `Same register as your ${fam} (${owned.mean})`;
  } else {
    reason = `${delta > 0 ? "Cleaner" : "Darker"} than your ${fam} (${owned.mean})`;
  }
  return { register: reg, delta, family: home.family, owned,
    label: registerLabel(reg), reason, outsideRange: !inRange && !one, thin: one };
}

export const DEFAULT_OPPOSING = [
  ["citrus", "smoky"],
  ["floral", "earthy"],
  ["green", "oriental"],
  ["fruity", "resinous"],
  ["aquatic", "gourmand"],
];

export const THEME_PRESETS = {
  apothecary: { label: "Dark Apothecary", bg: "#0f0d09", card: "#141109", cream: "#e8dfd0", muted: "#8a7e6b", border: "#2a2318", gold: "#c5a46d", rose: "#b5546a", sage: "#7a927a", plum: "#7a5073" },
  midnight:   { label: "Midnight",        bg: "#0a0a12", card: "#10101a", cream: "#d8d8e8", muted: "#6a6a80", border: "#222235", gold: "#8a8acd", rose: "#b55a7a", sage: "#6a9a7a", plum: "#8a6aaa" },
  parchment:  { label: "Parchment",       bg: "#f4efe6", card: "#ebe4d8", cream: "#2a2218", muted: "#8a7e6b", border: "#d4cbb8", gold: "#8a6a3a", rose: "#9a3a4a", sage: "#4a7a4a", plum: "#6a3a6a" },
  forest:     { label: "Forest",          bg: "#0a100a", card: "#0f160f", cream: "#d0dfd0", muted: "#6b8a6b", border: "#1a2a1a", gold: "#a4c46d", rose: "#b5546a", sage: "#5a9a5a", plum: "#7a6a8a" },
  ember:      { label: "Ember",           bg: "#120a06", card: "#180e08", cream: "#f0dcc8", muted: "#9a7a5a", border: "#2a1a10", gold: "#d4944a", rose: "#c4543a", sage: "#7a8a5a", plum: "#8a5a5a" },
};

export const RATING_CATEGORIES = [
  { key: "overall", label: "Overall", color: "#c5a46d" },
  { key: "sillage", label: "Sillage", color: "#b5546a" },
  { key: "longevity", label: "Longevity", color: "#7a927a" },
  { key: "scent", label: "Scent", color: "#7a5073" },
];
