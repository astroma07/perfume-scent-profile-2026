import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { signIn, onAuth, saveUserData, loadUserData } from "./firebase.js";

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
  sonnetAnalysis: `Core identity is dark, woody, and earthy. Consistently reaches for sandalwood, vetiver, oud, patchouli, and resinous bases like labdanum and myrrh. Drawn to fragrances grounded in the natural world: petrichor, moss, sage, earth. Likes warmth but not sweetness for its own sake — tobacco, amber, and vanilla always anchored to something drier. Leather and suede appear subtly. Comfort is welcome, but must have texture and edge.`,
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
   SONNET API
   ═══════════════════════════════════════════════════════════ */

const ANALYSIS_PROMPT = `You are a world-class fragrance analyst. Given this person's full fragrance collection and the analysis from a prior Sonnet conversation, produce a scent profile as a JSON array of their preferred fragrance notes with percentage weights.

THEIR COLLECTION:
Owned: ${YOUR_COLLECTION.owned.join(", ")}
Previously had: ${YOUR_COLLECTION.had.join(", ")}
Want to buy: ${YOUR_COLLECTION.want.join(", ")}
Want to try: ${YOUR_COLLECTION.wantToTry.join(", ")}

PRIOR ANALYSIS: ${YOUR_COLLECTION.sonnetAnalysis}

Based on ALL of this, return ONLY a JSON array (no markdown, no backticks, no explanation) of 8 fragrance notes that best represent this person's olfactory DNA. Use specific note names. Percentages must sum to 100. Weight heavily toward the notes that appear most consistently across their owned + want + try lists.

Example format:
[{"name":"Sandalwood","pct":20},{"name":"Oud","pct":18}]`;

async function analyzeWithSonnet() {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        messages: [{ role: "user", content: ANALYSIS_PROMPT }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && parsed[0].pct != null) return parsed;
  } catch (e) { console.error("Sonnet analysis error:", e); }
  return null;
}

const FALLBACK_NOTES = [
  { name: "Sandalwood", pct: 20 }, { name: "Myrrh", pct: 16 }, { name: "Oud", pct: 14 },
  { name: "Vetiver", pct: 12 }, { name: "Amber", pct: 10 }, { name: "Leather", pct: 9 },
  { name: "Patchouli", pct: 8 }, { name: "Tobacco", pct: 6 }, { name: "Labdanum", pct: 5 },
];

/* Refine chat */
const CHAT_SYSTEM = `You are a fragrance expert continuing a scent profile conversation. The user has an analyzed profile. They may want to refine it. Their core: dark, woody, earthy — sandalwood, vetiver, oud, myrrh, patchouli, leather, amber, tobacco. Keep responses concise (2-3 sentences). If they want an update, include:\n\`\`\`json\n[{"name":"Note","pct":25}]\n\`\`\`\nPercentages must sum to 100, 5-9 notes.`;

async function callSonnetChat(messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: CHAT_SYSTEM, messages }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

function extractNotes(text) {
  const m = text.match(/```json\s*([\s\S]*?)```/);
  if (!m) return null;
  try { const p = JSON.parse(m[1].trim()); if (Array.isArray(p) && p[0]?.name) return p; } catch {}
  return null;
}

/* ═══════════════════════════════════════════════════════════
   NOTE → FRAGRANCE MAPPING (from your Sonnet analysis)
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

/* Sonnet lookup for notes not in the static map */
async function lookupNoteFragrances(noteName, collection) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 500,
        messages: [{ role: "user", content: `From this fragrance collection, which ones contain or are characterized by the note "${noteName}"? Return ONLY a JSON array of fragrance name strings, no explanation.\n\nCollection: ${collection.join(", ")}` }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch { return null; }
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

const EditPanel = ({ bottles, setBottles, onClose, onReset }) => {
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
      const a = [...bottles]; a[i] = { ...a[i], house: val }; setBottles(a);
      setNewHouseInput(prev => { const n = { ...prev }; delete n[i]; return n; });
    }
  };

  const confirmNewHouse = (i) => {
    const val = (newHouseInput[i] || "").trim();
    if (val) { const a = [...bottles]; a[i] = { ...a[i], house: val }; setBottles(a); }
    setNewHouseInput(prev => { const n = { ...prev }; delete n[i]; return n; });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={onClose}>
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
                    <div style={{ flex: "1.5 1 120px" }}><label style={lab}>Name</label><input style={inputCss} value={b.name} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], name: e.target.value }; setBottles(a); }} /></div>
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
                  </div>
                );
              })}
              {items.length === 0 && <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, padding: "4px 0" }}>No fragrances in this category</p>}
            </div>
          );
        })}

        <button onClick={() => setBottles([...bottles, { name: "New Fragrance", fullName: "New Fragrance", house: "", cost: 100, ml: 50, freq: 3, status: "want to try" }])} style={{ background: `${PAL.gold}10`, border: `1px dashed ${PAL.gold}44`, borderRadius: 8, padding: 10, color: PAL.gold, cursor: "pointer", fontFamily: ff.body, fontSize: 12, width: "100%" }}>+ Add Fragrance</button>

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

/* ─── Refine Chat ────────────────────────────────────────── */

const RefineChat = ({ onUpdate }) => {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);
  const send = async () => {
    if (!input.trim() || loading) return;
    const u = input.trim(); setInput("");
    const n = [...msgs, { role: "user", content: u }]; setMsgs(n); setLoading(true);
    try { const r = await callSonnetChat(n); const w = [...n, { role: "assistant", content: r }]; setMsgs(w); const e = extractNotes(r); if (e) onUpdate(e); }
    catch { setMsgs([...n, { role: "assistant", content: "Could you rephrase that?" }]); }
    setLoading(false);
  };
  if (!open) return <button onClick={() => setOpen(true)} style={{ background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}30`, borderRadius: 8, padding: "8px 20px", color: PAL.gold, fontFamily: ff.body, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>💬 Refine with Sonnet</button>;
  return (
    <div style={{ marginTop: 16, background: `${PAL.cream}04`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: 16, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes dot{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: ff.display, fontStyle: "italic", fontSize: 13, color: PAL.gold }}>Refine Your Profile</span>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 16, cursor: "pointer" }}>✕</button>
      </div>
      <div ref={ref} style={{ maxHeight: 200, overflowY: "auto", marginBottom: 10, scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent` }}>
        {msgs.length === 0 && <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, margin: 0, lineHeight: 1.5 }}>Ask Sonnet to adjust — e.g. "Add incense and lower the tobacco"</p>}
        {msgs.map((m, i) => { const isU = m.role === "user"; const d = m.content.replace(/```json[\s\S]*?```/g, "").trim(); if (!d) return null; return (
          <div key={i} style={{ display: "flex", justifyContent: isU ? "flex-end" : "flex-start", marginBottom: 6, animation: "fadeUp .3s ease" }}>
            <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: 10, background: isU ? `${PAL.gold}15` : `${PAL.cream}08`, border: `1px solid ${isU ? PAL.gold + "25" : PAL.border}`, fontFamily: ff.body, fontSize: 12.5, lineHeight: 1.5, color: PAL.cream }}>
              {!isU && <span style={{ fontFamily: ff.display, fontStyle: "italic", fontSize: 9, color: PAL.gold, letterSpacing: 1.5, display: "block", marginBottom: 3 }}>SONNET</span>}{d}
            </div>
          </div>); })}
        {loading && <div style={{ display: "flex", gap: 5, padding: 6 }}>{[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: PAL.gold, animation: `dot 1.2s ease infinite ${d*.2}s` }} />)}</div>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Tweak your notes…" style={{ flex: 1, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "9px 14px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none" }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}35`, borderRadius: 8, padding: "0 16px", color: PAL.gold, fontFamily: ff.body, fontSize: 12, cursor: loading ? "wait" : "pointer", opacity: loading || !input.trim() ? .4 : 1 }}>Send</button>
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
const SONNET_RECOMMENDATIONS = [
  { name: "Vétiver Fauve", house: "Guerlain", fit: "essential" },
  { name: "Debaser", house: "D.S. & Durga", fit: "essential" },
  { name: "Patchouli 24", house: "Le Labo", fit: "essential" },
  { name: "Ganymede", house: "Marc-Antoine Barrois", fit: "essential" },
  { name: "Calahorra", house: "Woha Parfums", fit: "essential" },
  { name: "Un Jardin en Méditerranée", house: "Hermès", fit: "essential" },
  { name: "Gris Charnel", house: "BDK Parfums", fit: "essential" },
  { name: "Encens Mythique d'Orient", house: "Guerlain", fit: "essential" },
  { name: "Viper Green", house: "Ex Nihilo", fit: "essential" },
  { name: "Iris Malikhân", house: "Maison Crivelli", fit: "essential" },
  { name: "Copper Skies", house: "Kerosene", fit: "essential" },
  { name: "Blackmail", house: "Kerosene", fit: "essential" },
  { name: "Premier Figuier", house: "L'Artisan Parfumeur", fit: "essential" },
  { name: "Vetiver 46", house: "Le Labo", fit: "essential" },
  { name: "Silky Woods", house: "Goldfield & Banks", fit: "essential" },
  { name: "Ippuku", house: "J-Scent", fit: "essential" },
  { name: "Broken Theories", house: "Kerosene", fit: "strong" },
  { name: "Passage d'Enfer", house: "L'Artisan Parfumeur", fit: "strong" },
  { name: "Vétiver EDT", house: "Guerlain", fit: "strong" },
  { name: "Vétiver Parfum", house: "Guerlain", fit: "strong" },
  { name: "From the Garden", house: "Maison Martin Margiela", fit: "strong" },
  { name: "Bal d'Afrique", house: "Byredo", fit: "strong" },
  { name: "Terre d'Hermès", house: "Hermès", fit: "strong" },
  { name: "MAAI", house: "Bogue Profumo", fit: "strong" },
  { name: "Oud Cadenza", house: "Maison Crivelli", fit: "strong" },
  { name: "Tales of Amber", house: "Goldfield & Banks", fit: "strong" },
  { name: "Naked Dance", house: "Oddity", fit: "strong" },
  { name: "Atlas Fever", house: "Ex Nihilo", fit: "strong" },
  { name: "Oud in Bourbon", house: "Scents of Wood", fit: "strong" },
  { name: "Oud in Calvados", house: "Scents of Wood", fit: "strong" },
  { name: "Encens et Lavande", house: "Serge Lutens", fit: "strong" },
  { name: "Angélique Noire", house: "Guerlain", fit: "strong" },
  { name: "Misiones", house: "Fueguia 1833", fit: "strong" },
  { name: "Desert Rosewood", house: "Goldfield & Banks", fit: "strong" },
  { name: "Mystic Bliss", house: "Goldfield & Banks", fit: "strong" },
  { name: "Mycelium in Chestnut", house: "Scents of Wood", fit: "strong" },
  { name: "Timbuktu", house: "L'Artisan Parfumeur", fit: "good" },
  { name: "Herbes Troublantes", house: "Guerlain", fit: "good" },
  { name: "Un Jardin sur le Nil", house: "Hermès", fit: "good" },
  { name: "Eau de Lierre", house: "Diptyque", fit: "good" },
  { name: "Gypsy Water", house: "Byredo", fit: "good" },
  { name: "Sacred Memory", house: "Kerosene", fit: "good" },
  { name: "Burning Barbershop", house: "D.S. & Durga", fit: "good" },
  { name: "Canfield Cedar", house: "Kerosene", fit: "good" },
  { name: "Avignon", house: "Comme des Garçons", fit: "good" },
  { name: "Kyoto", house: "Diptyque", fit: "good" },
  { name: "Eau de Campagne", house: "Sisley", fit: "good" },
  { name: "Ichnusa", house: "Profumum Roma", fit: "good" },
  { name: "Figuier Noir", house: "Houbigant", fit: "good" },
  { name: "204", house: "Bon Parfumeur", fit: "good" },
  { name: "The Lover's Tale", house: "Francesca Bianchi", fit: "good" },
  { name: "Cardinal", house: "Heeley", fit: "good" },
  { name: "Violette 30", house: "Le Labo", fit: "good" },
  { name: "Vetiver in Chestnut", house: "Scents of Wood", fit: "good" },
  { name: "Fig and Oud", house: "Scents of Wood", fit: "good" },
  { name: "Patchouli Magnetik", house: "Maison Crivelli", fit: "good" },
  { name: "Ave Maria", house: "House of Bo", fit: "good" },
  { name: "Rosario", house: "House of Bo", fit: "good" },
  { name: "Eau de Sens", house: "Diptyque", fit: "good" },
  { name: "Eau de Gentiane Blanche", house: "Hermès", fit: "wildcard" },
  { name: "Après l'Ondée", house: "Guerlain", fit: "wildcard" },
  { name: "AO", house: "Floraiku", fit: "wildcard" },
  { name: "Infusion d'Iris", house: "Prada", fit: "wildcard" },
  { name: "Fig Fiction", house: "Essential Parfums", fit: "wildcard" },
  { name: "Vetiverio Hermès", house: "Hermès", fit: "wildcard" },
  { name: "Wonderwood", house: "Comme des Garçons", fit: "wildcard" },
  { name: "Herba Fresca", house: "Guerlain", fit: "wildcard" },
  { name: "Calling All Angels", house: "April Aromatics", fit: "wildcard" },
  { name: "Homo Homini Lupus", house: "Baruti", fit: "wildcard" },
  { name: "Coeur Sombre", house: "BeauFort London", fit: "wildcard" },
  { name: "L'Eau Scandaleuse", house: "Anatole Lebreton", fit: "wildcard" },
  { name: "Flor y Canto", house: "Arquiste", fit: "wildcard" },
  { name: "Amber Sky", house: "Ex Nihilo", fit: "wildcard" },
  { name: "Incense Extreme", house: "Andy Tauer", fit: "wildcard" },
  { name: "Olibanum", house: "Profumum Roma", fit: "wildcard" },
];

const DiscoverTab = ({ bottles, setBottles, rankedWishlist }) => {
  const [query, setQuery] = useState("");
  const [filterHouse, setFilterHouse] = useState(null);
  const [filterNote, setFilterNote] = useState(null);
  const [addedNames, setAddedNames] = useState(new Set());
  const [showAllRecs, setShowAllRecs] = useState(false);
  const [searchMode, setSearchMode] = useState("local"); /* local | api */
  const [apiResults, setApiResults] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const allHouses = useMemo(() => [...new Set(FRAGRANCE_DB.map(f => f.house))].sort(), []);
  const allNotes = useMemo(() => {
    const s = new Set();
    FRAGRANCE_DB.forEach(f => f.notes.forEach(n => s.add(n)));
    return [...s].sort();
  }, []);

  const localResults = useMemo(() => {
    let filtered = FRAGRANCE_DB;
    if (filterHouse) filtered = filtered.filter(f => f.house === filterHouse);
    if (filterNote) filtered = filtered.filter(f => f.notes.includes(filterNote));
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.house.toLowerCase().includes(q) ||
        f.notes.some(n => n.includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [query, filterHouse, filterNote]);

  const results = searchMode === "api" && apiResults.length > 0 ? apiResults : localResults;

  /* Fragella API search */
  const searchApi = async (q) => {
    if (!q || q.length < 3) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/fragella?endpoint=search&search=${encodeURIComponent(q)}&limit=10`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map(f => ({
        name: f.Name || "",
        house: f.Brand || "",
        cost: parseFloat(f.Price) || 0,
        ml: 0,
        notes: (f["General Notes"] || []).map(n => n.toLowerCase()),
        description: [
          f.Longevity ? `${f.Longevity} longevity` : "",
          f.Sillage ? `${f.Sillage} sillage` : "",
          f["Price Value"] ? f["Price Value"].replace("_", " ") : "",
        ].filter(Boolean).join(" · "),
        accords: f["Main Accords"] || [],
        imageUrl: f["Image URL"] || null,
        gender: f.Gender || "",
        rating: f.rating || "",
        oilType: f.OilType || "",
        _api: true,
      }));
      setApiResults(mapped);
    } catch (e) {
      setApiError("Couldn't reach the fragrance database. The API proxy may not be set up yet.");
      setApiResults([]);
    }
    setApiLoading(false);
  };

  const handleSearch = () => {
    if (searchMode === "api") searchApi(query);
  };

  const alreadyInCollection = (name, house) => {
    return bottles.some(b =>
      b.name.toLowerCase() === name.toLowerCase() ||
      (b.house && b.house.toLowerCase() === house.toLowerCase() && b.name.toLowerCase().includes(name.split(" ")[0].toLowerCase()))
    );
  };

  const addToCollection = (frag, status) => {
    const newBottle = {
      name: frag.name,
      fullName: `${frag.name} — ${frag.house}`,
      house: frag.house,
      cost: frag.cost,
      ml: frag.ml,
      freq: 0,
      status,
    };
    setBottles(prev => [...prev, newBottle]);
    setAddedNames(prev => new Set([...prev, frag.name]));
  };

  const visibleRecs = showAllRecs ? rankedWishlist : rankedWishlist.slice(0, 5);

  return (
    <div>
      <SectionTitle title="Discover Fragrances" sub="Your wishlist ranked by fit · browse 200+ fragrances" />

      {/* ─── Next Up For You — Sonnet Curated ─── */}
      {SONNET_RECOMMENDATIONS.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontFamily: ff.display, fontSize: 18, fontWeight: 400, color: PAL.cream, margin: 0 }}>Next Up For You</h3>
            <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Curated by Sonnet · {SONNET_RECOMMENDATIONS.length} picks
            </span>
          </div>

          {[
            { key: "essential", label: "Essential", color: "#c5a46d", desc: "These belong in your collection" },
            { key: "strong", label: "Strong Fit", color: "#7a927a", desc: "Highly aligned with your taste" },
            { key: "good", label: "Good Fit", color: "#b5546a", desc: "Worth exploring" },
            { key: "wildcard", label: "Wildcard / Stretch", color: "#7a5073", desc: "Expand your horizons" },
          ].map(cat => {
            const items = SONNET_RECOMMENDATIONS.filter(r => r.fit === cat.key);
            const visible = showAllRecs ? items : items.slice(0, cat.key === "essential" ? 16 : 5);
            if (items.length === 0) return null;
            return (
              <div key={cat.key} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
                  <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.cream }}>{cat.label}</span>
                  <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted }}>— {cat.desc} ({items.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {visible.map((rec, i) => {
                    const dbEntry = FRAGRANCE_DB.find(f => f.name === rec.name && f.house === rec.house);
                    const exists = alreadyInCollection(rec.name, rec.house);
                    const justAdded = addedNames.has(rec.name);
                    return (
                      <div key={rec.name + rec.house} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 10,
                        flexWrap: "wrap",
                      }}>
                        <span style={{ fontFamily: ff.body, fontSize: 11, color: cat.color, minWidth: 20 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: ff.display, fontSize: 14, color: PAL.cream }}>{rec.name}</span>
                            <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted }}>— {rec.house}</span>
                          </div>
                          {dbEntry && (
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
                              {dbEntry.notes.slice(0, 4).map((n, j) => (
                                <span key={j} style={{ fontFamily: ff.body, fontSize: 7, letterSpacing: 1, textTransform: "uppercase", color: PAL.gold, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}20`, borderRadius: 3, padding: "1px 5px" }}>{n}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {dbEntry && dbEntry.cost > 0 && (
                          <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.cream, minWidth: 45, textAlign: "right" }}>${dbEntry.cost}</span>
                        )}
                        {exists || justAdded ? (
                          <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.sage, letterSpacing: 1, minWidth: 70, textAlign: "center" }}>✓ {justAdded ? "Added" : "In collection"}</span>
                        ) : (
                          <div style={{ display: "flex", gap: 3 }}>
                            {[
                              { s: "want", l: "Want", c: STATUS_COLORS["want"] },
                              { s: "want to try", l: "Try", c: STATUS_COLORS["want to try"] },
                            ].map(opt => (
                              <button key={opt.s} onClick={() => {
                                if (dbEntry) addToCollection(dbEntry, opt.s);
                              }} style={{
                                padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                                background: `${opt.c}10`, border: `1px solid ${opt.c}35`,
                                fontFamily: ff.body, fontSize: 9, color: opt.c,
                                letterSpacing: 1, textTransform: "uppercase",
                              }}>{opt.l}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!showAllRecs && SONNET_RECOMMENDATIONS.length > 26 && (
            <button onClick={() => setShowAllRecs(true)} style={{
              marginTop: 8, width: "100%", padding: "8px",
              background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8,
              color: PAL.muted, fontFamily: ff.body, fontSize: 11, cursor: "pointer",
              letterSpacing: 1, textTransform: "uppercase",
            }}>Show all {SONNET_RECOMMENDATIONS.length} recommendations</button>
          )}
          {showAllRecs && (
            <button onClick={() => setShowAllRecs(false)} style={{
              marginTop: 8, width: "100%", padding: "8px",
              background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8,
              color: PAL.muted, fontFamily: ff.body, fontSize: 11, cursor: "pointer",
              letterSpacing: 1, textTransform: "uppercase",
            }}>Show less</button>
          )}

          <div style={{ height: 1, background: PAL.border, margin: "24px 0 4px" }} />
        </div>
      )}

      {/* ─── Browse Database ───────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontFamily: ff.display, fontSize: 18, fontWeight: 400, color: PAL.cream, margin: "0 0 4px" }}>Browse Fragrances</h3>
        <p style={{ fontFamily: ff.body, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, margin: 0 }}>
          {searchMode === "local" ? "295+ curated from top houses" : "74,000+ via Fragella API"}
        </p>
      </div>

      {/* Search mode toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {[{ k: "local", l: "Curated (offline)", ic: "📚" }, { k: "api", l: "Fragella API (live)", ic: "🌐" }].map(v => (
          <button key={v.k} onClick={() => { setSearchMode(v.k); setApiResults([]); setApiError(null); }} style={{
            background: searchMode === v.k ? `${PAL.gold}14` : "transparent",
            border: `1px solid ${searchMode === v.k ? PAL.gold + "44" : PAL.border}`,
            borderRadius: 8, padding: "6px 14px",
            fontFamily: ff.body, fontSize: 10, color: searchMode === v.k ? PAL.gold : PAL.muted,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5, letterSpacing: 0.5,
          }}><span style={{ fontSize: 12 }}>{v.ic}</span>{v.l}</button>
        ))}
      </div>

      {/* Search input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (searchMode === "local") setApiResults([]); }}
          onKeyDown={e => { if (e.key === "Enter" && searchMode === "api") handleSearch(); }}
          placeholder={searchMode === "api" ? "Search 74,000+ fragrances…" : "Search by name, house, or note…"}
          style={{
            flex: 1, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`,
            borderRadius: 10, padding: "12px 16px", color: PAL.cream,
            fontFamily: ff.body, fontSize: 13, outline: "none", boxSizing: "border-box",
          }}
        />
        {searchMode === "api" && (
          <button onClick={handleSearch} disabled={apiLoading || query.length < 3} style={{
            background: `${PAL.gold}20`, border: `1px solid ${PAL.gold}40`,
            borderRadius: 10, padding: "0 20px", color: PAL.gold,
            fontFamily: ff.body, fontSize: 12, fontWeight: 500,
            cursor: apiLoading ? "wait" : "pointer",
            opacity: apiLoading || query.length < 3 ? .4 : 1,
          }}>{apiLoading ? "Searching…" : "Search"}</button>
        )}
      </div>

      {/* API error */}
      {apiError && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: `${PAL.rose}10`, border: `1px solid ${PAL.rose}30`, borderRadius: 8 }}>
          <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.rose, margin: 0 }}>{apiError}</p>
          <p style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, margin: "4px 0 0" }}>
            Make sure you've added your Fragella API key as a Vercel environment variable (FRAGELLA_API_KEY).
          </p>
        </div>
      )}

      {/* Filter row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        {/* House filter */}
        <select
          value={filterHouse || ""}
          onChange={e => setFilterHouse(e.target.value || null)}
          style={{
            background: filterHouse ? `${PAL.gold}14` : `${PAL.cream}06`,
            border: `1px solid ${filterHouse ? PAL.gold + "44" : PAL.border}`,
            borderRadius: 8, padding: "7px 28px 7px 12px", color: filterHouse ? PAL.gold : PAL.muted,
            fontFamily: ff.body, fontSize: 11, outline: "none", appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
          }}
        >
          <option value="">All Houses</option>
          {allHouses.map(h => <option key={h} value={h} style={{ background: PAL.bg, color: PAL.cream }}>{h}</option>)}
        </select>

        {/* Note filter */}
        <select
          value={filterNote || ""}
          onChange={e => setFilterNote(e.target.value || null)}
          style={{
            background: filterNote ? `${PAL.rose}14` : `${PAL.cream}06`,
            border: `1px solid ${filterNote ? PAL.rose + "44" : PAL.border}`,
            borderRadius: 8, padding: "7px 28px 7px 12px", color: filterNote ? PAL.rose : PAL.muted,
            fontFamily: ff.body, fontSize: 11, outline: "none", appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
          }}
        >
          <option value="">All Notes</option>
          {allNotes.map(n => <option key={n} value={n} style={{ background: PAL.bg, color: PAL.cream }}>{n}</option>)}
        </select>

        {(filterHouse || filterNote || query) && (
          <button onClick={() => { setFilterHouse(null); setFilterNote(null); setQuery(""); }}
            style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "6px 12px", color: PAL.muted, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>
            Clear filters
          </button>
        )}

        <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginLeft: "auto" }}>
          {results.length} fragrance{results.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Results */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent`, paddingRight: 4 }}>
        <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {results.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: .4 }}>✦</div>
            <p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>No matches found</p>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 4 }}>Try a different search or clear filters</p>
          </div>
        )}
        {results.map((frag, i) => {
          const exists = alreadyInCollection(frag.name, frag.house);
          const justAdded = addedNames.has(frag.name);
          return (
            <div key={`${frag.house}-${frag.name}`} style={{
              background: `${PAL.cream}04`, border: `1px solid ${PAL.border}`, borderRadius: 14,
              padding: "16px 18px", animation: `cardIn .35s ease ${Math.min(i, 8) * .04}s both`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream }}>{frag.name}</div>
                  <div style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 2 }}>{frag.house}</div>
                  {frag.description && <p style={{ fontFamily: ff.body, fontSize: 12, color: `${PAL.cream}88`, marginTop: 6, lineHeight: 1.5 }}>{frag.description}</p>}

                  {/* Notes pills */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {frag.notes.map((n, j) => (
                      <span key={j} onClick={() => setFilterNote(n)} style={{
                        fontFamily: ff.body, fontSize: 9, letterSpacing: 1, textTransform: "uppercase",
                        color: PAL.gold, background: `${PAL.gold}12`, border: `1px solid ${PAL.gold}25`,
                        borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                      }}>{n}</span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                    <div>
                      <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Price</span>
                      <div style={{ fontFamily: ff.display, fontSize: 20, color: PAL.cream }}>${frag.cost}</div>
                    </div>
                    <div>
                      <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Size</span>
                      <div style={{ fontFamily: ff.display, fontSize: 20, color: PAL.cream }}>{frag.ml}mL</div>
                    </div>
                    <div>
                      <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>$/mL</span>
                      <div style={{ fontFamily: ff.display, fontSize: 20, color: PAL.gold }}>${(frag.cost / frag.ml).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Add buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
                  {exists || justAdded ? (
                    <div style={{
                      padding: "10px 16px", borderRadius: 8, textAlign: "center",
                      background: `${PAL.sage}15`, border: `1px solid ${PAL.sage}40`,
                      fontFamily: ff.body, fontSize: 11, color: PAL.sage, letterSpacing: 1,
                    }}>
                      ✓ {justAdded ? "Added" : "In collection"}
                    </div>
                  ) : (
                    <>
                      {[
                        { status: "owned", label: "Add as Owned", color: STATUS_COLORS["owned"] },
                        { status: "want", label: "Add to Wishlist", color: STATUS_COLORS["want"] },
                        { status: "want to try", label: "Want to Try", color: STATUS_COLORS["want to try"] },
                      ].map(opt => (
                        <button key={opt.status} onClick={() => addToCollection(frag, opt.status)} style={{
                          padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                          background: `${opt.color}12`, border: `1px solid ${opt.color}40`,
                          fontFamily: ff.body, fontSize: 11, color: opt.color,
                          letterSpacing: 1, textTransform: "uppercase", transition: "all .2s",
                          textAlign: "center",
                        }}>{opt.label}</button>
                      ))}
                    </>
                  )}
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
   WEAR CALENDAR COMPONENT
   ═══════════════════════════════════════════════════════════ */

const WearCalendar = ({ wearLog, setWearLog, bottles, wearRatings, setWearRatings }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
        }} onClick={() => setPickerOpen(false)}>
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

  /* ─── Persistent state — loads from localStorage first, then Firebase ─── */

  const loadStored = (key, fallback) => {
    try {
      const raw = localStorage.getItem(`scent_${key}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return fallback;
  };

  const [notes, setNotes] = useState(() => loadStored("notes", FALLBACK_NOTES));
  const [notesSource, setNotesSource] = useState(() => loadStored("notesSource", "fallback"));
  const [analyzing, setAnalyzing] = useState(() => loadStored("notesSource", "fallback") === "sonnet" ? false : true);
  const [bottles, setBottles] = useState(() => loadStored("bottles", INITIAL_BOTTLES));
  const [wearLog, setWearLog] = useState(() => loadStored("wearLog", {}));
  const [bottleRatings, setBottleRatings] = useState(() => loadStored("bottleRatings", {}));
  const [wearRatings, setWearRatings] = useState(() => loadStored("wearRatings", {}));
  const [testedScents, setTestedScents] = useState(() => loadStored("testedScents", []));

  const [uid, setUid] = useState(null);
  const [syncStatus, setSyncStatus] = useState("offline"); /* offline | syncing | synced | error */
  const saveTimer = useRef(null);

  /* ─── Firebase auth + initial load ─── */

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));

    /* Firebase auth — wrapped in try/catch so failures never crash the app */
    let unsub = () => {};
    try {
      unsub = onAuth(async (user) => {
        if (user) {
          setUid(user.uid);
          setSyncStatus("syncing");
          try {
            const cloud = await loadUserData(user.uid);
            if (cloud && cloud.updatedAt) {
              const localTs = parseInt(localStorage.getItem("scent_updatedAt") || "0");
              if (cloud.updatedAt > localTs) {
                if (cloud.notes) setNotes(cloud.notes);
                if (cloud.notesSource) setNotesSource(cloud.notesSource);
                if (cloud.bottles) setBottles(cloud.bottles);
                if (cloud.wearLog) setWearLog(cloud.wearLog);
                if (cloud.bottleRatings) setBottleRatings(cloud.bottleRatings);
                if (cloud.wearRatings) setWearRatings(cloud.wearRatings);
                if (cloud.testedScents) setTestedScents(cloud.testedScents);
                if (cloud.notesSource === "sonnet") setAnalyzing(false);
              }
            }
            setSyncStatus("synced");
          } catch (e) {
            console.warn("Firebase load failed:", e);
            setSyncStatus("error");
          }
        } else {
          try { await signIn(); } catch { setSyncStatus("error"); }
        }
      });
    } catch (e) {
      console.warn("Firebase auth failed:", e);
      setSyncStatus("error");
    }

    /* Sonnet analysis if needed — also wrapped */
    if (loadStored("notesSource", "fallback") !== "sonnet") {
      (async () => {
        try {
          const result = await analyzeWithSonnet();
          if (result) { setNotes(result); setNotesSource("sonnet"); }
        } catch (e) { console.warn("Sonnet analysis skipped:", e); }
        setAnalyzing(false);
      })();
    }

    return () => unsub();
  }, []);

  /* ─── Auto-save: localStorage immediately, Firebase debounced ─── */

  const saveToCloud = useCallback(() => {
    if (!uid) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const ts = Date.now();
        await saveUserData(uid, { notes, notesSource, bottles, wearLog, bottleRatings, wearRatings, testedScents, updatedAt: ts });
        try { localStorage.setItem("scent_updatedAt", String(ts)); } catch {}
        setSyncStatus("synced");
      } catch (e) {
        console.warn("Cloud save failed:", e);
        setSyncStatus("error");
      }
    }, 1500); /* debounce 1.5s so rapid edits batch together */
  }, [uid, notes, notesSource, bottles, wearLog, bottleRatings, wearRatings, testedScents]);

  /* Save to localStorage immediately + trigger cloud save */
  useEffect(() => {
    try { localStorage.setItem("scent_notes", JSON.stringify(notes)); } catch {}
    saveToCloud();
  }, [notes]);
  useEffect(() => {
    try { localStorage.setItem("scent_notesSource", JSON.stringify(notesSource)); } catch {}
    saveToCloud();
  }, [notesSource]);
  useEffect(() => {
    try { localStorage.setItem("scent_bottles", JSON.stringify(bottles)); } catch {}
    saveToCloud();
  }, [bottles]);
  useEffect(() => {
    try { localStorage.setItem("scent_wearLog", JSON.stringify(wearLog)); } catch {}
    saveToCloud();
  }, [wearLog]);
  useEffect(() => {
    try { localStorage.setItem("scent_bottleRatings", JSON.stringify(bottleRatings)); } catch {}
    saveToCloud();
  }, [bottleRatings]);
  useEffect(() => {
    try { localStorage.setItem("scent_wearRatings", JSON.stringify(wearRatings)); } catch {}
    saveToCloud();
  }, [wearRatings]);
  useEffect(() => {
    try { localStorage.setItem("scent_testedScents", JSON.stringify(testedScents)); } catch {}
    saveToCloud();
  }, [testedScents]);

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
  const topNote = useMemo(() => [...notes].sort((a, b) => b.pct - a.pct)[0]?.name || "—", [notes]);
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

  const axisTick = { fill: PAL.muted, fontFamily: ff.body, fontSize: 11 };

  const reanalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeWithSonnet();
    if (result) { setNotes(result); setNotesSource("sonnet"); }
    setAnalyzing(false);
  };

  const resetAll = async () => {
    setBottles(INITIAL_BOTTLES);
    setWearLog({});
    setBottleRatings({});
    setWearRatings({});
    setTestedScents([]);
    setNotes(FALLBACK_NOTES);
    setNotesSource("fallback");
    setSelectedNote(null);
    setNoteFragrances(null);
    try {
      localStorage.removeItem("scent_bottles");
      localStorage.removeItem("scent_wearLog");
      localStorage.removeItem("scent_bottleRatings");
      localStorage.removeItem("scent_wearRatings");
      localStorage.removeItem("scent_testedScents");
      localStorage.removeItem("scent_notes");
      localStorage.removeItem("scent_notesSource");
      localStorage.removeItem("scent_updatedAt");
    } catch {}
    if (uid) {
      await saveUserData(uid, {
        notes: FALLBACK_NOTES, notesSource: "fallback",
        bottles: INITIAL_BOTTLES, wearLog: {}, bottleRatings: {}, wearRatings: {}, testedScents: [],
        updatedAt: Date.now(),
      });
    }
  };

  const handleNoteClick = async (index) => {
    if (selectedNote === index) { setSelectedNote(null); setNoteFragrances(null); return; }
    setSelectedNote(index);
    const noteName = notes[index]?.name;
    if (!noteName) return;
    const staticResult = getFragrancesForNote(noteName);
    if (staticResult) { setNoteFragrances(staticResult); return; }
    setLookingUp(true);
    setNoteFragrances(null);
    const allFragrances = bottles.map(b => b.fullName || b.name);
    const result = await lookupNoteFragrances(noteName, allFragrances);
    setNoteFragrances(result || [`No matches found for "${noteName}"`]);
    setLookingUp(false);
  };

  return (
    <div style={{ fontFamily: ff.body, background: PAL.bg, minHeight: "100vh", color: PAL.cream, position: "relative", overflow: "hidden" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: syncStatus === "synced" ? PAL.sage : syncStatus === "syncing" ? PAL.gold : syncStatus === "error" ? PAL.rose : PAL.muted,
                  boxShadow: syncStatus === "synced" ? `0 0 6px ${PAL.sage}88` : "none",
                  transition: "all .3s",
                }} />
                <span style={{ fontFamily: ff.body, fontSize: 8, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  {syncStatus === "synced" ? "Synced" : syncStatus === "syncing" ? "Saving…" : syncStatus === "error" ? "Offline" : "…"}
                </span>
              </div>
              <button onClick={() => setEditing(true)} style={{ background: `${PAL.gold}12`, border: `1px solid ${PAL.gold}33`, borderRadius: 8, padding: "9px 18px", color: PAL.gold, fontFamily: ff.body, fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", cursor: "pointer" }}>✎ Edit Collection</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(12px)", transition: "all .7s cubic-bezier(.16,1,.3,1) .1s" }}>
            <Pill label="Collection" value={`${bottles.filter(b => b.status === "owned").length} owned`} accent={PAL.gold} />
            <div style={{ background: PAL.card, border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "14px 18px", flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: ff.body, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: PAL.muted }}>Invested</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: ff.display, fontSize: 26, fontWeight: 400, color: PAL.gold, lineHeight: 1.1 }}>${totalSpent.toLocaleString()}</span>
                <span style={{ fontFamily: ff.body, fontSize: 14, color: PAL.muted }}>/</span>
                <span style={{ fontFamily: ff.display, fontSize: 18, fontWeight: 400, color: PAL.muted, lineHeight: 1.1 }}>${totalAll.toLocaleString()}</span>
              </div>
              <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 1, marginTop: 1 }}>owned / full collection</span>
            </div>
            <Pill label="Days Worn" value={totalWears} accent={PAL.sage} />
            <Pill label="Signature" value={topNote} accent={PAL.rose} />
          </div>
        </header>

        {/* Tabs */}
        <nav style={{ display: "flex", gap: 8, paddingTop: 28, opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(12px)", transition: "all .7s cubic-bezier(.16,1,.3,1) .2s" }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              background: tab === i ? `${PAL.gold}14` : "transparent",
              border: `1px solid ${tab === i ? PAL.gold + "44" : PAL.border}`,
              borderRadius: 28, padding: "9px 20px",
              fontFamily: ff.body, fontSize: 11, fontWeight: tab === i ? 500 : 400,
              letterSpacing: 1.8, textTransform: "uppercase",
              color: tab === i ? PAL.gold : PAL.muted,
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
              <SectionTitle title="Fragrance Notes" sub={analyzing ? "Sonnet is analyzing your collection…" : notesSource === "sonnet" ? "Analyzed by Sonnet from your collection" : "Based on your Sonnet conversation"} />
              {analyzing ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10 }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ width: 24, height: 24, border: `2px solid ${PAL.border}`, borderTopColor: PAL.gold, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                  <span style={{ fontFamily: ff.display, fontStyle: "italic", fontSize: 15, color: PAL.gold }}>Analyzing your collection…</span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 36, marginTop: 8 }}>
                    <div style={{ position: "relative", width: 280, height: 280 }}>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                        <div style={{ fontFamily: ff.display, fontStyle: "italic", fontSize: (hovered !== null || selectedNote !== null) ? 34 : 22, fontWeight: 400, color: (hovered !== null || selectedNote !== null) ? NOTE_COLORS[(hovered ?? selectedNote) % NOTE_COLORS.length] : PAL.gold, transition: "all .35s" }}>
                          {(hovered !== null || selectedNote !== null) ? `${notes[hovered ?? selectedNote]?.pct}%` : "Notes"}
                        </div>
                        <div style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>
                          {(hovered !== null || selectedNote !== null) ? notes[hovered ?? selectedNote]?.name : "profile"}
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={notes} dataKey="pct" cx="50%" cy="50%" innerRadius={78} outerRadius={125} paddingAngle={2.5} stroke="none"
                            onMouseEnter={(_, i) => setHovered(i)} onMouseLeave={() => setHovered(null)}
                            onClick={(_, i) => handleNoteClick(i)}
                            animationDuration={1100}>
                            {notes.map((_, i) => {
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
                      {notes.map((n, i) => {
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

                  {/* ─── Note → Fragrance Detail Box ────────── */}
                  {selectedNote !== null && (
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
                          <span style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream }}>{notes[selectedNote]?.name}</span>
                          <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginLeft: 4 }}>in your collection</span>
                        </div>
                        <button onClick={() => { setSelectedNote(null); setNoteFragrances(null); }}
                          style={{ background: "none", border: "none", color: PAL.muted, fontSize: 16, cursor: "pointer" }}>✕</button>
                      </div>
                      {lookingUp ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                          <div style={{ width: 16, height: 16, border: `2px solid ${PAL.border}`, borderTopColor: NOTE_COLORS[selectedNote % NOTE_COLORS.length], borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                          <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, fontStyle: "italic" }}>Sonnet is looking this up…</span>
                        </div>
                      ) : noteFragrances ? (
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

                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                    <button onClick={reanalyze} disabled={analyzing} style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "8px 20px", color: PAL.muted, fontFamily: ff.body, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>↻ Re-analyze</button>
                    <RefineChat onUpdate={(u) => { setNotes(u); setNotesSource("sonnet"); }} />
                  </div>
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
        <EditPanel bottles={bottles} setBottles={setBottles} onClose={() => setEditing(false)} onReset={resetAll} />
      )}
    </div>
  );
}
