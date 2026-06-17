import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

import { PAL, ff, FONT_LINK, NOTE_COLORS, STATUS_COLORS, STATUSES, sum, MONTHS, DAYS_SHORT, getDaysInMonth, getFirstDayOfWeek, dateKey } from "./constants.js";
import { YOUR_COLLECTION, INITIAL_BOTTLES } from "./collection.js";
import { NOTE_TO_FRAGRANCES, getFragrancesForNote } from "./noteMap.js";
import { NOTE_FAMILIES, FAMILY_COLORS, FAMILY_LABELS, FAMILY_ORDER, getNoteFamily, computeNotesProfile, scoreFragranceFit, DEFAULT_OPPOSING, THEME_PRESETS, RATING_CATEGORIES } from "./noteCategories.js";
import { FRAGRANCE_DB } from "./fragranceDB.js";

import { SectionTitle, Pill, ChartTooltip, RatingSlider, RatingBadge } from "./components/ui.jsx";
import EditPanel from "./components/EditPanel.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import WearCalendar from "./components/WearCalendar.jsx";
import BubbleChart from "./components/BubbleChart.jsx";
import TestedTab from "./components/TestedTab.jsx";
import DiscoverTab from "./components/DiscoverTab.jsx";
import PairingWheel from "./components/PairingWheel.jsx";
import CollectionView from "./components/CollectionView.jsx";
import PurchaseList from "./components/PurchaseList.jsx";

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
  const [pairingNotes, setPairingNotes] = useState(() => loadStored("pairingNotes", {}));
  const [pairingRatings, setPairingRatings] = useState(() => loadStored("pairingRatings", {}));
  const [rejectedPairings, setRejectedPairings] = useState(() => loadStored("rejectedPairings", []));
  const [purchaseData, setPurchaseData] = useState(() => loadStored("purchaseData", {}));
  const [collectionSubTab, setCollectionSubTab] = useState("collection");
  const [visibleTabs, setVisibleTabs] = useState(() => loadStored("visibleTabs", { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true }));
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
  /* Migrate old status names + ensure hasTester field */
  const migrateStatuses = (list) => list.map(b => ({
    ...b,
    status: b.status === "want to try" ? "to test" : b.status === "want" ? "wishlist" : b.status,
    hasTester: b.hasTester || false,
  }));

  const [bottles, setBottles] = useState(() => {
    const raw = isFirstVisit ? [] : loadStored("bottles", INITIAL_BOTTLES);
    return migrateStatuses(raw);
  });
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
    setBottles(migrateStatuses(INITIAL_BOTTLES));
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
        if (data.bottles) setBottles(migrateStatuses(data.bottles));
        if (data.notes) setNotes(data.notes);
        if (data.wearLog) setWearLog(data.wearLog);
        if (data.bottleRatings) setBottleRatings(data.bottleRatings);
        if (data.wearRatings) setWearRatings(data.wearRatings);
        if (data.testedScents) setTestedScents(data.testedScents);
        if (data.noteOverrides) setNoteOverrides(data.noteOverrides);
        if (data.opposingPairs) setOpposingPairs(data.opposingPairs);
        if (data.pairingNotes) setPairingNotes(data.pairingNotes);
        if (data.pairingRatings) setPairingRatings(data.pairingRatings);
        if (data.rejectedPairings) setRejectedPairings(data.rejectedPairings);
        if (data.purchaseData) setPurchaseData(data.purchaseData);
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
  useEffect(() => { try { localStorage.setItem("scent_pairingNotes", JSON.stringify(pairingNotes)); } catch {} }, [pairingNotes]);
  useEffect(() => { try { localStorage.setItem("scent_pairingRatings", JSON.stringify(pairingRatings)); } catch {} }, [pairingRatings]);
  useEffect(() => { try { localStorage.setItem("scent_rejectedPairings", JSON.stringify(rejectedPairings)); } catch {} }, [rejectedPairings]);
  useEffect(() => { try { localStorage.setItem("scent_purchaseData", JSON.stringify(purchaseData)); } catch {} }, [purchaseData]);

  /* ─── Export / Import ─── */

  const exportData = () => {
    const data = { notes, bottles, wearLog, bottleRatings, wearRatings, testedScents, noteOverrides, opposingPairs, pairingNotes, pairingRatings, rejectedPairings, purchaseData, exportedAt: new Date().toISOString() };
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
        if (data.bottles) setBottles(migrateStatuses(data.bottles));
        if (data.notes) setNotes(data.notes);
        if (data.wearLog) setWearLog(data.wearLog);
        if (data.bottleRatings) setBottleRatings(data.bottleRatings);
        if (data.wearRatings) setWearRatings(data.wearRatings);
        if (data.testedScents) setTestedScents(data.testedScents);
        if (data.noteOverrides) setNoteOverrides(data.noteOverrides);
        if (data.opposingPairs) setOpposingPairs(data.opposingPairs);
        if (data.pairingNotes) setPairingNotes(data.pairingNotes);
        if (data.pairingRatings) setPairingRatings(data.pairingRatings);
        if (data.rejectedPairings) setRejectedPairings(data.rejectedPairings);
        if (data.purchaseData) setPurchaseData(data.purchaseData);
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
    const wishlist = bottles.filter(b => b.status === "wishlist" || b.status === "to test");
    return wishlist
      .map(b => ({ ...b, fit: scoreFragranceFit(b, ownedBottles, notes) }))
      .sort((a, b) => b.fit.score - a.fit.score);
  }, [bottles, notes]);

  const tabs = [
    { icon: "❋", label: "Notes" },
    { icon: "〰", label: "Trends" },
    { icon: "▧", label: "Collection Breakdown" },
    { icon: "✦", label: "Discover" },
    { icon: "◉", label: "Tested" },
    { icon: "☰", label: "My Collection" },
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
    setBottles(migrateStatuses(INITIAL_BOTTLES));
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
        <nav style={{ display: "flex", gap: 5, paddingTop: 28, flexWrap: "nowrap", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(12px)", transition: "all .7s cubic-bezier(.16,1,.3,1) .2s" }}>
          {filteredTabs.map((t) => (
            <button key={t.origIdx} onClick={() => setTab(t.origIdx)} style={{
              background: tab === t.origIdx ? `${PAL.gold}14` : "transparent",
              border: `1px solid ${tab === t.origIdx ? PAL.gold + "44" : PAL.border}`,
              borderRadius: 20, padding: "7px 12px",
              fontFamily: ff.body, fontSize: 9, fontWeight: tab === t.origIdx ? 500 : 400,
              letterSpacing: 1.2, textTransform: "uppercase",
              color: tab === t.origIdx ? PAL.gold : PAL.muted,
              cursor: "pointer", transition: "all .3s",
              display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 11 }}>{t.icon}</span>{t.label}
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
                <PairingWheel bottles={bottles} noteOverrides={noteOverrides} opposingPairs={opposingPairs} pairingNotes={pairingNotes} setPairingNotes={setPairingNotes} pairingRatings={pairingRatings} setPairingRatings={setPairingRatings} rejectedPairings={rejectedPairings} setRejectedPairings={setRejectedPairings} />
              )}
            </div>
          )}

          {/* ═══ DISCOVER ═══════════════════════════════ */}
          {tab === 3 && (
            <DiscoverTab bottles={bottles} setBottles={setBottles} rankedWishlist={rankedWishlist} />
          )}

          {/* ═══ TESTED ═════════════════════════════════ */}
          {tab === 4 && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <button onClick={() => setEditing(true)} style={{ background: `${PAL.gold}12`, border: `1px solid ${PAL.gold}33`, borderRadius: 8, padding: "8px 16px", color: PAL.gold, fontFamily: ff.body, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>✎ Edit Collection</button>
              </div>
              <TestedTab testedScents={testedScents} setTestedScents={setTestedScents} bottles={bottles} setBottles={setBottles} />
            </div>
          )}

          {/* ═══ MY COLLECTION ═══════════════════════════ */}
          {tab === 5 && (
            <div>
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {[{k:"collection",l:"My Collection"},{k:"purchases",l:"Purchases"}].map(v => (
                  <button key={v.k} onClick={() => setCollectionSubTab(v.k)} style={{
                    background: collectionSubTab === v.k ? `${PAL.gold}14` : "transparent",
                    border: `1px solid ${collectionSubTab === v.k ? PAL.gold + "44" : PAL.border}`,
                    borderRadius: 20, padding: "6px 18px",
                    fontFamily: ff.body, fontSize: 11, color: collectionSubTab === v.k ? PAL.gold : PAL.muted,
                    cursor: "pointer",
                  }}>{v.l}</button>
                ))}
              </div>
              {collectionSubTab === "collection" && (
                <CollectionView bottles={bottles} setBottles={setBottles} bottleRatings={bottleRatings} setBottleRatings={setBottleRatings} noteOverrides={noteOverrides} />
              )}
              {collectionSubTab === "purchases" && (
                <PurchaseList bottles={bottles} noteOverrides={noteOverrides} purchaseData={purchaseData} setPurchaseData={setPurchaseData} />
              )}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <EditPanel bottles={bottles} setBottles={setBottles} onClose={() => setEditing(false)} onReset={resetAll} noteOverrides={noteOverrides} setNoteOverrides={setNoteOverrides} testedScents={testedScents} setTestedScents={setTestedScents} />
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
