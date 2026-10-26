import { useState, useMemo } from "react";
import { PAL, ff } from "../constants.js";
import {
  FAMILY_COLORS, FAMILY_LABELS, FAMILY_ORDER, getNoteFamily,
  computeFamilyProfile, scoreGapFill, findNearestOwned, gapVerdict,
  computeNotesProfile, scoreValue, scoreCollectionMatch, scoreUniqueness, pricePerMl,
} from "../noteCategories.js";
import { SectionTitle } from "./ui.jsx";

const TONE = { good: PAL.sage, warn: PAL.gold, bad: PAL.rose, neutral: PAL.muted };

const PurchaseList = ({ bottles, noteOverrides, purchaseData, setPurchaseData }) => {
  const [sortBy, setSortBy] = useState("priority");
  const [editingId, setEditingId] = useState(null);
  const [showPurchased, setShowPurchased] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [editingRank, setEditingRank] = useState(null);
  const [rankInput, setRankInput] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const inputCss = { background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "8px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box" };

  /* What the owned collection looks like by family — the yardstick every
     candidate below is measured against. */
  const familyProfile = useMemo(() => computeFamilyProfile(bottles, noteOverrides), [bottles, noteOverrides]);

  /* Weighted note profile — what the match score measures affinity against. */
  const notesProfile = useMemo(() => computeNotesProfile(bottles, []), [bottles]);

  const items = useMemo(() => {
    const wishlist = bottles.filter(b => b.status === "wishlist" && b.name.trim());
    const base = wishlist.map((b, i) => {
      const saved = (purchaseData || {})[b.name] || {};
      const { gap, fams } = scoreGapFill(b, familyProfile.shares, noteOverrides);
      const nearest = findNearestOwned(b, bottles, 3, noteOverrides);
      return {
        ...b, id: b.name,
        priority: saved.priority ?? i + 1,
        whereToBuy: saved.whereToBuy || "", budgetNote: saved.budgetNote || "",
        purchaseNotes: saved.purchaseNotes || "", purchased: saved.purchased || false,
        notes: (b.userNotes || "").split(",").map(n => n.trim()).filter(Boolean),
        gap, fams, nearest, verdict: gapVerdict(gap, nearest, fams),
        ppm: pricePerMl(b),
        match: scoreCollectionMatch(b, bottles, notesProfile, familyProfile.shares, noteOverrides),
        unique: scoreUniqueness(b, bottles, familyProfile.shares, noteOverrides),
      };
    });
    /* Value is relative to the rest of the list, so it needs the whole set. */
    const wishOnly = base.filter(i => !i.purchased);
    return base.map(i => ({ ...i, value: scoreValue(i, wishOnly) }));
  }, [bottles, purchaseData, familyProfile, notesProfile, noteOverrides]);

  const sorted = useMemo(() => {
    const active = items.filter(i => !i.purchased), done = items.filter(i => i.purchased);
    let list = [...active];
    if (sortBy === "priority") list.sort((a, b) => a.priority - b.priority);
    else if (sortBy === "cost-low") list.sort((a, b) => (a.cost || 0) - (b.cost || 0));
    else if (sortBy === "cost-high") list.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "gap") list.sort((a, b) => b.gap - a.gap);
    else if (sortBy === "value") list.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
    else if (sortBy === "match") list.sort((a, b) => (b.match.score ?? -1) - (a.match.score ?? -1));
    else if (sortBy === "unique") list.sort((a, b) => (b.unique.score ?? -1) - (a.unique.score ?? -1));
    return { active: list, done };
  }, [items, sortBy]);

  /* One top pick per axis. They are meant to differ — a near-twin of a
     favourite wins on match and loses on uniqueness — so each is shown
     separately rather than folded into a single ranking. */
  const picks = useMemo(() => {
    const live = items.filter(i => !i.purchased);
    const best = (fn) => live.reduce((top, i) => {
      const v = fn(i);
      if (v === null || v === undefined) return top;
      return !top || v > fn(top) ? i : top;
    }, null);
    return [
      { key: "value", label: "Best Value", sort: "value", item: best(i => i.value),
        detail: (i) => i.ppm ? `$${i.ppm.toFixed(2)}/mL · ${i.ml}mL` : "", color: PAL.sage },
      { key: "match", label: "Best Match", sort: "match", item: best(i => i.match.score),
        detail: (i) => i.match.reason, color: PAL.gold },
      { key: "unique", label: "Most Unique", sort: "unique", item: best(i => i.unique.score),
        detail: (i) => i.unique.reason, color: "#c49bd4" },
    ];
  }, [items]);

  const selected = useMemo(() => items.find(i => i.id === selectedId) || null, [items, selectedId]);

  /* The three families the collection is most saturated in — context for
     reading any single candidate's meters. */
  const topFamilies = useMemo(() => FAMILY_ORDER
    .map(f => ({ family: f, share: familyProfile.shares[f] || 0 }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 3), [familyProfile]);

  const totalCost = sorted.active.reduce((s, i) => s + (i.cost || 0), 0);
  const updateItem = (name, updates) => setPurchaseData(prev => ({ ...prev, [name]: { ...(prev?.[name] || {}), ...updates } }));
  const getNoteColor = (note) => FAMILY_COLORS[getNoteFamily(note, noteOverrides)] || PAL.gold;

  const movePriority = (name, direction) => {
    const list = [...sorted.active];
    const idx = list.findIndex(i => i.name === name);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const newData = { ...(purchaseData || {}) };
    newData[list[idx].name] = { ...(newData[list[idx].name] || {}), priority: list[swapIdx].priority };
    newData[list[swapIdx].name] = { ...(newData[list[swapIdx].name] || {}), priority: list[idx].priority };
    setPurchaseData(newData);
  };

  const handleDrop = (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const list = [...sorted.active];
    const newData = { ...(purchaseData || {}) };
    /* Reassign priorities based on new visual order */
    const moved = list.splice(dragIdx, 1)[0];
    list.splice(dropIdx, 0, moved);
    list.forEach((item, i) => {
      newData[item.name] = { ...(newData[item.name] || {}), priority: i + 1 };
    });
    setPurchaseData(newData);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const reorderTo = (fromVisualIdx, toPosition) => {
    const list = [...sorted.active];
    const target = Math.max(1, Math.min(toPosition, list.length)) - 1;
    if (fromVisualIdx === target) return;
    const [moved] = list.splice(fromVisualIdx, 1);
    list.splice(target, 0, moved);
    const newData = { ...(purchaseData || {}) };
    list.forEach((item, i) => {
      newData[item.name] = { ...(newData[item.name] || {}), priority: i + 1 };
    });
    setPurchaseData(newData);
    setSortBy("priority");
  };

  if (items.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>🛒</div>
      <p style={{ fontFamily: ff.display, fontSize: 17, color: PAL.cream }}>No wishlist fragrances yet</p>
      <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 6 }}>Add fragrances with "wishlist" status to build your shopping list.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <SectionTitle title="Purchase List" sub={`${sorted.active.length} remaining`} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: ff.display, fontSize: 26, color: PAL.gold }}>${totalCost.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: PAL.muted }}>total remaining</div>
        </div>
      </div>

      {sorted.active.length > 0 && (
        <div style={{ display: "flex", gap: 3, marginBottom: 16, height: 5, borderRadius: 3, overflow: "hidden", background: PAL.border }}>
          {sorted.active.filter(i => i.cost > 0).map((item, i) => (
            <div key={item.id} style={{ flex: item.cost, background: `hsl(${30 + i * 25}, 45%, ${50 - i * 3}%)` }} title={`${item.name}: $${item.cost}`} />
          ))}
        </div>
      )}

      {/* ─── TOP PICKS ─────────────────────────────────────────────────
          Three axes that deliberately disagree. Clicking a tile sorts the
          list by that axis. */}
      {picks.some(p => p.item) && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {picks.filter(p => p.item).map(p => {
            const active = sortBy === p.sort;
            const score = p.key === "value" ? p.item.value : p.item[p.key].score;
            return (
              <button key={p.key} onClick={() => setSortBy(active ? "priority" : p.sort)}
                title={`Sort the list by ${p.label.toLowerCase()}`}
                style={{
                  flex: "1 1 190px", minWidth: 180, textAlign: "left", cursor: "pointer",
                  background: active ? `${p.color}12` : `${PAL.cream}03`,
                  border: `1px solid ${active ? p.color + "55" : PAL.border}`,
                  borderRadius: 12, padding: "11px 13px", fontFamily: ff.body,
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: p.color }}>{p.label}</span>
                  <span style={{ fontFamily: ff.display, fontSize: 13, color: p.color }}>{score}</span>
                </div>
                <div style={{ fontFamily: ff.display, fontSize: 16, fontStyle: "italic", color: PAL.cream, margin: "4px 0 2px", lineHeight: 1.2 }}>{p.item.name}</div>
                <div style={{ fontSize: 9, color: PAL.muted, lineHeight: 1.45 }}>{p.detail(p.item)}</div>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[{k:"priority",l:"Priority"},{k:"value",l:"Value"},{k:"match",l:"Match"},{k:"unique",l:"Unique"},{k:"gap",l:"Fills a Gap"},{k:"cost-low",l:"Cost ↑"},{k:"cost-high",l:"Cost ↓"},{k:"name",l:"A-Z"}].map(s => (
          <button key={s.k} onClick={() => setSortBy(s.k)} style={{
            background: sortBy === s.k ? `${PAL.gold}14` : "transparent",
            border: `1px solid ${sortBy === s.k ? PAL.gold + "44" : PAL.border}`,
            borderRadius: 16, padding: "4px 12px", fontFamily: ff.body, fontSize: 10, color: sortBy === s.k ? PAL.gold : PAL.muted, cursor: "pointer",
          }}>{s.l}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 440px", minWidth: 290, display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.active.map((item, visualIdx) => {
          const isEditing = editingId === item.id;
          return (
            <div key={item.id}
              draggable
              onDragStart={() => setDragIdx(visualIdx)}
              onDragOver={e => { e.preventDefault(); setDragOverIdx(visualIdx); }}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              onDrop={() => handleDrop(visualIdx)}
              style={{
                background: `${PAL.cream}03`,
                border: `1px solid ${dragOverIdx === visualIdx && dragIdx !== visualIdx ? PAL.gold + "66" : isEditing ? PAL.gold + "33" : PAL.border}`,
                borderRadius: 14, padding: "14px 16px", transition: "border-color .2s",
                opacity: dragIdx === visualIdx ? 0.4 : 1,
                cursor: "grab",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", minWidth: 32 }}>
                  <button onClick={() => movePriority(item.name, -1)} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 10, cursor: "pointer", padding: 0 }}>▲</button>
                  {editingRank === visualIdx ? (
                    <input
                      autoFocus
                      value={rankInput}
                      onChange={e => setRankInput(e.target.value.replace(/[^0-9]/g, ""))}
                      onKeyDown={e => {
                        if (e.key === "Enter") { const n = parseInt(rankInput); if (n > 0) reorderTo(visualIdx, n); setEditingRank(null); }
                        if (e.key === "Escape") setEditingRank(null);
                      }}
                      onBlur={() => { const n = parseInt(rankInput); if (n > 0) reorderTo(visualIdx, n); setEditingRank(null); }}
                      style={{ width: 28, textAlign: "center", background: `${PAL.gold}14`, border: `1px solid ${PAL.gold}44`, borderRadius: 4, padding: "2px 0", color: PAL.gold, fontFamily: ff.display, fontSize: 16, outline: "none" }}
                    />
                  ) : (
                    <span onClick={() => { setEditingRank(visualIdx); setRankInput(String(visualIdx + 1)); }}
                      style={{ fontFamily: ff.display, fontSize: 20, color: PAL.gold, lineHeight: 1, cursor: "pointer", minWidth: 24, textAlign: "center" }}
                      title="Click to change position">{visualIdx + 1}</span>
                  )}
                  <button onClick={() => movePriority(item.name, 1)} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 10, cursor: "pointer", padding: 0 }}>▼</button>
                </div>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setEditingId(isEditing ? null : item.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic" }}>{item.name}</span>
                    {item.house && <span style={{ fontSize: 12, color: PAL.muted }}>— {item.house}</span>}
                    {item.verdict && item.verdict.key !== "unknown" && (
                      <span title={`Its families make up ${(item.verdict.saturation || 0).toFixed(0)}% of what you own`}
                        style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap", color: TONE[item.verdict.tone], background: `${TONE[item.verdict.tone]}12`, border: `1px solid ${TONE[item.verdict.tone]}33` }}>{item.verdict.label}</span>
                    )}
                  </div>
                  {item.notes.length > 0 && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                      {item.notes.map((n, j) => (
                        <span key={j} style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, color: getNoteColor(n), background: `${getNoteColor(n)}12`, border: `1px solid ${getNoteColor(n)}22` }}>{n}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", minWidth: 80, flexShrink: 0 }}>
                  <div style={{ fontFamily: ff.display, fontSize: 20, color: PAL.cream }}>{item.cost > 0 ? `$${item.cost}` : "—"}</div>
                  {item.ml > 0 && item.cost > 0 && <div style={{ fontSize: 10, color: PAL.muted }}>{item.ml}mL · ${(item.cost / item.ml).toFixed(2)}/mL</div>}
                  {item.whereToBuy && <div style={{ fontSize: 9, color: PAL.sage, marginTop: 2 }}>📍 {item.whereToBuy}</div>}
                </div>
                <button onClick={e => { e.stopPropagation(); setSelectedId(selectedId === item.id ? null : item.id); }}
                  title="Show how this fits your collection"
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, cursor: "pointer",
                    background: selectedId === item.id ? `${PAL.gold}1e` : "transparent",
                    border: `1px solid ${selectedId === item.id ? PAL.gold + "66" : PAL.border}`,
                    color: selectedId === item.id ? PAL.gold : PAL.muted,
                    fontFamily: ff.body, fontSize: 13, lineHeight: 1, padding: 0,
                  }}>◴</button>
                <div onClick={() => updateItem(item.name, { purchased: true })}
                  style={{ width: 28, height: 28, borderRadius: 14, border: `2px solid ${PAL.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  title="Mark purchased" />
              </div>
              {isEditing && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${PAL.border}` }} onClick={e => e.stopPropagation()}>
                  {item.thoughts && (
                    <div style={{ marginBottom: 10, padding: "8px 12px", background: `${PAL.gold}06`, borderRadius: 8, border: `1px solid ${PAL.gold}15` }}>
                      <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted }}>Notes from collection</span>
                      <p style={{ fontFamily: ff.body, fontSize: 13, color: PAL.cream, margin: "4px 0 0", lineHeight: 1.5 }}>{item.thoughts}</p>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Where to Buy</label>
                      <input style={inputCss} value={item.whereToBuy} onChange={e => updateItem(item.name, { whereToBuy: e.target.value })} placeholder="Store, website, link…" />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Budget Note</label>
                      <input style={inputCss} value={item.budgetNote} onChange={e => updateItem(item.name, { budgetNote: e.target.value })} placeholder="Wait for sale, birthday…" />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Notes</label>
                    <textarea style={{ ...inputCss, minHeight: 50, resize: "vertical", lineHeight: 1.5 }} value={item.purchaseNotes || ""} onChange={e => updateItem(item.name, { purchaseNotes: e.target.value })} placeholder="Why you want it, sizing thoughts, layering ideas…" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── COVERAGE PANEL ─────────────────────────────────────────────
          What this candidate fills, and what it already resembles. Only the
          families it actually contains — the full 12-family picture lives in
          the bubble chart, and a number belongs in one place. */}
      <div style={{ flex: "0 1 318px", minWidth: 270, position: "sticky", top: 12 }}>
        {!selected ? (
          <div style={{ background: `${PAL.cream}03`, border: `1px dashed ${PAL.border}`, borderRadius: 14, padding: "22px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 20, opacity: .35, marginBottom: 8 }}>◴</div>
            <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, margin: 0, lineHeight: 1.6 }}>
              Pick the ◴ on any row to see which family it fills and what it's closest to in your collection.
            </p>
            {familyProfile.ownedCount > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${PAL.border}`, textAlign: "left" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 8 }}>Your collection leans</div>
                {topFamilies.map(({ family, share }) => (
                  <div key={family} style={{ marginBottom: 7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: PAL.cream, marginBottom: 3 }}>
                      <span>{FAMILY_LABELS[family] || family}</span>
                      <span style={{ color: PAL.muted }}>{share.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: `${FAMILY_COLORS[family]}1e`, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (share / (topFamilies[0].share || 1)) * 100)}%`, height: "100%", borderRadius: 3, background: FAMILY_COLORS[family] }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: `${PAL.cream}04`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div>
                <div style={{ fontFamily: ff.display, fontSize: 17, fontStyle: "italic", color: PAL.cream, lineHeight: 1.2 }}>{selected.name}</div>
                {selected.house && <div style={{ fontSize: 10, color: PAL.muted, marginTop: 2 }}>{selected.house}</div>}
              </div>
              <button onClick={() => setSelectedId(null)} style={{ background: "transparent", border: "none", color: PAL.muted, fontSize: 15, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {/* Verdict — the headline, with the number behind it */}
            {selected.verdict && (
              <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: `${TONE[selected.verdict.tone]}0e`, border: `1px solid ${TONE[selected.verdict.tone]}33` }}>
                <div style={{ fontFamily: ff.display, fontSize: 16, color: TONE[selected.verdict.tone] }}>{selected.verdict.label}</div>
                <div style={{ fontSize: 10, color: PAL.muted, marginTop: 3, lineHeight: 1.5 }}>
                  {selected.verdict.key === "duplicate"
                    ? `${Math.round((selected.nearest[0]?.overlap || 0) * 100)}% note overlap with ${selected.nearest[0]?.name}`
                    : selected.verdict.key === "unknown"
                      ? "Add notes to this bottle to score it"
                      : `Its families are ${(selected.verdict.saturation || 0).toFixed(0)}% of what you own`}
                </div>
              </div>
            )}

            {/* The three axes side by side. Seeing them disagree is the
                point — a high match with low uniqueness is a safe repeat,
                the reverse is a stretch. */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 9 }}>
                How it scores
              </div>
              {[
                { label: "Value", score: selected.value, color: PAL.sage,
                  note: selected.ppm ? `$${selected.ppm.toFixed(2)}/mL` : "No price or size set" },
                { label: "Match", score: selected.match.score, color: PAL.gold, note: selected.match.reason },
                { label: "Unique", score: selected.unique.score, color: "#c49bd4", note: selected.unique.reason },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 6 }}>
                    <span style={{ fontSize: 11, color: PAL.cream }}>{row.label}</span>
                    <span style={{ fontFamily: ff.display, fontSize: 13, color: row.score === null || row.score === undefined ? PAL.muted : row.color }}>
                      {row.score === null || row.score === undefined ? "—" : row.score}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: `${row.color}1e`, overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, row.score || 0))}%`, height: "100%", borderRadius: 3, background: row.color }} />
                  </div>
                  <div style={{ fontSize: 9, color: PAL.muted, marginTop: 3, lineHeight: 1.45 }}>{row.note}</div>
                </div>
              ))}
            </div>

            {/* Saturation meters — one per family this candidate contains */}
            {selected.fams.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 9 }}>
                  How full you already are
                </div>
                {selected.fams.map(({ family, weight, share }) => {
                  const scale = topFamilies[0]?.share || 100;
                  return (
                    <div key={family} style={{ marginBottom: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 6 }}>
                        <span style={{ fontSize: 11, color: PAL.cream }}>{FAMILY_LABELS[family] || family}</span>
                        <span style={{ fontSize: 9, color: PAL.muted, whiteSpace: "nowrap" }}>
                          {Math.round(weight * 100)}% of this · you own {share.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: `${FAMILY_COLORS[family]}1e`, overflow: "hidden" }}
                        title={`${FAMILY_LABELS[family] || family} is ${share.toFixed(1)}% of your owned collection`}>
                        <div style={{ width: `${Math.min(100, (share / scale) * 100)}%`, height: "100%", borderRadius: 3, background: FAMILY_COLORS[family] }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: 9, color: PAL.muted, marginTop: -2, lineHeight: 1.5 }}>
                  Full bar = {(topFamilies[0]?.share || 0).toFixed(0)}%, your most saturated family
                  {topFamilies[0] ? ` (${FAMILY_LABELS[topFamilies[0].family] || topFamilies[0].family})` : ""}
                </div>
              </div>
            )}

            {/* Nearest owned — a short list, not a chart */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${PAL.border}` }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 9 }}>
                Closest in your collection
              </div>
              {selected.nearest.length === 0 ? (
                <p style={{ fontSize: 10, color: PAL.muted, margin: 0, lineHeight: 1.5 }}>Nothing you own shares a note with this — genuinely new territory.</p>
              ) : selected.nearest.map(n => (
                <div key={n.name} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 11, color: PAL.cream, fontStyle: "italic", fontFamily: ff.display }}>{n.name}</span>
                    <span style={{ fontSize: 11, fontFamily: ff.display, color: n.overlap >= 0.5 ? PAL.rose : PAL.muted, whiteSpace: "nowrap" }}>{Math.round(n.overlap * 100)}%</span>
                  </div>
                  {n.shared.length > 0 && (
                    <div style={{ fontSize: 9, color: PAL.muted, marginTop: 2 }}>shares {n.shared.slice(0, 4).join(", ")}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {sorted.done.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowPurchased(!showPurchased)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: ff.body, fontSize: 11, color: PAL.sage, letterSpacing: 1.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <span style={{ fontSize: 8, transition: "transform .2s", transform: showPurchased ? "rotate(90deg)" : "none" }}>▶</span>
            Purchased ({sorted.done.length}) · ${sorted.done.reduce((s, i) => s + (i.cost || 0), 0).toLocaleString()} spent
          </button>
          {showPurchased && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {sorted.done.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${PAL.sage}04`, border: `1px solid ${PAL.sage}15`, borderRadius: 10, opacity: .6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: `${PAL.sage}20`, border: `2px solid ${PAL.sage}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: PAL.sage, fontSize: 12 }}>✓</span></div>
                  <span style={{ fontFamily: ff.display, fontSize: 14, fontStyle: "italic", textDecoration: "line-through", opacity: .7, flex: 1 }}>{item.name}</span>
                  <span style={{ fontSize: 10, color: PAL.muted }}>{item.house}</span>
                  <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.muted }}>${item.cost || 0}</span>
                  <button onClick={() => updateItem(item.name, { purchased: false })} style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "3px 8px", color: PAL.muted, fontSize: 9, cursor: "pointer" }}>Undo</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, padding: "14px 18px", background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 3 }}>Remaining</div>
          <span style={{ fontFamily: ff.display, fontSize: 22, color: PAL.gold }}>${totalCost.toLocaleString()}</span>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 3 }}>Purchased</div>
          <span style={{ fontFamily: ff.display, fontSize: 22, color: PAL.sage }}>${sorted.done.reduce((s, i) => s + (i.cost || 0), 0).toLocaleString()}</span>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 3 }}>Best Value Next</div>
          {sorted.active.filter(i => i.ml > 0 && i.cost > 0).length > 0 ? (() => {
            const best = [...sorted.active].filter(i => i.ml > 0 && i.cost > 0).sort((a, b) => (a.cost / a.ml) - (b.cost / b.ml))[0];
            return <span style={{ fontFamily: ff.display, fontSize: 15, fontStyle: "italic", color: PAL.cream }}>{best.name} <span style={{ color: PAL.sage, fontSize: 11 }}>${(best.cost / best.ml).toFixed(2)}/mL</span></span>;
          })() : <span style={{ color: PAL.muted }}>—</span>}
        </div>
      </div>
    </div>
  );
};

export default PurchaseList;
