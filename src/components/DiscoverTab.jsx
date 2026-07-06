import { useState, useMemo } from "react";
import { PAL, ff, STATUS_COLORS, TESTER_COLOR } from "../constants.js";
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
  const [apiSearchType, setApiSearchType] = useState("name");
  const [apiResults, setApiResults] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [activeSection, setActiveSection] = useState("recs");
  const [similarSource, setSimilarSource] = useState(null);
  const [noteInputs, setNoteInputs] = useState("");

  const userNoteProfile = useMemo(() => {
    const counts = {};
    bottles.filter(b => b.status === "owned" || b.status === "had" || b.status === "tester" || b.hasTester).forEach(b => {
      (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean).forEach(n => {
        const w = b.status === "owned" ? 4 : b.status === "tester" || b.hasTester ? 3 : 2;
        counts[n] = (counts[n] || 0) + w;
      });
    });
    bottles.filter(b => b.status === "owned" && (!b.userNotes || !b.userNotes.trim())).forEach(b => {
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

  /* ─── API search functions ─── */
  const parseApiResults = (data) => {
    /* Fragella can return: flat array, { data: [...] }, or single object */
    let list = [];
    if (Array.isArray(data)) list = data;
    else if (data?.data && Array.isArray(data.data)) list = data.data;
    else if (data?.results && Array.isArray(data.results)) list = data.results;
    else if (data?.Name || data?.name) list = [data];
    return list.map(f => ({
      name: f.Name || f.name || "",
      house: f.Brand || f.brand || "",
      cost: parseFloat(f.Price || f.price) || 0,
      ml: 0,
      notes: [
        ...(f["Top Notes"] || f.top_notes || []),
        ...(f["Middle Notes"] || f.middle_notes || []),
        ...(f["Base Notes"] || f.base_notes || []),
        ...(f["General Notes"] || f.notes || []),
      ].map(n => typeof n === "string" ? n.toLowerCase() : (n?.name || "").toLowerCase()).filter(Boolean),
      description: [
        f.Description || "",
        f.Longevity ? `${f.Longevity} longevity` : "",
        f.Sillage ? `${f.Sillage} sillage` : "",
        f.similarity_score ? `${Math.round(f.similarity_score)}% similar` : "",
      ].filter(Boolean).join(" · "),
      _api: true,
    })).filter(f => f.name);
  };

  const apiCall = async (endpoint, params) => {
    setApiLoading(true); setApiError(null);
    try {
      const qp = new URLSearchParams({ endpoint, ...params });
      const res = await fetch(`/api/fragella?${qp}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 500 && data?.error === "API key not configured") {
          setApiError("Fragella API key not configured. Add FRAGELLA_API_KEY in Vercel → Settings → Environment Variables, then redeploy.");
        } else {
          setApiError(`API error (${res.status}): ${data?.error || data?.message || "Unknown error"}. Check your Fragella API key and subscription.`);
        }
        setApiResults([]);
      } else {
        setApiResults(parseApiResults(data));
      }
    } catch (err) {
      setApiError(`Could not reach the API proxy: ${err.message}. Make sure /api/fragella is deployed — try redeploying your Vercel project.`);
      setApiResults([]);
    }
    setApiLoading(false);
  };

  const searchByName = (q) => { if (q.length >= 2) apiCall("search", { search: q, limit: "20" }); };
  const searchByNotes = (notes) => {
    if (!notes.trim()) return;
    /* Use the match endpoint with notes split into top/middle/base */
    const noteList = notes.split(",").map(n => n.trim()).filter(Boolean).join(",");
    apiCall("match", { top: noteList, limit: "20" });
  };
  const searchByHouse = (house) => { if (house.trim()) apiCall("brand", { brandName: house.trim(), limit: "20" }); };
  const searchSimilar = (name) => { if (name.trim()) apiCall("similar", { name: name.trim(), limit: "15" }); };

  const alreadyInCollection = (name) => bottles.some(b => b.name.toLowerCase() === name.toLowerCase());

  const addToCollection = (frag, status) => {
    setBottles(prev => [...prev, {
      name: frag.name, fullName: `${frag.name} — ${frag.house}`, house: frag.house,
      cost: frag.cost || 0, ml: frag.ml || 0, freq: 0, status,
      userNotes: (frag.notes || []).join(", "),
      hasTester: status === "tester",
    }]);
    setAddedNames(prev => new Set([...prev, frag.name]));
  };

  const getNoteColor = (n) => FAMILY_COLORS[getNoteFamily(n)] || PAL.gold;

  const renderFragCard = (frag, i, showScore) => {
    const exists = alreadyInCollection(frag.name);
    const justAdded = addedNames.has(frag.name);
    return (
      <div key={`${frag.name}-${i}`} style={{ display: "flex", gap: 14, background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "14px 16px", animation: "cardIn .3s both", animationDelay: `${i * .04}s` }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic", color: PAL.cream }}>{frag.name}</span>
            <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted }}>— {frag.house}</span>
            {showScore && frag.pct > 0 && <span style={{ fontFamily: ff.display, fontSize: 14, color: PAL.gold, background: `${PAL.gold}12`, borderRadius: 10, padding: "2px 10px" }}>{frag.pct}%</span>}
            {frag._api && <span style={{ fontSize: 8, color: PAL.muted, border: `1px solid ${PAL.border}`, borderRadius: 3, padding: "1px 5px" }}>API</span>}
          </div>
          {frag.description && <p style={{ fontFamily: ff.body, fontSize: 12, color: `${PAL.cream}77`, marginTop: 6, lineHeight: 1.5 }}>{frag.description}</p>}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
            {(frag.notes || []).slice(0, 6).map((n, j) => (
              <span key={j} onClick={() => { setFilterNote(n); setActiveSection("browse"); setSearchMode("local"); }}
                style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: (showScore && frag.matched?.includes(n)) ? PAL.sage : getNoteColor(n), background: `${(showScore && frag.matched?.includes(n)) ? PAL.sage : getNoteColor(n)}12`, border: `1px solid ${(showScore && frag.matched?.includes(n)) ? PAL.sage : getNoteColor(n)}25`, borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>{n}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
            {frag.cost > 0 && <span style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream }}>${frag.cost}</span>}
            {frag.ml > 0 && frag.cost > 0 && <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted }}>{frag.ml}mL</span>}
            {/* Find Similar button */}
            <button onClick={() => { setSimilarSource(frag); setActiveSection("similar"); if (searchMode === "api") searchSimilar(frag.name); }}
              style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "3px 10px", color: PAL.muted, fontFamily: ff.body, fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>Find Similar</button>
            {/* Browse House button */}
            {frag.house && (
              <button onClick={() => { setQuery(""); setActiveSection("browse"); if (searchMode === "api") { setApiSearchType("house"); searchByHouse(frag.house); } else { setFilterHouse(frag.house); setFilterNote(null); } }}
                style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "3px 10px", color: PAL.muted, fontFamily: ff.body, fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>More by {frag.house}</button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 110 }}>
          {exists || justAdded ? (
            <div style={{ padding: "10px 14px", borderRadius: 8, textAlign: "center", background: `${PAL.sage}15`, border: `1px solid ${PAL.sage}40`, fontFamily: ff.body, fontSize: 11, color: PAL.sage }}>✓ {justAdded ? "Added" : "In collection"}</div>
          ) : (
            [{s:"owned",l:"Owned",c:STATUS_COLORS["owned"]},{s:"tester",l:"Tester",c:TESTER_COLOR},{s:"wishlist",l:"Wishlist",c:STATUS_COLORS["wishlist"]},{s:"to test",l:"To Test",c:STATUS_COLORS["to test"]}].map(opt => (
              <button key={opt.s} onClick={() => addToCollection(frag, opt.s)} style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: `${opt.c}12`, border: `1px solid ${opt.c}40`, fontFamily: ff.body, fontSize: 10, color: opt.c, letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>{opt.l}</button>
            ))
          )}
        </div>
      </div>
    );
  };

  const visibleRecs = showAllRecs ? smartRecs : smartRecs.slice(0, 8);

  return (
    <div>
      <SectionTitle title="Discover Fragrances" sub="Personalized recommendations · browse 295+ · live API search" />
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Section toggle */}
      <div style={{ display: "flex", gap: 5, marginBottom: 18, flexWrap: "wrap" }}>
        {[{k:"recs",l:"For You",ic:"✦"},{k:"browse",l:"Browse",ic:"📚"},{k:"similar",l:"Similar",ic:"🔗"},{k:"notes",l:"By Notes",ic:"🎵"}].map(s => (
          <button key={s.k} onClick={() => setActiveSection(s.k)} style={{ background: activeSection === s.k ? `${PAL.gold}14` : "transparent", border: `1px solid ${activeSection === s.k ? PAL.gold + "44" : PAL.border}`, borderRadius: 20, padding: "6px 14px", fontFamily: ff.body, fontSize: 10, color: activeSection === s.k ? PAL.gold : PAL.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12 }}>{s.ic}</span>{s.l}</button>
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
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {[{k:"local",l:"Curated (295)",ic:"📚"},{k:"api",l:"Fragella API (74K+)",ic:"🌐"}].map(v => (
              <button key={v.k} onClick={() => { setSearchMode(v.k); setApiResults([]); setApiError(null); }} style={{ background: searchMode === v.k ? `${PAL.gold}14` : "transparent", border: `1px solid ${searchMode === v.k ? PAL.gold + "44" : PAL.border}`, borderRadius: 8, padding: "5px 12px", fontFamily: ff.body, fontSize: 10, color: searchMode === v.k ? PAL.gold : PAL.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 11 }}>{v.ic}</span>{v.l}</button>
            ))}
            {searchMode === "api" && (
              <button onClick={async () => {
                setApiError(null);
                try {
                  const res = await fetch("/api/fragella?endpoint=search&search=Sauvage&limit=1");
                  const raw = await res.text();
                  setApiError(`Test result (${res.status}): ${raw.slice(0, 300)}`);
                } catch (e) { setApiError(`Test failed: ${e.message}`); }
              }} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "4px 10px", fontFamily: ff.body, fontSize: 9, color: PAL.muted, cursor: "pointer" }}>Test API</button>
            )}
          </div>
          {searchMode === "api" && (
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {[{k:"name",l:"By Name"},{k:"house",l:"By House"},{k:"noteSearch",l:"By Notes"}].map(t => (
                <button key={t.k} onClick={() => { setApiSearchType(t.k); setApiResults([]); }} style={{ background: apiSearchType === t.k ? `${PAL.cream}08` : "transparent", border: `1px solid ${apiSearchType === t.k ? PAL.cream + "22" : PAL.border}`, borderRadius: 6, padding: "4px 10px", fontFamily: ff.body, fontSize: 9, color: apiSearchType === t.k ? PAL.cream : PAL.muted, cursor: "pointer" }}>{t.l}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={query} onChange={e => { setQuery(e.target.value); if (searchMode === "local") setApiResults([]); }}
              onKeyDown={e => {
                if (e.key === "Enter" && searchMode === "api") {
                  if (apiSearchType === "name") searchByName(query);
                  else if (apiSearchType === "house") searchByHouse(query);
                  else if (apiSearchType === "noteSearch") searchByNotes(query);
                }
              }}
              placeholder={searchMode === "api" ? (apiSearchType === "house" ? "Enter house name…" : apiSearchType === "noteSearch" ? "Enter notes: vetiver, myrrh, amber…" : "Search fragrances…") : "Search by name, house, or note…"}
              style={{ flex: 1, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 10, padding: "12px 16px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            {searchMode === "api" && (
              <button onClick={() => { if (apiSearchType === "name") searchByName(query); else if (apiSearchType === "house") searchByHouse(query); else searchByNotes(query); }}
                disabled={apiLoading || query.length < 2}
                style={{ background: `${PAL.gold}20`, border: `1px solid ${PAL.gold}40`, borderRadius: 10, padding: "0 20px", color: PAL.gold, fontFamily: ff.body, fontSize: 12, cursor: apiLoading ? "wait" : "pointer", opacity: apiLoading || query.length < 2 ? .4 : 1 }}>{apiLoading ? "…" : "Search"}</button>
            )}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 600, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent`, paddingRight: 4 }}>
            {results.length === 0 && !apiLoading && <div style={{ textAlign: "center", padding: "40px 20px" }}><p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>No matches</p><p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 4 }}>{searchMode === "api" ? "Try a different search term" : "Try a different search or clear filters"}</p></div>}
            {apiLoading && <div style={{ textAlign: "center", padding: "40px 20px" }}><p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.muted, fontStyle: "italic" }}>Searching…</p></div>}
            {results.map((f, i) => renderFragCard(f, i, false))}
          </div>
        </div>
      )}

      {/* ─── FIND SIMILAR ─── */}
      {activeSection === "similar" && (
        <div>
          <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginBottom: 10 }}>Find fragrances similar to one you love</p>
          {/* Quick picks from collection */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 6, display: "block" }}>From your collection</span>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {bottles.filter(b => b.name.trim() && (b.status === "owned" || b.status === "tester" || b.hasTester)).slice(0, 20).map((b, i) => (
                <button key={i} onClick={() => { setSimilarSource(b); searchSimilar(b.name); }}
                  style={{
                    background: similarSource?.name === b.name ? `${PAL.gold}14` : "transparent",
                    border: `1px solid ${similarSource?.name === b.name ? PAL.gold + "44" : PAL.border}`,
                    borderRadius: 8, padding: "5px 12px", fontFamily: ff.body, fontSize: 10, color: similarSource?.name === b.name ? PAL.gold : PAL.muted, cursor: "pointer",
                  }}>{b.name}</button>
              ))}
            </div>
          </div>
          {/* Or type a name */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { setSimilarSource({ name: query }); searchSimilar(query); } }}
              placeholder="Or type any fragrance name…"
              style={{ flex: 1, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 10, padding: "12px 16px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => { setSimilarSource({ name: query }); searchSimilar(query); }} disabled={apiLoading || query.length < 2}
              style={{ background: `${PAL.gold}20`, border: `1px solid ${PAL.gold}40`, borderRadius: 10, padding: "0 20px", color: PAL.gold, fontFamily: ff.body, fontSize: 12, cursor: apiLoading ? "wait" : "pointer", opacity: apiLoading || query.length < 2 ? .4 : 1 }}>{apiLoading ? "…" : "Find Similar"}</button>
          </div>
          {apiError && <div style={{ marginBottom: 14, padding: "10px 14px", background: `${PAL.rose}10`, border: `1px solid ${PAL.rose}30`, borderRadius: 8 }}><p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.rose, margin: 0 }}>{apiError}</p></div>}
          {similarSource && !apiLoading && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: `${PAL.gold}06`, border: `1px solid ${PAL.gold}15`, borderRadius: 10 }}>
              <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted }}>Showing fragrances similar to</span>
              <span style={{ fontFamily: ff.display, fontSize: 16, fontStyle: "italic", color: PAL.cream, marginLeft: 8 }}>{similarSource.name}</span>
              {similarSource.house && <span style={{ fontSize: 11, color: PAL.muted, marginLeft: 6 }}>— {similarSource.house}</span>}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 600, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent` }}>
            {apiLoading && <div style={{ textAlign: "center", padding: "40px 20px" }}><p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.muted, fontStyle: "italic" }}>Finding similar fragrances…</p></div>}
            {!apiLoading && apiResults.length === 0 && similarSource && <div style={{ textAlign: "center", padding: "30px 20px" }}><p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted }}>No similar fragrances found. Try the Fragella API — add your API key in Vercel settings.</p></div>}
            {apiResults.map((f, i) => renderFragCard(f, i, false))}
          </div>
        </div>
      )}

      {/* ─── BY NOTES ─── */}
      {activeSection === "notes" && (
        <div>
          <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginBottom: 10 }}>Search for fragrances containing specific notes</p>
          {/* Quick note pills from user's top notes */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 6, display: "block" }}>Your top notes</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {Object.entries(userNoteProfile).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([note]) => {
                const isSelected = noteInputs.toLowerCase().includes(note);
                return (
                  <button key={note} onClick={() => setNoteInputs(prev => prev ? `${prev}, ${note}` : note)}
                    style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "3px 9px", borderRadius: 4, cursor: "pointer", background: isSelected ? `${getNoteColor(note)}20` : "transparent", border: `1px solid ${isSelected ? getNoteColor(note) + "50" : PAL.border}`, color: isSelected ? getNoteColor(note) : PAL.muted, fontFamily: ff.body }}>{note}</button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={noteInputs} onChange={e => setNoteInputs(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  searchByNotes(noteInputs);
                  /* Also filter local */
                  const noteList = noteInputs.split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
                  if (noteList.length > 0) {
                    const local = FRAGRANCE_DB.filter(f => noteList.some(n => f.notes.some(fn => fn.toLowerCase().includes(n))));
                    if (local.length > 0 && apiResults.length === 0) setApiResults(local);
                  }
                }
              }}
              placeholder="vetiver, myrrh, amber…"
              style={{ flex: 1, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 10, padding: "12px 16px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => {
              searchByNotes(noteInputs);
              const noteList = noteInputs.split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
              if (noteList.length > 0) {
                const local = FRAGRANCE_DB.filter(f => noteList.some(n => f.notes.some(fn => fn.toLowerCase().includes(n))));
                if (local.length > 0) setApiResults(prev => prev.length > 0 ? prev : local);
              }
            }}
              disabled={apiLoading || noteInputs.trim().length < 2}
              style={{ background: `${PAL.gold}20`, border: `1px solid ${PAL.gold}40`, borderRadius: 10, padding: "0 20px", color: PAL.gold, fontFamily: ff.body, fontSize: 12, cursor: apiLoading ? "wait" : "pointer", opacity: apiLoading || noteInputs.trim().length < 2 ? .4 : 1 }}>{apiLoading ? "…" : "Search"}</button>
          </div>
          {apiError && <div style={{ marginBottom: 14, padding: "10px 14px", background: `${PAL.rose}10`, border: `1px solid ${PAL.rose}30`, borderRadius: 8 }}><p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.rose, margin: 0 }}>{apiError}</p></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 600, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent` }}>
            {apiLoading && <div style={{ textAlign: "center", padding: "40px 20px" }}><p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.muted, fontStyle: "italic" }}>Searching by notes…</p></div>}
            {!apiLoading && apiResults.length === 0 && noteInputs.trim() && <div style={{ textAlign: "center", padding: "30px 20px" }}><p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted }}>No results yet. Hit Search to find fragrances with those notes.</p></div>}
            {apiResults.map((f, i) => renderFragCard(f, i, false))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverTab;
