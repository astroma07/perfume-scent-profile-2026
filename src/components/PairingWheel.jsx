import { useState, useMemo, useCallback } from "react";
import { PAL, ff } from "../constants.js";
import { FAMILY_ORDER, FAMILY_COLORS, FAMILY_LABELS, getNoteFamily } from "../noteCategories.js";

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

export default PairingWheel;
