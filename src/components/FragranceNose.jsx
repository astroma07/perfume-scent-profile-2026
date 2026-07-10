import { useState, useMemo, useEffect } from "react";
import { PAL, ff } from "../constants.js";
import { FAMILY_ORDER, FAMILY_COLORS, FAMILY_LABELS, getNoteFamily } from "../noteCategories.js";

const FAMILIES = FAMILY_ORDER.map(k => ({ key: k, label: FAMILY_LABELS[k] || k, color: FAMILY_COLORS[k] || "#888" }));

const FragranceNose = ({ bottles, testedScents, noteOverrides, likedNotes, setLikedNotes, dislikedNotes, setDislikedNotes }) => {
  const [hovered, setHovered] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [addTarget, setAddTarget] = useState("liked");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const t = tick * 0.02;
  const n = FAMILIES.length;
  const cx = 500, cy = 500, maxR = 340;

  const getPos = (idx, r) => {
    const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, angle };
  };

  /* Compute category scores from collection */
  const profile = useMemo(() => {
    const scores = {};
    FAMILIES.forEach(f => { scores[f.key] = 0; });
    const fragsPerCat = {};
    FAMILIES.forEach(f => { fragsPerCat[f.key] = []; });

    const processBottle = (b, weight) => {
      const notes = (b.userNotes || "").split(",").map(nn => nn.trim().toLowerCase()).filter(Boolean);
      const catHits = {};
      notes.forEach(nn => {
        const fam = getNoteFamily(nn, noteOverrides);
        scores[fam] = (scores[fam] || 0) + weight;
        catHits[fam] = (catHits[fam] || 0) + weight;
      });
      Object.entries(catHits).forEach(([fam, w]) => {
        fragsPerCat[fam].push({ name: b.name, house: b.house || "", weight: w });
      });
    };

    bottles.filter(b => b.name.trim()).forEach(b => {
      const w = b.status === "owned" ? 4 : b.status === "had" || b.status === "tried it" ? 2.5 : b.hasTester ? 3 : b.status === "wishlist" ? 1 : 0.5;
      const freq = 1 + Math.min((b.freq || 0) * 0.15, 2);
      processBottle({ ...b, userNotes: b.userNotes }, w * freq);
    });

    (testedScents || []).forEach(ts => {
      processBottle({ name: ts.name, house: ts.house, userNotes: ts.notes }, 2);
    });

    const maxScore = Math.max(...Object.values(scores), 1);
    return FAMILIES.map(f => ({
      ...f,
      score: scores[f.key] || 0,
      pct: (scores[f.key] || 0) / maxScore,
      fragrances: fragsPerCat[f.key].sort((a, b) => b.weight - a.weight)
        .filter((v, i, arr) => arr.findIndex(x => x.name === v.name) === i),
    }));
  }, [bottles, testedScents, noteOverrides]);

  const topCategories = [...profile].sort((a, b) => b.score - a.score);
  const strongSuit = topCategories.slice(0, 3);
  const blind = topCategories.filter(c => c.score === 0);

  const webPoints = profile.map((f, i) => {
    const r = 80 + f.pct * (maxR - 80);
    return getPos(i, r);
  });
  const webPath = webPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  const totalFrags = new Set(bottles.filter(b => b.name.trim()).map(b => b.name)).size;

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: 6, textTransform: "uppercase", color: PAL.muted, marginBottom: 6 }}>Olfactory · Identity</div>
        <h2 style={{ fontFamily: ff.display, fontSize: 28, fontWeight: 400, fontStyle: "italic", margin: "0 0 6px" }}>Your Fragrance Nose</h2>
        <p style={{ fontSize: 12, color: PAL.muted, lineHeight: 1.5 }}>A map of your scent identity — what draws you and where you might explore next.</p>
      </div>

      {/* Strong suit badges */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
        {strongSuit.filter(c => c.score > 0).map((c, i) => (
          <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: `${c.color}10`, border: `1px solid ${c.color}30`, borderRadius: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
            <span style={{ fontFamily: ff.display, fontSize: 13, fontStyle: "italic", color: c.color }}>{c.label}</span>
            <span style={{ fontSize: 9, color: PAL.muted }}>#{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Web Graph */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <svg viewBox="0 0 1000 1000" width="100%">
          <defs>
            {profile.map((f, i) => {
              const next = profile[(i + 1) % n];
              return (
                <linearGradient key={`grad-${i}`} id={`noseGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={f.color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={next.color} stopOpacity="0.3" />
                </linearGradient>
              );
            })}
            <radialGradient id="noseCenterGlow">
              <stop offset="0%" stopColor={PAL.gold} stopOpacity="0.06" />
              <stop offset="100%" stopColor={PAL.bg} stopOpacity="0" />
            </radialGradient>
            {profile.map((f, i) => (
              <radialGradient key={`flow-${i}`} id={`noseFlow${i}`}
                cx={`${50 + Math.sin(t + i * 0.5) * 25}%`}
                cy={`${50 + Math.cos(t + i * 0.7) * 25}%`}
                r="85%">
                <stop offset="0%" stopColor={f.color} stopOpacity={0.2 + Math.sin(t + i) * 0.06} />
                <stop offset="40%" stopColor={f.color} stopOpacity="0.08" />
                <stop offset="100%" stopColor={f.color} stopOpacity="0" />
              </radialGradient>
            ))}
            {profile.map((f, i) => {
              const p = webPoints[i] || { x: cx, y: cy };
              return (
                <radialGradient key={`vtx-${i}`} id={`noseVtx${i}`}
                  cx={p.x} cy={p.y} r={maxR * 0.8}
                  gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={f.color} stopOpacity={0.35 + Math.sin(t * 0.3 + i) * 0.05} />
                  <stop offset="30%" stopColor={f.color} stopOpacity="0.12" />
                  <stop offset="70%" stopColor={f.color} stopOpacity="0.03" />
                  <stop offset="100%" stopColor={f.color} stopOpacity="0" />
                </radialGradient>
              );
            })}
            <filter id="noseSoftBlur"><feGaussianBlur stdDeviation="18" /></filter>
            <filter id="noseGentleBlur"><feGaussianBlur stdDeviation="8" /></filter>
          </defs>

          {/* Background rings */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((r, i) => (
            <polygon key={`ring-${i}`}
              points={FAMILIES.map((_, j) => { const p = getPos(j, 80 + r * (maxR - 80)); return `${p.x},${p.y}`; }).join(" ")}
              fill="none" stroke={PAL.border} strokeWidth={i === 4 ? "1" : "0.5"} opacity={i === 4 ? "0.25" : "0.1"} />
          ))}

          {/* Spokes */}
          {profile.map((f, i) => {
            const outer = getPos(i, maxR + 20);
            return <line key={`spoke-${i}`} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke={f.color} strokeWidth="0.5" opacity="0.15" />;
          })}

          {/* Flowing gradient zones */}
          {profile.map((f, i) => {
            if (f.pct < 0.05) return null;
            const p = webPoints[i];
            const prev = webPoints[(i - 1 + n) % n];
            const next = webPoints[(i + 1) % n];
            const ext = 1.4;
            const ep = { x: cx + (p.x - cx) * ext, y: cy + (p.y - cy) * ext };
            const eprev = { x: cx + (prev.x - cx) * ext, y: cy + (prev.y - cy) * ext };
            const enext = { x: cx + (next.x - cx) * ext, y: cy + (next.y - cy) * ext };
            return (
              <path key={`zone-${i}`}
                d={`M${cx},${cy} L${eprev.x},${eprev.y} Q${ep.x},${ep.y} ${enext.x},${enext.y} Z`}
                fill={`url(#noseFlow${i})`} filter="url(#noseSoftBlur)"
                style={{ mixBlendMode: "screen" }} />
            );
          })}

          {/* Web outline */}
          <path d={webPath} fill="none" stroke={PAL.gold} strokeWidth="1" opacity="0.2" />

          {/* Per-vertex gradient fills */}
          {profile.map((f, i) => {
            if (f.pct < 0.05) return null;
            return (
              <path key={`vtxfill-${i}`} d={webPath}
                fill={`url(#noseVtx${i})`}
                opacity={0.6 + Math.sin(t * 0.4 + i * 0.8) * 0.1}
                style={{ mixBlendMode: "screen" }} />
            );
          })}

          {/* Intertwining ribbons */}
          {profile.map((f, i) => {
            if (f.pct < 0.1) return null;
            const p1 = webPoints[i], p2 = webPoints[(i + 1) % n], p3 = webPoints[(i + 2) % n];
            return (
              <g key={`ribbon-${i}`} opacity={0.25 + Math.sin(t * 0.7 + i) * 0.08} filter="url(#noseGentleBlur)">
                <path d={`M${p1.x},${p1.y} Q${(p1.x+p2.x)/2+Math.sin(t+i)*8},${(p1.y+p2.y)/2+Math.cos(t+i)*8} ${p2.x},${p2.y}`}
                  fill="none" stroke={f.color} strokeWidth={2 + f.pct * 3} strokeLinecap="round" opacity="0.4" />
                <path d={`M${p2.x},${p2.y} Q${(p2.x+p3.x)/2+Math.cos(t+i)*6},${(p2.y+p3.y)/2+Math.sin(t+i)*6} ${p3.x},${p3.y}`}
                  fill="none" stroke={profile[(i+1)%n].color} strokeWidth={1 + f.pct * 2} strokeLinecap="round" opacity="0.25" />
              </g>
            );
          })}

          {/* Center */}
          <circle cx={cx} cy={cy} r={4} fill={PAL.gold} opacity="0.5" />

          {/* Fragrance dots */}
          {profile.map((f, i) => {
            const sectorAngle = (1 / n) * Math.PI * 2;
            const sectorStart = (i / n) * Math.PI * 2 - Math.PI / 2 - sectorAngle * 0.3;
            const sectorWidth = sectorAngle * 0.6;
            return f.fragrances.map((frag, j) => {
              const baseR = 90 + (frag.weight / 6) * (f.pct * maxR * 0.65);
              const jitter = ((j * 7 + i * 13) % 14 - 7);
              const r = Math.min(baseR + jitter, 80 + f.pct * (maxR - 80) - 8);
              const anglePos = f.fragrances.length <= 1 ? 0.5 : j / (f.fragrances.length - 1);
              const angle = sectorStart + anglePos * sectorWidth;
              const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
              const isHov = hovered === `${f.key}-${j}`;
              const dotSize = 2 + frag.weight * 0.6;
              return (
                <g key={`dot-${f.key}-${j}`} onMouseEnter={() => setHovered(`${f.key}-${j}`)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={isHov ? 18 : 7} fill={f.color} opacity={isHov ? 0.15 : 0.03 + Math.sin(t * 0.5 + j + i) * 0.02} style={{ transition: "all .3s" }} />
                  <circle cx={x} cy={y} r={isHov ? dotSize + 2 : dotSize} fill={f.color} opacity={isHov ? 1 : 0.7} stroke={isHov ? PAL.cream : "none"} strokeWidth={isHov ? 1 : 0} style={{ transition: "all .2s" }} />
                  {isHov && (
                    <g>
                      <rect x={x - 80} y={y - 44} width="160" height="38" rx="8" fill={PAL.bg} stroke={f.color} strokeWidth="1" opacity="0.95" />
                      <text x={x} y={y - 30} textAnchor="middle" dominantBaseline="middle" fill={PAL.cream} fontSize="14" fontFamily={ff.display} fontStyle="italic">{frag.name}</text>
                      <text x={x} y={y - 15} textAnchor="middle" dominantBaseline="middle" fill={PAL.muted} fontSize="9" fontFamily={ff.body}>{frag.house}</text>
                    </g>
                  )}
                </g>
              );
            });
          })}

          {/* Category labels */}
          {profile.map((f, i) => {
            const p = getPos(i, maxR + 44);
            return (
              <g key={`label-${i}`}>
                <circle cx={p.x} cy={p.y} r={12} fill={f.color} opacity={f.pct * 0.25} />
                <text x={p.x} y={p.y - 9} textAnchor="middle" dominantBaseline="middle" fill={f.color} fontSize="16" fontWeight="600" fontFamily={ff.body} letterSpacing="1" style={{ textTransform: "uppercase" }}>{f.label}</text>
                <text x={p.x} y={p.y + 7} textAnchor="middle" dominantBaseline="middle" fill={PAL.muted} fontSize="9" fontFamily={ff.body}>{f.fragrances.length} frag{f.fragrances.length !== 1 ? "s" : ""} · {Math.round(f.pct * 100)}%</text>
              </g>
            );
          })}

          {[20, 40, 60, 80, 100].map((pct, i) => (
            <text key={`pct-${i}`} x={cx + 6} y={cy - (80 + (pct / 100) * (maxR - 80))} fill={PAL.muted} fontSize="8" opacity="0.25">{pct}%</text>
          ))}
        </svg>
      </div>

      {/* Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "14px 18px" }}>
          <h3 style={{ fontFamily: ff.display, fontSize: 15, fontStyle: "italic", margin: "0 0 10px", color: PAL.gold }}>Your Signatures</h3>
          {topCategories.slice(0, 5).filter(c => c.score > 0).map((c, i) => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: ff.display, fontSize: 14, color: PAL.gold, width: 18 }}>{i + 1}</span>
              <div style={{ flex: 1, height: 5, background: PAL.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${c.pct * 100}%`, height: "100%", background: c.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: ff.body, fontSize: 11, color: c.color, minWidth: 55 }}>{c.label}</span>
              <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted }}>{c.fragrances.length}</span>
            </div>
          ))}
        </div>
        <div style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "14px 18px" }}>
          <h3 style={{ fontFamily: ff.display, fontSize: 15, fontStyle: "italic", margin: "0 0 10px", color: PAL.muted }}>Unexplored</h3>
          {blind.length > 0 ? blind.map(c => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, opacity: 0.5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", border: `1px dashed ${c.color}` }} />
              <span style={{ fontSize: 11, color: c.color }}>{c.label}</span>
              <span style={{ fontSize: 9, color: PAL.muted }}>— none yet</span>
            </div>
          )) : <p style={{ fontSize: 11, color: PAL.sage }}>You've explored every category!</p>}
          {topCategories.slice(-3).reverse().filter(c => c.score > 0).length > 0 && (
            <div style={{ marginTop: 10 }}>
              <h4 style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 6 }}>Least represented</h4>
              {topCategories.slice(-3).reverse().filter(c => c.score > 0).map(c => (
                <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, opacity: 0.7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color }} />
                  <span style={{ fontSize: 11, color: c.color }}>{c.label}</span>
                  <span style={{ fontSize: 9, color: PAL.muted }}>({c.fragrances.length})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note preferences */}
      <div style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "14px 18px", marginBottom: 18 }}>
        <h3 style={{ fontFamily: ff.display, fontSize: 15, fontStyle: "italic", margin: "0 0 12px" }}>Note Preferences</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <h4 style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.sage, marginBottom: 6 }}>Notes I Love</h4>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(likedNotes || []).map(note => (
                <span key={note} onClick={() => setLikedNotes(prev => prev.filter(n => n !== note))}
                  style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "3px 9px", borderRadius: 5, color: PAL.sage, background: `${PAL.sage}15`, border: `1px solid ${PAL.sage}30`, cursor: "pointer", fontFamily: ff.body }}>{note} ×</span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.rose, marginBottom: 6 }}>Notes I Avoid</h4>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(dislikedNotes || []).map(note => (
                <span key={note} onClick={() => setDislikedNotes(prev => prev.filter(n => n !== note))}
                  style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "3px 9px", borderRadius: 5, color: PAL.rose, background: `${PAL.rose}15`, border: `1px solid ${PAL.rose}30`, cursor: "pointer", fontFamily: ff.body }}>{note} ×</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && noteInput.trim()) { if (addTarget === "liked") setLikedNotes(prev => [...(prev || []), noteInput.trim().toLowerCase()]); else setDislikedNotes(prev => [...(prev || []), noteInput.trim().toLowerCase()]); setNoteInput(""); } }}
            placeholder="Add a note…"
            style={{ flex: 1, background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "8px 12px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none" }} />
          <button onClick={() => setAddTarget("liked")} style={{ padding: "5px 10px", borderRadius: 6, cursor: "pointer", background: addTarget === "liked" ? `${PAL.sage}20` : "transparent", border: `1px solid ${addTarget === "liked" ? PAL.sage : PAL.border}`, color: addTarget === "liked" ? PAL.sage : PAL.muted, fontSize: 10, fontFamily: ff.body }}>♥ Love</button>
          <button onClick={() => setAddTarget("disliked")} style={{ padding: "5px 10px", borderRadius: 6, cursor: "pointer", background: addTarget === "disliked" ? `${PAL.rose}20` : "transparent", border: `1px solid ${addTarget === "disliked" ? PAL.rose : PAL.border}`, color: addTarget === "disliked" ? PAL.rose : PAL.muted, fontSize: 10, fontFamily: ff.body }}>✕ Avoid</button>
        </div>
      </div>

      {/* Identity summary */}
      <div style={{ textAlign: "center", padding: "16px 20px", background: `${PAL.gold}04`, border: `1px solid ${PAL.gold}15`, borderRadius: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: 5, textTransform: "uppercase", color: PAL.muted, marginBottom: 4 }}>Your Scent Identity</div>
        <p style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic", margin: "0 0 6px", lineHeight: 1.4 }}>
          {strongSuit.filter(c => c.score > 0).map(c => c.label).join(", ")}
        </p>
        <p style={{ fontSize: 11, color: PAL.muted, lineHeight: 1.5, maxWidth: 480, margin: "0 auto" }}>
          {totalFrags} fragrances spanning {profile.filter(f => f.score > 0).length} of 12 note families.
          {blind.length > 0 ? ` Unexplored: ${blind.map(b => b.label.toLowerCase()).join(", ")}.` : " Every corner of the fragrance map covered."}
        </p>
      </div>
    </div>
  );
};

export default FragranceNose;
