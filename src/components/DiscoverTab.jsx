import { useState, useMemo } from "react";
import { PAL, ff, STATUS_COLORS } from "../constants.js";
import { NOTE_TO_FRAGRANCES } from "../noteMap.js";
import { FRAGRANCE_DB } from "../fragranceDB.js";
import { getNoteFamily, FAMILY_COLORS } from "../noteCategories.js";
import { SectionTitle } from "./ui.jsx";

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
              [{s:"owned",l:"Add as Owned",c:STATUS_COLORS["owned"]},{s:"wishlist",l:"Wishlist",c:STATUS_COLORS["wishlist"]},{s:"to test",l:"To Test",c:STATUS_COLORS["to test"]}].map(opt => (
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

export default DiscoverTab;
