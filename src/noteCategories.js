import { NOTE_TO_FRAGRANCES } from "./noteMap.js";

export const NOTE_FAMILIES = {
  citrus: ["bergamot","lemon","orange","grapefruit","mandarin","lime","yuzu","blood orange","bitter orange","citrus","citrusy","kumquat","tangerine","petitgrain","clementine"],
  fruity: ["apple","pear","peach","plum","raspberry","blackberry","cherry","fig","mango","coconut","pineapple","blackcurrant","apricot","pomegranate","date","tamarind","quince","passion fruit","lychee","cassis","berry","african marigold","fruity","fruit","grape","melon","banana","strawberry"],
  green: ["green notes","green","grass","basil","mint","galbanum","ivy","tomato leaf","green tea","tea","herbs","herbal","herbaceous","violet leaf","mate","thyme","rosemary","sage","clary sage","bamboo","hemp","green pepper","bay leaf","tarragon","artemisia","wormwood","absinthe","black tea","pine","palm leaves","aromatic","lavender","fougere","conifer","eucalyptus","camphor"],
  aquatic: ["sea salt","sea notes","ozone","seaweed","water","rain","marine","driftwood","ambergris","calone","fresh","clean","watery","ozonic","mineral","aldehyde","aldehydic","crisp","cool"],
  floral: ["rose","jasmine","iris","tuberose","violet","magnolia","ylang-ylang","orange blossom","gardenia","lily","orchid","geranium","carnation","peony","freesia","heliotrope","osmanthus","chamomile","honeysuckle","neroli","davana","jasmine sambac","frangipani","mimosa","white floral","lotus","champaca","chrysanthemum","floral","powdery","soft","delicate"],
  spicy: ["cardamom","pepper","pink pepper","black pepper","cinnamon","saffron","nutmeg","ginger","clove","cumin","coriander","anise","star anise","juniper","oregano","angelica","red pepper","sichuan pepper","spicy","spice","spices","hot","pungent","peppery"],
  oriental: ["amber","vanilla","tonka","benzoin","labdanum","honey","resins","copal","styrax","balsam","ambrette","musk","cashmeran","iso e super","ambroxan","marshmallow","sweet","warm","creamy","musky","sensual","opulent","rich","velvety","balmy","ambery"],
  resinous: ["frankincense","myrrh","incense","opopanax","olibanum","elemi","dragon's blood","balsamic","resinous","sacred"],
  woody: ["sandalwood","cedar","cedarwood","vetiver","oud","rosewood","hinoki","guaiac wood","cypress","birch","mahogany","teak","agarwood","amyris","akigalawood","palo santo","woody","wood","oakwood","dry"],
  earthy: ["patchouli","oakmoss","moss","earth","mushroom","soil","truffle","myrtle","helichrysum","immortelle","cave moss","stone","earthy","mossy","damp","loamy","petrichor","dirt"],
  smoky: ["leather","suede","smoke","tobacco","birch tar","cade","gunpowder","tar","civet","castoreum","cannabis","neon","copper","peat","smoky","smokey","leathery","metallic","animalic","dark","rugged","industrial"],
  gourmand: ["chocolate","coffee","cacao","caramel","almond","praline","sugar","chestnut","whiskey","rum","bourbon","milk","sesame","popcorn","apple brandy","cookie","hazelnut","gourmand","edible","buttery","nutty","roasted","toasted","baked","syrupy","boozy","dessert"],
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
