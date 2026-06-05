import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ZAxis
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   YOUR COLLECTION — from Sonnet chat
   ═══════════════════════════════════════════════════════════ */

const YOUR_COLLECTION = {
  owned: [
    "House of Bo Bonbon", "House of Bo Infinitoud", "Yellowstone Tornado Tru Western",
    "Heretic Nosferatu", "Strength in Santal — Scents of Wood", "Plum in Cognac — Scents of Wood",
    "Ceremonia Perfume de la Tierra", "34 Boulevard Saint Germain — Diptyque",
    "Santal Greenery — Dries Van Noten", "Eau Legendaire Reserve En Afrique 1934",
    "Rock the Myrrh — Dries Van Noten", "Libre Flowers and Flames — YSL",
    "Libre Berry — YSL", "Corail Oscuro — Diptyque", "Beach Blossom — Jo Malone", "Cult Gaia Mast",
  ],
  had: ["House of Bo Espiritu", "Phluid Project Intention"],
  want: [
    "Voodoo Chile — Dries Van Noten", "Casa Blanca — House of Bo", "Philosykos — Diptyque",
    "Etat Libre d'Orange Frustration", "Memo Paris French Leather", "Eau Capitale — Diptyque",
    "Camomile Satin — Dries Van Noten", "Fleur Du Mal — Dries Van Noten",
    "Jazz Club — Maison Martin Margiela", "By the Fireplace — Maison Martin Margiela",
    "Crazy Basil — Dries Van Noten",
  ],
  wantToTry: [
    "Guilty Story — Mihan Aromatics", "Ave Maria — House of Bo", "Rosario — House of Bo",
    "Gardenia Petale — Van Cleef and Arpels", "Gong — Floraiku",
    "Poets of Berlin — Vilhelm Parfumerie", "Naked Dance — Oddity", "Insolence — Guerlain",
    "Bois Farine — L'Artisan Parfumeur", "Eau de Sens — Diptyque", "Wild Vetiver — Creed",
    "Taormina Orange — Tom Ford", "Brutus — Orto Parisi", "Unknown Pleasures — Kerosene",
    "Orpheon — Diptyque", "Calahorra — Woha Parfums", "Myrrh and Tonka — Jo Malone",
    "Velvet Rose and Oud — Jo Malone", "Scarlet Poppy Intense — Jo Malone",
  ],
};

const STATUSES = ["owned", "had", "want", "want to try"];
const STATUS_COLORS = { "owned": "#7a927a", "had": "#8a7e6b", "want": "#c5a46d", "want to try": "#7a5073" };

const INITIAL_BOTTLES = [
  { name: "Bonbon",              fullName: "House of Bo Bonbon",                        house: "House of Bo",               cost: 165, ml: 50,  freq: 6, status: "owned" },
  { name: "Infinitoud",          fullName: "House of Bo Infinitoud",                    house: "House of Bo",               cost: 185, ml: 50,  freq: 7, status: "owned" },
  { name: "Nosferatu",           fullName: "Heretic Nosferatu",                         house: "Heretic",                   cost: 165, ml: 50,  freq: 8, status: "owned" },
  { name: "Strength in Santal",  fullName: "Strength in Santal — Scents of Wood",      house: "Scents of Wood",            cost: 195, ml: 50,  freq: 7, status: "owned" },
  { name: "Plum in Cognac",      fullName: "Plum in Cognac — Scents of Wood",          house: "Scents of Wood",            cost: 195, ml: 50,  freq: 5, status: "owned" },
  { name: "Perfume de la Tierra",fullName: "Ceremonia Perfume de la Tierra",            house: "Ceremonia",                 cost: 68,  ml: 50,  freq: 6, status: "owned" },
  { name: "34 Blvd St Germain",  fullName: "34 Boulevard Saint Germain — Diptyque",     house: "Diptyque",                  cost: 180, ml: 75,  freq: 5, status: "owned" },
  { name: "Santal Greenery",     fullName: "Santal Greenery — Dries Van Noten",        house: "Dries Van Noten",           cost: 250, ml: 100, freq: 8, status: "owned" },
  { name: "Reserve En Afrique",  fullName: "Eau Legendaire Reserve En Afrique 1934",   house: "Eau Legendaire",            cost: 220, ml: 100, freq: 4, status: "owned" },
  { name: "Rock the Myrrh",      fullName: "Rock the Myrrh — Dries Van Noten",         house: "Dries Van Noten",           cost: 250, ml: 100, freq: 6, status: "owned" },
  { name: "Libre Flowers&Flames",fullName: "Libre Flowers and Flames — YSL",           house: "YSL",                       cost: 150, ml: 90,  freq: 7, status: "owned" },
  { name: "Libre Berry",         fullName: "Libre Berry — YSL",                        house: "YSL",                       cost: 140, ml: 50,  freq: 5, status: "owned" },
  { name: "Corail Oscuro",       fullName: "Corail Oscuro — Diptyque",                 house: "Diptyque",                  cost: 200, ml: 75,  freq: 4, status: "owned" },
  { name: "Beach Blossom",       fullName: "Beach Blossom — Jo Malone",                house: "Jo Malone",                 cost: 78,  ml: 30,  freq: 3, status: "owned" },
  { name: "Cult Gaia Mast",      fullName: "Cult Gaia Mast",                           house: "Cult Gaia",                 cost: 95,  ml: 50,  freq: 5, status: "owned" },
  { name: "Tornado Tru Western", fullName: "Yellowstone Tornado Tru Western",          house: "Yellowstone",               cost: 130, ml: 50,  freq: 4, status: "owned" },
  { name: "Espiritu",            fullName: "House of Bo Espiritu",                     house: "House of Bo",               cost: 165, ml: 50,  freq: 0, status: "had" },
  { name: "Intention",           fullName: "Phluid Project Intention",                 house: "Phluid Project",            cost: 90,  ml: 50,  freq: 0, status: "had" },
  { name: "Voodoo Chile",        fullName: "Voodoo Chile — Dries Van Noten",           house: "Dries Van Noten",           cost: 250, ml: 100, freq: 0, status: "want" },
  { name: "Casa Blanca",         fullName: "Casa Blanca — House of Bo",                house: "House of Bo",               cost: 185, ml: 50,  freq: 0, status: "want" },
  { name: "Philosykos",          fullName: "Philosykos — Diptyque",                    house: "Diptyque",                  cost: 180, ml: 75,  freq: 0, status: "want" },
  { name: "Frustration",         fullName: "Etat Libre d'Orange Frustration",          house: "Etat Libre d'Orange",       cost: 155, ml: 50,  freq: 0, status: "want" },
  { name: "French Leather",      fullName: "Memo Paris French Leather",                house: "Memo Paris",                cost: 295, ml: 75,  freq: 0, status: "want" },
  { name: "Eau Capitale",        fullName: "Eau Capitale — Diptyque",                  house: "Diptyque",                  cost: 180, ml: 75,  freq: 0, status: "want" },
  { name: "Camomile Satin",      fullName: "Camomile Satin — Dries Van Noten",         house: "Dries Van Noten",           cost: 250, ml: 100, freq: 0, status: "want" },
  { name: "Fleur Du Mal",        fullName: "Fleur Du Mal — Dries Van Noten",           house: "Dries Van Noten",           cost: 250, ml: 100, freq: 0, status: "want" },
  { name: "Jazz Club",           fullName: "Jazz Club — Maison Martin Margiela",       house: "Maison Martin Margiela",    cost: 140, ml: 100, freq: 0, status: "want" },
  { name: "By the Fireplace",    fullName: "By the Fireplace — Maison Martin Margiela",house: "Maison Martin Margiela",    cost: 140, ml: 100, freq: 0, status: "want" },
  { name: "Crazy Basil",         fullName: "Crazy Basil — Dries Van Noten",            house: "Dries Van Noten",           cost: 250, ml: 100, freq: 0, status: "want" },
  { name: "Guilty Story",        fullName: "Guilty Story — Mihan Aromatics",           house: "Mihan Aromatics",           cost: 200, ml: 50,  freq: 0, status: "want to try" },
  { name: "Ave Maria",           fullName: "Ave Maria — House of Bo",                  house: "House of Bo",               cost: 185, ml: 50,  freq: 0, status: "want to try" },
  { name: "Rosario",             fullName: "Rosario — House of Bo",                    house: "House of Bo",               cost: 185, ml: 50,  freq: 0, status: "want to try" },
  { name: "Poets of Berlin",     fullName: "Poets of Berlin — Vilhelm Parfumerie",     house: "Vilhelm Parfumerie",        cost: 245, ml: 100, freq: 0, status: "want to try" },
  { name: "Myrrh and Tonka",     fullName: "Myrrh and Tonka — Jo Malone",              house: "Jo Malone",                 cost: 78,  ml: 50,  freq: 0, status: "want to try" },
  { name: "Velvet Rose & Oud",   fullName: "Velvet Rose and Oud — Jo Malone",          house: "Jo Malone",                 cost: 150, ml: 50,  freq: 0, status: "want to try" },
  { name: "Orpheon",             fullName: "Orpheon — Diptyque",                       house: "Diptyque",                  cost: 180, ml: 75,  freq: 0, status: "want to try" },
];

/* ═══════════════════════════════════════════════════════════
   PALETTE & FONTS
   ═══════════════════════════════════════════════════════════ */

const PAL = {
  bg: "#0f0d09", card: "#181410", border: "#2a2318",
  cream: "#e9dcc7", muted: "#8a7e6b", gold: "#c5a46d",
  rose: "#b5546a", sage: "#7a927a", plum: "#7a5073", amber: "#c98a3e",
};
const NOTE_COLORS = ["#c5a46d","#b5546a","#d4b896","#7a927a","#7a5073","#c98a3e","#6b3a2a","#8a7e6b","#a36b4f","#5e7a6e"];
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap";
const ff = { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', sans-serif" };

/* ═══════════════════════════════════════════════════════════
   NOTES COMPUTATION — dynamically from your collection
   ═══════════════════════════════════════════════════════════ */

function computeNotesProfile(bottles, testedScents) {
  const counts = {};

  const isValidBottle = (b) => b.name.trim() && b.name.trim().toLowerCase() !== "new fragrance";

  /* Count notes from owned/had bottles (weighted 3x) */
  bottles.filter(b => (b.status === "owned" || b.status === "had") && isValidBottle(b)).forEach(b => {
    (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean).forEach(n => {
      counts[n] = (counts[n] || 0) + 3;
    });
  });

  /* Count notes from want/want-to-try (weighted 1x) */
  bottles.filter(b => (b.status === "want" || b.status === "want to try") && isValidBottle(b)).forEach(b => {
    (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean).forEach(n => {
      counts[n] = (counts[n] || 0) + 1;
    });
  });

  /* Count notes from tested scents (weighted 2x) */
  (testedScents || []).forEach(t => {
    (t.notes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean).forEach(n => {
      counts[n] = (counts[n] || 0) + 2;
    });
  });

  /* Also check NOTE_TO_FRAGRANCES for bottles that don't have userNotes */
  bottles.filter(b => isValidBottle(b) && (!b.userNotes || b.userNotes.trim() === "")).forEach(b => {
    const bName = (b.fullName || b.name).toLowerCase();
    Object.entries(NOTE_TO_FRAGRANCES).forEach(([note, frags]) => {
      frags.forEach(f => {
        if (bName.includes(f.split(" — ")[0].toLowerCase()) || f.toLowerCase().includes(bName.split(" — ")[0].toLowerCase())) {
          const weight = (b.status === "owned" || b.status === "had") ? 2 : 1;
          counts[note] = (counts[note] || 0) + weight;
        }
      });
    });
  });

  /* Convert to sorted array with percentages */
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topTotal = sorted.reduce((s, [, v]) => s + v, 0);
  return sorted.map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    pct: Math.round((count / topTotal) * 100),
  }));
}

/* ═══════════════════════════════════════════════════════════
   NOTE → FRAGRANCE MAPPING
   ═══════════════════════════════════════════════════════════ */

const NOTE_TO_FRAGRANCES = {
  "sandalwood": ["Strength in Santal — Scents of Wood", "Santal Greenery — Dries Van Noten", "34 Boulevard Saint Germain — Diptyque", "Rock the Myrrh — Dries Van Noten", "Cult Gaia Mast", "Camomile Satin — Dries Van Noten", "Bois Farine — L'Artisan Parfumeur", "Myrrh and Tonka — Jo Malone"],
  "myrrh": ["Rock the Myrrh — Dries Van Noten", "Heretic Nosferatu", "Eau Legendaire Reserve En Afrique 1934", "34 Boulevard Saint Germain — Diptyque", "Myrrh and Tonka — Jo Malone", "Ave Maria — House of Bo"],
  "oud": ["House of Bo Infinitoud", "Heretic Nosferatu", "Eau Legendaire Reserve En Afrique 1934", "Plum in Cognac — Scents of Wood", "Velvet Rose and Oud — Jo Malone", "Guilty Story — Mihan Aromatics"],
  "vetiver": ["Ceremonia Perfume de la Tierra", "Yellowstone Tornado Tru Western", "34 Boulevard Saint Germain — Diptyque", "Santal Greenery — Dries Van Noten", "Wild Vetiver — Creed", "Voodoo Chile — Dries Van Noten", "Memo Paris French Leather"],
  "amber": ["Libre Flowers and Flames — YSL", "Libre Berry — YSL", "House of Bo Bonbon", "Plum in Cognac — Scents of Wood", "Corail Oscuro — Diptyque", "By the Fireplace — Maison Martin Margiela", "Scarlet Poppy Intense — Jo Malone", "Insolence — Guerlain"],
  "leather": ["Heretic Nosferatu", "Rock the Myrrh — Dries Van Noten", "Eau Legendaire Reserve En Afrique 1934", "Yellowstone Tornado Tru Western", "Memo Paris French Leather", "House of Bo Espiritu", "Brutus — Orto Parisi"],
  "patchouli": ["Heretic Nosferatu", "Corail Oscuro — Diptyque", "Ceremonia Perfume de la Tierra", "House of Bo Bonbon", "Etat Libre d'Orange Frustration", "Voodoo Chile — Dries Van Noten"],
  "tobacco": ["Plum in Cognac — Scents of Wood", "Rock the Myrrh — Dries Van Noten", "Yellowstone Tornado Tru Western", "Jazz Club — Maison Martin Margiela", "By the Fireplace — Maison Martin Margiela"],
  "labdanum": ["Heretic Nosferatu", "Corail Oscuro — Diptyque", "Eau Legendaire Reserve En Afrique 1934", "Fleur Du Mal — Dries Van Noten"],
  "rose": ["Libre Flowers and Flames — YSL", "Libre Berry — YSL", "Corail Oscuro — Diptyque", "Beach Blossom — Jo Malone", "Velvet Rose and Oud — Jo Malone", "Rosario — House of Bo", "Scarlet Poppy Intense — Jo Malone"],
  "vanilla": ["House of Bo Bonbon", "Libre Berry — YSL", "Plum in Cognac — Scents of Wood", "By the Fireplace — Maison Martin Margiela", "Myrrh and Tonka — Jo Malone"],
  "bergamot": ["34 Boulevard Saint Germain — Diptyque", "Beach Blossom — Jo Malone", "Cult Gaia Mast", "Santal Greenery — Dries Van Noten", "Jazz Club — Maison Martin Margiela", "Orpheon — Diptyque"],
  "cedar": ["Santal Greenery — Dries Van Noten", "Strength in Santal — Scents of Wood", "Yellowstone Tornado Tru Western", "Cult Gaia Mast", "Memo Paris French Leather", "Poets of Berlin — Vilhelm Parfumerie"],
  "musk": ["Libre Flowers and Flames — YSL", "Beach Blossom — Jo Malone", "Cult Gaia Mast", "House of Bo Bonbon", "Naked Dance — Oddity", "Insolence — Guerlain"],
  "incense": ["Heretic Nosferatu", "34 Boulevard Saint Germain — Diptyque", "Eau Legendaire Reserve En Afrique 1934", "Rock the Myrrh — Dries Van Noten", "Poets of Berlin — Vilhelm Parfumerie", "Ave Maria — House of Bo", "Gong — Floraiku"],
  "earth": ["Ceremonia Perfume de la Tierra", "Heretic Nosferatu", "Yellowstone Tornado Tru Western", "Voodoo Chile — Dries Van Noten", "Phluid Project Intention"],
  "fig": ["Corail Oscuro — Diptyque", "Beach Blossom — Jo Malone", "Philosykos — Diptyque"],
  "tonka": ["House of Bo Bonbon", "Plum in Cognac — Scents of Wood", "Libre Berry — YSL", "Myrrh and Tonka — Jo Malone", "Jazz Club — Maison Martin Margiela"],
  "saffron": ["Eau Legendaire Reserve En Afrique 1934", "House of Bo Infinitoud", "Guilty Story — Mihan Aromatics"],
  "moss": ["Ceremonia Perfume de la Tierra", "Santal Greenery — Dries Van Noten", "Yellowstone Tornado Tru Western", "Crazy Basil — Dries Van Noten"],
  "smoke": ["By the Fireplace — Maison Martin Margiela", "Heretic Nosferatu", "Unknown Pleasures — Kerosene", "Brutus — Orto Parisi"],
  "basil": ["Crazy Basil — Dries Van Noten", "Eau de Sens — Diptyque"],
  "iris": ["Insolence — Guerlain", "Fleur Du Mal — Dries Van Noten", "Naked Dance — Oddity"],
  "orange": ["Taormina Orange — Tom Ford", "Eau de Sens — Diptyque", "Corail Oscuro — Diptyque"],
  "gardenia": ["Gardenia Petale — Van Cleef and Arpels", "Fleur Du Mal — Dries Van Noten"],
  "birch": ["Poets of Berlin — Vilhelm Parfumerie", "Unknown Pleasures — Kerosene"],
  "suede": ["House of Bo Espiritu", "Camomile Satin — Dries Van Noten", "Calahorra — Woha Parfums"],
  "jasmine": ["Libre Flowers and Flames — YSL", "Scarlet Poppy Intense — Jo Malone", "Casa Blanca — House of Bo"],
  "wood": ["Bois Farine — L'Artisan Parfumeur", "Eau Capitale — Diptyque", "Orpheon — Diptyque"],
};

/* Look up fragrances for a note name (case-insensitive, partial match) */
function getFragrancesForNote(noteName) {
  const lower = noteName.toLowerCase();
  const exact = NOTE_TO_FRAGRANCES[lower];
  if (exact) return exact;
  const partial = Object.entries(NOTE_TO_FRAGRANCES).find(([k]) => lower.includes(k) || k.includes(lower));
  if (partial) return partial[1];
  return null;
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const sum = (arr, k) => arr.reduce((s, x) => s + (x[k] || 0), 0);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year, month) { return new Date(year, month, 1).getDay(); }
function dateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

/* ═══════════════════════════════════════════════════════════
   FRAGRANCE FIT SCORING
   ═══════════════════════════════════════════════════════════ */

/*
 * Scores how well a want/want-to-try fragrance fits your collection.
 * Uses three signals:
 *   1. Note overlap with your scent profile (from the doughnut chart)
 *   2. Note overlap with your owned bottles' known notes (from NOTE_TO_FRAGRANCES)
 *   3. House familiarity — bonus if you already own from the same house
 * Returns { score: 0-100, matchedNotes: [...], reason: "..." }
 */
function scoreFragranceFit(bottle, ownedBottles, notesProfile) {
  let score = 0;
  const matchedNotes = [];
  const reasons = [];

  /* Build a set of all notes present in owned collection */
  const ownedNoteSet = new Set();
  Object.entries(NOTE_TO_FRAGRANCES).forEach(([note, frags]) => {
    frags.forEach(f => {
      if (ownedBottles.some(ob => {
        const fn = (ob.fullName || ob.name).toLowerCase();
        const ff2 = f.toLowerCase();
        return fn.includes(ff2.split(" — ")[0].toLowerCase()) || ff2.includes(fn.split(" — ")[0].toLowerCase());
      })) {
        ownedNoteSet.add(note);
      }
    });
  });

  /* Build a weighted note map from the doughnut profile */
  const profileNotes = {};
  (notesProfile || []).forEach(n => {
    profileNotes[n.name.toLowerCase()] = n.pct;
  });

  /* Get the candidate fragrance's notes from NOTE_TO_FRAGRANCES */
  const candidateName = (bottle.fullName || bottle.name).toLowerCase();
  const candidateNotes = new Set();
  Object.entries(NOTE_TO_FRAGRANCES).forEach(([note, frags]) => {
    frags.forEach(f => {
      if (candidateName.includes(f.split(" — ")[0].toLowerCase()) || f.toLowerCase().includes(candidateName.split(" — ")[0].toLowerCase())) {
        candidateNotes.add(note);
      }
    });
  });

  /* Signal 1: Profile note match (up to 50 points) */
  let profileScore = 0;
  candidateNotes.forEach(note => {
    if (profileNotes[note]) {
      profileScore += profileNotes[note];
      matchedNotes.push(note);
    }
  });
  /* Also check note names in bottle name/fullName for common notes */
  Object.keys(profileNotes).forEach(pn => {
    if (candidateName.includes(pn) && !matchedNotes.includes(pn)) {
      profileScore += profileNotes[pn] * 0.5;
      matchedNotes.push(pn);
    }
  });
  score += Math.min(50, profileScore * 0.8);
  if (matchedNotes.length > 0) reasons.push(`Matches your top notes: ${matchedNotes.slice(0, 3).join(", ")}`);

  /* Signal 2: Owned note overlap (up to 30 points) */
  let overlapCount = 0;
  candidateNotes.forEach(note => {
    if (ownedNoteSet.has(note)) overlapCount++;
  });
  const overlapScore = candidateNotes.size > 0 ? (overlapCount / candidateNotes.size) * 30 : 0;
  score += overlapScore;
  if (overlapCount > 2) reasons.push(`${overlapCount} notes overlap with your collection`);

  /* Signal 3: House familiarity (up to 15 points) */
  if (bottle.house && ownedBottles.some(ob => ob.house && ob.house.toLowerCase() === bottle.house.toLowerCase())) {
    score += 15;
    reasons.push(`You already love ${bottle.house}`);
  }

  /* Signal 4: Small boost for bottles on want list vs want-to-try (up to 5 points) */
  if (bottle.status === "want") score += 5;

  return {
    score: Math.min(100, Math.round(score)),
    matchedNotes: [...new Set(matchedNotes)],
    reason: reasons.length > 0 ? reasons[0] : "Expand your horizons",
    isWildcard: score < 20,
  };
}

/* ═══════════════════════════════════════════════════════════
   RATING SYSTEM
   ═══════════════════════════════════════════════════════════ */

const RATING_CATEGORIES = [
  { key: "overall", label: "Overall", color: "#c5a46d" },
  { key: "sillage", label: "Sillage", color: "#b5546a" },
  { key: "longevity", label: "Longevity", color: "#7a927a" },
  { key: "scent", label: "Scent", color: "#7a5073" },
];

const RatingSlider = ({ value, onChange, color, label, compact }) => {
  const displayVal = value || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 10, flex: 1, minWidth: compact ? 0 : 180 }}>
      {label && <span style={{ fontFamily: ff.body, fontSize: compact ? 9 : 10, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase", minWidth: compact ? 50 : 65, flexShrink: 0 }}>{label}</span>}
      <input
        type="range" min="0" max="10" step="0.5" value={displayVal}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1, height: 4, appearance: "none", background: PAL.border, borderRadius: 2, outline: "none", cursor: "pointer",
          accentColor: color || PAL.gold,
        }}
      />
      <span style={{
        fontFamily: ff.display, fontSize: compact ? 14 : 16, color: displayVal > 0 ? (color || PAL.gold) : PAL.muted,
        minWidth: 28, textAlign: "right", fontWeight: 400,
      }}>{displayVal > 0 ? displayVal.toFixed(1) : "—"}</span>
    </div>
  );
};

/* Compact rating display (read-only) */
const RatingBadge = ({ ratings, size }) => {
  const avg = ratings && ratings.overall > 0 ? ratings.overall : null;
  if (!avg) return null;
  const sz = size || 28;
  return (
    <div style={{
      width: sz, height: sz, borderRadius: sz / 2, flexShrink: 0,
      background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}33`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: ff.display, fontSize: sz * 0.45, color: PAL.gold,
    }}>{avg.toFixed(1)}</div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════════ */

const ChartTooltip = ({ active, payload, label, units }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,13,9,0.95)", backdropFilter: "blur(10px)", border: `1px solid ${PAL.border}`, borderRadius: 10, padding: "14px 18px", fontFamily: ff.body, fontSize: 12 }}>
      <div style={{ color: PAL.gold, fontFamily: ff.display, fontSize: 14, marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: PAL.muted, flex: 1 }}>{p.name}</span>
          <span style={{ color: PAL.cream, fontWeight: 500 }}>{units?.[p.dataKey] ? `${units[p.dataKey][0]}${p.value}${units[p.dataKey][1]}` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Pill = ({ label, value, accent }) => (
  <div style={{ background: PAL.card, border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "14px 18px", flex: "1 1 140px", display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontFamily: ff.body, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: PAL.muted }}>{label}</span>
    <span style={{ fontFamily: ff.display, fontSize: 26, fontWeight: 400, color: accent || PAL.cream, lineHeight: 1.1 }}>{value}</span>
  </div>
);

const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: ff.display, fontSize: 24, fontWeight: 400, color: PAL.cream, margin: 0 }}>{title}</h2>
    <p style={{ fontFamily: ff.body, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, margin: "4px 0 0" }}>{sub}</p>
  </div>
);

/* ─── Edit Panel ─────────────────────────────────────────── */

const EditPanel = ({ bottles, setBottles, onClose, onReset, noteOverrides, setNoteOverrides }) => {
  const [newHouseInput, setNewHouseInput] = useState({});
  const inputCss = { background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "7px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const selectCss = { ...inputCss, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 28 };
  const lab = { fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 3, display: "block" };
  const row = { display: "flex", gap: 6, alignItems: "end", marginBottom: 10, flexWrap: "wrap" };

  /* Derive unique houses from current bottles */
  const allHouses = useMemo(() => [...new Set(bottles.map(b => b.house).filter(Boolean))].sort(), [bottles]);

  /* Group bottles by status */
  const grouped = {};
  STATUSES.forEach(s => { grouped[s] = bottles.map((b, i) => ({ ...b, _i: i })).filter(b => b.status === s); });

  const handleHouseChange = (i, val) => {
    if (val === "__new__") {
      setNewHouseInput(prev => ({ ...prev, [i]: "" }));
    } else {
      const a = [...bottles]; a[i] = { ...a[i], house: val, fullName: a[i].name + (val ? ` — ${val}` : "") }; setBottles(a);
      setNewHouseInput(prev => { const n = { ...prev }; delete n[i]; return n; });
    }
  };

  const confirmNewHouse = (i) => {
    const val = (newHouseInput[i] || "").trim();
    if (val) { const a = [...bottles]; a[i] = { ...a[i], house: val, fullName: a[i].name + ` — ${val}` }; setBottles(a); }
    setNewHouseInput(prev => { const n = { ...prev }; delete n[i]; return n; });
  };

  const mouseDownTarget = useRef(null);

  return (
    <div
      onMouseDown={e => { mouseDownTarget.current = e.target; }}
      onClick={e => { if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 16, padding: 28, width: "94%", maxWidth: 780, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: ff.display, fontSize: 20, color: PAL.cream, margin: 0 }}>Edit Collection</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {STATUSES.map(status => {
          const items = grouped[status] || [];
          const sc = STATUS_COLORS[status];
          return (
            <div key={status} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc }} />
                <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.cream, textTransform: "capitalize" }}>{status}</span>
                <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted }}>({items.length})</span>
              </div>
              {items.map(b => {
                const i = b._i;
                const isNewHouse = newHouseInput.hasOwnProperty(i);
                return (
                  <div key={i} style={row}>
                    <div style={{ flex: "1.5 1 120px" }}><label style={lab}>Name *</label><input style={{ ...inputCss, borderColor: !b.name.trim() ? `${PAL.rose}44` : undefined }} placeholder="Enter fragrance name…" value={b.name} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], name: e.target.value, fullName: e.target.value + (b.house ? ` — ${b.house}` : "") }; setBottles(a); }} /></div>
                    <div style={{ flex: "1.2 1 110px" }}>
                      <label style={lab}>House</label>
                      {isNewHouse ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input style={{ ...inputCss, flex: 1 }} placeholder="Type house name…" value={newHouseInput[i]} autoFocus
                            onChange={e => setNewHouseInput(prev => ({ ...prev, [i]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") confirmNewHouse(i); if (e.key === "Escape") setNewHouseInput(prev => { const n = { ...prev }; delete n[i]; return n; }); }}
                          />
                          <button onClick={() => confirmNewHouse(i)} style={{ background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}40`, borderRadius: 6, padding: "0 10px", color: PAL.gold, fontSize: 12, cursor: "pointer" }}>✓</button>
                        </div>
                      ) : (
                        <select style={selectCss} value={b.house || ""} onChange={e => handleHouseChange(i, e.target.value)}>
                          <option value="" style={{ background: PAL.bg, color: PAL.muted }}>— select —</option>
                          {allHouses.map(h => <option key={h} value={h} style={{ background: PAL.bg, color: PAL.cream }}>{h}</option>)}
                          <option value="__new__" style={{ background: PAL.bg, color: PAL.gold }}>+ Add new house…</option>
                        </select>
                      )}
                    </div>
                    <div style={{ flex: "0.8 1 80px" }}>
                      <label style={lab}>Status</label>
                      <select style={selectCss} value={b.status} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], status: e.target.value }; setBottles(a); }}>
                        {STATUSES.map(s => <option key={s} value={s} style={{ background: PAL.bg, color: PAL.cream }}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: "0.5 1 55px" }}><label style={lab}>Cost $</label><input style={inputCss} type="number" value={b.cost} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], cost: +e.target.value }; setBottles(a); }} /></div>
                    <div style={{ flex: "0.4 1 45px" }}><label style={lab}>mL</label><input style={inputCss} type="number" value={b.ml} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], ml: +e.target.value }; setBottles(a); }} /></div>
                    <div style={{ flex: "0.4 1 45px" }}><label style={lab}>Freq</label><input style={inputCss} type="number" value={b.freq} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], freq: +e.target.value }; setBottles(a); }} /></div>
                    <button onClick={() => setBottles(bottles.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: PAL.rose, fontSize: 18, cursor: "pointer", paddingBottom: 6 }}>−</button>
                    <div style={{ flex: "100% 1 100%", marginTop: -2 }}>
                      <label style={lab}>Notes (comma-separated)</label>
                      <input style={inputCss} value={b.userNotes || ""} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], userNotes: e.target.value }; setBottles(a); }} placeholder="e.g. sandalwood, vetiver, amber, musk" />
                      {/* Note category pills */}
                      {(b.userNotes || "").trim() && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                          {(b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean).map((note, j) => {
                            const family = getNoteFamily(note, noteOverrides);
                            const color = FAMILY_COLORS[family];
                            return (
                              <div key={j} style={{ position: "relative", display: "inline-flex" }}>
                                <select
                                  value={family}
                                  onChange={e => setNoteOverrides(prev => ({ ...prev, [note]: e.target.value }))}
                                  style={{
                                    appearance: "none", cursor: "pointer",
                                    background: `${color}20`, border: `1px solid ${color}50`,
                                    borderRadius: 4, padding: "3px 20px 3px 8px",
                                    color: color, fontFamily: ff.body, fontSize: 9, letterSpacing: 0.5,
                                    outline: "none",
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M2 3l2 2 2-2' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center",
                                  }}
                                >
                                  {FAMILY_ORDER.map(f => (
                                    <option key={f} value={f} style={{ background: PAL.bg, color: FAMILY_COLORS[f] }}>
                                      {note} → {FAMILY_LABELS[f]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, padding: "4px 0" }}>No fragrances in this category</p>}
            </div>
          );
        })}

        <button onClick={() => setBottles([...bottles, { name: "", fullName: "", house: "", cost: 0, ml: 0, freq: 0, status: "want to try", userNotes: "" }])} style={{ background: `${PAL.gold}10`, border: `1px dashed ${PAL.gold}44`, borderRadius: 8, padding: 10, color: PAL.gold, cursor: "pointer", fontFamily: ff.body, fontSize: 12, width: "100%" }}>+ Add Fragrance</button>

        {/* Reset all data */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${PAL.border}` }}>
          <button onClick={() => { if (window.confirm("This will reset your entire collection, wear log, and notes profile back to defaults. Are you sure?")) { onReset(); onClose(); } }}
            style={{ background: "transparent", border: `1px solid ${PAL.rose}33`, borderRadius: 8, padding: "8px 16px", color: PAL.rose, fontFamily: ff.body, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", width: "100%" }}>
            Reset All Data to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   DISCOVER TAB — Local fragrance database + search
   ═══════════════════════════════════════════════════════════ */

const FRAGRANCE_DB = [
  /* ═══════════════════════════════════════════════
     DIPTYQUE
     ═══════════════════════════════════════════════ */
  { name: "Tam Dao", house: "Diptyque", cost: 180, ml: 75, notes: ["sandalwood","cedar","rosewood","cypress"], description: "A classic sandalwood pillar — creamy, warm, meditative." },
  { name: "Do Son", house: "Diptyque", cost: 180, ml: 75, notes: ["tuberose","orange blossom","musk","iris"], description: "Hauntingly floral — white flowers carried by a warm breeze." },
  { name: "Fleur de Peau", house: "Diptyque", cost: 200, ml: 75, notes: ["musk","iris","ambrette","magnolia"], description: "Skin-scent intimacy — their most sensual offering." },
  { name: "Tempo", house: "Diptyque", cost: 180, ml: 75, notes: ["patchouli","clary sage","violet leaf","mate"], description: "A modern, clean patchouli that avoids hippie clichés." },
  { name: "Vetyverio", house: "Diptyque", cost: 180, ml: 75, notes: ["vetiver","grapefruit","cedar","musk"], description: "Clean, earthy vetiver with citrus brightness." },
  { name: "Oud Palao", house: "Diptyque", cost: 230, ml: 75, notes: ["oud","rose","cypriol","patchouli","incense"], description: "Rich oud softened with rose — opulent but wearable." },
  { name: "Volutes", house: "Diptyque", cost: 180, ml: 75, notes: ["tobacco","iris","honey","spices","vanilla"], description: "Tobacco and honey swirl — aromatic warmth." },
  { name: "L'Ombre dans l'Eau", house: "Diptyque", cost: 180, ml: 75, notes: ["rose","blackcurrant","green leaves","musk"], description: "Green roses and blackcurrant — their bestselling classic." },
  { name: "Kyoto", house: "Diptyque", cost: 180, ml: 75, notes: ["incense","cypress","hinoki wood","vetiver"], description: "Japanese temple incense — minimal, sacred, woody." },

  /* ═══════════════════════════════════════════════
     DRIES VAN NOTEN
     ═══════════════════════════════════════════════ */
  { name: "Jardin de l'Orangerie", house: "Dries Van Noten", cost: 250, ml: 100, notes: ["orange blossom","sandalwood","vanilla","amber"], description: "Luminous orange flower grounded by warm woods." },
  { name: "Raving Rose", house: "Dries Van Noten", cost: 250, ml: 100, notes: ["rose","leather","pepper","incense"], description: "Rose with an industrial edge — thorny, leathered, unisex." },
  { name: "Soie Malaquais", house: "Dries Van Noten", cost: 250, ml: 100, notes: ["iris","musk","violet","leather","amber"], description: "Powdery iris and suede — haute couture in a bottle." },
  { name: "Mystic Moss", house: "Dries Van Noten", cost: 250, ml: 100, notes: ["oakmoss","patchouli","vetiver","bergamot"], description: "Forest floor after rain — green, damp, alive." },

  /* ═══════════════════════════════════════════════
     HOUSE OF BO
     ═══════════════════════════════════════════════ */
  { name: "Lunatico", house: "House of Bo", cost: 185, ml: 50, notes: ["labdanum","amber","vanilla","benzoin","patchouli"], description: "Nocturnal warmth — resinous and hypnotic." },
  { name: "1984", house: "House of Bo", cost: 185, ml: 50, notes: ["leather","sandalwood","incense","amber"], description: "Dark retro rebellion — smoky leather and incense." },
  { name: "Lolita", house: "House of Bo", cost: 165, ml: 50, notes: ["rose","oud","saffron","vanilla"], description: "Rose-oud duet — provocative and layered." },

  /* ═══════════════════════════════════════════════
     TOM FORD
     ═══════════════════════════════════════════════ */
  { name: "Oud Wood", house: "Tom Ford", cost: 285, ml: 50, notes: ["oud","rosewood","sandalwood","vetiver","tonka"], description: "The gateway oud — smooth, sophisticated, universally appealing." },
  { name: "Tobacco Vanille", house: "Tom Ford", cost: 275, ml: 50, notes: ["tobacco","vanilla","tonka","cacao","ginger"], description: "Rich, sweet tobacco — a cold-weather powerhouse." },
  { name: "Noir de Noir", house: "Tom Ford", cost: 285, ml: 50, notes: ["rose","oud","truffle","patchouli","vanilla"], description: "Dark florals meet earthy depth — gothic elegance." },
  { name: "Tuscan Leather", house: "Tom Ford", cost: 285, ml: 50, notes: ["leather","raspberry","saffron","amber"], description: "Animalic leather with a sweet-fruity opening." },
  { name: "Ombré Leather", house: "Tom Ford", cost: 155, ml: 100, notes: ["leather","cardamom","jasmine","amber","patchouli"], description: "Accessible leather done right — warm, spicy, wearable." },
  { name: "Oud Fleur", house: "Tom Ford", cost: 420, ml: 50, notes: ["oud","rose","sandalwood","saffron","amber"], description: "Rose-oud luxury — lush and enveloping." },
  { name: "Tobacco Oud", house: "Tom Ford", cost: 420, ml: 50, notes: ["tobacco","oud","sandalwood","patchouli","whiskey"], description: "Boozy oud and dark tobacco — evening decadence." },
  { name: "Beau de Jour", house: "Tom Ford", cost: 285, ml: 50, notes: ["lavender","rosemary","mint","amber","oakmoss"], description: "Classic fougère elevated — clean, confident, timeless." },
  { name: "Neroli Portofino", house: "Tom Ford", cost: 285, ml: 50, notes: ["neroli","bergamot","lavender","amber","musk"], description: "Italian Riviera in a bottle — bright, citrusy, effortless." },
  { name: "Lost Cherry", house: "Tom Ford", cost: 390, ml: 50, notes: ["cherry","almond","tonka","sandalwood","cedar"], description: "Boozy dark cherry — addictive and polarizing." },
  { name: "Fucking Fabulous", house: "Tom Ford", cost: 395, ml: 50, notes: ["leather","almond","tonka","orris","cashmeran"], description: "Creamy almond leather — bold name, bolder scent." },
  { name: "Black Orchid", house: "Tom Ford", cost: 155, ml: 100, notes: ["truffle","orchid","patchouli","incense","vanilla"], description: "Dark, sweet, and heavy — a modern classic." },
  { name: "Santal Blush", house: "Tom Ford", cost: 285, ml: 50, notes: ["sandalwood","ylang-ylang","cinnamon","musk"], description: "Spiced sandalwood with a feminine warmth." },

  /* ═══════════════════════════════════════════════
     BYREDO
     ═══════════════════════════════════════════════ */
  { name: "Bal d'Afrique", house: "Byredo", cost: 290, ml: 100, notes: ["vetiver","musk","bergamot","african marigold","cedar"], description: "Earthy, green, and luminous — warm African botanicals." },
  { name: "Gypsy Water", house: "Byredo", cost: 290, ml: 100, notes: ["bergamot","pine","sandalwood","vanilla","amber"], description: "Fresh woods and campfire nostalgia." },
  { name: "Mojave Ghost", house: "Byredo", cost: 290, ml: 100, notes: ["ambrette","sandalwood","violet","magnolia","cedar"], description: "Desert blooms and ghostly woods — ethereal." },
  { name: "Black Saffron", house: "Byredo", cost: 290, ml: 100, notes: ["saffron","leather","raspberry","vetiver","cedar"], description: "Spiced leather with berry tartness." },
  { name: "Oud Immortel", house: "Byredo", cost: 290, ml: 100, notes: ["oud","incense","papyrus","patchouli","tobacco"], description: "Smoky oud and papyrus — dry, ancient, meditative." },
  { name: "Bibliothèque", house: "Byredo", cost: 290, ml: 100, notes: ["plum","peach","leather","patchouli","vanilla"], description: "Old leather-bound books — fruity, warm, intellectual." },
  { name: "Eleventh Hour", house: "Byredo", cost: 290, ml: 100, notes: ["fig","cardamom","sichuan pepper","cedar","amber"], description: "Spiced fig and warm woods — contemplative." },
  { name: "Rose of No Man's Land", house: "Byredo", cost: 290, ml: 100, notes: ["rose","raspberry","amber","papyrus","musk"], description: "Turkish rose in a desert — warm, dusty, romantic." },
  { name: "Mixed Emotions", house: "Byredo", cost: 290, ml: 100, notes: ["blackcurrant","violet","maté","birch","musk"], description: "Green-woody tension — modern and bittersweet." },
  { name: "Slow Dance", house: "Byredo", cost: 290, ml: 100, notes: ["opopanax","geranium","labdanum","vanilla","patchouli"], description: "Resinous slow burn — intimate and unhurried." },

  /* ═══════════════════════════════════════════════
     LE LABO
     ═══════════════════════════════════════════════ */
  { name: "Santal 33", house: "Le Labo", cost: 310, ml: 100, notes: ["sandalwood","cedar","leather","iris","violet"], description: "The ubiquitous sandalwood — woody, leathery, addictive." },
  { name: "Another 13", house: "Le Labo", cost: 310, ml: 100, notes: ["ambrette","musk","moss","jasmine"], description: "A skin scent that smells like you but better." },
  { name: "Thé Noir 29", house: "Le Labo", cost: 310, ml: 100, notes: ["black tea","fig","cedar","musk","vetiver"], description: "Smoky tea leaves and fig — intellectual and cozy." },
  { name: "Rose 31", house: "Le Labo", cost: 310, ml: 100, notes: ["rose","cedar","musk","amber","cumin"], description: "Masculine rose — woody, spiced, and confident." },
  { name: "Oud 27", house: "Le Labo", cost: 420, ml: 100, notes: ["oud","cedar","incense","patchouli","amber"], description: "Raw, smoky oud — Le Labo's most polarizing." },
  { name: "Tonka 25", house: "Le Labo", cost: 310, ml: 100, notes: ["tonka","cedar","musk","vanilla","amber"], description: "Creamy tonka wrapped in cedarwood." },
  { name: "Bergamote 22", house: "Le Labo", cost: 310, ml: 100, notes: ["bergamot","grapefruit","cedar","musk","vetiver"], description: "Bright citrus anchored by vetiver — clean energy." },
  { name: "Lys 41", house: "Le Labo", cost: 310, ml: 100, notes: ["lily","tuberose","iris","musk","vanilla"], description: "White floral opulence — creamy and enveloping." },

  /* ═══════════════════════════════════════════════
     CREED
     ═══════════════════════════════════════════════ */
  { name: "Aventus", house: "Creed", cost: 445, ml: 100, notes: ["pineapple","birch","musk","ambergris","vanilla"], description: "The king of crowd-pleasers — smoky fruit and power." },
  { name: "Green Irish Tweed", house: "Creed", cost: 445, ml: 100, notes: ["iris","violet leaf","sandalwood","ambergris"], description: "Fresh, green, and classic — a cornerstone masculine." },
  { name: "Royal Oud", house: "Creed", cost: 445, ml: 100, notes: ["oud","cedar","sandalwood","galbanum","pink pepper"], description: "Refined oud — woody, peppery, regal." },
  { name: "Viking", house: "Creed", cost: 445, ml: 100, notes: ["bergamot","pink pepper","sandalwood","vetiver","amber"], description: "Nordic spice — clean and rugged." },
  { name: "Himalaya", house: "Creed", cost: 445, ml: 100, notes: ["bergamot","sandalwood","musk","cedar","grapefruit"], description: "Crisp mountain air and warm sandalwood base." },
  { name: "Original Santal", house: "Creed", cost: 445, ml: 100, notes: ["sandalwood","vanilla","cinnamon","lavender","tonka"], description: "Spiced sandalwood — warm, gourmand, classic." },

  /* ═══════════════════════════════════════════════
     MAISON MARTIN MARGIELA (REPLICA)
     ═══════════════════════════════════════════════ */
  { name: "Coffee Break", house: "Maison Martin Margiela", cost: 140, ml: 100, notes: ["coffee","lavender","milk","vanilla"], description: "A Sunday morning in a cup — cozy, sweet, and warm." },
  { name: "Autumn Vibes", house: "Maison Martin Margiela", cost: 140, ml: 100, notes: ["cedar","nutmeg","patchouli","cardamom"], description: "Spiced woods and leaf piles — fall in a bottle." },
  { name: "Whispers in the Library", house: "Maison Martin Margiela", cost: 140, ml: 100, notes: ["cedar","vanilla","tonka","musk","amber"], description: "Goes deeper into vanilla-wood than By the Fireplace." },
  { name: "At the Barber's", house: "Maison Martin Margiela", cost: 140, ml: 100, notes: ["basil","lavender","leather","musk","cedar"], description: "Nostalgic barbershop — fresh herbs and warm leather." },
  { name: "Under the Lemon Trees", house: "Maison Martin Margiela", cost: 140, ml: 100, notes: ["lemon","green tea","cedar","musk","thyme"], description: "Mediterranean shade — bright citrus, herbal calm." },
  { name: "Bubble Bath", house: "Maison Martin Margiela", cost: 140, ml: 100, notes: ["soap","coconut","lavender","musk","rose"], description: "Clean skin straight from the bath — universal comfort." },
  { name: "Matcha Meditation", house: "Maison Martin Margiela", cost: 140, ml: 100, notes: ["matcha","bergamot","fig","white musk","cedarwood"], description: "Japanese tea ceremony stillness — green, creamy, calm." },

  /* ═══════════════════════════════════════════════
     JO MALONE
     ═══════════════════════════════════════════════ */
  { name: "Wood Sage & Sea Salt", house: "Jo Malone", cost: 78, ml: 30, notes: ["sage","sea salt","ambrette","cedar"], description: "Windswept and mineral — your earthy side in a lighter register." },
  { name: "English Pear & Freesia", house: "Jo Malone", cost: 78, ml: 30, notes: ["pear","freesia","patchouli","amber"], description: "Crisp and bright — an easy-wearing fruit floral." },
  { name: "Oud & Bergamot", house: "Jo Malone", cost: 150, ml: 50, notes: ["oud","bergamot","cedar","amber"], description: "Smoky citrus warmth — niche-leaning." },
  { name: "English Oak & Hazelnut", house: "Jo Malone", cost: 78, ml: 30, notes: ["hazelnut","oak","cedar","vetiver","musk"], description: "Autumn walk through an oak forest — nutty and grounding." },
  { name: "Dark Amber & Ginger Lily", house: "Jo Malone", cost: 150, ml: 50, notes: ["amber","ginger","sandalwood","vanilla","vetiver"], description: "Warm spice and dark amber — evening elegance." },
  { name: "Cypress & Grapevine", house: "Jo Malone", cost: 78, ml: 30, notes: ["cypress","grapevine","musk","cedar","moss"], description: "Mediterranean greens and aromatic cypress." },
  { name: "Bronze Wood & Leather", house: "Jo Malone", cost: 150, ml: 50, notes: ["leather","oud","cedar","incense","amber"], description: "Burnished leather and dark wood — Jo Malone's edgiest." },
  { name: "Myrrh & Tonka", house: "Jo Malone", cost: 78, ml: 50, notes: ["myrrh","tonka","vanilla","almond","cedar"], description: "Warm, sweet resin — a modern gourmand classic." },

  /* ═══════════════════════════════════════════════
     MAISON FRANCIS KURKDJIAN
     ═══════════════════════════════════════════════ */
  { name: "Baccarat Rouge 540", house: "Maison Francis Kurkdjian", cost: 325, ml: 70, notes: ["saffron","ambergris","cedar","jasmine"], description: "Crystalline sweetness — the scent that launched a thousand dupes." },
  { name: "Baccarat Rouge 540 Extrait", house: "Maison Francis Kurkdjian", cost: 385, ml: 70, notes: ["saffron","ambergris","cedar","bitter almond","fir resin"], description: "Deeper, smokier, longer-lasting than the original." },
  { name: "Oud Satin Mood", house: "Maison Francis Kurkdjian", cost: 325, ml: 70, notes: ["oud","rose","violet","vanilla","benzoin"], description: "Velvet oud and Bulgarian rose — opulent and smooth." },
  { name: "Grand Soir", house: "Maison Francis Kurkdjian", cost: 255, ml: 70, notes: ["amber","benzoin","vanilla","tonka","musk"], description: "Pure amber luxury — warm, resinous, enveloping." },
  { name: "Gentle Fluidity Gold", house: "Maison Francis Kurkdjian", cost: 255, ml: 70, notes: ["juniper","nutmeg","musk","vanilla","amber"], description: "Spiced warmth and transparent musk — genderless elegance." },

  /* ═══════════════════════════════════════════════
     PARFUMS DE MARLY
     ═══════════════════════════════════════════════ */
  { name: "Pegasus", house: "Parfums de Marly", cost: 325, ml: 125, notes: ["almond","vanilla","sandalwood","amber","heliotrope"], description: "Sweet, almond-forward warmth — a crowd-pleaser." },
  { name: "Layton", house: "Parfums de Marly", cost: 325, ml: 125, notes: ["apple","vanilla","cardamom","sandalwood","guaiac wood"], description: "Spiced apple and creamy woods — one of the most complimented." },
  { name: "Herod", house: "Parfums de Marly", cost: 325, ml: 125, notes: ["tobacco","cinnamon","osmanthus","vanilla","cedar"], description: "Smoky tobacco and sweet spices — fall royalty." },
  { name: "Oajan", house: "Parfums de Marly", cost: 325, ml: 125, notes: ["cinnamon","honey","amber","sandalwood","benzoin"], description: "Spiced honey and amber — gourmand-oriental opulence." },
  { name: "Carlisle", house: "Parfums de Marly", cost: 325, ml: 125, notes: ["tonka","vanilla","patchouli","rose","oud"], description: "Dark rose and tonka — the sophisticated PdM." },
  { name: "Habdan", house: "Parfums de Marly", cost: 325, ml: 125, notes: ["apple","cinnamon","amber","vanilla","sandalwood"], description: "Candied apple and amber — indulgent and smooth." },

  /* ═══════════════════════════════════════════════
     AMOUAGE
     ═══════════════════════════════════════════════ */
  { name: "Interlude Man", house: "Amouage", cost: 310, ml: 100, notes: ["frankincense","oud","myrrh","amber","oregano"], description: "Organized chaos — smoky incense and herbs colliding." },
  { name: "Reflection Man", house: "Amouage", cost: 310, ml: 100, notes: ["rosemary","neroli","sandalwood","cedar","jasmine"], description: "Elegant, clean, and refined — their most versatile." },
  { name: "Jubilation XXV", house: "Amouage", cost: 370, ml: 100, notes: ["frankincense","myrrh","oud","amber","blackberry"], description: "Layered luxury — fruit, incense, and woods in perfect balance." },
  { name: "Memoir Man", house: "Amouage", cost: 310, ml: 100, notes: ["frankincense","basil","wormwood","cedar","sandalwood"], description: "Herbal incense — green, smoky, and contemplative." },
  { name: "Epic Man", house: "Amouage", cost: 310, ml: 100, notes: ["frankincense","cumin","oud","sandalwood","leather"], description: "Desert epic — spiced smoke and dark leather." },
  { name: "Enclave", house: "Amouage", cost: 310, ml: 100, notes: ["nutmeg","cardamom","oud","sandalwood","vetiver"], description: "Spiced wood and vetiver — quietly powerful." },

  /* ═══════════════════════════════════════════════
     D.S. & DURGA
     ═══════════════════════════════════════════════ */
  { name: "Burning Barbershop", house: "D.S. & Durga", cost: 195, ml: 50, notes: ["smoke","leather","birch tar","sage"], description: "Dark and earthy like Nosferatu but smokier." },
  { name: "Debaser", house: "D.S. & Durga", cost: 195, ml: 50, notes: ["fig","coconut","iris","tonka","cedar"], description: "Milky fig and warm iris — creamy and sun-drenched." },
  { name: "Bowmakers", house: "D.S. & Durga", cost: 195, ml: 50, notes: ["maple","cedar","amber","mahogany","violin wood"], description: "A luthier's workshop — warm wood shavings and resin." },
  { name: "I Don't Know What", house: "D.S. & Durga", cost: 260, ml: 50, notes: ["musk","ambrette","cashmeran","iso e super"], description: "A molecular skin scent — magnetic and elusive." },
  { name: "El Cosmico", house: "D.S. & Durga", cost: 195, ml: 50, notes: ["sage","creosote","cactus","cedar","musk"], description: "Desert camping — sage brush and sun-warmed wood." },
  { name: "Radio Bombay", house: "D.S. & Durga", cost: 195, ml: 50, notes: ["sandalwood","coconut","copper","cedar"], description: "Warm sandalwood with a metallic shimmer." },

  /* ═══════════════════════════════════════════════
     COMME DES GARÇONS
     ═══════════════════════════════════════════════ */
  { name: "Wonderwood", house: "Comme des Garçons", cost: 130, ml: 100, notes: ["cedar","sandalwood","vetiver","oud"], description: "A pure woody cedar experience — stripped down, clean-dark." },
  { name: "Hinoki", house: "Comme des Garçons", cost: 165, ml: 50, notes: ["hinoki","cedar","cypress","incense","musk"], description: "Japanese cypress temple — austere and sacred." },
  { name: "Avignon", house: "Comme des Garçons", cost: 130, ml: 50, notes: ["frankincense","myrrh","cedar","vetiver","incense"], description: "Cathedral stone and smoking incense." },
  { name: "Blackpepper", house: "Comme des Garçons", cost: 130, ml: 50, notes: ["black pepper","cedar","sandalwood","vetiver","musk"], description: "Straightforward pepper heat on a woody base." },
  { name: "Wonderoud", house: "Comme des Garçons", cost: 130, ml: 100, notes: ["oud","cedar","frankincense","vetiver","cypress"], description: "Clean oud without the animalic — accessible and modern." },
  { name: "Amazingreen", house: "Comme des Garçons", cost: 130, ml: 100, notes: ["green pepper","palm leaves","gunpowder","vetiver","musk"], description: "Explosive green — sharp, smoky, alive." },

  /* ═══════════════════════════════════════════════
     NASOMATTO / ORTO PARISI
     ═══════════════════════════════════════════════ */
  { name: "Black Afgano", house: "Nasomatto", cost: 185, ml: 30, notes: ["oud","cannabis","incense","coffee","resins"], description: "Dense, resinous, and narcotic — pure dark niche." },
  { name: "Pardon", house: "Nasomatto", cost: 185, ml: 30, notes: ["chocolate","oud","sandalwood","amber","leather"], description: "Dark chocolate and oud — smooth masculine depth." },
  { name: "Duro", house: "Nasomatto", cost: 185, ml: 30, notes: ["leather","sandalwood","wood","musk"], description: "Raw, tough, leathered — unapologetically masculine." },
  { name: "Baraonda", house: "Nasomatto", cost: 185, ml: 30, notes: ["whiskey","oud","musk","vanilla","amber"], description: "Boozy warmth — aged whiskey and oud." },
  { name: "Brutus", house: "Orto Parisi", cost: 185, ml: 50, notes: ["birch tar","leather","smoke","musk","resins"], description: "Brutal and animalic — not for the faint of heart." },
  { name: "Terroni", house: "Orto Parisi", cost: 185, ml: 50, notes: ["earth","patchouli","incense","vetiver","oud"], description: "Raw earth and soil — primal and grounding." },
  { name: "Megamare", house: "Orto Parisi", cost: 185, ml: 50, notes: ["seaweed","salt","musk","amber","driftwood"], description: "Ocean depths and shore minerals — aquatic done dark." },
  { name: "Stercus", house: "Orto Parisi", cost: 185, ml: 50, notes: ["civet","sandalwood","musk","vanilla","resins"], description: "Animalic beauty from decay — challenging and rewarding." },

  /* ═══════════════════════════════════════════════
     NISHANE
     ═══════════════════════════════════════════════ */
  { name: "Hacivat", house: "Nishane", cost: 210, ml: 100, notes: ["pineapple","bergamot","patchouli","cedar","oakmoss"], description: "The Aventus alternative — fruity, woody, long-lasting." },
  { name: "Ani", house: "Nishane", cost: 210, ml: 100, notes: ["vanilla","orchid","cardamom","sandalwood","amber"], description: "Warm vanilla orchid — sweet without being cloying." },
  { name: "Fan Your Flames", house: "Nishane", cost: 210, ml: 100, notes: ["saffron","rose","vanilla","oud","amber"], description: "Saffron-rose heat — rich, warm, and seductive." },
  { name: "Hundred Silent Ways", house: "Nishane", cost: 210, ml: 100, notes: ["vanilla","tonka","musk","sandalwood","amber"], description: "Comfort vanilla with a woody backbone — versatile." },
  { name: "Sultan Vetiver", house: "Nishane", cost: 210, ml: 100, notes: ["vetiver","bergamot","nutmeg","cedar","amber"], description: "Smoky vetiver with spice — commanding and earthy." },

  /* ═══════════════════════════════════════════════
     KEROSENE / INDIE NICHE
     ═══════════════════════════════════════════════ */
  { name: "Unknown Pleasures", house: "Kerosene", cost: 115, ml: 100, notes: ["coffee","cardamom","smoke","vanilla","leather"], description: "Campfire coffee and leather — indie cult classic." },
  { name: "Sweetly Known", house: "Kerosene", cost: 115, ml: 100, notes: ["vanilla","tobacco","amber","sandalwood","sugar"], description: "Candied tobacco — sweet, warm, irresistible." },
  { name: "Blackmail", house: "Kerosene", cost: 115, ml: 100, notes: ["plum","oud","incense","amber","vanilla"], description: "Dark plum and oud — fruity-resinous intrigue." },
  { name: "Follow", house: "Kerosene", cost: 115, ml: 100, notes: ["tonka","amber","sandalwood","musk","vanilla"], description: "Warm skin scent — comforting and close." },

  /* ═══════════════════════════════════════════════
     ETAT LIBRE D'ORANGE
     ═══════════════════════════════════════════════ */
  { name: "Rien", house: "Etat Libre d'Orange", cost: 155, ml: 50, notes: ["leather","incense","amber","rose","smoke"], description: "Burnt leather and churchy incense — anarchic elegance." },
  { name: "You or Someone Like You", house: "Etat Libre d'Orange", cost: 110, ml: 50, notes: ["mint","rose","vetiver","musk"], description: "Mint julep garden — crisp, green, and sparkling." },
  { name: "Remarkable People", house: "Etat Libre d'Orange", cost: 155, ml: 50, notes: ["bergamot","pepper","musk","cedar","labdanum"], description: "Warm, peppery skin scent — effortlessly cool." },
  { name: "La Fin du Monde", house: "Etat Libre d'Orange", cost: 110, ml: 50, notes: ["popcorn","gunpowder","cedar","musk","smoke"], description: "Buttered popcorn and fireworks — playful apocalypse." },

  /* ═══════════════════════════════════════════════
     L'ARTISAN PARFUMEUR
     ═══════════════════════════════════════════════ */
  { name: "Timbuktu", house: "L'Artisan Parfumeur", cost: 170, ml: 100, notes: ["mango wood","myrrh","cardamom","incense"], description: "Earthy-spicy-resinous — in line with your Diptyque taste." },
  { name: "Passage d'Enfer", house: "L'Artisan Parfumeur", cost: 170, ml: 100, notes: ["incense","lily","cedar","iris","vanilla"], description: "Cool church incense and white lilies — spiritual." },
  { name: "Noir Exquis", house: "L'Artisan Parfumeur", cost: 170, ml: 100, notes: ["chestnut","truffle","coffee","patchouli","musk"], description: "Roasted chestnuts and dark truffle — gourmand darkness." },

  /* ═══════════════════════════════════════════════
     BOGUE PROFUMO / FRANCESCA BIANCHI
     ═══════════════════════════════════════════════ */
  { name: "MAAI", house: "Bogue Profumo", cost: 250, ml: 50, notes: ["labdanum","myrrh","leather","sandalwood"], description: "One of the most revered dark resins — your territory." },
  { name: "O/E", house: "Bogue Profumo", cost: 250, ml: 50, notes: ["rose","oud","incense","labdanum","amber"], description: "Mystical rose-oud — dense and transformative." },
  { name: "The Lover's Tale", house: "Francesca Bianchi", cost: 185, ml: 30, notes: ["tobacco","benzoin","suede","earth","musk"], description: "Dark comfort — compatible with Rock the Myrrh." },
  { name: "The Dark Side", house: "Francesca Bianchi", cost: 185, ml: 30, notes: ["patchouli","vanilla","tobacco","amber","leather"], description: "Vintage patchouli darkness — rich and animalic." },
  { name: "Sticky Fingers", house: "Francesca Bianchi", cost: 185, ml: 30, notes: ["hashish","vanilla","amber","oud","musk"], description: "Resinous and narcotic — slow-building intensity." },

  /* ═══════════════════════════════════════════════
     VILHELM PARFUMERIE
     ═══════════════════════════════════════════════ */
  { name: "Poets of Berlin", house: "Vilhelm Parfumerie", cost: 245, ml: 100, notes: ["incense","birch","vetiver","bamboo","musk"], description: "Smoky birch and incense — perfectly aligned with your taste." },
  { name: "Dear Polly", house: "Vilhelm Parfumerie", cost: 245, ml: 100, notes: ["green tea","lemon","musks","apple","vanilla"], description: "Bright, clean tea — a palette cleanser." },
  { name: "Smoke Show", house: "Vilhelm Parfumerie", cost: 245, ml: 100, notes: ["smoke","cade","vanilla","sandalwood","amber"], description: "Bonfire vanilla — smoky sweetness that lingers." },
  { name: "Morning Chess", house: "Vilhelm Parfumerie", cost: 245, ml: 100, notes: ["black tea","blackcurrant","cedar","musk","amber"], description: "Sophisticated tea and cashmere — cerebral warmth." },

  /* ═══════════════════════════════════════════════
     MEMO PARIS
     ═══════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════
     MEMO PARIS (full lineup)
     ═══════════════════════════════════════════════ */
  { name: "African Leather", house: "Memo Paris", cost: 295, ml: 75, notes: ["leather","cardamom","saffron","oud","geranium","cumin","patchouli"], description: "Spiced leather and oud — warm, arid, and exotic. Their most iconic." },
  { name: "French Leather", house: "Memo Paris", cost: 295, ml: 75, notes: ["leather","rose","lime","suede","musk","cedar"], description: "A French rose wrapped in suede — sophisticated and soft." },
  { name: "Italian Leather", house: "Memo Paris", cost: 295, ml: 75, notes: ["leather","bergamot","iris","clary sage","vanilla","rockrose"], description: "Herbaceous Italian leather — smooth with a resinous vanilla base." },
  { name: "Irish Leather", house: "Memo Paris", cost: 295, ml: 75, notes: ["leather","juniper","mate","cedar","musk","vetiver"], description: "Windswept Irish moors — leather, juniper berries, and green mate." },
  { name: "Russian Leather", house: "Memo Paris", cost: 295, ml: 75, notes: ["leather","birch","pepper","amber","styrax","labdanum"], description: "Smoky birch tar and dark leather — raw and commanding." },
  { name: "Sicilian Leather", house: "Memo Paris", cost: 295, ml: 75, notes: ["leather","bergamot","neroli","cedar","musk","sea notes"], description: "Solar Mediterranean leather — volcanic, fresh, carried by sea winds." },
  { name: "Iberian Leather", house: "Memo Paris", cost: 295, ml: 75, notes: ["leather","iris","rose","jasmine","cedar","geranium","osmanthus"], description: "Dense and smoky leather over an elaborate floral heart." },
  { name: "Lalibela", house: "Memo Paris", cost: 295, ml: 75, notes: ["jasmine","rose","ylang-ylang","orange blossom","vanilla","patchouli","musk"], description: "Ethiopian temple florals — joyous, mystical, frankincense-tinged." },
  { name: "Marfa", house: "Memo Paris", cost: 295, ml: 75, notes: ["tuberose","orange blossom","saffron","sandalwood","cedar","musk"], description: "West Texas desert tuberose — powerful, sun-drenched, magnetic." },
  { name: "Inlé", house: "Memo Paris", cost: 295, ml: 75, notes: ["tea","neroli","bergamot","osmanthus","jasmine","fig","mate","cedar"], description: "Drifting on fragrant Burmese waters — osmanthus, tea, and green fig." },
  { name: "Sintra", house: "Memo Paris", cost: 295, ml: 75, notes: ["orange blossom","petitgrain","vanilla","marshmallow","musk"], description: "Portuguese childhood nostalgia — marshmallow sweetness and orange blossom." },
  { name: "Madurai", house: "Memo Paris", cost: 295, ml: 75, notes: ["jasmine sambac","sandalwood","cardamom","vanilla","musk","amber"], description: "Sacred Indian jasmine and creamy sandalwood — sensual and rich." },
  { name: "Kedu", house: "Memo Paris", cost: 295, ml: 75, notes: ["sesame","grapefruit","coconut","sandalwood","vanilla","musk"], description: "Javanese fertile earth — sesame and tropical woods, utterly unique." },
  { name: "Winter Palace", house: "Memo Paris", cost: 295, ml: 75, notes: ["cardamom","pink pepper","rose","incense","amber","musk"], description: "Russian winter contrast — fire and ice, spiced and crystalline." },
  { name: "Granada", house: "Memo Paris", cost: 295, ml: 75, notes: ["neroli","orange blossom","rose","amber","musk","sandalwood"], description: "Andalusian orange groves — floral, warm, and sun-kissed." },
  { name: "Luxor Oud", house: "Memo Paris", cost: 295, ml: 75, notes: ["oud","rose","patchouli","labdanum","fruit","saffron"], description: "Egyptian temple stones — roses and oud in splendor." },
  { name: "Odéon", house: "Memo Paris", cost: 295, ml: 75, notes: ["rose","patchouli","tonka","vanilla","musk","sandalwood"], description: "Mythical Parisian district — rose, patchouli, and tonka enlivened." },
  { name: "Palais Bourbon", house: "Memo Paris", cost: 295, ml: 75, notes: ["vanilla","sandalwood","cedar","amber","musk","benzoin"], description: "Majestic vanilla and sandalwood — persuasive, elegant, Parisian." },
  { name: "Tiger's Nest", house: "Memo Paris", cost: 295, ml: 75, notes: ["bergamot","bitter orange","saffron","incense","cedar","amber","musk"], description: "Himalayan monastery — northern lights warmth and woody protection." },
  { name: "Argentina", house: "Memo Paris", cost: 295, ml: 75, notes: ["mate","leather","vanilla","amber","musk","cedar"], description: "Passionate tango — mate, leather, and amber in a single movement." },
  { name: "Inverness", house: "Memo Paris", cost: 295, ml: 75, notes: ["peat","heather","whiskey","amber","cedar","musk","vetiver"], description: "Scottish Highlands — peat, heather, and golden rain." },
  { name: "Portobello Road", house: "Memo Paris", cost: 295, ml: 75, notes: ["lavender","incense","leather","amber","musk","cedar"], description: "London eccentricity — aromatic lavender and smoky incense." },
  { name: "Eau de Memo", house: "Memo Paris", cost: 225, ml: 75, notes: ["bergamot","jasmine","leather","musk","cedar"], description: "The house signature — euphoric bergamot and buttery leather accord." },
  { name: "Sherwood", house: "Memo Paris", cost: 295, ml: 75, notes: ["sandalwood","oakwood","blackcurrant","spices","musk","amber"], description: "Creamy red sandalwood enhanced by upcycled oakwood — warm and spiced." },
  { name: "Cappadocia", house: "Memo Paris", cost: 295, ml: 75, notes: ["rose","saffron","oud","amber","leather","musk"], description: "Turkish fairy chimneys — rose-saffron warmth over smoky leather." },
  { name: "Ithaque", house: "Memo Paris", cost: 295, ml: 75, notes: ["fig","bergamot","cedar","musk","amber","sea notes"], description: "Mythical Ionian island — sun-warmed fig and Mediterranean breeze." },
  { name: "Flam", house: "Memo Paris", cost: 295, ml: 75, notes: ["bergamot","bitter orange","cedar","amber","musk","vetiver"], description: "Norwegian fjord warmth — citrus brightness and protective woods." },
  { name: "Cap Camarat", house: "Memo Paris", cost: 295, ml: 75, notes: ["ylang-ylang","vanilla","amyris","pink pepper","musk"], description: "Provençal Riviera — sunny ylang, vanilla, and a smile in the sun." },
  { name: "Abu Dhabi", house: "Memo Paris", cost: 295, ml: 75, notes: ["date","oud","saffron","amber","vanilla","musk"], description: "Emirati dates and golden oud — delicately generous and enveloping." },
  { name: "Ilha do Mel", house: "Memo Paris", cost: 295, ml: 75, notes: ["coconut","honey","sandalwood","vanilla","musk","amber"], description: "Brazilian honey island — tropical sweetness and warm sand." },
  { name: "Tamarindo", house: "Memo Paris", cost: 295, ml: 75, notes: ["tamarind","coconut","sandalwood","vanilla","musk"], description: "Costa Rican coast — exotic tamarind fruit and oceanic warmth." },
  { name: "Siberian Golden Wood", house: "Memo Paris", cost: 295, ml: 75, notes: ["sesame","vetiver","sandalwood","amber","musk","cedar"], description: "Trans-Siberian journey — sesame, vetiver, and wild golden woods." },
  { name: "Desert Orange Blossom", house: "Memo Paris", cost: 295, ml: 75, notes: ["orange blossom","cinnamon","almond","patchouli","amber","musk"], description: "Dubai at dusk — warm cinnamon currents and rippling orange flower." },
  { name: "Rose Paris Rose", house: "Memo Paris", cost: 295, ml: 75, notes: ["rose","davana","guaiac wood","musk","amber"], description: "Parisian rooftop roses — ruffled, fruity, sophisticated." },
  { name: "London Tweed", house: "Memo Paris", cost: 295, ml: 75, notes: ["bergamot","ginger","cardamom","musk","amber","sandalwood"], description: "Royal parks shimmer — bergamot, ginger, and golden spice." },
  { name: "Kotor", house: "Memo Paris", cost: 295, ml: 75, notes: ["bergamot","pink pepper","rose","amber","musk","cedar"], description: "Montenegrin bay — sparkling citrus and Mediterranean warmth." },
  { name: "French Leather Rose", house: "Memo Paris", cost: 295, ml: 75, notes: ["rose","pink pepper","suede","musk","leather"], description: "French rose with bare-shoulder sophistication — sueded and intimate." },

  /* ═══════════════════════════════════════════════
     XERJOFF
     ═══════════════════════════════════════════════ */
  { name: "Naxos", house: "Xerjoff", cost: 295, ml: 100, notes: ["tobacco","honey","vanilla","tonka","lavender","cinnamon"], description: "Sweet tobacco and honey lavender — niche masterpiece." },
  { name: "Alexandria II", house: "Xerjoff", cost: 295, ml: 100, notes: ["oud","sandalwood","frankincense","musk","saffron"], description: "Regal oud and sandalwood — Middle Eastern royalty." },
  { name: "Erba Pura", house: "Xerjoff", cost: 295, ml: 100, notes: ["orange","bergamot","musk","amber","vanilla"], description: "Fruity-sweet amber — universally loved crowd-pleaser." },

  /* ═══════════════════════════════════════════════
     JULIETTE HAS A GUN
     ═══════════════════════════════════════════════ */
  { name: "Not a Perfume", house: "Juliette Has a Gun", cost: 135, ml: 100, notes: ["ambrette","musk"], description: "Single-molecule simplicity — clean, intimate, barely there." },
  { name: "Vanilla Vibes", house: "Juliette Has a Gun", cost: 135, ml: 100, notes: ["vanilla","sandalwood","sea salt","orchid"], description: "Beach vanilla — warm, salty, effortless." },
  { name: "Lady Vengeance", house: "Juliette Has a Gun", cost: 135, ml: 100, notes: ["rose","patchouli","vanilla","amber","musk"], description: "Dark rose and patchouli — sweet revenge." },

  /* ═══════════════════════════════════════════════
     GUERLAIN
     ═══════════════════════════════════════════════ */
  { name: "L'Homme Idéal EDP", house: "Guerlain", cost: 130, ml: 100, notes: ["cherry","almond","leather","sandalwood","vanilla"], description: "Boozy cherry-leather — refined and addictive." },
  { name: "Santal Royal", house: "Guerlain", cost: 280, ml: 125, notes: ["sandalwood","oud","rose","cinnamon","leather"], description: "Royal sandalwood-oud — opulent and smooth." },
  { name: "Encens Mythique", house: "Guerlain", cost: 280, ml: 125, notes: ["frankincense","oud","myrrh","amber","cedar"], description: "Sacred temple incense — profound and lasting." },
  { name: "Bois Mystérieux", house: "Guerlain", cost: 280, ml: 125, notes: ["sandalwood","cedar","incense","amber","vanilla"], description: "Mysterious woods — warm, balsamic, meditative." },

  /* ═══════════════════════════════════════════════
     ACQUA DI PARMA
     ═══════════════════════════════════════════════ */
  { name: "Oud & Spice", house: "Acqua di Parma", cost: 275, ml: 100, notes: ["oud","pink pepper","cardamom","amber","vanilla"], description: "Italian-spiced oud — elegant and warm." },
  { name: "Leather", house: "Acqua di Parma", cost: 275, ml: 100, notes: ["leather","birch","cedar","musk","amber"], description: "Refined leather — birch-forward, creamy dry down." },
  { name: "Sandalo", house: "Acqua di Parma", cost: 275, ml: 100, notes: ["sandalwood","musk","amber","vanilla","cedar"], description: "Pure Italian sandalwood — creamy and clean." },

  /* ═══════════════════════════════════════════════
     MISCELLANEOUS NICHE
     ═══════════════════════════════════════════════ */
  { name: "Straight to Heaven", house: "Kilian", cost: 275, ml: 50, notes: ["rum","cedar","sandalwood","vanilla","musk"], description: "Boozy rum and dry cedar — smooth, addictive, timeless." },
  { name: "Back to Black", house: "Kilian", cost: 275, ml: 50, notes: ["honey","tobacco","cherry","cedar","musk"], description: "Dark honey-tobacco — Amy Winehouse in scent form." },
  { name: "Intoxicated", house: "Kilian", cost: 275, ml: 50, notes: ["coffee","cardamom","cinnamon","oud","vanilla"], description: "Turkish coffee spice — warm and addictive." },
  { name: "Tauer L'Air du Désert Marocain", house: "Tauer Perfumes", cost: 120, ml: 50, notes: ["petitgrain","coriander","amber","vetiver","cedar"], description: "Saharan amber — the indie legend." },
  { name: "Zoologist Tyrannosaurus Rex", house: "Zoologist", cost: 165, ml: 60, notes: ["smoke","patchouli","leather","amber","labdanum"], description: "Primordial chaos — smoky, animalic, prehistoric." },
  { name: "Zoologist Bat", house: "Zoologist", cost: 165, ml: 60, notes: ["fig","cave moss","stone","smoke","damp earth"], description: "Underground cavern — dark, damp, mineral." },
  { name: "Imaginary Authors Every Storm a Serenade", house: "Imaginary Authors", cost: 95, ml: 50, notes: ["vetiver","sea salt","cedar","musk","green notes"], description: "Pacific Northwest shoreline — green salt and wet wood." },
  { name: "Imaginary Authors A City on Fire", house: "Imaginary Authors", cost: 95, ml: 50, notes: ["smoke","cade","labdanum","styrax","black pepper"], description: "Smoldering ruins — smoky-resinous intensity." },
  { name: "Imaginary Authors Yesterday Haze", house: "Imaginary Authors", cost: 95, ml: 50, notes: ["fig","coconut","tonka","sandalwood","vanilla"], description: "Dreamy fig milk and warm vanilla — hazy comfort." },
  { name: "Mihan Aromatics Mikado Bark", house: "Mihan Aromatics", cost: 200, ml: 50, notes: ["hinoki","cedar","sandalwood","musk","incense"], description: "Japanese wood minimalism — Australian niche excellence." },
  { name: "Floraiku One Umbrella for Two", house: "Floraiku", cost: 200, ml: 50, notes: ["incense","sandalwood","iris","amber","musk"], description: "Rainy-day incense and tender woods — poetic." },
  { name: "Woha Palermo", house: "Woha Parfums", cost: 160, ml: 50, notes: ["neroli","bergamot","cedar","musk","amber"], description: "Sicilian sun — bright citrus and warm wood." },
  { name: "Oddity Neon Church", house: "Oddity", cost: 150, ml: 50, notes: ["incense","neon","ozone","cedar","musk"], description: "Sacred meets synthetic — glowing incense in neon light." },

  /* ═══════════════════════════════════════════════
     SONNET CHAT RECOMMENDATIONS
     ═══════════════════════════════════════════════ */
  /* — Guerlain — */
  { name: "Vétiver Fauve", house: "Guerlain", cost: 280, ml: 125, notes: ["vetiver","sandalwood","tonka","amber","musk"], description: "Untamed vetiver — smoky, animalic, and wildly elegant." },
  { name: "Encens Mythique d'Orient", house: "Guerlain", cost: 280, ml: 125, notes: ["frankincense","oud","myrrh","amber","cedar"], description: "Sacred temple incense — profound, resinous, and lasting." },
  { name: "Vétiver EDT", house: "Guerlain", cost: 90, ml: 100, notes: ["vetiver","tobacco","pepper","cedar","musk"], description: "The classic vetiver benchmark — green, earthy, timeless." },
  { name: "Vétiver Parfum", house: "Guerlain", cost: 280, ml: 125, notes: ["vetiver","sandalwood","cedar","tonka","amber"], description: "The EDT elevated — richer, deeper, more resinous." },
  { name: "Angélique Noire", house: "Guerlain", cost: 280, ml: 125, notes: ["angelica","vanilla","leather","tonka","amber","musk"], description: "Dark angelica root and vanilla — herbaceous warmth with bite." },
  { name: "Herbes Troublantes", house: "Guerlain", cost: 280, ml: 125, notes: ["herbs","vetiver","cedar","musk","green notes"], description: "Wild aromatic herbs — troubling, green, and alive." },
  { name: "Après l'Ondée", house: "Guerlain", cost: 130, ml: 100, notes: ["violet","iris","anise","vanilla","heliotrope","musk"], description: "After the rain — violet tears and soft anise. A poetic masterpiece." },
  { name: "Herba Fresca", house: "Guerlain", cost: 90, ml: 75, notes: ["mint","green tea","lemon","cedar","musk"], description: "Fresh-cut herbs and morning dew — sparkling green simplicity." },
  /* — Marc-Antoine Barrois — */
  { name: "Ganymede", house: "Marc-Antoine Barrois", cost: 190, ml: 100, notes: ["mandarin","saffron","violet","osmanthus","immortelle","suede","akigalawood","musk"], description: "Mineral leather from Jupiter's moon — luminous, metallic, cult status." },
  /* — Hermès — */
  { name: "Un Jardin en Méditerranée", house: "Hermès", cost: 135, ml: 100, notes: ["fig","cedar","orange blossom","red pepper","cypress"], description: "Mediterranean fig garden — green, sun-warmed, and breezy." },
  { name: "Terre d'Hermès", house: "Hermès", cost: 135, ml: 100, notes: ["orange","vetiver","cedar","pepper","flint"], description: "Mineral earth meets citrus — masculine, grounded, iconic." },
  { name: "Un Jardin sur le Nil", house: "Hermès", cost: 135, ml: 100, notes: ["green mango","lotus","sycamore","incense","bulrush"], description: "Nile river garden — green mango and watery lotus." },
  { name: "Eau de Gentiane Blanche", house: "Hermès", cost: 175, ml: 100, notes: ["gentian","iris","musk","white floral"], description: "Bitter gentian root — austere, herbal, and wildly refined." },
  { name: "Vetiverio Hermès", house: "Hermès", cost: 175, ml: 100, notes: ["vetiver","grapefruit","basil","cedar","musk"], description: "Hermès vetiver — bright citrus opening into earthy depth." },
  /* — BDK Parfums — */
  { name: "Gris Charnel", house: "BDK Parfums", cost: 195, ml: 100, notes: ["fig","cardamom","iris","sandalwood","vetiver","musk"], description: "Fig and cardamom over carnal sandalwood — sophisticated and warm." },
  /* — Ex Nihilo — */
  { name: "Viper Green", house: "Ex Nihilo", cost: 250, ml: 100, notes: ["green notes","basil","vetiver","cedar","leather","musk"], description: "Venomous green — sharp basil and vetiver with a leather bite." },
  { name: "Atlas Fever", house: "Ex Nihilo", cost: 250, ml: 100, notes: ["leather","saffron","cedar","amber","musk","oud"], description: "Moroccan Atlas mountains — spiced leather and desert warmth." },
  { name: "Amber Sky", house: "Ex Nihilo", cost: 250, ml: 100, notes: ["amber","bergamot","vanilla","musk","tonka"], description: "Liquid amber sunset — warm, resinous, expansive." },
  /* — Maison Crivelli — */
  { name: "Iris Malikhân", house: "Maison Crivelli", cost: 195, ml: 100, notes: ["iris","leather","incense","amber","musk","vetiver"], description: "Iris rooted in leather and incense — dark, powdery, magnetic." },
  { name: "Oud Cadenza", house: "Maison Crivelli", cost: 195, ml: 100, notes: ["oud","saffron","rose","cedar","amber","musk"], description: "Oud crescendo — saffron-rose opening into dark resinous woods." },
  { name: "Patchouli Magnetik", house: "Maison Crivelli", cost: 195, ml: 100, notes: ["patchouli","ginger","vanilla","amber","musk"], description: "Magnetic patchouli pulled toward spiced vanilla." },
  /* — Kerosene — */
  { name: "Copper Skies", house: "Kerosene", cost: 115, ml: 100, notes: ["saffron","cardamom","leather","amber","cedar","musk"], description: "Saffron-spiced leather under copper-tinted twilight." },
  { name: "Broken Theories", house: "Kerosene", cost: 115, ml: 100, notes: ["vetiver","incense","leather","cedar","smoke"], description: "Fractured incense and vetiver — intellectual and smoky." },
  { name: "Sacred Memory", house: "Kerosene", cost: 115, ml: 100, notes: ["frankincense","myrrh","vanilla","amber","sandalwood"], description: "Cathedral resins and sacred vanilla — devotional warmth." },
  { name: "Canfield Cedar", house: "Kerosene", cost: 115, ml: 100, notes: ["cedar","birch","smoke","vanilla","musk"], description: "Smoky cedar forest — rugged, campfire-adjacent, wearable." },
  /* — Goldfield & Banks — */
  { name: "Silky Woods", house: "Goldfield & Banks", cost: 195, ml: 100, notes: ["sandalwood","vanilla","musk","amber","cedar"], description: "Australian sandalwood silk — creamy, smooth, second-skin." },
  { name: "Tales of Amber", house: "Goldfield & Banks", cost: 195, ml: 100, notes: ["amber","benzoin","labdanum","vanilla","musk"], description: "Deep amber storytelling — resinous warmth from Down Under." },
  { name: "Desert Rosewood", house: "Goldfield & Banks", cost: 195, ml: 100, notes: ["rosewood","sandalwood","iris","cedar","musk"], description: "Outback rosewood — dry, creamy, beautifully balanced." },
  { name: "Mystic Bliss", house: "Goldfield & Banks", cost: 195, ml: 100, notes: ["sandalwood","vanilla","amber","musk","tonka"], description: "Meditative bliss — sandalwood, vanilla, and cosmic calm." },
  /* — J-Scent — */
  { name: "Ippuku", house: "J-Scent", cost: 90, ml: 50, notes: ["tobacco","incense","hinoki","tea","cedar","musk"], description: "Japanese tobacco pause — incense, hinoki, and contemplation." },
  /* — Le Labo — */
  { name: "Patchouli 24", house: "Le Labo", cost: 310, ml: 100, notes: ["patchouli","birch tar","smoke","vanilla","styrax","leather"], description: "Smoky patchouli bonfire — dark, tarry, unforgettable." },
  { name: "Vetiver 46", house: "Le Labo", cost: 310, ml: 100, notes: ["vetiver","cedar","labdanum","pepper","amber","musk"], description: "Labdanum-laced vetiver — earthy, resinous, deeply masculine." },
  { name: "Violette 30", house: "Le Labo", cost: 310, ml: 100, notes: ["violet","earth","musk","sandalwood","amber"], description: "Violet ripped from the earth — raw, green, and grounding." },
  /* — L'Artisan Parfumeur — */
  { name: "Premier Figuier", house: "L'Artisan Parfumeur", cost: 170, ml: 100, notes: ["fig","coconut","cedar","musk","green notes"], description: "The original fig fragrance — milky, green, and sun-drenched." },
  /* — Scents of Wood — */
  { name: "Oud in Bourbon", house: "Scents of Wood", cost: 195, ml: 50, notes: ["oud","bourbon","vanilla","sandalwood","amber","musk"], description: "Oud aged in bourbon barrels — boozy, warm, and smooth." },
  { name: "Oud in Calvados", house: "Scents of Wood", cost: 195, ml: 50, notes: ["oud","apple brandy","cedar","amber","musk"], description: "Oud meets Normandy apple brandy — fruity, oaky, refined." },
  { name: "Mycelium in Chestnut", house: "Scents of Wood", cost: 195, ml: 50, notes: ["mushroom","chestnut","earth","cedar","musk","amber"], description: "Forest floor fungi and roasted chestnuts — earthy and unique." },
  { name: "Vetiver in Chestnut", house: "Scents of Wood", cost: 195, ml: 50, notes: ["vetiver","chestnut","cedar","amber","musk"], description: "Earthy vetiver roasted with sweet chestnut warmth." },
  { name: "Fig and Oud", house: "Scents of Wood", cost: 195, ml: 50, notes: ["fig","oud","cedar","musk","amber"], description: "Mediterranean fig wrapped in smoky oud." },
  /* — Serge Lutens — */
  { name: "Encens et Lavande", house: "Serge Lutens", cost: 170, ml: 50, notes: ["incense","lavender","cedar","amber","musk"], description: "Lavender smoke — aromatic incense meeting herbal calm." },
  /* — Fueguia 1833 — */
  { name: "Misiones", house: "Fueguia 1833", cost: 220, ml: 100, notes: ["mate","cedar","vetiver","tobacco","earth","musk"], description: "Argentine rainforest — maté, tobacco, and wild green earth." },
  /* — Maison Margiela — */
  { name: "From the Garden", house: "Maison Martin Margiela", cost: 140, ml: 100, notes: ["basil","tomato leaf","green pepper","earth","cedar"], description: "Fresh-picked herbs — tomato vine, basil, and garden soil." },
  /* — Calahorra / Woha — */
  { name: "Calahorra", house: "Woha Parfums", cost: 160, ml: 50, notes: ["leather","suede","fig","cedar","vetiver","musk"], description: "Spanish leather and sun-dried fig — warm, tactile, grounded." },
  /* — Sisley — */
  { name: "Eau de Campagne", house: "Sisley", cost: 150, ml: 100, notes: ["tomato leaf","herbs","patchouli","vetiver","oakmoss"], description: "Country garden classique — herbal, green, and earthy." },
  /* — Profumum Roma — */
  { name: "Ichnusa", house: "Profumum Roma", cost: 195, ml: 100, notes: ["myrtle","juniper","helichrysum","cedar","musk"], description: "Sardinian macchia — wild herbs baked in Mediterranean sun." },
  { name: "Olibanum", house: "Profumum Roma", cost: 195, ml: 100, notes: ["frankincense","myrrh","cedar","amber","musk"], description: "Pure sacred frankincense — Roman church incense distilled." },
  /* — Houbigant — */
  { name: "Figuier Noir", house: "Houbigant", cost: 220, ml: 100, notes: ["fig","patchouli","cedar","amber","leather","musk"], description: "Dark fig — leathered, patchouli-rich, nighttime sophistication." },
  /* — Bon Parfumeur — */
  { name: "204", house: "Bon Parfumeur", cost: 95, ml: 100, notes: ["fig","cedar","vetiver","sandalwood","musk"], description: "Minimalist fig and cedar — clean, affordable, and well-made." },
  /* — Heeley — */
  { name: "Cardinal", house: "Heeley", cost: 160, ml: 100, notes: ["incense","cedar","elemi","musk","amber"], description: "Vatican incense — cool stone, elemi resin, and sacred smoke." },
  /* — Prada — */
  { name: "Infusion d'Iris", house: "Prada", cost: 145, ml: 100, notes: ["iris","cedar","benzoin","incense","vetiver","musk"], description: "Powdery iris precision — clean, elegant, Italian restraint." },
  /* — Essential Parfums — */
  { name: "Fig Fiction", house: "Essential Parfums", cost: 85, ml: 100, notes: ["fig","coconut","sandalwood","cedar","musk"], description: "Affordable fig dream — milky coconut fig at an incredible price." },
  /* — April Aromatics — */
  { name: "Calling All Angels", house: "April Aromatics", cost: 160, ml: 30, notes: ["frankincense","rose","sandalwood","amber","musk"], description: "Natural incense and rose — celestial, gentle, handcrafted." },
  /* — Baruti — */
  { name: "Homo Homini Lupus", house: "Baruti", cost: 165, ml: 30, notes: ["leather","smoke","birch tar","labdanum","musk"], description: "Man is wolf to man — primal birch tar and feral leather." },
  /* — BeauFort London — */
  { name: "Coeur Sombre", house: "BeauFort London", cost: 115, ml: 50, notes: ["oud","incense","leather","smoke","amber","musk"], description: "Dark heart — churchy oud, smoke, and brooding leather." },
  /* — Anatole Lebreton — */
  { name: "L'Eau Scandaleuse", house: "Anatole Lebreton", cost: 140, ml: 50, notes: ["iris","vetiver","cedar","musk","amber"], description: "Scandalously understated — iris and vetiver in quiet tension." },
  /* — Arquiste — */
  { name: "Flor y Canto", house: "Arquiste", cost: 195, ml: 100, notes: ["tuberose","cacao","vanilla","copal","incense"], description: "Aztec flower ceremony — tuberose, cacao, and sacred copal." },
  /* — Andy Tauer — */
  { name: "Incense Extreme", house: "Andy Tauer", cost: 120, ml: 50, notes: ["incense","labdanum","vanilla","cedar","amber","smoke"], description: "Incense pushed to its limit — resinous, smoky, and extreme." },
  /* — Floraiku — */
  { name: "AO", house: "Floraiku", cost: 200, ml: 50, notes: ["incense","hinoki","green tea","iris","musk"], description: "Blue stillness — Japanese incense and contemplative green tea." },
  /* — Diptyque additions — */
  { name: "Eau de Lierre", house: "Diptyque", cost: 180, ml: 75, notes: ["ivy","green notes","musk","cedar","moss"], description: "Climbing ivy — crushed green leaves and cool stone walls." },
];

/* Curated Sonnet recommendations with fit categories */

const DiscoverTab = ({ bottles, setBottles, rankedWishlist }) => {
  const [query, setQuery] = useState("");
  const [filterHouse, setFilterHouse] = useState(null);
  const [filterNote, setFilterNote] = useState(null);
  const [addedNames, setAddedNames] = useState(new Set());
  const [showAllRecs, setShowAllRecs] = useState(false);
  const [searchMode, setSearchMode] = useState("local");
  const [apiResults, setApiResults] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [activeSection, setActiveSection] = useState("recs");

  /* Build note profile from owned collection for smart recommendations */
  const userNoteProfile = useMemo(() => {
    const counts = {};
    bottles.filter(b => b.status === "owned" || b.status === "had").forEach(b => {
      (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean).forEach(n => {
        counts[n] = (counts[n] || 0) + 3;
      });
    });
    bottles.filter(b => (b.status === "owned") && (!b.userNotes || !b.userNotes.trim())).forEach(b => {
      const bName = (b.fullName || b.name).toLowerCase();
      Object.entries(NOTE_TO_FRAGRANCES).forEach(([note, frags]) => {
        frags.forEach(f => {
          if (bName.includes(f.split(" — ")[0].toLowerCase()) || f.toLowerCase().includes(bName.split(" — ")[0].toLowerCase())) {
            counts[note] = (counts[note] || 0) + 2;
          }
        });
      });
    });
    return counts;
  }, [bottles]);

  /* Score DB fragrances by note overlap with user's profile */
  const smartRecs = useMemo(() => {
    const ownedNames = new Set(bottles.map(b => b.name.toLowerCase()));
    const totalWeight = Object.values(userNoteProfile).reduce((s, v) => s + v, 0);
    if (totalWeight === 0) return [];
    return FRAGRANCE_DB
      .filter(f => !ownedNames.has(f.name.toLowerCase()))
      .map(f => {
        let score = 0; let matched = [];
        f.notes.forEach(n => { const nl = n.toLowerCase(); if (userNoteProfile[nl]) { score += userNoteProfile[nl]; matched.push(n); } });
        if (matched.length >= 3) score *= 1.3;
        if (matched.length >= 4) score *= 1.2;
        return { ...f, score, matched, pct: Math.min(100, Math.round((score / totalWeight) * 200)) };
      })
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [userNoteProfile, bottles]);

  const allHouses = useMemo(() => [...new Set(FRAGRANCE_DB.map(f => f.house))].sort(), []);
  const allNotes = useMemo(() => { const s = new Set(); FRAGRANCE_DB.forEach(f => f.notes.forEach(n => s.add(n))); return [...s].sort(); }, []);

  const localResults = useMemo(() => {
    let filtered = FRAGRANCE_DB;
    if (filterHouse) filtered = filtered.filter(f => f.house === filterHouse);
    if (filterNote) filtered = filtered.filter(f => f.notes.includes(filterNote));
    if (query.trim()) { const q = query.toLowerCase(); filtered = filtered.filter(f => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q) || f.notes.some(n => n.includes(q)) || (f.description && f.description.toLowerCase().includes(q))); }
    return filtered;
  }, [query, filterHouse, filterNote]);

  const results = searchMode === "api" && apiResults.length > 0 ? apiResults : localResults;

  const searchApi = async (q) => {
    if (!q || q.length < 3) return;
    setApiLoading(true); setApiError(null);
    try {
      const res = await fetch(`/api/fragella?endpoint=search&search=${encodeURIComponent(q)}&limit=12`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setApiResults((Array.isArray(data) ? data : []).map(f => ({
        name: f.Name || "", house: f.Brand || "", cost: parseFloat(f.Price) || 0, ml: 0,
        notes: (f["General Notes"] || []).map(n => n.toLowerCase()),
        description: [f.Longevity ? `${f.Longevity} longevity` : "", f.Sillage ? `${f.Sillage} sillage` : ""].filter(Boolean).join(" · "),
        _api: true,
      })));
    } catch {
      setApiError("Fragella API not configured. Add FRAGELLA_API_KEY in Vercel → Settings → Environment Variables to unlock live search across 74,000+ fragrances.");
      setApiResults([]);
    }
    setApiLoading(false);
  };

  const alreadyInCollection = (name, house) => bottles.some(b => b.name.toLowerCase() === name.toLowerCase() || (b.house && house && b.house.toLowerCase() === house.toLowerCase() && b.name.toLowerCase().includes(name.split(" ")[0].toLowerCase())));

  const addToCollection = (frag, status) => {
    setBottles(prev => [...prev, { name: frag.name, fullName: `${frag.name} — ${frag.house}`, house: frag.house, cost: frag.cost || 0, ml: frag.ml || 0, freq: 0, status, userNotes: (frag.notes || []).join(", ") }]);
    setAddedNames(prev => new Set([...prev, frag.name]));
  };

  const renderFragCard = (frag, i, showScore) => {
    const exists = alreadyInCollection(frag.name, frag.house);
    const justAdded = addedNames.has(frag.name);
    return (
      <div key={`${frag.house}-${frag.name}-${i}`} style={{ background: `${PAL.cream}04`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "16px 18px", animation: `cardIn .35s ease ${Math.min(i, 8) * .04}s both` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {showScore && frag.pct > 0 && (
                <div style={{ width: 30, height: 30, borderRadius: 15, background: `${frag.pct >= 60 ? PAL.sage : frag.pct >= 30 ? PAL.gold : PAL.plum}18`, border: `1px solid ${frag.pct >= 60 ? PAL.sage : frag.pct >= 30 ? PAL.gold : PAL.plum}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ff.display, fontSize: 12, color: frag.pct >= 60 ? PAL.sage : frag.pct >= 30 ? PAL.gold : PAL.plum, flexShrink: 0 }}>{frag.pct}%</div>
              )}
              <div>
                <span style={{ fontFamily: ff.display, fontSize: 17, color: PAL.cream }}>{frag.name}</span>
                {frag.house && <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginLeft: 6 }}>{frag.house}</span>}
              </div>
            </div>
            {frag.description && <p style={{ fontFamily: ff.body, fontSize: 12, color: `${PAL.cream}77`, marginTop: 6, lineHeight: 1.5 }}>{frag.description}</p>}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
              {(frag.notes || []).slice(0, 5).map((n, j) => (
                <span key={j} onClick={() => { setFilterNote(n); setActiveSection("browse"); }} style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: (showScore && frag.matched?.includes(n)) ? PAL.sage : PAL.gold, background: (showScore && frag.matched?.includes(n)) ? `${PAL.sage}12` : `${PAL.gold}12`, border: `1px solid ${(showScore && frag.matched?.includes(n)) ? PAL.sage : PAL.gold}25`, borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>{n}</span>
              ))}
            </div>
            {frag.cost > 0 && (
              <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                <span style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream }}>${frag.cost}</span>
                {frag.ml > 0 && <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, alignSelf: "center" }}>{frag.ml}mL · ${(frag.cost / frag.ml).toFixed(2)}/mL</span>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
            {exists || justAdded ? (
              <div style={{ padding: "10px 16px", borderRadius: 8, textAlign: "center", background: `${PAL.sage}15`, border: `1px solid ${PAL.sage}40`, fontFamily: ff.body, fontSize: 11, color: PAL.sage }}>✓ {justAdded ? "Added" : "In collection"}</div>
            ) : (
              [{s:"owned",l:"Add as Owned",c:STATUS_COLORS["owned"]},{s:"want",l:"Add to Wishlist",c:STATUS_COLORS["want"]},{s:"want to try",l:"Want to Try",c:STATUS_COLORS["want to try"]}].map(opt => (
                <button key={opt.s} onClick={() => addToCollection(frag, opt.s)} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", background: `${opt.c}12`, border: `1px solid ${opt.c}40`, fontFamily: ff.body, fontSize: 11, color: opt.c, letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>{opt.l}</button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const visibleRecs = showAllRecs ? smartRecs : smartRecs.slice(0, 8);

  return (
    <div>
      <SectionTitle title="Discover Fragrances" sub="Personalized recommendations · browse 295+ · optional live search" />
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Section toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {[{k:"recs",l:"For You",ic:"✦"},{k:"browse",l:"Browse All",ic:"📚"}].map(s => (
          <button key={s.k} onClick={() => setActiveSection(s.k)} style={{ background: activeSection === s.k ? `${PAL.gold}14` : "transparent", border: `1px solid ${activeSection === s.k ? PAL.gold + "44" : PAL.border}`, borderRadius: 20, padding: "7px 16px", fontFamily: ff.body, fontSize: 11, color: activeSection === s.k ? PAL.gold : PAL.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 13 }}>{s.ic}</span>{s.l}</button>
        ))}
      </div>

      {/* ─── FOR YOU ─── */}
      {activeSection === "recs" && (
        <div>
          {smartRecs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>✦</div>
              <p style={{ fontFamily: ff.display, fontSize: 17, color: PAL.cream }}>Add notes to build recommendations</p>
              <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 6, lineHeight: 1.6, maxWidth: 360, margin: "6px auto 0" }}>Open Edit Collection and add fragrance notes to your owned bottles. The more notes you add, the better the recommendations.</p>
              <button onClick={() => setActiveSection("browse")} style={{ marginTop: 16, background: `${PAL.gold}14`, border: `1px solid ${PAL.gold}44`, borderRadius: 8, padding: "10px 24px", color: PAL.gold, fontFamily: ff.body, fontSize: 12, cursor: "pointer" }}>Browse All Fragrances</button>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginBottom: 14 }}>Based on the notes in your collection · matched notes in green</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{visibleRecs.map((f, i) => renderFragCard(f, i, true))}</div>
              {smartRecs.length > 8 && (
                <button onClick={() => setShowAllRecs(!showAllRecs)} style={{ marginTop: 12, width: "100%", padding: "10px", background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8, color: PAL.muted, fontFamily: ff.body, fontSize: 11, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>{showAllRecs ? "Show less" : `Show all ${smartRecs.length}`}</button>
              )}
            </>
          )}
        </div>
      )}


      {/* ─── BROWSE ALL ─── */}
      {activeSection === "browse" && (
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {[{k:"local",l:"Curated (offline)",ic:"📚"},{k:"api",l:"Fragella API (live)",ic:"🌐"}].map(v => (
              <button key={v.k} onClick={() => { setSearchMode(v.k); setApiResults([]); setApiError(null); }} style={{ background: searchMode === v.k ? `${PAL.gold}14` : "transparent", border: `1px solid ${searchMode === v.k ? PAL.gold + "44" : PAL.border}`, borderRadius: 8, padding: "6px 14px", fontFamily: ff.body, fontSize: 10, color: searchMode === v.k ? PAL.gold : PAL.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12 }}>{v.ic}</span>{v.l}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={query} onChange={e => { setQuery(e.target.value); if (searchMode === "local") setApiResults([]); }} onKeyDown={e => { if (e.key === "Enter" && searchMode === "api") searchApi(query); }} placeholder={searchMode === "api" ? "Search 74,000+ fragrances…" : "Search by name, house, or note…"} style={{ flex: 1, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 10, padding: "12px 16px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            {searchMode === "api" && <button onClick={() => searchApi(query)} disabled={apiLoading || query.length < 3} style={{ background: `${PAL.gold}20`, border: `1px solid ${PAL.gold}40`, borderRadius: 10, padding: "0 20px", color: PAL.gold, fontFamily: ff.body, fontSize: 12, cursor: apiLoading ? "wait" : "pointer", opacity: apiLoading || query.length < 3 ? .4 : 1 }}>{apiLoading ? "…" : "Search"}</button>}
          </div>
          {apiError && <div style={{ marginBottom: 14, padding: "10px 14px", background: `${PAL.rose}10`, border: `1px solid ${PAL.rose}30`, borderRadius: 8 }}><p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.rose, margin: 0 }}>{apiError}</p></div>}
          {searchMode === "local" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              <select value={filterHouse || ""} onChange={e => setFilterHouse(e.target.value || null)} style={{ background: filterHouse ? `${PAL.gold}14` : `${PAL.cream}06`, border: `1px solid ${filterHouse ? PAL.gold + "44" : PAL.border}`, borderRadius: 8, padding: "7px 28px 7px 12px", color: filterHouse ? PAL.gold : PAL.muted, fontFamily: ff.body, fontSize: 11, outline: "none", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
                <option value="">All Houses</option>
                {allHouses.map(h => <option key={h} value={h} style={{ background: PAL.bg, color: PAL.cream }}>{h}</option>)}
              </select>
              <select value={filterNote || ""} onChange={e => setFilterNote(e.target.value || null)} style={{ background: filterNote ? `${PAL.rose}14` : `${PAL.cream}06`, border: `1px solid ${filterNote ? PAL.rose + "44" : PAL.border}`, borderRadius: 8, padding: "7px 28px 7px 12px", color: filterNote ? PAL.rose : PAL.muted, fontFamily: ff.body, fontSize: 11, outline: "none", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
                <option value="">All Notes</option>
                {allNotes.map(n => <option key={n} value={n} style={{ background: PAL.bg, color: PAL.cream }}>{n}</option>)}
              </select>
              {(filterHouse || filterNote || query) && <button onClick={() => { setFilterHouse(null); setFilterNote(null); setQuery(""); }} style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "6px 12px", color: PAL.muted, fontFamily: ff.body, fontSize: 10, cursor: "pointer" }}>Clear</button>}
              <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginLeft: "auto" }}>{results.length} result{results.length !== 1 ? "s" : ""}</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent`, paddingRight: 4 }}>
            {results.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px" }}><p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>No matches</p><p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 4 }}>Try a different search or clear filters</p></div>}
            {results.map((f, i) => renderFragCard(f, i, false))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   WEAR CALENDAR COMPONENT
   ═══════════════════════════════════════════════════════════ */

const WearCalendar = ({ wearLog, setWearLog, bottles, wearRatings, setWearRatings }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerMouseDown = useRef(null);

  /* Only show owned bottles in the picker */
  const ownedBottles = useMemo(() => bottles.filter(b => b.status === "owned"), [bottles]);

  /* Generate a stable color for any bottle name */
  const bottleColor = useCallback((name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return NOTE_COLORS[Math.abs(hash) % NOTE_COLORS.length];
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleDayClick = (day) => {
    const key = dateKey(viewYear, viewMonth, day);
    setSelectedDay(key);
    setPickerOpen(true);
  };

  const toggleFragrance = (bottleName) => {
    setWearLog(prev => {
      const current = prev[selectedDay] || [];
      const exists = current.includes(bottleName);
      const updated = exists ? current.filter(n => n !== bottleName) : [...current, bottleName];
      if (updated.length === 0) { const n = { ...prev }; delete n[selectedDay]; return n; }
      return { ...prev, [selectedDay]: updated };
    });
  };

  const clearDay = () => {
    setWearLog(prev => { const n = { ...prev }; delete n[selectedDay]; return n; });
    setPickerOpen(false);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(viewYear, viewMonth, d);
    const worn = wearLog[key] || [];
    const isToday = key === todayKey;
    const hasWear = worn.length > 0;
    cells.push(
      <div key={d} onClick={() => handleDayClick(d)} style={{
        position: "relative", aspectRatio: "1", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", borderRadius: 10, cursor: "pointer",
        border: isToday ? `1.5px solid ${PAL.gold}66` : `1px solid ${PAL.border}`,
        background: hasWear ? `${bottleColor(worn[0])}12` : "transparent",
        transition: "all .2s",
      }}>
        <span style={{ fontFamily: ff.body, fontSize: 12, color: isToday ? PAL.gold : PAL.cream, fontWeight: isToday ? 600 : 400 }}>{d}</span>
        {hasWear && (
          <div style={{
            position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 2,
          }}>
            {worn.slice(0, 4).map((name, i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: bottleColor(name),
                boxShadow: `0 0 4px ${bottleColor(name)}88`,
              }} />
            ))}
            {worn.length > 4 && (
              <span style={{ fontSize: 7, color: PAL.muted, lineHeight: 1, marginLeft: 1 }}>+{worn.length - 4}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${PAL.border}`, borderRadius: 6, width: 32, height: 32, color: PAL.muted, cursor: "pointer", fontSize: 14 }}>‹</button>
        <span style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${PAL.border}`, borderRadius: 6, width: 32, height: 32, color: PAL.muted, cursor: "pointer", fontSize: 14 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: "center", fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells}
      </div>

      {/* Legend */}
      {(() => {
        const monthEntries = Object.entries(wearLog).filter(([k]) => k.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}`));
        const uniqueNames = [...new Set(monthEntries.flatMap(([,v]) => v))];
        if (uniqueNames.length === 0) return (
          <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, textAlign: "center", marginTop: 14 }}>
            Tap a day to log what you wore
          </p>
        );
        return (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, justifyContent: "center" }}>
            {uniqueNames.map(name => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: bottleColor(name), flexShrink: 0 }} />
                <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.cream }}>{name}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Fragrance picker popover */}
      {pickerOpen && (
        <div
          onMouseDown={e => { pickerMouseDown.current = e.target; }}
          onClick={e => { if (e.target === e.currentTarget && pickerMouseDown.current === e.currentTarget) setPickerOpen(false); }}
          style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 16,
            padding: 24, width: "88%", maxWidth: 400, maxHeight: "70vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h4 style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream, margin: 0 }}>Log Your Wear</h4>
                <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, margin: "2px 0 0" }}>
                  {selectedDay} · {(wearLog[selectedDay] || []).length > 0 ? `${(wearLog[selectedDay] || []).length} selected` : "select one or more"}
                </p>
              </div>
              <button onClick={() => setPickerOpen(false)} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {ownedBottles.length === 0 ? (
              <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, textAlign: "center", padding: "20px 0", lineHeight: 1.6 }}>
                No owned fragrances yet. Add bottles to your collection and set their status to "owned" to start logging wears.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ownedBottles.map((b) => {
                  const dayArr = wearLog[selectedDay] || [];
                  const isActive = dayArr.includes(b.name);
                  const color = bottleColor(b.name);
                  return (
                    <button key={b.name} onClick={() => toggleFragrance(b.name)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      borderRadius: 10, cursor: "pointer", transition: "all .2s",
                      background: isActive ? `${color}22` : "transparent",
                      border: isActive ? `1px solid ${color}55` : `1px solid ${PAL.border}`,
                      textAlign: "left",
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: isActive ? `2px solid ${color}` : `1.5px solid ${PAL.border}`,
                        background: isActive ? color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .2s",
                      }}>
                        {isActive && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: ff.body, fontSize: 13, color: PAL.cream, display: "block" }}>{b.name}</span>
                        {b.house && <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted }}>{b.house}</span>}
                      </div>
                      {isActive && <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.gold, letterSpacing: 1 }}>WORN</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {/* Daily wear rating */}
            {(wearLog[selectedDay] || []).length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${PAL.border}` }}>
                <span style={{ fontFamily: ff.display, fontStyle: "italic", fontSize: 12, color: PAL.gold, display: "block", marginBottom: 10 }}>Rate today's wear</span>
                {RATING_CATEGORIES.map(cat => (
                  <div key={cat.key} style={{ marginBottom: 6 }}>
                    <RatingSlider
                      compact
                      label={cat.label}
                      color={cat.color}
                      value={(wearRatings[selectedDay] || {})[cat.key] || 0}
                      onChange={v => setWearRatings(prev => ({
                        ...prev,
                        [selectedDay]: { ...(prev[selectedDay] || {}), [cat.key]: v }
                      }))}
                    />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setPickerOpen(false)} style={{
                flex: 1, padding: "11px",
                background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
                color: PAL.gold, fontFamily: ff.body, fontSize: 12, fontWeight: 500, cursor: "pointer",
                letterSpacing: 1,
              }}>Done</button>
              {(wearLog[selectedDay] || []).length > 0 && (
                <button onClick={clearDay} style={{
                  padding: "11px 16px",
                  background: "transparent", border: `1px solid ${PAL.rose}44`, borderRadius: 8,
                  color: PAL.rose, fontFamily: ff.body, fontSize: 12, cursor: "pointer",
                }}>Clear</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   BUBBLE CHART — Cost vs Volume, bubble size = frequency
   ═══════════════════════════════════════════════════════════ */

const BubbleChart = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });
  const containerRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDims({ w: rect.width, h: Math.min(440, Math.max(320, rect.width * 0.55)) });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (data.length === 0) return <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, textAlign: "center", padding: 40 }}>No fragrances in this filter</p>;

  const pad = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = dims.w - pad.left - pad.right;
  const plotH = dims.h - pad.top - pad.bottom;

  const maxCost = Math.max(...data.map(d => d.cost), 50);
  const maxMl = Math.max(...data.map(d => d.ml), 20);
  const maxFreq = Math.max(...data.map(d => d.freq), 1);

  const scaleX = (cost) => pad.left + (cost / maxCost) * plotW;
  const scaleY = (ml) => pad.top + plotH - (ml / maxMl) * plotH;
  const scaleR = (freq) => 8 + (freq / maxFreq) * 26;

  /* X-axis ticks */
  const xTicks = [];
  const xStep = maxCost <= 200 ? 50 : maxCost <= 500 ? 100 : 150;
  for (let v = 0; v <= maxCost; v += xStep) xTicks.push(v);

  /* Y-axis ticks */
  const yTicks = [];
  const yStep = maxMl <= 60 ? 10 : maxMl <= 120 ? 25 : 50;
  for (let v = 0; v <= maxMl; v += yStep) yTicks.push(v);

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <svg width={dims.w} height={dims.h} style={{ overflow: "visible" }}>
        {/* Grid lines */}
        {xTicks.map(v => (
          <line key={`xg${v}`} x1={scaleX(v)} y1={pad.top} x2={scaleX(v)} y2={pad.top + plotH} stroke={PAL.border} strokeDasharray="3 3" />
        ))}
        {yTicks.map(v => (
          <line key={`yg${v}`} x1={pad.left} y1={scaleY(v)} x2={pad.left + plotW} y2={scaleY(v)} stroke={PAL.border} strokeDasharray="3 3" />
        ))}

        {/* Axes */}
        <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke={PAL.border} />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke={PAL.border} />

        {/* X-axis labels */}
        {xTicks.map(v => (
          <text key={`xl${v}`} x={scaleX(v)} y={pad.top + plotH + 20} textAnchor="middle" fill={PAL.muted} fontFamily={ff.body} fontSize={10}>${v}</text>
        ))}
        <text x={pad.left + plotW / 2} y={dims.h - 4} textAnchor="middle" fill={PAL.muted} fontFamily={ff.body} fontSize={9} letterSpacing="2">COST ($)</text>

        {/* Y-axis labels */}
        {yTicks.map(v => (
          <text key={`yl${v}`} x={pad.left - 10} y={scaleY(v) + 4} textAnchor="end" fill={PAL.muted} fontFamily={ff.body} fontSize={10}>{v}mL</text>
        ))}
        <text x={14} y={pad.top + plotH / 2} textAnchor="middle" fill={PAL.muted} fontFamily={ff.body} fontSize={9} letterSpacing="2" transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}>VOLUME</text>

        {/* Bubbles */}
        {data.map((b, i) => {
          const cx = scaleX(b.cost);
          const cy = scaleY(b.ml);
          const r = scaleR(b.freq);
          const sc = STATUS_COLORS[b.status] || PAL.muted;
          const isHov = hoveredIdx === i;
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Glow */}
              {isHov && <circle cx={cx} cy={cy} r={r + 4} fill={sc} opacity={0.15} />}
              {/* Bubble */}
              <circle cx={cx} cy={cy} r={r}
                fill={sc}
                opacity={hoveredIdx !== null ? (isHov ? 0.85 : 0.2) : 0.65}
                stroke={isHov ? sc : "none"}
                strokeWidth={isHov ? 2 : 0}
                style={{ transition: "all .25s ease" }}
              />
              {/* Label — show on hover or if bubble is big enough */}
              {(isHov || r > 18) && (
                <text x={cx} y={cy - r - 6} textAnchor="middle" fill={isHov ? PAL.cream : PAL.muted}
                  fontFamily={ff.body} fontSize={isHov ? 11 : 9} fontWeight={isHov ? 500 : 400}
                  style={{ transition: "all .2s", pointerEvents: "none" }}>
                  {b.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (() => {
        const b = data[hoveredIdx];
        const sc = STATUS_COLORS[b.status] || PAL.muted;
        const cx = scaleX(b.cost);
        const cy = scaleY(b.ml);
        const tooltipLeft = cx > dims.w / 2 ? cx - 180 : cx + 20;
        const tooltipTop = Math.max(8, Math.min(cy - 40, dims.h - 120));
        return (
          <div style={{
            position: "absolute", left: tooltipLeft, top: tooltipTop,
            background: "rgba(15,13,9,0.95)", backdropFilter: "blur(10px)",
            border: `1px solid ${sc}40`, borderRadius: 10,
            padding: "12px 16px", fontFamily: ff.body, fontSize: 12,
            pointerEvents: "none", zIndex: 10, minWidth: 150,
          }}>
            <div style={{ fontFamily: ff.display, fontSize: 15, color: PAL.cream, marginBottom: 2 }}>{b.name}</div>
            {b.house && <div style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginBottom: 6 }}>{b.house}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 8, color: sc, background: `${sc}18`, border: `1px solid ${sc}30`, borderRadius: 3, padding: "1px 6px", letterSpacing: 1, textTransform: "uppercase" }}>{b.status}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: PAL.muted }}>Cost</span>
                <span style={{ color: PAL.cream, fontWeight: 500 }}>${b.cost}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: PAL.muted }}>Volume</span>
                <span style={{ color: PAL.cream, fontWeight: 500 }}>{b.ml}mL</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: PAL.muted }}>Frequency</span>
                <span style={{ color: PAL.cream, fontWeight: 500 }}>{b.freq}×/mo</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingTop: 4, borderTop: `1px solid ${PAL.border}` }}>
                <span style={{ color: PAL.muted }}>Cost/mL</span>
                <span style={{ color: PAL.gold, fontWeight: 500 }}>${(b.cost / (b.ml || 1)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TESTED TAB — Log fragrances you've sampled with ratings
   ═══════════════════════════════════════════════════════════ */

const TestedTab = ({ testedScents, setTestedScents, bottles, setBottles }) => {
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ name: "", house: "", notes: "", date: "", overall: 0, sillage: 0, longevity: 0, scent: 0, thoughts: "" });
  const [sortBy, setSortBy] = useState("date"); /* date | rating | name */

  const resetForm = () => {
    setForm({ name: "", house: "", notes: "", date: new Date().toISOString().slice(0, 10), overall: 0, sillage: 0, longevity: 0, scent: 0, thoughts: "" });
    setEditIdx(null);
    setShowForm(false);
  };

  const saveEntry = () => {
    if (!form.name.trim()) return;
    const entry = {
      ...form,
      name: form.name.trim(),
      house: form.house.trim(),
      notes: form.notes.trim(),
      avg: RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).length > 0
        ? RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).reduce((s, c) => s + form[c.key], 0) / RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).length
        : 0,
      createdAt: editIdx !== null ? (testedScents[editIdx]?.createdAt || Date.now()) : Date.now(),
    };
    if (editIdx !== null) {
      const updated = [...testedScents];
      updated[editIdx] = entry;
      setTestedScents(updated);
    } else {
      setTestedScents(prev => [entry, ...prev]);
    }
    resetForm();
  };

  const deleteEntry = (idx) => {
    setTestedScents(prev => prev.filter((_, i) => i !== idx));
  };

  const editEntry = (idx) => {
    const e = testedScents[idx];
    setForm({ name: e.name, house: e.house || "", notes: e.notes || "", date: e.date || "", overall: e.overall || 0, sillage: e.sillage || 0, longevity: e.longevity || 0, scent: e.scent || 0, thoughts: e.thoughts || "" });
    setEditIdx(idx);
    setShowForm(true);
  };

  const addToCollection = (entry, status) => {
    const newBottle = {
      name: entry.name,
      fullName: entry.house ? `${entry.name} — ${entry.house}` : entry.name,
      house: entry.house || "",
      cost: 0, ml: 0, freq: 0, status,
    };
    setBottles(prev => [...prev, newBottle]);
  };

  const alreadyInCollection = (name) => bottles.some(b => b.name.toLowerCase() === name.toLowerCase());

  const sorted = useMemo(() => {
    const copy = [...testedScents];
    if (sortBy === "rating") copy.sort((a, b) => (b.avg || 0) - (a.avg || 0));
    else if (sortBy === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    else copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return copy.map((e, i) => ({ ...e, _origIdx: testedScents.indexOf(e) }));
  }, [testedScents, sortBy]);

  const inputCss = { background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "10px 14px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div>
      <SectionTitle title="Tested Fragrances" sub={`${testedScents.length} scent${testedScents.length !== 1 ? "s" : ""} sampled`} />

      {/* Add button */}
      {!showForm && (
        <button onClick={() => { setForm({ ...form, date: new Date().toISOString().slice(0, 10) }); setShowForm(true); }} style={{
          width: "100%", padding: "14px",
          background: `linear-gradient(135deg, ${PAL.gold}12, ${PAL.rose}08)`,
          border: `1px dashed ${PAL.gold}44`, borderRadius: 12,
          color: PAL.gold, fontFamily: ff.display, fontSize: 15, fontStyle: "italic",
          cursor: "pointer", marginBottom: 20, letterSpacing: 0.5,
        }}>+ Log a new scent</button>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div style={{
          background: `${PAL.cream}04`, border: `1px solid ${PAL.border}`, borderRadius: 14,
          padding: "20px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: ff.display, fontSize: 17, color: PAL.cream, margin: 0 }}>{editIdx !== null ? "Edit Entry" : "Log a Scent"}</h3>
            <button onClick={resetForm} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 180px" }}>
              <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Fragrance name *</label>
              <input style={inputCss} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tam Dao" />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>House</label>
              <input style={inputCss} value={form.house} onChange={e => setForm({ ...form, house: e.target.value })} placeholder="e.g. Diptyque" />
            </div>
            <div style={{ flex: "0.7 1 100px" }}>
              <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Date tested</label>
              <input style={inputCss} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Notes you detected</label>
            <input style={inputCss} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. sandalwood, cedar, rosewood, cypress" />
          </div>

          {/* Rating sliders */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 8 }}>Ratings</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RATING_CATEGORIES.map(cat => (
                <RatingSlider key={cat.key} label={cat.label} color={cat.color}
                  value={form[cat.key] || 0}
                  onChange={v => setForm({ ...form, [cat.key]: v })}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Thoughts / impressions</label>
            <textarea style={{ ...inputCss, minHeight: 60, resize: "vertical" }} value={form.thoughts} onChange={e => setForm({ ...form, thoughts: e.target.value })} placeholder="How did it wear? Would you buy a full bottle?" />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveEntry} disabled={!form.name.trim()} style={{
              flex: 1, padding: "12px",
              background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
              color: PAL.gold, fontFamily: ff.body, fontSize: 13, fontWeight: 500, cursor: "pointer",
              opacity: form.name.trim() ? 1 : .4, letterSpacing: 0.5,
            }}>{editIdx !== null ? "Save Changes" : "Log Scent"}</button>
            <button onClick={resetForm} style={{
              padding: "12px 20px",
              background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8,
              color: PAL.muted, fontFamily: ff.body, fontSize: 12, cursor: "pointer",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Sort controls */}
      {testedScents.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {[{ k: "date", l: "Recent" }, { k: "rating", l: "Top Rated" }, { k: "name", l: "A–Z" }].map(s => (
            <button key={s.k} onClick={() => setSortBy(s.k)} style={{
              background: sortBy === s.k ? `${PAL.gold}14` : "transparent",
              border: `1px solid ${sortBy === s.k ? PAL.gold + "44" : PAL.border}`,
              borderRadius: 8, padding: "5px 12px",
              fontFamily: ff.body, fontSize: 10, color: sortBy === s.k ? PAL.gold : PAL.muted,
              cursor: "pointer", letterSpacing: 1,
            }}>{s.l}</button>
          ))}
        </div>
      )}

      {/* Entries list */}
      {sorted.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>◉</div>
          <p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>No scents tested yet</p>
          <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 4, lineHeight: 1.6 }}>
            Log fragrances you sample at stores, from decants, or borrowed from friends.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((entry) => {
          const i = entry._origIdx;
          const exists = alreadyInCollection(entry.name);
          const catsFilled = RATING_CATEGORIES.filter(c => (entry[c.key] || 0) > 0);
          return (
            <div key={entry.createdAt + entry.name} style={{
              background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 12,
              padding: "14px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {entry.avg > 0 && <RatingBadge ratings={{ overall: entry.avg }} size={32} />}
                    <div>
                      <span style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>{entry.name}</span>
                      {entry.house && <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginLeft: 6 }}>{entry.house}</span>}
                    </div>
                  </div>
                  {entry.date && <p style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, margin: "6px 0 0" }}>Tested {entry.date}</p>}

                  {/* Notes pills */}
                  {entry.notes && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                      {entry.notes.split(",").map(n => n.trim()).filter(Boolean).map((n, j) => (
                        <span key={j} style={{ fontFamily: ff.body, fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: PAL.gold, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}20`, borderRadius: 3, padding: "1px 6px" }}>{n}</span>
                      ))}
                    </div>
                  )}

                  {/* Category ratings */}
                  {catsFilled.length > 0 && (
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      {RATING_CATEGORIES.map(cat => (
                        <div key={cat.key} style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: ff.body, fontSize: 7, color: PAL.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{cat.label.slice(0, 4)}</div>
                          <div style={{ fontFamily: ff.display, fontSize: 14, color: (entry[cat.key] || 0) > 0 ? cat.color : PAL.muted }}>
                            {(entry[cat.key] || 0) > 0 ? entry[cat.key].toFixed(1) : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.thoughts && (
                    <p style={{ fontFamily: ff.body, fontSize: 12, color: `${PAL.cream}77`, margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>"{entry.thoughts}"</p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => editEntry(i)} style={{ padding: "6px 12px", borderRadius: 6, background: "transparent", border: `1px solid ${PAL.border}`, color: PAL.muted, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>Edit</button>
                  {!exists ? (
                    <button onClick={() => addToCollection(entry, "want")} style={{ padding: "6px 12px", borderRadius: 6, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}35`, color: PAL.gold, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>+ Collection</button>
                  ) : (
                    <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.sage, textAlign: "center", letterSpacing: 1 }}>✓ In collection</span>
                  )}
                  <button onClick={() => { if (window.confirm(`Remove "${entry.name}" from tested?`)) deleteEntry(i); }} style={{ padding: "6px 12px", borderRadius: 6, background: "transparent", border: `1px solid ${PAL.rose}25`, color: PAL.rose, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1, opacity: .6 }}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════
   SETTINGS PANEL — Tabs, Pairings, Themes
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_OPPOSING = [
  ["citrus", "smoky"],
  ["floral", "earthy"],
  ["green", "oriental"],
  ["fruity", "resinous"],
  ["aquatic", "gourmand"],
];

const THEME_PRESETS = {
  apothecary: { label: "Dark Apothecary", bg: "#0f0d09", card: "#141109", cream: "#e8dfd0", muted: "#8a7e6b", border: "#2a2318", gold: "#c5a46d", rose: "#b5546a", sage: "#7a927a", plum: "#7a5073" },
  midnight:   { label: "Midnight",        bg: "#0a0a12", card: "#10101a", cream: "#d8d8e8", muted: "#6a6a80", border: "#222235", gold: "#8a8acd", rose: "#b55a7a", sage: "#6a9a7a", plum: "#8a6aaa" },
  parchment:  { label: "Parchment",       bg: "#f4efe6", card: "#ebe4d8", cream: "#2a2218", muted: "#8a7e6b", border: "#d4cbb8", gold: "#8a6a3a", rose: "#9a3a4a", sage: "#4a7a4a", plum: "#6a3a6a" },
  forest:     { label: "Forest",          bg: "#0a100a", card: "#0f160f", cream: "#d0dfd0", muted: "#6b8a6b", border: "#1a2a1a", gold: "#a4c46d", rose: "#b5546a", sage: "#5a9a5a", plum: "#7a6a8a" },
  ember:      { label: "Ember",           bg: "#120a06", card: "#180e08", cream: "#f0dcc8", muted: "#9a7a5a", border: "#2a1a10", gold: "#d4944a", rose: "#c4543a", sage: "#7a8a5a", plum: "#8a5a5a" },
};

const SettingsPanel = ({ onClose, visibleTabs, setVisibleTabs, opposingPairs, setOpposingPairs, theme, setTheme, tabLabels }) => {
  const [section, setSection] = useState("tabs");
  const [newA, setNewA] = useState("");
  const [newB, setNewB] = useState("");
  const mouseDownRef = useRef(null);

  const currentPal = THEME_PRESETS[theme.preset] || THEME_PRESETS.apothecary;
  const isCustom = theme.preset === "custom";

  const sectionBtns = [
    { k: "tabs", l: "Tabs", ic: "☰" },
    { k: "pairings", l: "Pairings", ic: "🔗" },
    { k: "theme", l: "Theme", ic: "◐" },
  ];

  const selectCss = {
    background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`,
    borderRadius: 8, padding: "8px 28px 8px 10px", color: PAL.cream,
    fontFamily: ff.body, fontSize: 12, outline: "none", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
  };

  return (
    <div
      onMouseDown={e => { mouseDownRef.current = e.target; }}
      onClick={e => { if (e.target === e.currentTarget && mouseDownRef.current === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 16,
        padding: 24, width: "94%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: ff.display, fontSize: 20, color: PAL.cream, margin: 0 }}>Settings</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {/* Section toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {sectionBtns.map(s => (
            <button key={s.k} onClick={() => setSection(s.k)} style={{
              flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer",
              background: section === s.k ? `${PAL.gold}14` : "transparent",
              border: `1px solid ${section === s.k ? PAL.gold + "44" : PAL.border}`,
              fontFamily: ff.body, fontSize: 11, color: section === s.k ? PAL.gold : PAL.muted,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}><span style={{ fontSize: 14 }}>{s.ic}</span>{s.l}</button>
          ))}
        </div>

        {/* ── TAB VISIBILITY ── */}
        {section === "tabs" && (
          <div>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Choose which tabs appear in the navigation bar. Hidden tabs keep their data — you can always turn them back on.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tabLabels.map((tab, i) => (
                <label key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 10,
                  cursor: "pointer",
                }}>
                  <div onClick={() => setVisibleTabs(prev => ({ ...prev, [i]: !prev[i] }))}
                    style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0, cursor: "pointer",
                      border: `2px solid ${visibleTabs[i] !== false ? PAL.gold : PAL.border}`,
                      background: visibleTabs[i] !== false ? PAL.gold : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .2s",
                    }}>
                    {visibleTabs[i] !== false && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: ff.body, fontSize: 14, color: PAL.cream }}>{tab.icon} {tab.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── OPPOSING PAIRS ── */}
        {section === "pairings" && (
          <div>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Define which note families create interesting <span style={{ color: PAL.rose }}>opposing</span> pairings on the fragrance wheel.
              <span style={{ color: PAL.sage }}> Complementary</span> pairings (shared notes) are always shown automatically.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {opposingPairs.map(([a, b], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: FAMILY_COLORS[a] }} />
                  <span style={{ fontFamily: ff.body, fontSize: 12, color: FAMILY_COLORS[a], flex: 1 }}>{FAMILY_LABELS[a] || a}</span>
                  <span style={{ fontFamily: ff.display, fontSize: 14, color: PAL.rose }}>↔</span>
                  <span style={{ fontFamily: ff.body, fontSize: 12, color: FAMILY_COLORS[b], flex: 1, textAlign: "right" }}>{FAMILY_LABELS[b] || b}</span>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: FAMILY_COLORS[b] }} />
                  <button onClick={() => setOpposingPairs(opposingPairs.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: PAL.rose, fontSize: 16, cursor: "pointer", opacity: .6 }}>×</button>
                </div>
              ))}
              {opposingPairs.length === 0 && (
                <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, textAlign: "center", padding: 12 }}>No opposing pairs defined.</p>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <select value={newA} onChange={e => setNewA(e.target.value)} style={{ ...selectCss, flex: 1 }}>
                <option value="" style={{ background: PAL.bg }}>Family A…</option>
                {FAMILY_ORDER.map(f => <option key={f} value={f} style={{ background: PAL.bg, color: FAMILY_COLORS[f] }}>{FAMILY_LABELS[f]}</option>)}
              </select>
              <span style={{ fontFamily: ff.display, fontSize: 14, color: PAL.rose }}>↔</span>
              <select value={newB} onChange={e => setNewB(e.target.value)} style={{ ...selectCss, flex: 1 }}>
                <option value="" style={{ background: PAL.bg }}>Family B…</option>
                {FAMILY_ORDER.map(f => <option key={f} value={f} style={{ background: PAL.bg, color: FAMILY_COLORS[f] }}>{FAMILY_LABELS[f]}</option>)}
              </select>
              <button onClick={() => {
                if (newA && newB && newA !== newB && !opposingPairs.some(([a, b]) => (a === newA && b === newB) || (a === newB && b === newA))) {
                  setOpposingPairs([...opposingPairs, [newA, newB]]);
                }
                setNewA(""); setNewB("");
              }} disabled={!newA || !newB || newA === newB} style={{
                background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
                padding: "8px 14px", color: PAL.gold, fontFamily: ff.body, fontSize: 11, cursor: "pointer",
                opacity: !newA || !newB || newA === newB ? .3 : 1,
              }}>+ Add</button>
            </div>

            <button onClick={() => setOpposingPairs(DEFAULT_OPPOSING)} style={{
              width: "100%", padding: "8px", background: "transparent", border: `1px solid ${PAL.border}`,
              borderRadius: 8, color: PAL.muted, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1,
            }}>Reset to Defaults</button>
          </div>
        )}

        {/* ── COLOR THEME ── */}
        {section === "theme" && (
          <div>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Choose a preset theme or customize your own colors. Changes apply immediately.
            </p>

            {/* Preset grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 18 }}>
              {Object.entries(THEME_PRESETS).map(([key, t]) => (
                <button key={key} onClick={() => setTheme({ preset: key })} style={{
                  padding: "12px", borderRadius: 10, cursor: "pointer",
                  background: t.bg, border: `2px solid ${theme.preset === key ? t.gold : t.border}`,
                  textAlign: "left", transition: "border-color .2s",
                }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                    {[t.gold, t.rose, t.sage, t.plum, t.muted].map((c, i) => (
                      <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: ff.body, fontSize: 11, color: t.cream, fontWeight: theme.preset === key ? 600 : 400 }}>{t.label}</span>
                </button>
              ))}
              {/* Custom option */}
              <button onClick={() => setTheme({ preset: "custom", bg: theme.customBg || "#0f0d09", text: theme.customText || "#e8dfd0" })} style={{
                padding: "12px", borderRadius: 10, cursor: "pointer",
                background: theme.preset === "custom" ? (theme.customBg || "#0f0d09") : `${PAL.cream}04`,
                border: `2px solid ${theme.preset === "custom" ? PAL.gold : PAL.border}`,
                textAlign: "left",
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>🎨</div>
                <span style={{ fontFamily: ff.body, fontSize: 11, color: theme.preset === "custom" ? (theme.customText || PAL.cream) : PAL.muted }}>Custom</span>
              </button>
            </div>

            {/* Custom color pickers */}
            {theme.preset === "custom" && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 6 }}>Background</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={theme.customBg || "#0f0d09"}
                      onChange={e => setTheme({ ...theme, customBg: e.target.value })}
                      style={{ width: 36, height: 36, border: `1px solid ${PAL.border}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
                    <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.cream }}>{theme.customBg || "#0f0d09"}</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 6 }}>Text</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={theme.customText || "#e8dfd0"}
                      onChange={e => setTheme({ ...theme, customText: e.target.value })}
                      style={{ width: 36, height: 36, border: `1px solid ${PAL.border}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
                    <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.cream }}>{theme.customText || "#e8dfd0"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Done */}
        <button onClick={onClose} style={{
          marginTop: 20, width: "100%", padding: "12px",
          background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
          color: PAL.gold, fontFamily: ff.body, fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>Done</button>
      </div>
    </div>
  );
};


const PairingWheel = ({ bottles, noteOverrides, opposingPairs }) => {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [pairMode, setPairMode] = useState("all"); /* all | complementary | opposing */

  const owned = useMemo(() => bottles.filter(b => b.status === "owned" && (b.userNotes || "").trim()), [bottles]);

  const getBottleNotes = (b) => (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
  const getBottleFamily = (b) => {
    const notes = getBottleNotes(b);
    const counts = {};
    notes.forEach(n => { const f = getNoteFamily(n, noteOverrides); counts[f] = (counts[f] || 0) + 1; });
    let best = "oriental", max = 0;
    for (const [f, c] of Object.entries(counts)) { if (c > max) { max = c; best = f; } }
    return best;
  };

  /* Group by family */
  const grouped = useMemo(() => {
    const g = {};
    FAMILY_ORDER.forEach(f => { g[f] = []; });
    owned.forEach((b, i) => { const f = getBottleFamily(b); g[f].push({ bottle: b, idx: i, family: f }); });
    return g;
  }, [owned, noteOverrides]);

  /* Layout angles */
  const layout = useMemo(() => {
    const total = owned.length;
    if (total === 0) return { families: {}, frags: {} };
    const GAP = 0.03;
    const active = FAMILY_ORDER.filter(f => grouped[f].length > 0);
    const totalGaps = active.length * GAP;
    const usable = Math.PI * 2 - totalGaps;
    let angle = -Math.PI / 2;
    const families = {}, frags = {};
    active.forEach(fam => {
      const count = grouped[fam].length;
      const sweep = (count / total) * usable;
      families[fam] = { start: angle, end: angle + sweep, mid: angle + sweep / 2, count };
      grouped[fam].forEach((item, i) => {
        frags[item.idx] = { angle: angle + ((i + 0.5) / count) * sweep, family: fam };
      });
      angle += sweep + GAP;
    });
    return { families, frags };
  }, [owned, grouped]);

  /* Compute pairings */
  const pairings = useMemo(() => {
    if (selected === null) return [];
    const sel = owned[selected];
    const selNotes = getBottleNotes(sel);
    const selFamily = getBottleFamily(sel);

    return owned.map((b, i) => {
      if (i === selected) return null;
      const bNotes = getBottleNotes(b);
      const bFamily = getBottleFamily(b);
      const shared = selNotes.filter(n => bNotes.includes(n));
      const isOpposing = opposingPairs.some(([a, bb]) => (a === selFamily && bb === bFamily) || (a === bFamily && bb === selFamily));
      if (shared.length === 0 && !isOpposing) return null;
      return { idx: i, bottle: b, shared, strength: shared.length, isOpposing, isComplementary: shared.length > 0, family: bFamily };
    }).filter(Boolean).sort((a, b) => b.strength - a.strength);
  }, [selected, owned, opposingPairs, noteOverrides]);

  const filteredPairings = useMemo(() => {
    if (pairMode === "complementary") return pairings.filter(p => p.isComplementary);
    if (pairMode === "opposing") return pairings.filter(p => p.isOpposing);
    return pairings;
  }, [pairings, pairMode]);

  const pairedIndices = useMemo(() => new Set(filteredPairings.map(p => p.idx)), [filteredPairings]);

  const size = 600;
  const cx = size / 2, cy = size / 2;
  const catOuterR = 120, catInnerR = 72;
  const fragR = 175, fragDotR = 7;

  const arcPath = useCallback((r1, r2, a1, a2) => {
    const x1o = cx + Math.cos(a1) * r2, y1o = cy + Math.sin(a1) * r2;
    const x2o = cx + Math.cos(a2) * r2, y2o = cy + Math.sin(a2) * r2;
    const x1i = cx + Math.cos(a2) * r1, y1i = cy + Math.sin(a2) * r1;
    const x2i = cx + Math.cos(a1) * r1, y2i = cy + Math.sin(a1) * r1;
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return `M${x1o},${y1o} A${r2},${r2} 0 ${large},1 ${x2o},${y2o} L${x1i},${y1i} A${r1},${r1} 0 ${large},0 ${x2i},${y2i} Z`;
  }, [cx, cy]);

  const chordPath = useCallback((i1, i2) => {
    if (!layout.frags[i1] || !layout.frags[i2]) return "";
    const a1 = layout.frags[i1].angle, a2 = layout.frags[i2].angle;
    const x1 = cx + Math.cos(a1) * fragR, y1 = cy + Math.sin(a1) * fragR;
    const x2 = cx + Math.cos(a2) * fragR, y2 = cy + Math.sin(a2) * fragR;
    const pull = 0.08;
    const mx = cx + ((x1 - cx) + (x2 - cx)) * pull;
    const my = cy + ((y1 - cy) + (y2 - cy)) * pull;
    return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
  }, [layout, cx, cy, fragR]);

  if (owned.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>🔗</div>
        <p style={{ fontFamily: ff.display, fontSize: 17, color: PAL.cream }}>Add notes to at least 2 owned fragrances</p>
        <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 6, lineHeight: 1.6 }}>
          Open Edit Collection and add comma-separated notes to your bottles.
        </p>
      </div>
    );
  }

  const activeIdx = hovered ?? selected;
  const showPairings = selected !== null;

  return (
    <div>
      {/* Pairing mode toggle */}
      {showPairings && (
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 14 }}>
          {[{k:"all",l:"All Pairings"},{k:"complementary",l:"Complementary",c:PAL.sage},{k:"opposing",l:"Opposing",c:PAL.rose}].map(m => (
            <button key={m.k} onClick={() => setPairMode(m.k)} style={{
              background: pairMode === m.k ? `${m.c || PAL.gold}14` : "transparent",
              border: `1px solid ${pairMode === m.k ? (m.c || PAL.gold) + "44" : PAL.border}`,
              borderRadius: 20, padding: "5px 14px",
              fontFamily: ff.body, fontSize: 10, color: pairMode === m.k ? (m.c || PAL.gold) : PAL.muted,
              cursor: "pointer",
            }}>{m.l}</button>
          ))}
        </div>
      )}

      {/* Wheel */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, overflow: "visible" }}>
          {/* Category arcs */}
          {Object.entries(layout.families).map(([fam, pos]) => {
            const color = FAMILY_COLORS[fam];
            const isActive = activeIdx !== null && layout.frags[activeIdx]?.family === fam;
            const midA = pos.mid;
            const labelR = (catInnerR + catOuterR) / 2;
            const lx = cx + Math.cos(midA) * labelR;
            const ly = cy + Math.sin(midA) * labelR;
            const deg = midA * (180 / Math.PI);
            const flip = deg > 90 || deg < -90;
            return (
              <g key={`cat-${fam}`}>
                <path d={arcPath(catInnerR, catOuterR, pos.start, pos.end)}
                  fill={color} opacity={activeIdx !== null ? (isActive ? 0.35 : 0.06) : 0.18}
                  stroke={PAL.bg} strokeWidth="2" style={{ transition: "opacity .4s" }} />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                  fill={isActive || activeIdx === null ? color : "#2a2318"}
                  fontSize={pos.count > 3 ? "10" : "9"} fontFamily={ff.body}
                  fontWeight="600" letterSpacing="1.5"
                  style={{ textTransform: "uppercase", transition: "fill .3s" }}>
                  {FAMILY_LABELS[fam] || fam}
                </text>
              </g>
            );
          })}

          {/* Spokes */}
          {owned.map((b, i) => {
            if (!layout.frags[i]) return null;
            const a = layout.frags[i].angle;
            const fam = layout.frags[i].family;
            const x1 = cx + Math.cos(a) * catOuterR, y1 = cy + Math.sin(a) * catOuterR;
            const x2 = cx + Math.cos(a) * (fragR - fragDotR - 2), y2 = cy + Math.sin(a) * (fragR - fragDotR - 2);
            const isAct = activeIdx === i || (showPairings && pairedIndices.has(i));
            return <line key={`sp-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={FAMILY_COLORS[fam]} strokeWidth={isAct ? 1 : 0.4}
              opacity={activeIdx !== null ? (isAct ? 0.4 : 0.03) : 0.1}
              style={{ transition: "opacity .3s" }} />;
          })}

          {/* Pairing chords */}
          {showPairings && filteredPairings.map((p, i) => {
            const isHovPair = hovered === p.idx;
            const maxW = Math.max(...filteredPairings.map(pp => pp.strength), 1);
            const width = p.isOpposing && !p.isComplementary ? 2 : 1.5 + (p.strength / maxW) * 3.5;
            const color = p.isOpposing && !p.isComplementary ? PAL.rose : p.isComplementary ? PAL.sage : PAL.gold;
            return (
              <path key={`ch-${i}`} d={chordPath(selected, p.idx)} fill="none"
                stroke={isHovPair ? "#e8dfd0" : color}
                strokeWidth={isHovPair ? width + 1.5 : width}
                strokeDasharray={p.isOpposing && !p.isComplementary ? "6,4" : "none"}
                opacity={hovered !== null ? (isHovPair ? 0.9 : 0.06) : 0.45}
                strokeLinecap="round" style={{ transition: "opacity .3s" }} />
            );
          })}

          {/* Fragrance dots */}
          {owned.map((b, i) => {
            if (!layout.frags[i]) return null;
            const a = layout.frags[i].angle;
            const fam = layout.frags[i].family;
            const x = cx + Math.cos(a) * fragR, y = cy + Math.sin(a) * fragR;
            const color = FAMILY_COLORS[fam];
            const isSel = selected === i, isHov = hovered === i;
            const isPaired = showPairings && pairedIndices.has(i);
            const dimmed = activeIdx !== null && !isSel && !isPaired && !isHov;
            const pair = isPaired ? filteredPairings.find(p => p.idx === i) : null;
            return (
              <g key={`f-${i}`} onClick={() => setSelected(selected === i ? null : i)}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}>
                {isSel && <circle cx={x} cy={y} r={fragDotR + 5} fill="none" stroke={color} strokeWidth="1" opacity=".3">
                  <animate attributeName="r" values={`${fragDotR+3};${fragDotR+7};${fragDotR+3}`} dur="2.5s" repeatCount="indefinite" />
                </circle>}
                {(isHov || isSel) && <circle cx={x} cy={y} r={fragDotR + 3} fill={color} opacity=".12" />}
                <circle cx={x} cy={y} r={isSel ? fragDotR + 2 : isHov ? fragDotR + 1 : fragDotR}
                  fill={dimmed ? "#1a1710" : color}
                  stroke={isSel ? PAL.cream : isHov ? color : PAL.bg}
                  strokeWidth={isSel ? 2 : 1.5}
                  opacity={dimmed ? 0.15 : 1}
                  style={{ transition: "all .25s" }} />
                {isPaired && pair && (
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={PAL.bg} fontSize="7" fontWeight="600" fontFamily={ff.body}>{pair.strength || "↔"}</text>
                )}
                {(isHov || isSel) && (() => {
                  const ld = fragR + fragDotR + 12;
                  const lx = cx + Math.cos(a) * ld, ly = cy + Math.sin(a) * ld;
                  const deg = a * (180 / Math.PI), flip = deg > 90 || deg < -90;
                  return (
                    <g>
                      <text x={lx} y={ly - 1} textAnchor={flip ? "end" : "start"} dominantBaseline="middle"
                        transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                        fill={PAL.cream} fontSize="10" fontFamily={ff.display} fontStyle="italic">{b.name}</text>
                      <text x={lx} y={ly + 10} textAnchor={flip ? "end" : "start"} dominantBaseline="middle"
                        transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                        fill={PAL.muted} fontSize="7" fontFamily={ff.body}>{b.house}</text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Center */}
          <circle cx={cx} cy={cy} r={catInnerR - 4} fill={PAL.bg} />
          {selected !== null ? (
            <>
              <text x={cx} y={cy - 12} textAnchor="middle" fill={PAL.muted} fontSize="6" letterSpacing="3" style={{ textTransform: "uppercase" }}>Selected</text>
              <text x={cx} y={cy + 4} textAnchor="middle" fill={PAL.cream} fontSize="13" fontFamily={ff.display} fontStyle="italic">
                {owned[selected]?.name?.length > 14 ? owned[selected].name.slice(0, 13) + "…" : owned[selected]?.name}
              </text>
              <text x={cx} y={cy + 18} textAnchor="middle" fill={PAL.gold} fontSize="8" fontFamily={ff.body}>
                {filteredPairings.filter(p => p.isComplementary).length} complementary · {filteredPairings.filter(p => p.isOpposing).length} opposing
              </text>
              <text x={cx} y={cy + 33} textAnchor="middle" fill={PAL.muted} fontSize="8" fontFamily={ff.body}
                style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); setSelected(null); }}>✕ clear</text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 6} textAnchor="middle" fill={PAL.muted} fontSize="6" letterSpacing="4" style={{ textTransform: "uppercase" }}>Your</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fill={PAL.cream} fontSize="14" fontFamily={ff.display} fontStyle="italic">Collection</text>
              <text x={cx} y={cy + 24} textAnchor="middle" fill={PAL.muted} fontSize="8">{owned.length} fragrances</text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
        {FAMILY_ORDER.filter(f => grouped[f].length > 0).map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: FAMILY_COLORS[f] }} />
            <span style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: FAMILY_COLORS[f] }}>{FAMILY_LABELS[f]}</span>
          </div>
        ))}
        {showPairings && <>
          <span style={{ width: 1, height: 14, background: PAL.border, margin: "0 4px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 14, height: 2, background: PAL.sage, borderRadius: 1 }} />
            <span style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: PAL.sage }}>Complementary</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 14, height: 2, background: PAL.rose, borderRadius: 1, borderTop: `1px dashed ${PAL.rose}` }} />
            <span style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: PAL.rose }}>Opposing</span>
          </div>
        </>}
      </div>

      {/* Detail panel */}
      {showPairings && (
        <div style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: FAMILY_COLORS[layout.frags[selected]?.family] }} />
            <span style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic", color: PAL.cream }}>{owned[selected]?.name}</span>
            <span style={{ fontSize: 11, color: PAL.muted }}>{owned[selected]?.house}</span>
          </div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 14 }}>
            {getBottleNotes(owned[selected]).map((n, i) => {
              const nc = FAMILY_COLORS[getNoteFamily(n, noteOverrides)];
              return <span key={i} style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, color: nc, background: `${nc}12`, border: `1px solid ${nc}22` }}>{n}</span>;
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filteredPairings.map((p, i) => {
              const isHov = hovered === p.idx;
              const typeColor = p.isOpposing && !p.isComplementary ? PAL.rose : p.isComplementary ? PAL.sage : PAL.gold;
              const typeLabel = p.isComplementary && p.isOpposing ? "Both" : p.isOpposing ? "Opposing" : "Complementary";
              return (
                <div key={i} onMouseEnter={() => setHovered(p.idx)} onMouseLeave={() => setHovered(null)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                    background: isHov ? `${PAL.cream}06` : "transparent", border: `1px solid ${isHov ? PAL.border : "transparent"}`,
                    transition: "all .2s" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: FAMILY_COLORS[p.family], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: ff.display, fontSize: 13, fontStyle: "italic", color: PAL.cream }}>{p.bottle.name}</span>
                    <span style={{ fontSize: 9, color: PAL.muted, marginLeft: 6 }}>{p.bottle.house}</span>
                  </div>
                  <span style={{ fontSize: 7, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}25` }}>{typeLabel}</span>
                  {p.shared.length > 0 && (
                    <div style={{ display: "flex", gap: 2 }}>
                      {p.shared.slice(0, 3).map((n, j) => {
                        const nc = FAMILY_COLORS[getNoteFamily(n, noteOverrides)];
                        return <span key={j} style={{ fontSize: 6, letterSpacing: 1, textTransform: "uppercase", padding: "1px 5px", borderRadius: 2, color: nc, background: `${nc}10`, border: `1px solid ${nc}18` }}>{n}</span>;
                      })}
                    </div>
                  )}
                  <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.gold, minWidth: 20, textAlign: "right" }}>{p.strength || "↔"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════ */

export default function ScentDashboard() {
  const [tab, setTab] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteFragrances, setNoteFragrances] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [editing, setEditing] = useState(false);
  const [vis, setVis] = useState(false);
  const [trendView, setTrendView] = useState("chart");
  const [collectionFilter, setCollectionFilter] = useState(null);
  const [collectionView, setCollectionView] = useState("breakdown");
  const [statsMenuOpen, setStatsMenuOpen] = useState(false);

  /* ─── Persistent state — localStorage only ─── */

  const loadStored = (key, fallback) => {
    try {
      const raw = localStorage.getItem(`scent_${key}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return fallback;
  };

  const [visibleStats, setVisibleStats] = useState(() => loadStored("visibleStats", { collection: true, invested: true, daysWorn: true, signature: true }));
  const [noteOverrides, setNoteOverrides] = useState(() => loadStored("noteOverrides", {}));
  const [opposingPairs, setOpposingPairs] = useState(() => loadStored("opposingPairs", DEFAULT_OPPOSING));
  const [showSettings, setShowSettings] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState(() => loadStored("visibleTabs", { 0: true, 1: true, 2: true, 3: true, 4: true }));
  const [theme, setTheme] = useState(() => loadStored("theme", { preset: "apothecary" }));

  const isFirstVisit = (() => {
    try {
      const hasFlag = localStorage.getItem("scent_hasVisited");
      if (!hasFlag) return true;
      /* Even if the flag exists, if there are no bottles saved, treat as new user */
      const savedBottles = localStorage.getItem("scent_bottles");
      if (!savedBottles) return true;
      const parsed = JSON.parse(savedBottles);
      if (Array.isArray(parsed) && parsed.length === 0) return true;
    } catch {}
    return false;
  })();
  const [showWelcome, setShowWelcome] = useState(isFirstVisit);

  const [notes, setNotes] = useState(() => isFirstVisit ? [] : loadStored("notes", []));
  const [bottles, setBottles] = useState(() => isFirstVisit ? [] : loadStored("bottles", INITIAL_BOTTLES));
  const [wearLog, setWearLog] = useState(() => isFirstVisit ? {} : loadStored("wearLog", {}));
  const [bottleRatings, setBottleRatings] = useState(() => isFirstVisit ? {} : loadStored("bottleRatings", {}));
  const [wearRatings, setWearRatings] = useState(() => isFirstVisit ? {} : loadStored("wearRatings", {}));
  const [testedScents, setTestedScents] = useState(() => isFirstVisit ? [] : loadStored("testedScents", []));

  /* Dynamically compute notes profile from collection + tested scents */
  const computedNotes = useMemo(() => computeNotesProfile(bottles, testedScents), [bottles, testedScents]);
  const displayNotes = computedNotes.length > 0 ? computedNotes : notes.length > 0 ? notes : [];

  const startFresh = () => {
    setBottles([]);
    setNotes([]);
    try { localStorage.setItem("scent_hasVisited", "true"); } catch {}
    setShowWelcome(false);
  };

  const startWithDemo = () => {
    setBottles(INITIAL_BOTTLES);
    setNotes([]);
    try { localStorage.setItem("scent_hasVisited", "true"); } catch {}
    setShowWelcome(false);
  };

  const startWithImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.bottles) setBottles(data.bottles);
        if (data.notes) setNotes(data.notes);
        if (data.wearLog) setWearLog(data.wearLog);
        if (data.bottleRatings) setBottleRatings(data.bottleRatings);
        if (data.wearRatings) setWearRatings(data.wearRatings);
        if (data.testedScents) setTestedScents(data.testedScents);
        if (data.noteOverrides) setNoteOverrides(data.noteOverrides);
        if (data.opposingPairs) setOpposingPairs(data.opposingPairs);
        try { localStorage.setItem("scent_hasVisited", "true"); } catch {}
        setShowWelcome(false);
      } catch { alert("Couldn't read that file. Make sure it's a valid scent profile export."); }
    };
    input.click();
  };

  /* ─── Auto-save to localStorage ─── */

  useEffect(() => { try { localStorage.setItem("scent_notes", JSON.stringify(notes)); } catch {} }, [notes]);
  useEffect(() => { try { localStorage.setItem("scent_bottles", JSON.stringify(bottles)); } catch {} }, [bottles]);
  useEffect(() => { try { localStorage.setItem("scent_wearLog", JSON.stringify(wearLog)); } catch {} }, [wearLog]);
  useEffect(() => { try { localStorage.setItem("scent_bottleRatings", JSON.stringify(bottleRatings)); } catch {} }, [bottleRatings]);
  useEffect(() => { try { localStorage.setItem("scent_wearRatings", JSON.stringify(wearRatings)); } catch {} }, [wearRatings]);
  useEffect(() => { try { localStorage.setItem("scent_testedScents", JSON.stringify(testedScents)); } catch {} }, [testedScents]);
  useEffect(() => { try { localStorage.setItem("scent_visibleStats", JSON.stringify(visibleStats)); } catch {} }, [visibleStats]);
  useEffect(() => { try { localStorage.setItem("scent_noteOverrides", JSON.stringify(noteOverrides)); } catch {} }, [noteOverrides]);
  useEffect(() => { try { localStorage.setItem("scent_opposingPairs", JSON.stringify(opposingPairs)); } catch {} }, [opposingPairs]);
  useEffect(() => { try { localStorage.setItem("scent_visibleTabs", JSON.stringify(visibleTabs)); } catch {} }, [visibleTabs]);
  useEffect(() => { try { localStorage.setItem("scent_theme", JSON.stringify(theme)); } catch {} }, [theme]);

  /* ─── Export / Import ─── */

  const exportData = () => {
    const data = { notes, bottles, wearLog, bottleRatings, wearRatings, testedScents, noteOverrides, opposingPairs, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `scent-profile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.bottles) setBottles(data.bottles);
        if (data.notes) setNotes(data.notes);
        if (data.wearLog) setWearLog(data.wearLog);
        if (data.bottleRatings) setBottleRatings(data.bottleRatings);
        if (data.wearRatings) setWearRatings(data.wearRatings);
        if (data.testedScents) setTestedScents(data.testedScents);
        if (data.noteOverrides) setNoteOverrides(data.noteOverrides);
        if (data.opposingPairs) setOpposingPairs(data.opposingPairs);
      } catch { alert("Couldn't read that file. Make sure it's a valid scent profile export."); }
    };
    input.click();
  };

  /* ─── Initial setup ─── */

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
  }, []);

  /* Derive monthly trends from wearLog (arrays per day) */
  const calendarTrends = useMemo(() => {
    return MONTHS.map((name, i) => {
      const mk = `2026-${String(i + 1).padStart(2, "0")}`;
      const monthEntries = Object.entries(wearLog).filter(([k]) => k.startsWith(mk));
      const daysWorn = monthEntries.length;
      const totalApplications = monthEntries.reduce((s, [, arr]) => s + arr.length, 0);
      const uniqueBottles = new Set(monthEntries.flatMap(([, arr]) => arr)).size;
      return { month: name.slice(0, 3), daysWorn, applications: totalApplications, uniqueBottles };
    });
  }, [wearLog]);

  const hasCalendarData = Object.keys(wearLog).length > 0;

  const totalSpent = useMemo(() => sum(bottles.filter(b => b.status === "owned"), "cost"), [bottles]);
  const totalAll = useMemo(() => sum(bottles, "cost"), [bottles]);
  const totalMl = useMemo(() => sum(bottles.filter(b => b.status === "owned"), "ml"), [bottles]);
  const totalWears = Object.keys(wearLog).length;
  const filteredBottles = useMemo(() => collectionFilter ? bottles.filter(b => b.status === collectionFilter) : bottles, [bottles, collectionFilter]);

  /* Rank want/want-to-try bottles by fit score */
  const rankedWishlist = useMemo(() => {
    const ownedBottles = bottles.filter(b => b.status === "owned");
    const wishlist = bottles.filter(b => b.status === "want" || b.status === "want to try");
    return wishlist
      .map(b => ({ ...b, fit: scoreFragranceFit(b, ownedBottles, notes) }))
      .sort((a, b) => b.fit.score - a.fit.score);
  }, [bottles, notes]);

  const tabs = [
    { icon: "❋", label: "Notes" },
    { icon: "〰", label: "Trends" },
    { icon: "▧", label: "Collection" },
    { icon: "✦", label: "Discover" },
    { icon: "◉", label: "Tested" },
  ];

  /* Filter tabs by visibility settings */
  const filteredTabs = tabs.map((t, i) => ({ ...t, origIdx: i })).filter((_, i) => visibleTabs[i] !== false);

  /* Compute active theme colors */
  const activeTheme = useMemo(() => {
    if (theme.preset === "custom") {
      return { ...THEME_PRESETS.apothecary, bg: theme.customBg || "#0f0d09", cream: theme.customText || "#e8dfd0" };
    }
    return THEME_PRESETS[theme.preset] || THEME_PRESETS.apothecary;
  }, [theme]);

  const axisTick = { fill: PAL.muted, fontFamily: ff.body, fontSize: 11 };

  const topNote = useMemo(() => displayNotes.length > 0 ? [...displayNotes].sort((a, b) => b.pct - a.pct)[0]?.name || "—" : "—", [displayNotes]);

  const resetAll = () => {
    setBottles(INITIAL_BOTTLES);
    setWearLog({});
    setBottleRatings({});
    setWearRatings({});
    setTestedScents([]);
    setNotes([]);
    setSelectedNote(null);
    setNoteFragrances(null);
    try {
      localStorage.removeItem("scent_bottles");
      localStorage.removeItem("scent_wearLog");
      localStorage.removeItem("scent_bottleRatings");
      localStorage.removeItem("scent_wearRatings");
      localStorage.removeItem("scent_testedScents");
      localStorage.removeItem("scent_notes");
    } catch {}
  };

  const handleNoteClick = (index) => {
    if (selectedNote === index) { setSelectedNote(null); setNoteFragrances(null); return; }
    setSelectedNote(index);
    const noteName = displayNotes[index]?.name;
    if (!noteName) return;
    const lowerNote = noteName.toLowerCase();
    const seen = new Set();
    const results = [];

    /* 1. Check all bottles in your collection by their userNotes field */
    bottles.forEach(b => {
      if (!b.name.trim() || b.name.trim().toLowerCase() === "new fragrance") return;
      const bName = b.house ? `${b.name} — ${b.house}` : b.name;
      const userNotesList = (b.userNotes || "").toLowerCase().split(",").map(n => n.trim()).filter(Boolean);
      if (userNotesList.includes(lowerNote)) {
        if (!seen.has(bName.toLowerCase())) { seen.add(bName.toLowerCase()); results.push(bName); }
      }
    });

    /* 2. Check tested scents by their notes field */
    testedScents.forEach(t => {
      const tName = t.house ? `${t.name} — ${t.house}` : t.name;
      const testedNotesList = (t.notes || "").toLowerCase().split(",").map(n => n.trim()).filter(Boolean);
      if (testedNotesList.includes(lowerNote)) {
        if (!seen.has(tName.toLowerCase())) { seen.add(tName.toLowerCase()); results.push(tName); }
      }
    });

    /* 3. Check bottles against NOTE_TO_FRAGRANCES for those without userNotes */
    const staticResult = getFragrancesForNote(noteName);
    if (staticResult) {
      staticResult.forEach(fragName => {
        /* Only include if this fragrance is actually in the user's collection */
        const inCollection = bottles.some(b => {
          const bName = (b.fullName || b.name).toLowerCase();
          const fName = fragName.toLowerCase();
          return bName.includes(fName.split(" — ")[0]) || fName.includes(bName.split(" — ")[0]) || b.name.toLowerCase() === fName.split(" — ")[0];
        });
        if (inCollection && !seen.has(fragName.toLowerCase())) {
          seen.add(fragName.toLowerCase());
          results.push(fragName);
        }
      });
    }

    setNoteFragrances(results.length > 0 ? results : [`No fragrances with "${noteName}" in your collection yet`]);
  };

  /* ═══ Welcome Screen ═══════════════════════════ */
  if (showWelcome) {
    return (
      <div style={{ fontFamily: ff.body, background: PAL.bg, minHeight: "100vh", color: PAL.cream, position: "relative", overflow: "hidden" }}>
        <link href={FONT_LINK} rel="stylesheet" />
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity: 0.03 }} />
        <div style={{ position: "fixed", top: -180, left: "30%", width: 500, height: 500, background: `radial-gradient(circle, ${PAL.gold}08 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: -200, right: "10%", width: 400, height: 400, background: `radial-gradient(circle, ${PAL.rose}06 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 520, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: .6 }}>❋</div>
          <div style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 5, textTransform: "uppercase", color: PAL.muted, marginBottom: 8 }}>Olfactory · Analytics</div>
          <h1 style={{ fontFamily: ff.display, fontSize: "clamp(36px, 6vw, 52px)", fontWeight: 400, margin: "0 0 8px", lineHeight: 1.1, color: PAL.cream }}>Scent Profile</h1>
          <div style={{ width: 48, height: 2, background: `linear-gradient(90deg, ${PAL.gold}, transparent)`, margin: "0 auto 24px", borderRadius: 1 }} />
          <p style={{ fontFamily: ff.body, fontSize: 14, color: PAL.muted, lineHeight: 1.7, maxWidth: 400, marginBottom: 36 }}>
            Track your fragrance collection, log daily wears, rate what you sample, and discover your olfactory DNA.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
            <button onClick={startFresh} style={{
              padding: "16px 24px", borderRadius: 12, cursor: "pointer",
              background: `linear-gradient(135deg, ${PAL.gold}18, ${PAL.rose}10)`,
              border: `1px solid ${PAL.gold}44`,
              fontFamily: ff.display, fontSize: 16, fontStyle: "italic", color: PAL.gold,
              letterSpacing: 0.5,
            }}>Start Fresh</button>

            <button onClick={startWithDemo} style={{
              padding: "14px 24px", borderRadius: 12, cursor: "pointer",
              background: "transparent", border: `1px solid ${PAL.border}`,
              fontFamily: ff.body, fontSize: 13, color: PAL.muted,
            }}>Load Demo Collection</button>

            <button onClick={startWithImport} style={{
              padding: "14px 24px", borderRadius: 12, cursor: "pointer",
              background: "transparent", border: `1px solid ${PAL.border}`,
              fontFamily: ff.body, fontSize: 13, color: PAL.muted,
            }}>↑ Import Existing Data</button>
          </div>

          <p style={{ fontFamily: ff.body, fontSize: 10, color: `${PAL.muted}88`, marginTop: 24, lineHeight: 1.6 }}>
            Your data is stored locally in your browser.<br />Use Export / Import to transfer between devices.
          </p>
        </div>
      </div>
    );
  }

  /* ═══ Main Dashboard ═══════════════════════════ */
  return (
    <div style={{ fontFamily: ff.body, background: activeTheme.bg, minHeight: "100vh", color: activeTheme.cream, position: "relative", overflow: "hidden", transition: "background .4s, color .4s" }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity: 0.03 }} />
      <div style={{ position: "fixed", top: -180, left: "30%", width: 500, height: 500, background: `radial-gradient(circle, ${PAL.gold}08 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -200, right: "10%", width: 400, height: 400, background: `radial-gradient(circle, ${PAL.rose}06 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <header style={{ paddingTop: 52, paddingBottom: 16, opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(-16px)", transition: "all .7s cubic-bezier(.16,1,.3,1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 5, textTransform: "uppercase", color: PAL.muted }}>Olfactory · Analytics</div>
              <h1 style={{ fontFamily: ff.display, fontSize: "clamp(34px,5vw,52px)", fontWeight: 400, margin: "6px 0 0", lineHeight: 1.05, color: PAL.cream }}>Scent Profile</h1>
              <div style={{ width: 48, height: 2, background: `linear-gradient(90deg, ${PAL.gold}, transparent)`, marginTop: 14, borderRadius: 1 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={exportData} style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "7px 12px", color: PAL.muted, fontFamily: ff.body, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>↓ Export</button>
              <button onClick={importData} style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "7px 12px", color: PAL.muted, fontFamily: ff.body, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>↑ Import</button>
              <button onClick={() => setShowSettings(true)} style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "9px 14px", color: PAL.muted, fontFamily: ff.body, fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", cursor: "pointer" }}>⚙ Settings</button>
              <button onClick={() => setEditing(true)} style={{ background: `${PAL.gold}12`, border: `1px solid ${PAL.gold}33`, borderRadius: 8, padding: "9px 18px", color: PAL.gold, fontFamily: ff.body, fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", cursor: "pointer" }}>✎ Edit Collection</button>
            </div>
          </div>

          {/* Stats with show/hide */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setStatsMenuOpen(!statsMenuOpen)} style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: PAL.muted, cursor: "pointer", fontSize: 14 }}>⚙</button>
              {statsMenuOpen && (
                <div style={{ position: "absolute", top: 36, left: 0, background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 10, padding: "10px 14px", zIndex: 50, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                  <p style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, margin: "0 0 8px" }}>Show / Hide Stats</p>
                  {[
                    { key: "collection", label: "Collection" },
                    { key: "invested", label: "Invested" },
                    { key: "daysWorn", label: "Days Worn" },
                    { key: "signature", label: "Signature Note" },
                  ].map(item => (
                    <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer" }}>
                      <div onClick={() => setVisibleStats(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${visibleStats[item.key] ? PAL.gold : PAL.border}`, background: visibleStats[item.key] ? PAL.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}>
                        {visibleStats[item.key] && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.cream }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(12px)", transition: "all .7s cubic-bezier(.16,1,.3,1) .1s" }}>
            {visibleStats.collection && <Pill label="Collection" value={`${bottles.filter(b => b.status === "owned").length} owned`} accent={PAL.gold} />}
            {visibleStats.invested && (
            <div style={{ background: PAL.card, border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "14px 18px", flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: ff.body, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: PAL.muted }}>Invested</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: ff.display, fontSize: 26, fontWeight: 400, color: PAL.gold, lineHeight: 1.1 }}>${totalSpent.toLocaleString()}</span>
                <span style={{ fontFamily: ff.body, fontSize: 14, color: PAL.muted }}>/</span>
                <span style={{ fontFamily: ff.display, fontSize: 18, fontWeight: 400, color: PAL.muted, lineHeight: 1.1 }}>${totalAll.toLocaleString()}</span>
              </div>
              <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 1, marginTop: 1 }}>owned / full collection</span>
            </div>
            )}
            {visibleStats.daysWorn && <Pill label="Days Worn" value={totalWears} accent={PAL.sage} />}
            {visibleStats.signature && <Pill label="Signature" value={topNote} accent={PAL.rose} />}
          </div>
        </header>

        {/* Tabs */}
        <nav style={{ display: "flex", gap: 8, paddingTop: 28, flexWrap: "wrap", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(12px)", transition: "all .7s cubic-bezier(.16,1,.3,1) .2s" }}>
          {filteredTabs.map((t) => (
            <button key={t.origIdx} onClick={() => setTab(t.origIdx)} style={{
              background: tab === t.origIdx ? `${PAL.gold}14` : "transparent",
              border: `1px solid ${tab === t.origIdx ? PAL.gold + "44" : PAL.border}`,
              borderRadius: 28, padding: "9px 20px",
              fontFamily: ff.body, fontSize: 11, fontWeight: tab === t.origIdx ? 500 : 400,
              letterSpacing: 1.8, textTransform: "uppercase",
              color: tab === t.origIdx ? PAL.gold : PAL.muted,
              cursor: "pointer", transition: "all .3s",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>

        {/* Chart Card */}
        <section style={{
          marginTop: 22, marginBottom: 52, background: PAL.card, border: `1px solid ${PAL.border}`,
          borderRadius: 18, padding: "28px 22px 24px", position: "relative", overflow: "hidden",
          opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(18px)",
          transition: "all .7s cubic-bezier(.16,1,.3,1) .35s",
        }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: "absolute", top: 0, right: 0, opacity: .08, pointerEvents: "none" }}>
            <path d="M80 0 C80 44, 44 80, 0 80" fill="none" stroke={PAL.gold} strokeWidth="1"/>
            <path d="M80 0 C80 28, 28 80, 0 80" fill="none" stroke={PAL.gold} strokeWidth=".5"/>
          </svg>

          {/* ═══ NOTES ══════════════════════════════════ */}
          {tab === 0 && (
            <div>
              <SectionTitle title="Fragrance Notes" sub={displayNotes.length > 0 ? "Computed from your collection & tested scents" : "Add notes to your fragrances to build your profile"} />

              {displayNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 20px" }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>❋</div>
                  <p style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream, margin: "0 0 8px" }}>No scent profile yet</p>
                  <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
                    Add fragrance notes to your bottles in Edit Collection, or log tested scents with notes — your doughnut chart will build automatically.
                  </p>
                  <button onClick={() => setEditing(true)} style={{
                    marginTop: 18, background: `${PAL.gold}14`, border: `1px solid ${PAL.gold}44`,
                    borderRadius: 8, padding: "10px 24px", color: PAL.gold,
                    fontFamily: ff.body, fontSize: 12, cursor: "pointer",
                  }}>Open Edit Collection</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 36, marginTop: 8 }}>
                    <div style={{ position: "relative", width: 280, height: 280 }}>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                        <div style={{ fontFamily: ff.display, fontStyle: "italic", fontSize: (hovered !== null || selectedNote !== null) ? 34 : 22, fontWeight: 400, color: (hovered !== null || selectedNote !== null) ? NOTE_COLORS[(hovered ?? selectedNote) % NOTE_COLORS.length] : PAL.gold, transition: "all .35s" }}>
                          {(hovered !== null || selectedNote !== null) ? `${displayNotes[hovered ?? selectedNote]?.pct}%` : "Notes"}
                        </div>
                        <div style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>
                          {(hovered !== null || selectedNote !== null) ? displayNotes[hovered ?? selectedNote]?.name : "profile"}
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={displayNotes} dataKey="pct" cx="50%" cy="50%" innerRadius={78} outerRadius={125} paddingAngle={2.5} stroke="none"
                            onMouseEnter={(_, i) => setHovered(i)} onMouseLeave={() => setHovered(null)}
                            onClick={(_, i) => handleNoteClick(i)}
                            animationDuration={1100}>
                            {displayNotes.map((_, i) => {
                              const active = hovered ?? selectedNote;
                              return (
                                <Cell key={i} fill={NOTE_COLORS[i % NOTE_COLORS.length]}
                                  opacity={active !== null ? (active === i ? 1 : .25) : .82}
                                  style={{ transition: "opacity .3s", cursor: "pointer" }} />
                              );
                            })}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {displayNotes.map((n, i) => {
                        const active = hovered ?? selectedNote;
                        return (
                          <div key={i}
                            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                            onClick={() => handleNoteClick(i)}
                            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "5px 12px", borderRadius: 8, background: (selectedNote === i || hovered === i) ? `${NOTE_COLORS[i % NOTE_COLORS.length]}12` : "transparent", opacity: active !== null ? (active === i ? 1 : .4) : 1, transition: "all .3s", border: selectedNote === i ? `1px solid ${NOTE_COLORS[i % NOTE_COLORS.length]}40` : "1px solid transparent" }}>
                            <span style={{ width: 12, height: 12, borderRadius: 3, background: NOTE_COLORS[i % NOTE_COLORS.length], boxShadow: `0 0 10px ${NOTE_COLORS[i % NOTE_COLORS.length]}44`, flexShrink: 0 }} />
                            <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.cream, minWidth: 90 }}>{n.name}</span>
                            <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted }}>{n.pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Note detail box */}
                  {selectedNote !== null && displayNotes[selectedNote] && (
                    <div style={{
                      marginTop: 22, padding: "20px 24px",
                      background: `${NOTE_COLORS[selectedNote % NOTE_COLORS.length]}08`,
                      border: `1px solid ${NOTE_COLORS[selectedNote % NOTE_COLORS.length]}30`,
                      borderRadius: 14, transition: "all .3s ease",
                      animation: "fadeUp .35s ease",
                    }}>
                      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 4, background: NOTE_COLORS[selectedNote % NOTE_COLORS.length], boxShadow: `0 0 12px ${NOTE_COLORS[selectedNote % NOTE_COLORS.length]}55` }} />
                          <span style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream }}>{displayNotes[selectedNote]?.name}</span>
                          <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginLeft: 4 }}>in your collection</span>
                        </div>
                        <button onClick={() => { setSelectedNote(null); setNoteFragrances(null); }}
                          style={{ background: "none", border: "none", color: PAL.muted, fontSize: 16, cursor: "pointer" }}>✕</button>
                      </div>
                      {noteFragrances ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {noteFragrances.map((frag, i) => {
                            const matchedBottle = bottles.find(b =>
                              (b.fullName && (frag.includes(b.fullName.split(" — ")[0]) || b.fullName.includes(frag.split(" — ")[0]))) ||
                              frag.toLowerCase().includes(b.name.toLowerCase()) ||
                              b.name.toLowerCase().includes(frag.split(" — ")[0].toLowerCase())
                            );
                            const tag = matchedBottle?.status || null;
                            const tagColor = tag ? (STATUS_COLORS[tag] || PAL.muted) : PAL.muted;
                            return (
                              <div key={i} style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                                background: `${PAL.cream}04`, borderRadius: 8,
                                border: `1px solid ${PAL.border}`,
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: NOTE_COLORS[selectedNote % NOTE_COLORS.length], flexShrink: 0 }} />
                                <span style={{ fontFamily: ff.body, fontSize: 13, color: PAL.cream, flex: 1 }}>{frag}</span>
                                {tag && (
                                  <span style={{
                                    fontFamily: ff.body, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
                                    color: tagColor, background: `${tagColor}15`, border: `1px solid ${tagColor}30`,
                                    borderRadius: 4, padding: "2px 8px",
                                  }}>{tag}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {!selectedNote && (
                    <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, textAlign: "center", marginTop: 18 }}>
                      Click a note to see which fragrances in your collection contain it
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ TRENDS + CALENDAR ══════════════════════ */}
          {tab === 1 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: ff.display, fontSize: 24, fontWeight: 400, color: PAL.cream, margin: 0 }}>Perfume Trends</h2>
                  <p style={{ fontFamily: ff.body, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, margin: "4px 0 0" }}>
                    Log daily wears · view monthly patterns
                  </p>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[{k:"calendar",l:"Calendar",ic:"📅"},{k:"chart",l:"Chart",ic:"📈"},{k:"ratings",l:"Ratings",ic:"⭐"}].map(v => (
                    <button key={v.k} onClick={() => setTrendView(v.k)} style={{
                      background: trendView === v.k ? `${PAL.gold}14` : "transparent",
                      border: `1px solid ${trendView === v.k ? PAL.gold + "44" : PAL.border}`,
                      borderRadius: 8, padding: "6px 14px",
                      fontFamily: ff.body, fontSize: 11, color: trendView === v.k ? PAL.gold : PAL.muted,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}><span style={{ fontSize: 13 }}>{v.ic}</span>{v.l}</button>
                  ))}
                </div>
              </div>

              {trendView === "calendar" && (
                <WearCalendar wearLog={wearLog} setWearLog={setWearLog} bottles={bottles} wearRatings={wearRatings} setWearRatings={setWearRatings} />
              )}

              {trendView === "chart" && (
                <>
                  {hasCalendarData ? (
                    <>
                      <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, margin: "0 0 12px", letterSpacing: 1 }}>
                        Generated from your calendar entries
                      </p>
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={calendarTrends} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PAL.rose} stopOpacity={.35} /><stop offset="100%" stopColor={PAL.rose} stopOpacity={0} /></linearGradient>
                            <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PAL.gold} stopOpacity={.35} /><stop offset="100%" stopColor={PAL.gold} stopOpacity={0} /></linearGradient>
                            <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PAL.sage} stopOpacity={.3} /><stop offset="100%" stopColor={PAL.sage} stopOpacity={0} /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={PAL.border} />
                          <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: PAL.border }} tickLine={false} />
                          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend iconType="circle" wrapperStyle={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, paddingTop: 8 }} />
                          <Area type="monotone" dataKey="daysWorn" name="Days Worn" stroke={PAL.rose} fill="url(#gD)" strokeWidth={2.5} dot={{ r: 3, fill: PAL.rose }} activeDot={{ r: 5 }} />
                          <Area type="monotone" dataKey="applications" name="Total Applications" stroke={PAL.gold} fill="url(#gA)" strokeWidth={2.5} dot={{ r: 3, fill: PAL.gold }} activeDot={{ r: 5 }} />
                          <Area type="monotone" dataKey="uniqueBottles" name="Unique Fragrances" stroke={PAL.sage} fill="url(#gU)" strokeWidth={2.5} dot={{ r: 3, fill: PAL.sage }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>📅</div>
                      <p style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream, margin: "0 0 6px" }}>No wear data yet</p>
                      <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, maxWidth: 340, lineHeight: 1.6 }}>
                        Switch to the Calendar view and start logging which fragrance you wear each day. The chart will auto-populate from your entries.
                      </p>
                      <button onClick={() => setTrendView("calendar")} style={{
                        marginTop: 16, background: `${PAL.gold}14`, border: `1px solid ${PAL.gold}44`,
                        borderRadius: 8, padding: "10px 24px", color: PAL.gold,
                        fontFamily: ff.body, fontSize: 12, cursor: "pointer",
                      }}>Open Calendar</button>
                    </div>
                  )}
                </>
              )}

              {/* ─── Ratings View ─────────────────────── */}
              {trendView === "ratings" && (
                <div>
                  {/* Bottle Ratings */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontFamily: ff.display, fontSize: 18, fontWeight: 400, color: PAL.cream, margin: "0 0 4px" }}>Bottle Ratings</h3>
                    <p style={{ fontFamily: ff.body, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, margin: "0 0 14px" }}>Rate your owned fragrances · 1–10 with half steps</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {bottles.filter(b => b.status === "owned").map(b => {
                        const r = bottleRatings[b.name] || {};
                        const filled = RATING_CATEGORIES.filter(c => (r[c.key] || 0) > 0);
                        const avg = filled.length > 0 ? filled.reduce((s, c) => s + r[c.key], 0) / filled.length : 0;
                        return (
                          <div key={b.name} style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                              {avg > 0 && <RatingBadge ratings={{ overall: avg }} size={30} />}
                              <div>
                                <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.cream }}>{b.name}</span>
                                {b.house && <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, marginLeft: 6 }}>{b.house}</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {RATING_CATEGORIES.map(cat => (
                                <RatingSlider key={cat.key} label={cat.label} color={cat.color}
                                  value={r[cat.key] || 0}
                                  onChange={v => setBottleRatings(prev => ({ ...prev, [b.name]: { ...(prev[b.name] || {}), [cat.key]: v } }))}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leaderboard */}
                  {(() => {
                    const rated = bottles.filter(b => b.status === "owned" && bottleRatings[b.name])
                      .map(b => {
                        const r = bottleRatings[b.name] || {};
                        const filled = RATING_CATEGORIES.filter(c => (r[c.key] || 0) > 0);
                        return { ...b, avg: filled.length > 0 ? filled.reduce((s, c) => s + r[c.key], 0) / filled.length : 0 };
                      }).filter(b => b.avg > 0).sort((a, b) => b.avg - a.avg);
                    if (rated.length < 2) return null;
                    const medals = ["🥇","🥈","🥉"];
                    return (
                      <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontFamily: ff.display, fontSize: 18, fontWeight: 400, color: PAL.cream, margin: "0 0 4px" }}>Leaderboard</h3>
                        <p style={{ fontFamily: ff.body, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, margin: "0 0 14px" }}>Your top-rated bottles</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {rated.map((b, i) => (
                            <div key={b.name} style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                              background: i < 3 ? `${PAL.gold}06` : "transparent",
                              border: `1px solid ${i < 3 ? PAL.gold + "22" : PAL.border}`,
                              borderRadius: 10, flexWrap: "wrap",
                            }}>
                              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{medals[i] || `${i + 1}`}</span>
                              <div style={{ flex: 1, minWidth: 100 }}>
                                <span style={{ fontFamily: ff.display, fontSize: 14, color: PAL.cream }}>{b.name}</span>
                                {b.house && <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, marginLeft: 6 }}>{b.house}</span>}
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                {RATING_CATEGORIES.map(cat => (
                                  <div key={cat.key} style={{ textAlign: "center" }}>
                                    <div style={{ fontFamily: ff.body, fontSize: 7, color: PAL.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{cat.label.slice(0, 4)}</div>
                                    <div style={{ fontFamily: ff.display, fontSize: 13, color: (bottleRatings[b.name]?.[cat.key] || 0) > 0 ? cat.color : PAL.muted }}>{(bottleRatings[b.name]?.[cat.key] || 0).toFixed(1)}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ fontFamily: ff.display, fontSize: 20, color: PAL.gold, minWidth: 40, textAlign: "right" }}>{b.avg.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recent Wear Ratings */}
                  {(() => {
                    const ratedDays = Object.entries(wearRatings)
                      .filter(([, r]) => r && RATING_CATEGORIES.some(c => (r[c.key] || 0) > 0))
                      .sort(([a], [b]) => b.localeCompare(a)).slice(0, 20);
                    if (ratedDays.length === 0) return (
                      <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted }}>Rate your daily wears from the Calendar view — they'll appear here.</p>
                      </div>
                    );
                    return (
                      <div>
                        <h3 style={{ fontFamily: ff.display, fontSize: 18, fontWeight: 400, color: PAL.cream, margin: "0 0 4px" }}>Recent Wear Ratings</h3>
                        <p style={{ fontFamily: ff.body, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, margin: "0 0 14px" }}>Your last {ratedDays.length} rated sessions</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {ratedDays.map(([day, r]) => {
                            const worn = wearLog[day] || [];
                            const filled = RATING_CATEGORIES.filter(c => (r[c.key] || 0) > 0);
                            const avg = filled.length > 0 ? filled.reduce((s, c) => s + r[c.key], 0) / filled.length : 0;
                            return (
                              <div key={day} style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                                background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 10, flexWrap: "wrap",
                              }}>
                                <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, minWidth: 80 }}>{day}</span>
                                <div style={{ flex: 1, minWidth: 100 }}>
                                  {worn.map((name, i) => (
                                    <span key={i} style={{ fontFamily: ff.display, fontSize: 13, color: PAL.cream }}>{name}{i < worn.length - 1 ? ", " : ""}</span>
                                  ))}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {RATING_CATEGORIES.map(cat => (
                                    <div key={cat.key} style={{ textAlign: "center" }}>
                                      <div style={{ fontFamily: ff.body, fontSize: 7, color: PAL.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 1 }}>{cat.label.slice(0, 4)}</div>
                                      <div style={{ fontFamily: ff.display, fontSize: 12, color: (r[cat.key] || 0) > 0 ? cat.color : PAL.muted }}>{(r[cat.key] || 0) > 0 ? r[cat.key].toFixed(1) : "—"}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ fontFamily: ff.display, fontSize: 18, color: PAL.gold, minWidth: 36, textAlign: "right" }}>{avg > 0 ? avg.toFixed(1) : "—"}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ═══ COLLECTION ═════════════════════════════ */}
          {tab === 2 && (
            <div>
              {/* View toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[{k:"breakdown",l:"Breakdown",ic:"▧"},{k:"pairings",l:"Pairings",ic:"🔗"}].map(v => (
                  <button key={v.k} onClick={() => setCollectionView(v.k)} style={{
                    background: collectionView === v.k ? `${PAL.gold}14` : "transparent",
                    border: `1px solid ${collectionView === v.k ? PAL.gold + "44" : PAL.border}`,
                    borderRadius: 20, padding: "7px 16px",
                    fontFamily: ff.body, fontSize: 11, color: collectionView === v.k ? PAL.gold : PAL.muted,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}><span style={{ fontSize: 13 }}>{v.ic}</span>{v.l}</button>
                ))}
              </div>

              {collectionView === "breakdown" && (
                <div>
              <SectionTitle title="Collection Breakdown" sub="X: cost · Y: volume · bubble size: wear frequency" />
              {/* Status filter pills */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {["all", ...STATUSES].map(s => {
                  const count = s === "all" ? bottles.length : bottles.filter(b => b.status === s).length;
                  const isActive = (collectionFilter || "all") === s;
                  return (
                    <button key={s} onClick={() => setCollectionFilter(s === "all" ? null : s)} style={{
                      background: isActive ? `${s === "all" ? PAL.gold : STATUS_COLORS[s]}18` : "transparent",
                      border: `1px solid ${isActive ? (s === "all" ? PAL.gold : STATUS_COLORS[s]) + "44" : PAL.border}`,
                      borderRadius: 20, padding: "5px 14px",
                      fontFamily: ff.body, fontSize: 10, letterSpacing: 1.2, textTransform: "capitalize",
                      color: isActive ? (s === "all" ? PAL.gold : STATUS_COLORS[s]) : PAL.muted,
                      cursor: "pointer", transition: "all .2s",
                    }}>{s} ({count})</button>
                  );
                })}
              </div>

              {/* Bubble legend */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                {STATUSES.map(s => {
                  const sc = STATUS_COLORS[s];
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: sc, opacity: .7 }} />
                      <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, textTransform: "capitalize", letterSpacing: 1 }}>{s}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                  <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 1 }}>FREQ:</span>
                  {[2, 5, 9].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 8 + f * 2.5, height: 8 + f * 2.5, borderRadius: "50%", border: `1px solid ${PAL.muted}44`, background: `${PAL.muted}15` }} />
                      <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bubble Chart */}
              <BubbleChart data={filteredBottles} />

              {/* Cost per mL ribbon */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
                {filteredBottles.map((b, i) => {
                  const sc = STATUS_COLORS[b.status] || PAL.muted;
                  return (
                    <div key={i} style={{ background: `${sc}08`, border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "7px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: PAL.muted, letterSpacing: 1.2 }}>{b.name}</span>
                        <span style={{ fontSize: 8, color: sc, background: `${sc}18`, border: `1px solid ${sc}30`, borderRadius: 3, padding: "1px 5px", letterSpacing: 1, textTransform: "uppercase", fontFamily: ff.body }}>{b.status}</span>
                      </div>
                      <div style={{ fontFamily: ff.display, fontSize: 17, color: PAL.gold }}>${(b.cost / (b.ml || 1)).toFixed(2)}<span style={{ fontSize: 11, color: PAL.muted }}>/mL</span></div>
                    </div>
                  );
                })}
              </div>

                </div>
              )}

              {collectionView === "pairings" && (
                <PairingWheel bottles={bottles} noteOverrides={noteOverrides} opposingPairs={opposingPairs} />
              )}
            </div>
          )}

          {/* ═══ DISCOVER ═══════════════════════════════ */}
          {tab === 3 && (
            <DiscoverTab bottles={bottles} setBottles={setBottles} rankedWishlist={rankedWishlist} />
          )}

          {/* ═══ TESTED ═════════════════════════════════ */}
          {tab === 4 && (
            <TestedTab testedScents={testedScents} setTestedScents={setTestedScents} bottles={bottles} setBottles={setBottles} />
          )}
        </section>
      </div>

      {editing && (
        <EditPanel bottles={bottles} setBottles={setBottles} onClose={() => setEditing(false)} onReset={resetAll} noteOverrides={noteOverrides} setNoteOverrides={setNoteOverrides} />
      )}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          visibleTabs={visibleTabs} setVisibleTabs={setVisibleTabs}
          opposingPairs={opposingPairs} setOpposingPairs={setOpposingPairs}
          theme={theme} setTheme={setTheme}
          tabLabels={tabs}
        />
      )}
    </div>
  );
}
