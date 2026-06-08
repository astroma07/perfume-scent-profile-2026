import { useState, useRef, useMemo } from "react";
import { PAL, ff, STATUS_COLORS, STATUSES } from "../constants.js";
import { FAMILY_ORDER, FAMILY_COLORS, FAMILY_LABELS, getNoteFamily } from "../noteCategories.js";
import { FragranceTags } from "./ui.jsx";

const EditPanel = ({ bottles, setBottles, onClose, onReset, noteOverrides, setNoteOverrides, testedScents, setTestedScents }) => {
  const [newHouseInput, setNewHouseInput] = useState({});
  const inputCss = { background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "7px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const selectCss = { ...inputCss, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 28 };
  const lab = { fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 3, display: "block" };
  const row = { display: "flex", gap: 6, alignItems: "end", marginBottom: 10, flexWrap: "wrap" };

  /* Derive unique houses from current bottles */
  const allHouses = useMemo(() => [...new Set(bottles.map(b => b.house).filter(Boolean))].sort(), [bottles]);

  /* Group bottles by status */
  const grouped = {};
  STATUSES.forEach(s => { grouped[s] = bottles.map((b, i) => ({ ...b, _i: i })).filter(b => b.status === s); });

  const handleHouseChange = (i, val) => {
    if (val === "__new__") {
      setNewHouseInput(prev => ({ ...prev, [i]: "" }));
    } else {
      const a = [...bottles]; a[i] = { ...a[i], house: val, fullName: a[i].name + (val ? ` — ${val}` : "") }; setBottles(a);
      setNewHouseInput(prev => { const n = { ...prev }; delete n[i]; return n; });
    }
  };

  const confirmNewHouse = (i) => {
    const val = (newHouseInput[i] || "").trim();
    if (val) { const a = [...bottles]; a[i] = { ...a[i], house: val, fullName: a[i].name + ` — ${val}` }; setBottles(a); }
    setNewHouseInput(prev => { const n = { ...prev }; delete n[i]; return n; });
  };

  const mouseDownTarget = useRef(null);

  return (
    <div
      onMouseDown={e => { mouseDownTarget.current = e.target; }}
      onClick={e => { if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 16, padding: 28, width: "96%", maxWidth: 1000, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: ff.display, fontSize: 20, color: PAL.cream, margin: 0 }}>Edit Collection</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {STATUSES.map(status => {
          const items = grouped[status] || [];
          const sc = STATUS_COLORS[status];
          return (
            <div key={status} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc }} />
                <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.cream, textTransform: "capitalize" }}>{status}</span>
                <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted }}>({items.length})</span>
              </div>
              {items.map(b => {
                const i = b._i;
                const isNewHouse = newHouseInput.hasOwnProperty(i);
                return (
                  <div key={i} style={row}>
                    <div style={{ flex: "1.5 1 120px" }}><label style={lab}>Name *</label><input style={{ ...inputCss, borderColor: !b.name.trim() ? `${PAL.rose}44` : undefined }} placeholder="Enter fragrance name…" value={b.name} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], name: e.target.value, fullName: e.target.value + (b.house ? ` — ${b.house}` : "") }; setBottles(a); }} /></div>
                    <div style={{ flex: "1.2 1 110px" }}>
                      <label style={lab}>House</label>
                      {isNewHouse ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input style={{ ...inputCss, flex: 1 }} placeholder="Type house name…" value={newHouseInput[i]} autoFocus
                            onChange={e => setNewHouseInput(prev => ({ ...prev, [i]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") confirmNewHouse(i); if (e.key === "Escape") setNewHouseInput(prev => { const n = { ...prev }; delete n[i]; return n; }); }}
                          />
                          <button onClick={() => confirmNewHouse(i)} style={{ background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}40`, borderRadius: 6, padding: "0 10px", color: PAL.gold, fontSize: 12, cursor: "pointer" }}>✓</button>
                        </div>
                      ) : (
                        <select style={selectCss} value={b.house || ""} onChange={e => handleHouseChange(i, e.target.value)}>
                          <option value="" style={{ background: PAL.bg, color: PAL.muted }}>— select —</option>
                          {allHouses.map(h => <option key={h} value={h} style={{ background: PAL.bg, color: PAL.cream }}>{h}</option>)}
                          <option value="__new__" style={{ background: PAL.bg, color: PAL.gold }}>+ Add new house…</option>
                        </select>
                      )}
                    </div>
                    <div style={{ flex: "0.8 1 80px" }}>
                      <label style={lab}>Status</label>
                      <select style={selectCss} value={b.status} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], status: e.target.value }; setBottles(a); }}>
                        {STATUSES.map(s => <option key={s} value={s} style={{ background: PAL.bg, color: PAL.cream }}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: "0.5 1 55px" }}><label style={lab}>Cost $</label><input style={inputCss} type="number" value={b.cost} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], cost: +e.target.value }; setBottles(a); }} /></div>
                    <div style={{ flex: "0.4 1 45px" }}><label style={lab}>mL</label><input style={inputCss} type="number" value={b.ml} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], ml: +e.target.value }; setBottles(a); }} /></div>
                    <div style={{ flex: "0.4 1 45px" }}><label style={lab}>Freq</label><input style={inputCss} type="number" value={b.freq} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], freq: +e.target.value }; setBottles(a); }} /></div>
                    <button onClick={() => setBottles(bottles.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: PAL.rose, fontSize: 18, cursor: "pointer", paddingBottom: 6 }}>−</button>
                    <div style={{ flex: "100% 1 100%", marginTop: -2 }}>
                      <label style={lab}>Notes (comma-separated)</label>
                      <input style={inputCss} value={b.userNotes || ""} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], userNotes: e.target.value }; setBottles(a); }} placeholder="e.g. sandalwood, vetiver, amber, musk" />
                      {/* Note category pills */}
                      {(b.userNotes || "").trim() && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                          {(b.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean).map((note, j) => {
                            const family = getNoteFamily(note, noteOverrides);
                            const color = FAMILY_COLORS[family];
                            return (
                              <div key={j} style={{ position: "relative", display: "inline-flex" }}>
                                <select
                                  value={family}
                                  onChange={e => setNoteOverrides(prev => ({ ...prev, [note]: e.target.value }))}
                                  style={{
                                    appearance: "none", cursor: "pointer",
                                    background: `${color}20`, border: `1px solid ${color}50`,
                                    borderRadius: 4, padding: "3px 20px 3px 8px",
                                    color: color, fontFamily: ff.body, fontSize: 9, letterSpacing: 0.5,
                                    outline: "none",
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M2 3l2 2 2-2' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center",
                                  }}
                                >
                                  {FAMILY_ORDER.map(f => (
                                    <option key={f} value={f} style={{ background: PAL.bg, color: FAMILY_COLORS[f] }}>
                                      {note} → {FAMILY_LABELS[f]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: "100% 1 100%", marginTop: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <label style={lab}>Thoughts</label>
                        {b.status === "tester" && b.name.trim() && (
                          <button onClick={() => {
                            const alreadyTested = testedScents.some(t => t.name.toLowerCase() === b.name.toLowerCase());
                            if (alreadyTested) return;
                            setTestedScents(prev => [...prev, {
                              name: b.name, house: b.house || "",
                              date: new Date().toISOString().split("T")[0],
                              notes: b.userNotes || "", thoughts: b.thoughts || "",
                              ratings: {}, id: Date.now(),
                            }]);
                          }}
                          style={{
                            background: testedScents.some(t => t.name.toLowerCase() === b.name.toLowerCase()) ? `${PAL.sage}12` : `${PAL.plum}12`,
                            border: `1px solid ${testedScents.some(t => t.name.toLowerCase() === b.name.toLowerCase()) ? PAL.sage + "40" : PAL.plum + "40"}`,
                            borderRadius: 6, padding: "3px 10px",
                            color: testedScents.some(t => t.name.toLowerCase() === b.name.toLowerCase()) ? PAL.sage : PAL.plum,
                            fontFamily: ff.body, fontSize: 9, cursor: "pointer",
                            letterSpacing: 1, textTransform: "uppercase",
                          }}>
                            {testedScents.some(t => t.name.toLowerCase() === b.name.toLowerCase()) ? "✓ In Tested" : "→ Add to Tested"}
                          </button>
                        )}
                      </div>
                      <textarea style={{ ...inputCss, minHeight: 36, resize: "vertical", lineHeight: 1.5 }} value={b.thoughts || ""} onChange={e => { const a = [...bottles]; a[i] = { ...a[i], thoughts: e.target.value }; setBottles(a); }} placeholder="Your impressions, when you wear it, memories…" />
                    </div>
                    <div style={{ flex: "100% 1 100%", marginTop: 4 }}>
                      <FragranceTags compact tags={b.tags || {}} onChange={t => { const a = [...bottles]; a[i] = { ...a[i], tags: t }; setBottles(a); }} />
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, padding: "4px 0" }}>No fragrances in this category</p>}
            </div>
          );
        })}

        <button onClick={() => setBottles([...bottles, { name: "", fullName: "", house: "", cost: 0, ml: 0, freq: 0, status: "to test", userNotes: "", thoughts: "", tags: {} }])} style={{ background: `${PAL.gold}10`, border: `1px dashed ${PAL.gold}44`, borderRadius: 8, padding: 10, color: PAL.gold, cursor: "pointer", fontFamily: ff.body, fontSize: 12, width: "100%" }}>+ Add Fragrance</button>

        {/* Reset all data */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${PAL.border}` }}>
          <button onClick={() => { if (window.confirm("This will reset your entire collection, wear log, and notes profile back to defaults. Are you sure?")) { onReset(); onClose(); } }}
            style={{ background: "transparent", border: `1px solid ${PAL.rose}33`, borderRadius: 8, padding: "8px 16px", color: PAL.rose, fontFamily: ff.body, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", width: "100%" }}>
            Reset All Data to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPanel;
