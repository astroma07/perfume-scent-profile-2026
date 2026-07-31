import { useState, useMemo, useEffect } from "react";
import { PAL, ff } from "../constants.js";
import { FAMILY_COLORS, getNoteFamily } from "../noteCategories.js";
import { SectionTitle } from "./ui.jsx";

const DEFAULT_VIBE_MAP = {
  confident: ["oud", "leather", "amber", "saffron", "tobacco"],
  cozy: ["vanilla", "amber", "cashmere", "sandalwood", "tonka bean"],
  mysterious: ["oud", "myrrh", "incense", "leather", "black pepper"],
  romantic: ["rose", "jasmine", "vanilla", "musk", "iris"],
  powerful: ["oud", "leather", "saffron", "amber", "patchouli"],
  calm: ["lavender", "sandalwood", "chamomile", "cedar", "musk"],
  playful: ["bergamot", "peach", "raspberry", "mandarin", "coconut"],
  sensual: ["vanilla", "amber", "musk", "oud", "rose"],
  rebellious: ["leather", "smoke", "birch tar", "pepper", "tobacco"],
  dreamy: ["iris", "violet", "musk", "ambrette", "fig"],
  nostalgic: ["tobacco", "vanilla", "hay", "cedar", "fig"],
  grounded: ["vetiver", "patchouli", "oakmoss", "earth", "cedar"],
  energized: ["grapefruit", "bergamot", "ginger", "cardamom", "lemon"],
  elegant: ["iris", "violet", "leather", "sandalwood", "rose"],
  wild: ["vetiver", "labdanum", "smoke", "moss", "earth"],
  moody: ["myrrh", "incense", "smoke", "leather", "labdanum"],
  fresh: ["bergamot", "lemon", "mint", "green tea", "cucumber"],
  warm: ["amber", "vanilla", "cinnamon", "sandalwood", "benzoin"],
  cool: ["mint", "violet", "iris", "vetiver", "ambrette"],
  dark: ["oud", "birch tar", "smoke", "leather", "myrrh"],
  soft: ["musk", "cashmere", "iris", "peony", "cotton"],
  sharp: ["galbanum", "black pepper", "vetiver", "ginger", "juniper"],
  sweet: ["vanilla", "tonka bean", "praline", "caramel", "honey"],
  earthy: ["vetiver", "patchouli", "earth", "moss", "mushroom"],
  clean: ["white musk", "soap", "linen", "aldehydes", "iris"],
  woody: ["sandalwood", "cedar", "guaiac", "oud", "cypress"],
  minimalist: ["iris", "cedar", "white musk", "aldehydes", "vetiver"],
  bohemian: ["patchouli", "incense", "sandalwood", "fig", "amber"],
  gothic: ["incense", "myrrh", "leather", "smoke", "labdanum"],
  preppy: ["bergamot", "green tea", "cedar", "lavender", "lemon"],
  vintage: ["rose", "powder", "iris", "aldehydes", "amber"],
  streetwear: ["ambroxan", "cedar", "pepper", "musk", "leather"],
  cocktail: ["rose", "oud", "saffron", "amber", "vanilla"],
  brunch: ["fig", "bergamot", "peach", "green tea", "linen"],
  interview: ["iris", "cedar", "white musk", "bergamot", "lavender"],
  "date night": ["oud", "vanilla", "rose", "amber", "musk"],
  beach: ["coconut", "salt", "tiare", "bergamot", "driftwood"],
  forest: ["pine", "moss", "fir", "cedar", "mushroom"],
  rain: ["petrichor", "ozone", "violet leaf", "earth", "moss"],
  velvet: ["iris", "amber", "vanilla", "sandalwood", "musk"],
  silk: ["rose", "peony", "iris", "musk", "bergamot"],
  leather: ["leather", "smoke", "tobacco", "oud", "birch tar"],
  suede: ["suede", "violet", "iris", "amber", "musk"],
  cashmere: ["cashmere", "musk", "sandalwood", "amber", "vanilla"],
  black: ["oud", "leather", "smoke", "incense", "black pepper"],
  gold: ["amber", "saffron", "honey", "benzoin", "labdanum"],
  green: ["galbanum", "fig leaf", "vetiver", "violet leaf", "moss"],
  red: ["rose", "saffron", "raspberry", "cinnamon", "oud"],
  white: ["iris", "lily", "jasmine", "musk", "aldehydes"],
};

const getNoteColor = (note) => {
  const n = note.toLowerCase();
  if (["rose", "jasmine", "iris", "violet", "peony", "lily"].some(f => n.includes(f))) return "#d4849a";
  if (["oud", "myrrh", "incense", "frankincense", "labdanum", "benzoin"].some(f => n.includes(f))) return "#a35a5a";
  if (["bergamot", "lemon", "grapefruit", "mandarin", "orange", "citrus"].some(f => n.includes(f))) return "#a8c256";
  if (["sandalwood", "cedar", "cypress", "guaiac", "pine", "fir"].some(f => n.includes(f))) return "#8a9e7a";
  if (["pepper", "saffron", "cardamom", "cinnamon", "ginger"].some(f => n.includes(f))) return "#d4944a";
  if (["smoke", "birch", "tobacco"].some(f => n.includes(f))) return "#8a6a4a";
  if (["vetiver", "patchouli", "moss", "earth", "petrichor"].some(f => n.includes(f))) return "#7a8a5a";
  if (["coconut", "fig", "peach", "raspberry", "fruit"].some(f => n.includes(f))) return "#c49bd4";
  if (["vanilla", "tonka", "honey", "praline", "caramel", "amber"].some(f => n.includes(f))) return "#c47a6b";
  if (["leather", "suede"].some(f => n.includes(f))) return "#8a6a4a";
  if (["musk", "cashmere", "cotton", "linen"].some(f => n.includes(f))) return "#9a8a7a";
  return PAL.gold;
};

const VibeCalculator = ({ bottles, vibeMap, setVibeMap }) => {
  const [vibeInput, setVibeInput] = useState("");
  const [activeVibes, setActiveVibes] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);
  const t = tick * 0.015;

  const currentMap = vibeMap && Object.keys(vibeMap).length > 0 ? vibeMap : DEFAULT_VIBE_MAP;

  const matchedVibes = useMemo(() => {
    const words = activeVibes.map(v => v.toLowerCase());
    return words.flatMap(w => {
      const exact = currentMap[w];
      if (exact) return [{ vibe: w, notes: exact, score: 1 }];
      return Object.entries(currentMap)
        .filter(([key]) => key.includes(w) || w.includes(key))
        .map(([key, notes]) => ({ vibe: key, notes, score: 0.7 }));
    }).filter((v, i, arr) => arr.findIndex(x => x.vibe === v.vibe) === i);
  }, [activeVibes, currentMap]);

  const matchedNotes = useMemo(() => {
    const noteScores = {};
    matchedVibes.forEach(mv => {
      mv.notes.forEach((note, i) => {
        const weight = (mv.notes.length - i) / mv.notes.length * mv.score;
        noteScores[note] = (noteScores[note] || 0) + weight;
      });
    });
    return noteScores;
  }, [matchedVibes]);

  const scoredFragrances = useMemo(() => {
    if (Object.keys(matchedNotes).length === 0) return [];
    return bottles.filter(b => b.name.trim() && (b.status === "owned" || b.status === "had" || b.status === "tried it" || b.hasTester))
      .map(frag => {
        const fragNotes = (frag.userNotes || "").split(",").map(n => n.trim().toLowerCase());
        let score = 0;
        const matched = [];
        fragNotes.forEach(fn => {
          Object.entries(matchedNotes).forEach(([note, weight]) => {
            if (fn.includes(note.toLowerCase()) || note.toLowerCase().includes(fn)) {
              score += weight;
              matched.push(note);
            }
          });
        });
        return { ...frag, score, matched: [...new Set(matched)] };
      }).filter(f => f.score > 0).sort((a, b) => b.score - a.score);
  }, [matchedNotes, bottles]);

  const addVibe = (word) => {
    const w = word.trim().toLowerCase();
    if (w && !activeVibes.includes(w)) setActiveVibes(prev => [...prev, w]);
    setVibeInput("");
  };

  const suggestions = useMemo(() => {
    if (!vibeInput.trim()) return [];
    const q = vibeInput.toLowerCase();
    return Object.keys(currentMap).filter(k => k.includes(q) && !activeVibes.includes(k)).slice(0, 8);
  }, [vibeInput, activeVibes, currentMap]);

  const cx = 400, cy = 400, maxR = 320;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: 6, textTransform: "uppercase", color: PAL.muted, marginBottom: 6 }}>Scent · Synesthesia</div>
        <h2 style={{ fontFamily: ff.display, fontSize: 28, fontWeight: 400, fontStyle: "italic", margin: "0 0 6px" }}>Vibe Calculator</h2>
        <p style={{ fontSize: 12, color: PAL.muted, lineHeight: 1.5 }}>Describe your mood, outfit, or energy — discover which fragrances match.</p>
      </div>

      {/* Input */}
      <div style={{ maxWidth: 480, margin: "0 auto 10px", position: "relative" }}>
        <input value={vibeInput} onChange={e => setVibeInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addVibe(vibeInput); }}
          placeholder="Type a vibe… confident, velvet, dark, cozy"
          style={{ width: "100%", background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "14px 20px", color: PAL.cream, fontFamily: ff.display, fontSize: 16, fontStyle: "italic", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
        {suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 10, marginTop: 4, padding: "4px", zIndex: 10 }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => addVibe(s)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 12px", background: "transparent", border: "none", color: PAL.cream, fontFamily: ff.body, fontSize: 12, cursor: "pointer", borderRadius: 6 }}
                onMouseEnter={e => e.target.style.background = `${PAL.gold}10`}
                onMouseLeave={e => e.target.style.background = "transparent"}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Active vibes */}
      <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap", marginBottom: 24, maxWidth: 480, margin: "0 auto 24px" }}>
        {activeVibes.map(v => {
          const color = currentMap[v] ? getNoteColor(currentMap[v][0]) : PAL.gold;
          return (
            <span key={v} onClick={() => setActiveVibes(prev => prev.filter(x => x !== v))}
              style={{ fontSize: 11, padding: "5px 14px", borderRadius: 18, cursor: "pointer", fontFamily: ff.display, fontStyle: "italic", color, background: `${color}14`, border: `1px solid ${color}35` }}>{v} ✕</span>
          );
        })}
        {activeVibes.length > 0 && (
          <button onClick={() => setActiveVibes([])} style={{ fontSize: 9, padding: "5px 10px", borderRadius: 16, cursor: "pointer", background: "transparent", border: `1px solid ${PAL.border}`, color: PAL.muted, fontFamily: ff.body }}>Clear</button>
        )}
      </div>

      {/* Constellation */}
      {scoredFragrances.length > 0 && (
        <div style={{ maxWidth: 750, margin: "0 auto 24px" }}>
          <svg viewBox="0 0 800 800" width="100%">
            <defs>
              <filter id="vcGlow"><feGaussianBlur stdDeviation="20" /></filter>
              <radialGradient id="vcCenter">
                <stop offset="0%" stopColor={PAL.gold} stopOpacity="0.1" />
                <stop offset="100%" stopColor={PAL.gold} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={120} fill="url(#vcCenter)" />
            {[0.33, 0.66, 1].map((r, i) => (
              <circle key={i} cx={cx} cy={cy} r={r * maxR} fill="none" stroke={PAL.border} strokeWidth="0.5" opacity="0.12" strokeDasharray="4 8" />
            ))}
            <text x={cx} y={cy - 8} textAnchor="middle" fill={PAL.gold} fontSize="13" fontFamily={ff.display} fontStyle="italic" opacity="0.5">{activeVibes.join(" · ")}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill={PAL.muted} fontSize="9" fontFamily={ff.body}>{scoredFragrances.length} matches</text>

            {/* Note ring */}
            {Object.entries(matchedNotes).slice(0, 12).map(([note, weight], i) => {
              const total = Math.min(Object.keys(matchedNotes).length, 12);
              const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(angle) * 48, y = cy + Math.sin(angle) * 48;
              const color = getNoteColor(note);
              return (
                <g key={note}>
                  <circle cx={x} cy={y} r={3} fill={color} opacity={0.5 + Math.sin(t + i) * 0.15} />
                  <text x={x + Math.cos(angle) * 14} y={y + Math.sin(angle) * 14} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="7" fontFamily={ff.body} opacity="0.45" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>{note}</text>
                </g>
              );
            })}

            {/* Fragrance nodes */}
            {scoredFragrances.map((frag, i) => {
              const maxScore = scoredFragrances[0]?.score || 1;
              const ns = frag.score / maxScore;
              const r = 80 + (1 - ns) * (maxR - 100);
              const angle = (i / scoredFragrances.length) * Math.PI * 2 - Math.PI / 2;
              const wobble = Math.sin(t + i * 1.3) * 4;
              const x = cx + Math.cos(angle) * (r + wobble), y = cy + Math.sin(angle) * (r + wobble);
              const isHov = hovered === i;
              const color = frag.matched[0] ? getNoteColor(frag.matched[0]) : PAL.gold;
              const dotSize = 4 + ns * 7;
              return (
                <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
                  <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth={ns * 1.5} opacity={isHov ? 0.4 : 0.06 + ns * 0.05} strokeDasharray={isHov ? "none" : "2 6"} style={{ transition: "opacity .3s" }} />
                  <circle cx={x} cy={y} r={isHov ? 30 : 12 + ns * 6} fill={color} opacity={isHov ? 0.12 : 0.025 + Math.sin(t + i) * 0.01} filter="url(#vcGlow)" style={{ transition: "all .3s" }} />
                  <circle cx={x} cy={y} r={isHov ? dotSize + 3 : dotSize} fill={color} opacity={isHov ? 1 : 0.55 + ns * 0.3} stroke={isHov ? PAL.cream : "none"} strokeWidth={isHov ? 1.5 : 0} style={{ transition: "all .2s" }} />
                  <circle cx={x} cy={y} r={dotSize + 7} fill="none" stroke={color} strokeWidth="0.5" opacity={isHov ? 0.35 : 0.08} strokeDasharray={`${ns * 44} 100`} style={{ transition: "all .3s" }} />
                  {isHov && (
                    <g>
                      <rect x={x - 95} y={y - 56} width="190" height="48" rx="10" fill={PAL.bg} stroke={color} strokeWidth="1" opacity="0.95" />
                      <text x={x} y={y - 40} textAnchor="middle" dominantBaseline="middle" fill={PAL.cream} fontSize="14" fontFamily={ff.display} fontStyle="italic">{frag.name}</text>
                      <text x={x} y={y - 25} textAnchor="middle" dominantBaseline="middle" fill={PAL.muted} fontSize="9" fontFamily={ff.body}>{frag.house}</text>
                      <text x={x} y={y - 13} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="8" fontFamily={ff.body}>{frag.matched.slice(0, 4).join(" · ")}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Empty state */}
      {activeVibes.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 16px" }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: .2 }}>✧</div>
          <p style={{ fontFamily: ff.display, fontSize: 16, fontStyle: "italic", margin: "0 0 12px" }}>How are you feeling?</p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
            {["confident", "cozy", "mysterious", "romantic", "rebellious", "dreamy", "dark", "elegant", "wild", "velvet", "gold", "rain"].map(v => (
              <button key={v} onClick={() => addVibe(v)}
                style={{ padding: "5px 12px", borderRadius: 16, cursor: "pointer", background: "transparent", border: `1px solid ${PAL.border}`, color: PAL.muted, fontFamily: ff.display, fontStyle: "italic", fontSize: 11 }}
                onMouseEnter={e => { e.target.style.borderColor = PAL.gold + "44"; e.target.style.color = PAL.gold; }}
                onMouseLeave={e => { e.target.style.borderColor = PAL.border; e.target.style.color = PAL.muted; }}>{v}</button>
            ))}
          </div>
        </div>
      )}

      {/* Results list */}
      {scoredFragrances.length > 0 && (
        <div>
          <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: PAL.muted, marginBottom: 10, textAlign: "center" }}>Recommended for your vibe</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scoredFragrances.map((frag, i) => {
              const maxScore = scoredFragrances[0]?.score || 1;
              const pct = Math.round((frag.score / maxScore) * 100);
              const color = frag.matched[0] ? getNoteColor(frag.matched[0]) : PAL.gold;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    <svg width="40" height="40" style={{ position: "absolute", top: -2, left: -2 }}>
                      <circle cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="2" strokeDasharray={`${pct * 1.13} 113`} strokeLinecap="round" transform="rotate(-90 20 20)" opacity="0.5" />
                    </svg>
                    <span style={{ fontFamily: ff.display, fontSize: 13, color }}>{pct}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: ff.display, fontSize: 15, fontStyle: "italic" }}>{frag.name}</span>
                      <span style={{ fontSize: 10, color: PAL.muted }}>— {frag.house}</span>
                    </div>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}>
                      {frag.matched.map(n => (
                        <span key={n} style={{ fontSize: 8, letterSpacing: 0.5, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, color: getNoteColor(n), background: `${getNoteColor(n)}12`, border: `1px solid ${getNoteColor(n)}20` }}>{n}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vibe mapping legend */}
      {activeVibes.length > 0 && matchedVibes.length > 0 && (
        <div style={{ marginTop: 20, padding: "14px 18px", background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 14 }}>
          <h4 style={{ fontFamily: ff.display, fontSize: 14, fontStyle: "italic", margin: "0 0 8px", color: PAL.muted }}>Vibe → Note Mapping</h4>
          {matchedVibes.map(mv => (
            <div key={mv.vibe} style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: ff.display, fontStyle: "italic", fontSize: 12, color: PAL.cream }}>{mv.vibe}</span>
              <span style={{ fontSize: 9, color: PAL.muted, margin: "0 6px" }}>→</span>
              {mv.notes.map(n => (
                <span key={n} style={{ fontSize: 9, marginRight: 4, color: getNoteColor(n) }}>{n}</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { DEFAULT_VIBE_MAP };
export default VibeCalculator;
