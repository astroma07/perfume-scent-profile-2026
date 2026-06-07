import { useState, useMemo, useCallback } from "react";
import { PAL, ff } from "../constants.js";
import { FAMILY_ORDER, FAMILY_COLORS, FAMILY_LABELS, getNoteFamily } from "../noteCategories.js";

const PairingWheel = ({ bottles, noteOverrides, opposingPairs, pairingNotes, setPairingNotes, pairingRatings, setPairingRatings, rejectedPairings, setRejectedPairings }) => {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [pairMode, setPairMode] = useState("all");
  const [showRejected, setShowRejected] = useState(false);

  const owned = useMemo(() => bottles.filter(b => (b.status === "owned" || b.status === "tester") && (b.userNotes || "").trim()), [bottles]);

  const getBottleNotes = (b) => (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
  const getBottleFamily = (b) => {
    const notes = getBottleNotes(b);
    const counts = {};
    notes.forEach(n => { const f = getNoteFamily(n, noteOverrides); counts[f] = (counts[f] || 0) + 1; });
    let best = "oriental", max = 0;
    for (const [f, c] of Object.entries(counts)) { if (c > max) { max = c; best = f; } }
    return best;
  };

  const grouped = useMemo(() => {
    const g = {};
    FAMILY_ORDER.forEach(f => { g[f] = []; });
    owned.forEach((b, i) => { const f = getBottleFamily(b); g[f].push({ bottle: b, idx: i, family: f }); });
    return g;
  }, [owned, noteOverrides]);

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
      const isOpposing = (opposingPairs || []).some(([a, bb]) => (a === selFamily && bb === bFamily) || (a === bFamily && bb === selFamily));
      if (shared.length === 0 && !isOpposing) return null;
      return { idx: i, bottle: b, shared, strength: shared.length, isOpposing, isComplementary: shared.length > 0, family: bFamily };
    }).filter(Boolean).sort((a, b) => b.strength - a.strength);
  }, [selected, owned, opposingPairs, noteOverrides]);

  const rejectedSet = useMemo(() => new Set(rejectedPairings || []), [rejectedPairings]);

  const getPairKey = (nameA, nameB) => [nameA, nameB].sort().join("||");

  const filteredPairings = useMemo(() => {
    let list = pairings;
    if (pairMode === "complementary") list = list.filter(p => p.isComplementary);
    if (pairMode === "opposing") list = list.filter(p => p.isOpposing);
    return list.filter(p => !rejectedSet.has(getPairKey(owned[selected]?.name, p.bottle.name)));
  }, [pairings, pairMode, rejectedSet, selected, owned]);

  const rejectedFromSelected = useMemo(() => {
    if (selected === null) return [];
    return pairings.filter(p => rejectedSet.has(getPairKey(owned[selected]?.name, p.bottle.name)));
  }, [pairings, rejectedSet, selected, owned]);

  const pairedIndices = useMemo(() => new Set(filteredPairings.map(p => p.idx)), [filteredPairings]);

  /* ── Dimensions ── */
  const viewSize = 1200;
  const pad = 180;
  const cx = viewSize / 2, cy = viewSize / 2;
  const catOuterR = 360, catInnerR = 150;
  const fragR = 420, fragDotR = 15;
  const testerR = 490, testerDotR = 8;
  const labelR = testerR + 22;

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
    const r1 = owned[i1]?.status === "tester" ? testerR : fragR;
    const r2 = owned[i2]?.status === "tester" ? testerR : fragR;
    const x1 = cx + Math.cos(a1) * r1, y1 = cy + Math.sin(a1) * r1;
    const x2 = cx + Math.cos(a2) * r2, y2 = cy + Math.sin(a2) * r2;
    const pull = 0.06;
    const mx = cx + ((x1 - cx) + (x2 - cx)) * pull;
    const my = cy + ((y1 - cy) + (y2 - cy)) * pull;
    return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
  }, [layout, cx, cy, fragR, testerR, owned]);

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

  const getNoteColor = (note) => FAMILY_COLORS[getNoteFamily(note, noteOverrides)] || PAL.gold;

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
      <div style={{ width: "100%", maxWidth: viewSize + pad * 2, margin: "0 auto" }}>
        <svg viewBox={`${-pad} ${-pad} ${viewSize + pad * 2} ${viewSize + pad * 2}`} width="100%">

          {/* Category arcs */}
          {Object.entries(layout.families).map(([fam, pos]) => {
            const color = FAMILY_COLORS[fam];
            const isActive = activeIdx !== null && layout.frags[activeIdx]?.family === fam;
            const midA = pos.mid;
            const lr = (catInnerR + catOuterR) / 2;
            const lx = cx + Math.cos(midA) * lr, ly = cy + Math.sin(midA) * lr;
            const deg = midA * (180 / Math.PI), flip = deg > 90 || deg < -90;
            const label = FAMILY_LABELS[fam] || fam;
            const parts = label.includes("&") ? label.split(" & ") : label.includes(" ") && label.length > 8 ? [label.split(" ")[0], label.split(" ").slice(1).join(" ")] : [label];
            const isTwoLine = parts.length > 1;
            return (
              <g key={`cat-${fam}`}>
                <path d={arcPath(catInnerR, catOuterR, pos.start, pos.end)}
                  fill={color} opacity={activeIdx !== null ? (isActive ? 0.4 : 0.06) : 0.2}
                  stroke={PAL.bg} strokeWidth="3" style={{ transition: "opacity .4s" }} />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                  fill={isActive || activeIdx === null ? color : "#2a2318"}
                  fontSize="20" fontFamily={ff.body} fontWeight="600" letterSpacing="2.5"
                  style={{ textTransform: "uppercase", transition: "fill .3s" }}>
                  {isTwoLine ? (
                    <>
                      <tspan x={lx} dy="-12">{parts[0]}</tspan>
                      <tspan x={lx} dy="24">{"& " + parts[1]}</tspan>
                    </>
                  ) : (
                    parts[0]
                  )}
                </text>
              </g>
            );
          })}

          {/* Ring guides */}
          <circle cx={cx} cy={cy} r={fragR} fill="none" stroke={PAL.border} strokeWidth="0.5" opacity=".2" strokeDasharray="2,6" />
          <circle cx={cx} cy={cy} r={testerR} fill="none" stroke={PAL.border} strokeWidth="0.5" opacity=".12" strokeDasharray="1,4" />

          {/* Spokes */}
          {owned.map((b, i) => {
            if (!layout.frags[i]) return null;
            const a = layout.frags[i].angle, fam = layout.frags[i].family;
            const isTester = b.status === "tester";
            const thisR = isTester ? testerR : fragR;
            const thisDotR = isTester ? testerDotR : fragDotR;
            const x1 = cx + Math.cos(a) * catOuterR, y1 = cy + Math.sin(a) * catOuterR;
            const x2 = cx + Math.cos(a) * (thisR - thisDotR - 4), y2 = cy + Math.sin(a) * (thisR - thisDotR - 4);
            const isAct = activeIdx === i || (showPairings && pairedIndices.has(i));
            return <line key={`sp-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={FAMILY_COLORS[fam]} strokeWidth={isAct ? 1.5 : 0.5}
              strokeDasharray={isTester ? "4,3" : "none"}
              opacity={activeIdx !== null ? (isAct ? 0.5 : 0.03) : 0.12}
              style={{ transition: "opacity .3s" }} />;
          })}

          {/* Pairing chords */}
          {showPairings && filteredPairings.map((p, i) => {
            const isHovPair = hovered === p.idx;
            const maxW = Math.max(...filteredPairings.map(pp => pp.strength), 1);
            const width = p.isOpposing && !p.isComplementary ? 2.5 : 2 + (p.strength / maxW) * 5;
            const color = p.isOpposing && !p.isComplementary ? PAL.rose : p.isComplementary ? PAL.sage : PAL.gold;
            return (
              <path key={`ch-${i}`} d={chordPath(selected, p.idx)} fill="none"
                stroke={isHovPair ? PAL.cream : color}
                strokeWidth={isHovPair ? width + 2 : width}
                strokeDasharray={p.isOpposing && !p.isComplementary ? "8,5" : "none"}
                opacity={hovered !== null ? (isHovPair ? 0.9 : 0.06) : 0.5}
                strokeLinecap="round" style={{ transition: "opacity .3s" }} />
            );
          })}

          {/* Fragrance dots */}
          {owned.map((b, i) => {
            if (!layout.frags[i]) return null;
            const a = layout.frags[i].angle, fam = layout.frags[i].family;
            const isTester = b.status === "tester";
            const thisR = isTester ? testerR : fragR;
            const thisDotR = isTester ? testerDotR : fragDotR;
            const x = cx + Math.cos(a) * thisR, y = cy + Math.sin(a) * thisR;
            const color = FAMILY_COLORS[fam];
            const isSel = selected === i, isHov = hovered === i;
            const isPaired = showPairings && pairedIndices.has(i);
            const dimmed = activeIdx !== null && !isSel && !isPaired && !isHov;
            const pair = isPaired ? filteredPairings.find(pp => pp.idx === i) : null;
            const lx = cx + Math.cos(a) * (labelR + (isTester ? 0 : 6)), ly = cy + Math.sin(a) * (labelR + (isTester ? 0 : 6));
            const deg = a * (180 / Math.PI), flip = deg > 90 || deg < -90;
            return (
              <g key={`f-${i}`} onClick={() => setSelected(selected === i ? null : i)}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}>
                {isSel && <circle cx={x} cy={y} r={thisDotR + 8} fill="none" stroke={color} strokeWidth="1.5" opacity=".3">
                  <animate attributeName="r" values={`${thisDotR+5};${thisDotR+11};${thisDotR+5}`} dur="2.5s" repeatCount="indefinite" />
                </circle>}
                {(isHov || isSel) && <circle cx={x} cy={y} r={thisDotR + 5} fill={color} opacity=".12" />}
                <circle cx={x} cy={y}
                  r={isSel ? thisDotR + 3 : isHov ? thisDotR + 2 : thisDotR}
                  fill={dimmed ? "#1a1710" : color}
                  stroke={isSel ? PAL.cream : isHov ? color : PAL.bg}
                  strokeWidth={isSel ? 2.5 : isTester ? 1 : 2}
                  strokeDasharray={isTester && !isSel && !isHov ? "3,2" : "none"}
                  opacity={dimmed ? 0.15 : isTester ? 0.7 : 1}
                  style={{ transition: "all .25s" }} />
                {isPaired && pair && (
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={PAL.bg} fontSize="13" fontWeight="700" fontFamily={ff.body}>{pair.strength || "↔"}</text>
                )}
                {(isHov || isSel) && (
                  <>
                    <text x={lx} y={ly - 2} textAnchor={flip ? "end" : "start"} dominantBaseline="middle"
                      transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                      fill={PAL.cream} fontSize={isTester ? "15" : "18"} fontFamily={ff.display} fontStyle="italic">
                      {b.name}{isTester ? "  ᵗ" : ""}</text>
                    <text x={lx} y={ly + 16} textAnchor={flip ? "end" : "start"} dominantBaseline="middle"
                      transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                      fill={PAL.muted} fontSize="13" fontFamily={ff.body}>{b.house}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Center */}
          <circle cx={cx} cy={cy} r={catInnerR - 8} fill={PAL.bg} />
          <circle cx={cx} cy={cy} r={catInnerR - 8} fill="none" stroke={PAL.border} strokeWidth=".5" />
          {selected !== null ? (
            <>
              <text x={cx} y={cy - 28} textAnchor="middle" fill={PAL.muted} fontSize="12" letterSpacing="5" style={{ textTransform: "uppercase" }}>Selected</text>
              <text x={cx} y={cy + 6} textAnchor="middle" fill={PAL.cream} fontSize="28" fontFamily={ff.display} fontStyle="italic">
                {owned[selected]?.name?.length > 16 ? owned[selected].name.slice(0, 15) + "…" : owned[selected]?.name}
              </text>
              <text x={cx} y={cy + 34} textAnchor="middle" fill={PAL.gold} fontSize="14" fontFamily={ff.body}>
                {filteredPairings.filter(p => p.isComplementary).length} complementary · {filteredPairings.filter(p => p.isOpposing).length} opposing
              </text>
              <text x={cx} y={cy + 58} textAnchor="middle" fill={PAL.muted} fontSize="13" fontFamily={ff.body}
                style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); setSelected(null); }}>✕ clear</text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 16} textAnchor="middle" fill={PAL.muted} fontSize="12" letterSpacing="6" style={{ textTransform: "uppercase" }}>Your</text>
              <text x={cx} y={cy + 16} textAnchor="middle" fill={PAL.cream} fontSize="32" fontFamily={ff.display} fontStyle="italic">Collection</text>
              <text x={cx} y={cy + 42} textAnchor="middle" fill={PAL.muted} fontSize="14">{owned.length} fragrances</text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
        {FAMILY_ORDER.filter(f => grouped[f].length > 0).map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: FAMILY_COLORS[f] }} />
            <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: FAMILY_COLORS[f] }}>{FAMILY_LABELS[f]}</span>
          </div>
        ))}
        <span style={{ width: 1, height: 14, background: PAL.border, margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: PAL.muted }} />
          <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: PAL.muted }}>Owned</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", border: `1.5px dashed ${PAL.muted}`, background: "transparent" }} />
          <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: PAL.muted }}>Tester</span>
        </div>
        {showPairings && <>
          <span style={{ width: 1, height: 14, background: PAL.border, margin: "0 4px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 14, height: 2, background: PAL.sage, borderRadius: 1 }} />
            <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: PAL.sage }}>Complementary</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 14, height: 0, borderTop: `2px dashed ${PAL.rose}` }} />
            <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: PAL.rose }}>Opposing</span>
          </div>
        </>}
      </div>

      {/* Detail panel */}
      {showPairings && (
        <div style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: FAMILY_COLORS[layout.frags[selected]?.family] }} />
            <span style={{ fontFamily: ff.display, fontSize: 22, fontStyle: "italic", color: PAL.cream }}>{owned[selected]?.name}</span>
            <span style={{ fontSize: 13, color: PAL.muted }}>{owned[selected]?.house}</span>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
            {getBottleNotes(owned[selected]).map((n, i) => {
              const nc = getNoteColor(n);
              return <span key={i} style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, color: nc, background: `${nc}15`, border: `1px solid ${nc}25` }}>{n}</span>;
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {filteredPairings.map((p, i) => {
              const isHov = hovered === p.idx;
              const typeColor = p.isOpposing && !p.isComplementary ? PAL.rose : p.isComplementary ? PAL.sage : PAL.gold;
              const typeLabel = p.isComplementary && p.isOpposing ? "Both" : p.isOpposing ? "Opposing" : "Complementary";
              const pairKey = getPairKey(owned[selected]?.name, p.bottle.name);
              const rating = (pairingRatings && pairingRatings[pairKey]) || 0;
              return (
                <div key={i} onMouseEnter={() => setHovered(p.idx)} onMouseLeave={() => setHovered(null)}
                  style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    background: isHov ? `${PAL.cream}06` : "transparent",
                    border: `1px solid ${isHov ? PAL.border : "transparent"}`,
                    transition: "all .2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: FAMILY_COLORS[p.family], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: ff.display, fontSize: 15, fontStyle: "italic", color: PAL.cream }}>{p.bottle.name}</span>
                      <span style={{ fontSize: 11, color: PAL.muted, marginLeft: 6 }}>{p.bottle.house}</span>
                    </div>
                    <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}25` }}>{typeLabel}</span>
                    {p.shared.length > 0 && (
                      <div style={{ display: "flex", gap: 2 }}>
                        {p.shared.slice(0, 3).map((n, j) => {
                          const nc = getNoteColor(n);
                          return <span key={j} style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, color: nc, background: `${nc}10`, border: `1px solid ${nc}18` }}>{n}</span>;
                        })}
                      </div>
                    )}
                    <span style={{ fontFamily: ff.display, fontSize: 18, color: PAL.gold, minWidth: 24, textAlign: "right" }}>{p.strength || "↔"}</span>
                  </div>
                  {/* Rating slider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase", minWidth: 42 }}>Rating</span>
                    <input type="range" min="0" max="10" step="0.5" value={rating}
                      onChange={e => { e.stopPropagation(); setPairingRatings(prev => ({ ...prev, [pairKey]: parseFloat(e.target.value) })); }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, height: 4, appearance: "none", background: PAL.border, borderRadius: 2, outline: "none", cursor: "pointer", accentColor: PAL.gold }} />
                    <span style={{ fontFamily: ff.display, fontSize: 14, color: rating > 0 ? PAL.gold : PAL.muted, minWidth: 24, textAlign: "right" }}>{rating > 0 ? rating : "—"}</span>
                    <button onClick={e => { e.stopPropagation(); setRejectedPairings(prev => [...prev, pairKey]); }}
                      title="Reject this pairing"
                      style={{ background: `${PAL.rose}10`, border: `1px solid ${PAL.rose}25`, borderRadius: 6, padding: "4px 8px", color: PAL.rose, fontFamily: ff.body, fontSize: 9, cursor: "pointer", letterSpacing: 1, flexShrink: 0 }}>✕</button>
                  </div>
                  {/* Notes */}
                  <input value={(pairingNotes && pairingNotes[pairKey]) || ""}
                    onChange={e => { e.stopPropagation(); setPairingNotes(prev => ({ ...prev, [pairKey]: e.target.value })); }}
                    onClick={e => e.stopPropagation()}
                    placeholder="Add pairing notes…"
                    style={{ width: "100%", marginTop: 6, background: `${PAL.cream}04`, border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "6px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                </div>
              );
            })}
          </div>

          {/* Rejected pile */}
          {rejectedFromSelected.length > 0 && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${PAL.border}`, paddingTop: 12 }}>
              <button onClick={() => setShowRejected(!showRejected)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: ff.body, fontSize: 11, color: PAL.muted, letterSpacing: 1.5,
                textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, padding: 0,
              }}>
                <span style={{ fontSize: 8, transform: showRejected ? "rotate(90deg)" : "none", transition: "transform .2s" }}>▶</span>
                Rejected ({rejectedFromSelected.length})
              </button>
              {showRejected && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {rejectedFromSelected.map((p, i) => {
                    const pairKey = getPairKey(owned[selected]?.name, p.bottle.name);
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                        borderRadius: 8, background: `${PAL.rose}04`, border: `1px solid ${PAL.rose}12`,
                        opacity: .6,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: FAMILY_COLORS[p.family], flexShrink: 0 }} />
                        <span style={{ fontFamily: ff.display, fontSize: 13, fontStyle: "italic", color: PAL.cream, flex: 1 }}>{p.bottle.name}</span>
                        <span style={{ fontSize: 9, color: PAL.muted }}>{p.bottle.house}</span>
                        <button onClick={e => { e.stopPropagation(); setRejectedPairings(prev => prev.filter(k => k !== pairKey)); }}
                          style={{ background: `${PAL.sage}12`, border: `1px solid ${PAL.sage}30`, borderRadius: 6, padding: "3px 10px", color: PAL.sage, fontFamily: ff.body, fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>Restore</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

export default PairingWheel;
        </div>
      )}
    </div>
  );
};

export default PairingWheel;
