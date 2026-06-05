import { useState, useRef } from "react";
import { PAL, ff } from "../constants.js";
import { FAMILY_ORDER, FAMILY_COLORS, FAMILY_LABELS, DEFAULT_OPPOSING, THEME_PRESETS } from "../noteCategories.js";

const SettingsPanel = ({ onClose, visibleTabs, setVisibleTabs, opposingPairs, setOpposingPairs, theme, setTheme, tabLabels }) => {
  const [section, setSection] = useState("tabs");
  const [newA, setNewA] = useState("");
  const [newB, setNewB] = useState("");
  const mouseDownRef = useRef(null);

  const currentPal = THEME_PRESETS[theme.preset] || THEME_PRESETS.apothecary;
  const isCustom = theme.preset === "custom";

  const sectionBtns = [
    { k: "tabs", l: "Tabs", ic: "☰" },
    { k: "pairings", l: "Pairings", ic: "🔗" },
    { k: "theme", l: "Theme", ic: "◐" },
  ];

  const selectCss = {
    background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`,
    borderRadius: 8, padding: "8px 28px 8px 10px", color: PAL.cream,
    fontFamily: ff.body, fontSize: 12, outline: "none", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
  };

  return (
    <div
      onMouseDown={e => { mouseDownRef.current = e.target; }}
      onClick={e => { if (e.target === e.currentTarget && mouseDownRef.current === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 16,
        padding: 24, width: "94%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: ff.display, fontSize: 20, color: PAL.cream, margin: 0 }}>Settings</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {/* Section toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {sectionBtns.map(s => (
            <button key={s.k} onClick={() => setSection(s.k)} style={{
              flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer",
              background: section === s.k ? `${PAL.gold}14` : "transparent",
              border: `1px solid ${section === s.k ? PAL.gold + "44" : PAL.border}`,
              fontFamily: ff.body, fontSize: 11, color: section === s.k ? PAL.gold : PAL.muted,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}><span style={{ fontSize: 14 }}>{s.ic}</span>{s.l}</button>
          ))}
        </div>

        {/* ── TAB VISIBILITY ── */}
        {section === "tabs" && (
          <div>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Choose which tabs appear in the navigation bar. Hidden tabs keep their data — you can always turn them back on.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tabLabels.map((tab, i) => (
                <label key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 10,
                  cursor: "pointer",
                }}>
                  <div onClick={() => setVisibleTabs(prev => ({ ...prev, [i]: !prev[i] }))}
                    style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0, cursor: "pointer",
                      border: `2px solid ${visibleTabs[i] !== false ? PAL.gold : PAL.border}`,
                      background: visibleTabs[i] !== false ? PAL.gold : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .2s",
                    }}>
                    {visibleTabs[i] !== false && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: ff.body, fontSize: 14, color: PAL.cream }}>{tab.icon} {tab.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── OPPOSING PAIRS ── */}
        {section === "pairings" && (
          <div>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Define which note families create interesting <span style={{ color: PAL.rose }}>opposing</span> pairings on the fragrance wheel.
              <span style={{ color: PAL.sage }}> Complementary</span> pairings (shared notes) are always shown automatically.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {opposingPairs.map(([a, b], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: FAMILY_COLORS[a] }} />
                  <span style={{ fontFamily: ff.body, fontSize: 12, color: FAMILY_COLORS[a], flex: 1 }}>{FAMILY_LABELS[a] || a}</span>
                  <span style={{ fontFamily: ff.display, fontSize: 14, color: PAL.rose }}>↔</span>
                  <span style={{ fontFamily: ff.body, fontSize: 12, color: FAMILY_COLORS[b], flex: 1, textAlign: "right" }}>{FAMILY_LABELS[b] || b}</span>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: FAMILY_COLORS[b] }} />
                  <button onClick={() => setOpposingPairs(opposingPairs.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: PAL.rose, fontSize: 16, cursor: "pointer", opacity: .6 }}>×</button>
                </div>
              ))}
              {opposingPairs.length === 0 && (
                <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, textAlign: "center", padding: 12 }}>No opposing pairs defined.</p>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <select value={newA} onChange={e => setNewA(e.target.value)} style={{ ...selectCss, flex: 1 }}>
                <option value="" style={{ background: PAL.bg }}>Family A…</option>
                {FAMILY_ORDER.map(f => <option key={f} value={f} style={{ background: PAL.bg, color: FAMILY_COLORS[f] }}>{FAMILY_LABELS[f]}</option>)}
              </select>
              <span style={{ fontFamily: ff.display, fontSize: 14, color: PAL.rose }}>↔</span>
              <select value={newB} onChange={e => setNewB(e.target.value)} style={{ ...selectCss, flex: 1 }}>
                <option value="" style={{ background: PAL.bg }}>Family B…</option>
                {FAMILY_ORDER.map(f => <option key={f} value={f} style={{ background: PAL.bg, color: FAMILY_COLORS[f] }}>{FAMILY_LABELS[f]}</option>)}
              </select>
              <button onClick={() => {
                if (newA && newB && newA !== newB && !opposingPairs.some(([a, b]) => (a === newA && b === newB) || (a === newB && b === newA))) {
                  setOpposingPairs([...opposingPairs, [newA, newB]]);
                }
                setNewA(""); setNewB("");
              }} disabled={!newA || !newB || newA === newB} style={{
                background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
                padding: "8px 14px", color: PAL.gold, fontFamily: ff.body, fontSize: 11, cursor: "pointer",
                opacity: !newA || !newB || newA === newB ? .3 : 1,
              }}>+ Add</button>
            </div>

            <button onClick={() => setOpposingPairs(DEFAULT_OPPOSING)} style={{
              width: "100%", padding: "8px", background: "transparent", border: `1px solid ${PAL.border}`,
              borderRadius: 8, color: PAL.muted, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1,
            }}>Reset to Defaults</button>
          </div>
        )}

        {/* ── COLOR THEME ── */}
        {section === "theme" && (
          <div>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Choose a preset theme or customize your own colors. Changes apply immediately.
            </p>

            {/* Preset grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 18 }}>
              {Object.entries(THEME_PRESETS).map(([key, t]) => (
                <button key={key} onClick={() => setTheme({ preset: key })} style={{
                  padding: "12px", borderRadius: 10, cursor: "pointer",
                  background: t.bg, border: `2px solid ${theme.preset === key ? t.gold : t.border}`,
                  textAlign: "left", transition: "border-color .2s",
                }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                    {[t.gold, t.rose, t.sage, t.plum, t.muted].map((c, i) => (
                      <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: ff.body, fontSize: 11, color: t.cream, fontWeight: theme.preset === key ? 600 : 400 }}>{t.label}</span>
                </button>
              ))}
              {/* Custom option */}
              <button onClick={() => setTheme({ preset: "custom", bg: theme.customBg || "#0f0d09", text: theme.customText || "#e8dfd0" })} style={{
                padding: "12px", borderRadius: 10, cursor: "pointer",
                background: theme.preset === "custom" ? (theme.customBg || "#0f0d09") : `${PAL.cream}04`,
                border: `2px solid ${theme.preset === "custom" ? PAL.gold : PAL.border}`,
                textAlign: "left",
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>🎨</div>
                <span style={{ fontFamily: ff.body, fontSize: 11, color: theme.preset === "custom" ? (theme.customText || PAL.cream) : PAL.muted }}>Custom</span>
              </button>
            </div>

            {/* Custom color pickers */}
            {theme.preset === "custom" && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 6 }}>Background</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={theme.customBg || "#0f0d09"}
                      onChange={e => setTheme({ ...theme, customBg: e.target.value })}
                      style={{ width: 36, height: 36, border: `1px solid ${PAL.border}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
                    <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.cream }}>{theme.customBg || "#0f0d09"}</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 6 }}>Text</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={theme.customText || "#e8dfd0"}
                      onChange={e => setTheme({ ...theme, customText: e.target.value })}
                      style={{ width: 36, height: 36, border: `1px solid ${PAL.border}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
                    <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.cream }}>{theme.customText || "#e8dfd0"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Done */}
        <button onClick={onClose} style={{
          marginTop: 20, width: "100%", padding: "12px",
          background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
          color: PAL.gold, fontFamily: ff.body, fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>Done</button>
      </div>
    </div>
  );
};


export default SettingsPanel;
