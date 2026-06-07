import { useState, useMemo, useCallback } from "react";
import { PAL, ff } from "../constants.js";
import { FAMILY_ORDER, FAMILY_COLORS, FAMILY_LABELS, getNoteFamily } from "../noteCategories.js";

const PairingWheel = ({ bottles, noteOverrides, opposingPairs, pairingNotes, setPairingNotes, pairingRatings, setPairingRatings, rejectedPairings, setRejectedPairings }) => {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [hovType, setHovType] = useState(null);
  const [pairMode, setPairMode] = useState("all");
  const [showRejected, setShowRejected] = useState(false);

  /* Split bottles into owned and testers */
  const ownedBottles = useMemo(() => bottles.filter(b => b.status === "owned" && (b.userNotes || "").trim()), [bottles]);
  const testerBottles = useMemo(() => bottles.filter(b => b.status === "tester" && (b.userNotes || "").trim()), [bottles]);
  const allActive = useMemo(() => [...ownedBottles.map(b => ({ ...b, _type: "owned" })), ...testerBottles.map(b => ({ ...b, _type: "tester" }))], [ownedBottles, testerBottles]);

  const getBottleNotes = (b) => (b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
  const getBottleFamily = (b) => {
    const notes = getBottleNotes(b);
    const counts = {};
    notes.forEach(n => { const f = getNoteFamily(n, noteOverrides); counts[f] = (counts[f] || 0) + 1; });
    let best = "oriental", max = 0;
    for (const [f, c] of Object.entries(counts)) { if (c > max) { max = c; best = f; } }
    return best;
  };

  /* Group by family separately */
  const grouped = useMemo(() => {
    const ownedByFam = {}, testerByFam = {};
    FAMILY_ORDER.forEach(f => { ownedByFam[f] = []; testerByFam[f] = []; });
    ownedBottles.forEach((b, i) => { ownedByFam[getBottleFamily(b)].push({ bottle: b, idx: i }); });
    testerBottles.forEach((b, i) => { testerByFam[getBottleFamily(b)].push({ bottle: b, idx: i }); });
    return { ownedByFam, testerByFam };
  }, [ownedBottles, testerBottles, noteOverrides]);

  /* Layout: arc sizes driven by owned count, testers fit within */
  const layout = useMemo(() => {
    const { ownedByFam, testerByFam } = grouped;
    const GAP = 0.03;
    const active = FAMILY_ORDER.filter(f => ownedByFam[f].length > 0 || testerByFam[f].length > 0);
    const totalGaps = active.length * GAP;

    /* Weights: owned count drives size, tester-only families get minimal arc */
    const weights = {};
    let totalWeight = 0;
    active.forEach(f => {
      const oc = ownedByFam[f].length, tc = testerByFam[f].length;
      weights[f] = oc > 0 ? Math.max(oc, tc * 0.4) : tc * 0.5;
      totalWeight += weights[f];
    });

    const usable = Math.PI * 2 - totalGaps;
    let angle = -Math.PI / 2;
    const families = {}, ownedPos = {}, testerPos = {};

    active.forEach(fam => {
      const sweep = (weights[fam] / totalWeight) * usable;
      families[fam] = { start: angle, end: angle + sweep, mid: angle + sweep / 2, hasOwned: ownedByFam[fam].length > 0 };

      ownedByFam[fam].forEach((item, i) => {
        const count = ownedByFam[fam].length;
        ownedPos[item.idx] = { angle: angle + ((i + 0.5) / count) * sweep, family: fam };
      });

      testerByFam[fam].forEach((item, i) => {
        const count = testerByFam[fam].length;
        testerPos[item.idx] = { angle: angle + ((i + 0.5) / count) * sweep, family: fam };
      });

      angle += sweep + GAP;
    });
    return { families, ownedPos, testerPos, active };
  }, [grouped]);

  /* Pairings (across both owned + testers) */
  const pairings = useMemo(() => {
    if (selected === null) return [];
    const sel = allActive[selected];
    const selNotes = getBottleNotes(sel);
    const selFamily = getBottleFamily(sel);
    return allActive.map((b, i) => {
      if (i === selected) return null;
      const bNotes = getBottleNotes(b);
      const bFamily = getBottleFamily(b);
      const shared = selNotes.filter(n => bNotes.includes(n));
      const isOpposing = (opposingPairs || []).some(([a, bb]) => (a === selFamily && bb === bFamily) || (a === bFamily && bb === selFamily));
      if (shared.length === 0 && !isOpposing) return null;
      return { idx: i, bottle: b, shared, strength: shared.length, isOpposing, isComplementary: shared.length > 0, family: bFamily, _type: b._type };
    }).filter(Boolean).sort((a, b) => b.strength - a.strength);
  }, [selected, allActive, opposingPairs, noteOverrides]);

  const rejectedSet = useMemo(() => new Set(rejectedPairings || []), [rejectedPairings]);
  const getPairKey = (nameA, nameB) => [nameA, nameB].sort().join("||");

  const filteredPairings = useMemo(() => {
    let list = pairings;
    if (pairMode === "complementary") list = list.filter(p => p.isComplementary);
    if (pairMode === "opposing") list = list.filter(p => p.isOpposing);
    return list.filter(p => !rejectedSet.has(getPairKey(allActive[selected]?.name, p.bottle.name)));
  }, [pairings, pairMode, rejectedSet, selected, allActive]);

  const rejectedFromSelected = useMemo(() => {
    if (selected === null) return [];
    return pairings.filter(p => rejectedSet.has(getPairKey(allActive[selected]?.name, p.bottle.name)));
  }, [pairings, rejectedSet, selected, allActive]);

  const pairedIndices = useMemo(() => new Set(filteredPairings.map(p => p.idx)), [filteredPairings]);

  /* Dimensions — match app */
  const viewSize = 1200, pad = 150;
  const cx = viewSize / 2, cy = viewSize / 2;
  const catOuterR = 360, catInnerR = 150;
  const ownedR = 430, ownedDotR = 15;
  const testerR = 490, testerDotR = 9;
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
    const b1 = allActive[i1], b2 = allActive[i2];
    if (!b1 || !b2) return "";
    const isT1 = b1._type === "tester", isT2 = b2._type === "tester";
    const pos1 = isT1 ? layout.testerPos[testerBottles.indexOf(b1)] : layout.ownedPos[ownedBottles.indexOf(b1)];
    const pos2 = isT2 ? layout.testerPos[testerBottles.indexOf(b2)] : layout.ownedPos[ownedBottles.indexOf(b2)];
    if (!pos1 || !pos2) return "";
    const r1 = isT1 ? testerR : ownedR, r2 = isT2 ? testerR : ownedR;
    const x1 = cx + Math.cos(pos1.angle) * r1, y1 = cy + Math.sin(pos1.angle) * r1;
    const x2 = cx + Math.cos(pos2.angle) * r2, y2 = cy + Math.sin(pos2.angle) * r2;
    const pull = 0.06;
    return `M${x1},${y1} Q${cx + ((x1-cx)+(x2-cx))*pull},${cy + ((y1-cy)+(y2-cy))*pull} ${x2},${y2}`;
  }, [layout, allActive, cx, cy, ownedR, testerR, ownedBottles, testerBottles]);

  const getPos = (idx) => {
    const b = allActive[idx];
    if (!b) return null;
    if (b._type === "tester") return layout.testerPos[testerBottles.indexOf(b)];
    return layout.ownedPos[ownedBottles.indexOf(b)];
  };

  if (ownedBottles.length + testerBottles.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>🔗</div>
        <p style={{ fontFamily: ff.display, fontSize: 17, color: PAL.cream }}>Add notes to at least 2 owned or tester fragrances</p>
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
              fontFamily: ff.body, fontSize: 10, color: pairMode === m.k ? (m.c || PAL.gold) : PAL.muted, cursor: "pointer",
            }}>{m.l}</button>
          ))}
        </div>
      )}

      {/* Wheel */}
      <div style={{ width: "100%", maxWidth: viewSize + pad * 2, margin: "0 auto" }}>
        <svg viewBox={`${-pad} ${-pad} ${viewSize + pad * 2} ${viewSize + pad * 2}`} width="100%">

          {/* Category arcs with stacked text */}
          {layout.active.map(fam => {
            const pos = layout.families[fam];
            const color = FAMILY_COLORS[fam];
            const midA = pos.mid, lr = (catInnerR + catOuterR) / 2;
            const lx = cx + Math.cos(midA) * lr, ly = cy + Math.sin(midA) * lr;
            const deg = midA * (180 / Math.PI), flip = deg > 90 || deg < -90;
            const isActive = activeIdx !== null && (() => {
              const p = getPos(activeIdx);
              return p?.family === fam;
            })();
            const label = FAMILY_LABELS[fam] || fam;
            const parts = label.includes("&") ? label.split(" & ") : label.length > 8 ? [label.split(" ")[0], label.split(" ").slice(1).join(" ")] : [label];
            const isTwoLine = parts.length > 1;
            return (
              <g key={`cat-${fam}`}>
                <path d={arcPath(catInnerR, catOuterR, pos.start, pos.end)}
                  fill={color} opacity={activeIdx !== null ? (isActive ? 0.4 : 0.06) : pos.hasOwned ? 0.18 : 0.08}
                  stroke={PAL.bg} strokeWidth="3" style={{ transition: "opacity .4s" }} />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                  fill={isActive || activeIdx === null ? color : "#2a2318"}
                  fontSize="20" fontFamily={ff.body} fontWeight="600" letterSpacing="2.5"
                  opacity={pos.hasOwned ? 1 : 0.5}
                  style={{ textTransform: "uppercase", transition: "fill .3s" }}>
                  {isTwoLine ? (<><tspan x={lx} dy="-12">{parts[0]}</tspan><tspan x={lx} dy="24">{"& " + parts[1]}</tspan></>) : label}
                </text>
              </g>
            );
          })}

          {/* Ring guides */}
          <circle cx={cx} cy={cy} r={ownedR} fill="none" stroke={PAL.border} strokeWidth=".5" opacity=".12" />
          <circle cx={cx} cy={cy} r={testerR} fill="none" stroke={PAL.border} strokeWidth=".4" opacity=".06" strokeDasharray="3,6" />

          {/* Spokes (owned only) */}
          {ownedBottles.map((b, i) => {
            const pos = layout.ownedPos[i]; if (!pos) return null;
            const x1 = cx + Math.cos(pos.angle) * catOuterR, y1 = cy + Math.sin(pos.angle) * catOuterR;
            const x2 = cx + Math.cos(pos.angle) * (ownedR - ownedDotR - 3), y2 = cy + Math.sin(pos.angle) * (ownedR - ownedDotR - 3);
            const allIdx = allActive.indexOf(allActive.find(a => a._type === "owned" && ownedBottles.indexOf(a) === i));
            const isAct = activeIdx === allIdx || (showPairings && pairedIndices.has(allIdx));
            return <line key={`sp-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={FAMILY_COLORS[pos.family]} strokeWidth={isAct ? 1.5 : 0.4}
              opacity={activeIdx !== null ? (isAct ? 0.5 : 0.03) : 0.1}
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

          {/* TESTER DOTS (behind) */}
          {testerBottles.map((b, i) => {
            const pos = layout.testerPos[i]; if (!pos) return null;
            const allIdx = ownedBottles.length + i;
            const color = FAMILY_COLORS[pos.family];
            const x = cx + Math.cos(pos.angle) * testerR, y = cy + Math.sin(pos.angle) * testerR;
            const isSel = selected === allIdx, isHov = hovered === allIdx && hovType === "tester";
            const isPaired = showPairings && pairedIndices.has(allIdx);
            const dimmed = activeIdx !== null && !isSel && !isPaired && !isHov;
            return (
              <g key={`t-${i}`} onClick={() => setSelected(selected === allIdx ? null : allIdx)}
                onMouseEnter={() => { setHovered(allIdx); setHovType("tester"); }}
                onMouseLeave={() => { setHovered(null); setHovType(null); }}
                style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={isHov || isSel ? 20 : 16} fill={color} opacity={dimmed ? 0 : isHov ? ".1" : ".04"} style={{ transition: "all .2s" }} />
                {isSel && <circle cx={x} cy={y} r={testerDotR + 7} fill="none" stroke={color} strokeWidth="1" opacity=".3">
                  <animate attributeName="r" values={`${testerDotR+4};${testerDotR+9};${testerDotR+4}`} dur="2.5s" repeatCount="indefinite" />
                </circle>}
                <circle cx={x} cy={y} r={isHov || isSel ? testerDotR + 2 : testerDotR}
                  fill="transparent" stroke={color} strokeWidth={1.5}
                  strokeDasharray="2.5,2" opacity={dimmed ? 0.1 : isHov || isSel ? 0.9 : 0.5}
                  style={{ transition: "all .2s" }} />
                {isPaired && filteredPairings.find(p => p.idx === allIdx) && (
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={color} fontSize="8" fontWeight="600" fontFamily={ff.body} opacity=".7">
                    {filteredPairings.find(p => p.idx === allIdx).strength || "↔"}</text>
                )}
                {(isHov || isSel) && (() => {
                  const lx = cx + Math.cos(pos.angle) * labelR, ly = cx + Math.sin(pos.angle) * labelR;
                  const deg = pos.angle * (180 / Math.PI), flip = deg > 90 || deg < -90;
                  return (<>
                    <text x={lx} y={ly - 1} textAnchor={flip ? "end" : "start"} dominantBaseline="middle"
                      transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                      fill={PAL.cream} fontSize="15" fontFamily={ff.display} fontStyle="italic">{b.name}  ᵗ</text>
                    <text x={lx} y={ly + 14} textAnchor={flip ? "end" : "start"} dominantBaseline="middle"
                      transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                      fill={PAL.muted} fontSize="11" fontFamily={ff.body}>{b.house}</text>
                  </>);
                })()}
              </g>
            );
          })}

          {/* OWNED DOTS (in front) */}
          {ownedBottles.map((b, i) => {
            const pos = layout.ownedPos[i]; if (!pos) return null;
            const allIdx = i;
            const color = FAMILY_COLORS[pos.family];
            const x = cx + Math.cos(pos.angle) * ownedR, y = cy + Math.sin(pos.angle) * ownedR;
            const isSel = selected === allIdx, isHov = hovered === allIdx && hovType === "owned";
            const isPaired = showPairings && pairedIndices.has(allIdx);
            const dimmed = activeIdx !== null && !isSel && !isPaired && !isHov;
            const pair = isPaired ? filteredPairings.find(pp => pp.idx === allIdx) : null;
            return (
              <g key={`o-${i}`} onClick={() => setSelected(selected === allIdx ? null : allIdx)}
                onMouseEnter={() => { setHovered(allIdx); setHovType("owned"); }}
                onMouseLeave={() => { setHovered(null); setHovType(null); }}
                style={{ cursor: "pointer" }}>
                {isSel && <circle cx={x} cy={y} r={ownedDotR + 8} fill="none" stroke={color} strokeWidth="1.5" opacity=".3">
                  <animate attributeName="r" values={`${ownedDotR+5};${ownedDotR+11};${ownedDotR+5}`} dur="2.5s" repeatCount="indefinite" />
                </circle>}
                {(isHov || isSel) && <circle cx={x} cy={y} r={ownedDotR + 5} fill={color} opacity=".12" />}
                <circle cx={x} cy={y} r={isSel ? ownedDotR + 3 : isHov ? ownedDotR + 2 : ownedDotR}
                  fill={dimmed ? "#1a1710" : color} stroke={isSel ? PAL.cream : isHov ? color : PAL.bg}
                  strokeWidth={isSel ? 2.5 : 2} opacity={dimmed ? 0.15 : 1}
                  style={{ transition: "all .25s" }} />
                {isPaired && pair && (
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={PAL.bg} fontSize="13" fontWeight="700" fontFamily={ff.body}>{pair.strength || "↔"}</text>
                )}
                {(isHov || isSel) && (() => {
                  const lx = cx + Math.cos(pos.angle) * labelR, ly = cy + Math.sin(pos.angle) * labelR;
                  const deg = pos.angle * (180 / Math.PI), flip = deg > 90 || deg < -90;
                  return (
                    <text x={lx} y={ly} textAnchor={flip ? "end" : "start"} dominantBaseline="middle"
                      transform={`rotate(${flip ? deg + 180 : deg}, ${lx}, ${ly})`}
                      fill={PAL.cream} fontSize="18" fontFamily={ff.display} fontStyle="italic">{b.name}</text>
                  );
                })()}
              </g>
            );
          })}

          {/* Center */}
          <circle cx={cx} cy={cy} r={catInnerR - 8} fill={PAL.bg} stroke={PAL.border} strokeWidth=".5" />
          {selected !== null ? (<>
            <text x={cx} y={cy - 28} textAnchor="middle" fill={PAL.muted} fontSize="12" letterSpacing="5" style={{ textTransform: "uppercase" }}>Selected</text>
            <text x={cx} y={cy + 6} textAnchor="middle" fill={PAL.cream} fontSize="28" fontFamily={ff.display} fontStyle="italic">
              {allActive[selected]?.name?.length > 16 ? allActive[selected].name.slice(0, 15) + "…" : allActive[selected]?.name}
            </text>
            <text x={cx} y={cy + 34} textAnchor="middle" fill={PAL.gold} fontSize="14" fontFamily={ff.body}>
              {filteredPairings.filter(p => p.isComplementary).length} complementary · {filteredPairings.filter(p => p.isOpposing).length} opposing
            </text>
            <text x={cx} y={cy + 58} textAnchor="middle" fill={PAL.muted} fontSize="13" fontFamily={ff.body}
              style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); setSelected(null); }}>✕ clear</text>
          </>) : (<>
            <text x={cx} y={cy - 16} textAnchor="middle" fill={PAL.muted} fontSize="12" letterSpacing="6" style={{ textTransform: "uppercase" }}>Your</text>
            <text x={cx} y={cy + 16} textAnchor="middle" fill={PAL.cream} fontSize="32" fontFamily={ff.display} fontStyle="italic">Collection</text>
            <text x={cx} y={cy + 42} textAnchor="middle" fill={PAL.muted} fontSize="14">{ownedBottles.length} owned · {testerBottles.length} testers</text>
          </>)}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
        {layout.active.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: FAMILY_COLORS[f] }} />
            <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: FAMILY_COLORS[f] }}>{FAMILY_LABELS[f]}</span>
          </div>
        ))}
        <span style={{ width: 1, height: 14, background: PAL.border, margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: PAL.muted }} />
          <span style={{ fontSize: 11, color: PAL.muted }}>Owned</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", border: `1.5px dashed ${PAL.muted}`, background: "transparent" }} />
          <span style={{ fontSize: 11, color: PAL.muted }}>Tester</span>
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
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: FAMILY_COLORS[getBottleFamily(allActive[selected])] }} />
            <span style={{ fontFamily: ff.display, fontSize: 22, fontStyle: "italic", color: PAL.cream }}>{allActive[selected]?.name}</span>
            <span style={{ fontSize: 13, color: PAL.muted }}>{allActive[selected]?.house}</span>
            {allActive[selected]?._type === "tester" && <span style={{ fontSize: 9, color: PAL.muted, border: `1px solid ${PAL.border}`, borderRadius: 4, padding: "1px 6px" }}>tester</span>}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
            {getBottleNotes(allActive[selected]).map((n, i) => {
              const nc = getNoteColor(n);
              return <span key={i} style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, color: nc, background: `${nc}15`, border: `1px solid ${nc}25` }}>{n}</span>;
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {filteredPairings.map((p, i) => {
              const isHov = hovered === p.idx;
              const typeColor = p.isOpposing && !p.isComplementary ? PAL.rose : p.isComplementary ? PAL.sage : PAL.gold;
              const typeLabel = p.isComplementary && p.isOpposing ? "Both" : p.isOpposing ? "Opposing" : "Complementary";
              const pairKey = getPairKey(allActive[selected]?.name, p.bottle.name);
              const rating = (pairingRatings && pairingRatings[pairKey]) || 0;
              return (
                <div key={i} onMouseEnter={() => { setHovered(p.idx); setHovType(p._type); }} onMouseLeave={() => { setHovered(null); setHovType(null); }}
                  style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    background: isHov ? `${PAL.cream}06` : "transparent", border: `1px solid ${isHov ? PAL.border : "transparent"}`, transition: "all .2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: FAMILY_COLORS[p.family], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: ff.display, fontSize: 15, fontStyle: "italic", color: PAL.cream }}>{p.bottle.name}</span>
                      <span style={{ fontSize: 11, color: PAL.muted, marginLeft: 6 }}>{p.bottle.house}</span>
                      {p._type === "tester" && <span style={{ fontSize: 8, color: PAL.muted, marginLeft: 4, border: `1px solid ${PAL.border}`, borderRadius: 3, padding: "0 4px" }}>t</span>}
                    </div>
                    <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}25` }}>{typeLabel}</span>
                    {p.shared.length > 0 && <div style={{ display: "flex", gap: 2 }}>{p.shared.slice(0, 3).map((n, j) => {
                      const nc = getNoteColor(n);
                      return <span key={j} style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, color: nc, background: `${nc}10`, border: `1px solid ${nc}18` }}>{n}</span>;
                    })}</div>}
                    <span style={{ fontFamily: ff.display, fontSize: 18, color: PAL.gold, minWidth: 24, textAlign: "right" }}>{p.strength || "↔"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase", minWidth: 42 }}>Rating</span>
                    <input type="range" min="0" max="10" step="0.5" value={rating}
                      onChange={e => { e.stopPropagation(); setPairingRatings(prev => ({ ...prev, [pairKey]: parseFloat(e.target.value) })); }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, height: 4, appearance: "none", background: PAL.border, borderRadius: 2, outline: "none", cursor: "pointer", accentColor: PAL.gold }} />
                    <span style={{ fontFamily: ff.display, fontSize: 14, color: rating > 0 ? PAL.gold : PAL.muted, minWidth: 24, textAlign: "right" }}>{rating > 0 ? rating : "—"}</span>
                    <button onClick={e => { e.stopPropagation(); setRejectedPairings(prev => [...prev, pairKey]); }}
                      title="Reject" style={{ background: `${PAL.rose}10`, border: `1px solid ${PAL.rose}25`, borderRadius: 6, padding: "4px 8px", color: PAL.rose, fontFamily: ff.body, fontSize: 9, cursor: "pointer" }}>✕</button>
                  </div>
                  <input value={(pairingNotes && pairingNotes[pairKey]) || ""}
                    onChange={e => { e.stopPropagation(); setPairingNotes(prev => ({ ...prev, [pairKey]: e.target.value })); }}
                    onClick={e => e.stopPropagation()} placeholder="Add pairing notes…"
                    style={{ width: "100%", marginTop: 6, background: `${PAL.cream}04`, border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "6px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                </div>
              );
            })}
          </div>
          {rejectedFromSelected.length > 0 && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${PAL.border}`, paddingTop: 12 }}>
              <button onClick={() => setShowRejected(!showRejected)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: ff.body, fontSize: 11, color: PAL.muted, letterSpacing: 1.5,
                textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, padding: 0,
              }}><span style={{ fontSize: 8, transform: showRejected ? "rotate(90deg)" : "none", transition: "transform .2s" }}>▶</span>
                Rejected ({rejectedFromSelected.length})</button>
              {showRejected && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {rejectedFromSelected.map((p, i) => {
                    const pairKey = getPairKey(allActive[selected]?.name, p.bottle.name);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: `${PAL.rose}04`, border: `1px solid ${PAL.rose}12`, opacity: .6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: FAMILY_COLORS[p.family] }} />
                        <span style={{ fontFamily: ff.display, fontSize: 13, fontStyle: "italic", color: PAL.cream, flex: 1 }}>{p.bottle.name}</span>
                        <button onClick={e => { e.stopPropagation(); setRejectedPairings(prev => prev.filter(k => k !== pairKey)); }}
                          style={{ background: `${PAL.sage}12`, border: `1px solid ${PAL.sage}30`, borderRadius: 6, padding: "3px 10px", color: PAL.sage, fontFamily: ff.body, fontSize: 9, cursor: "pointer" }}>Restore</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PairingWheel;
