import { useState, useRef, useMemo } from "react";
import { PAL, ff, STATUS_COLORS, STATUSES, TESTER_COLOR } from "../constants.js";
import { FAMILY_ORDER, FAMILY_COLORS, FAMILY_LABELS, getNoteFamily } from "../noteCategories.js";
import { FragranceTags } from "./ui.jsx";

const EditPanel = ({ bottles, setBottles, onClose, onReset, noteOverrides, setNoteOverrides, testedScents, setTestedScents }) => {
  const [selectedIdx, setSelectedIdx] = useState(bottles.length > 0 ? 0 : null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [resetStep, setResetStep] = useState(0);
  const [resetInput, setResetInput] = useState("");
  const mouseDownTarget = useRef(null);

  const inputCss = { background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "10px 14px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const selectCss = { ...inputCss, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30 };
  const lab = { fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 };

  const allHouses = useMemo(() => [...new Set(bottles.map(b => b.house).filter(Boolean))].sort(), [bottles]);

  const filtered = useMemo(() => {
    let list = bottles.map((b, i) => ({ ...b, _i: i }));
    if (filterStatus === "_tester") list = list.filter(b => b.hasTester);
    else if (filterStatus) list = list.filter(b => b.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || (b.house || "").toLowerCase().includes(q) || (b.userNotes || "").toLowerCase().includes(q));
    }
    return list;
  }, [bottles, filterStatus, search]);

  const selected = selectedIdx !== null ? bottles[selectedIdx] : null;

  const updateField = (field, value) => {
    const a = [...bottles];
    a[selectedIdx] = { ...a[selectedIdx], [field]: value };
    if (field === "name" || field === "house") {
      const name = field === "name" ? value : a[selectedIdx].name;
      const house = field === "house" ? value : a[selectedIdx].house;
      a[selectedIdx].fullName = name + (house ? ` — ${house}` : "");
    }
    setBottles(a);
  };

  const addNew = () => {
    const newBottle = { name: "", fullName: "", house: "", cost: 0, ml: 0, freq: 0, status: "to test", userNotes: "", thoughts: "", tags: {}, hasTester: false, concentration: "" };
    const newIdx = bottles.length;
    setBottles(prev => [...prev, newBottle]);
    setTimeout(() => setSelectedIdx(newIdx), 0);
    setSearch("");
    setFilterStatus(null);
  };

  const deleteSelected = () => {
    if (selectedIdx === null) return;
    setBottles(prev => prev.filter((_, i) => i !== selectedIdx));
    setSelectedIdx(Math.max(0, selectedIdx - 1));
  };

  const isTested = selected ? testedScents.some(t => t.name.toLowerCase() === selected.name.toLowerCase()) : false;

  return (
    <div
      onMouseDown={e => { mouseDownTarget.current = e.target; }}
      onClick={e => { if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 16, width: "96%", maxWidth: 1100, height: "88vh", display: "flex", overflow: "hidden" }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: 300, borderRight: `1px solid ${PAL.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "18px 14px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic", margin: 0 }}>Edit Collection</h3>
              <button onClick={onClose} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, house, notes…"
              style={{ ...inputCss, fontSize: 12, padding: "8px 12px", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <button onClick={() => setFilterStatus(null)} style={{ padding: "3px 7px", borderRadius: 10, fontSize: 8, cursor: "pointer", fontFamily: ff.body, background: !filterStatus ? `${PAL.gold}14` : "transparent", border: `1px solid ${!filterStatus ? PAL.gold + "44" : PAL.border}`, color: !filterStatus ? PAL.gold : PAL.muted }}>All ({bottles.length})</button>
              {STATUSES.map(s => (
                <button key={s} onClick={() => setFilterStatus(filterStatus === s ? null : s)} style={{ padding: "3px 7px", borderRadius: 10, fontSize: 8, cursor: "pointer", fontFamily: ff.body, textTransform: "capitalize", background: filterStatus === s ? `${STATUS_COLORS[s]}18` : "transparent", border: `1px solid ${filterStatus === s ? STATUS_COLORS[s] + "44" : PAL.border}`, color: filterStatus === s ? STATUS_COLORS[s] : PAL.muted }}>{s} ({bottles.filter(b => b.status === s).length})</button>
              ))}
              <button onClick={() => setFilterStatus(filterStatus === "_tester" ? null : "_tester")} style={{ padding: "3px 7px", borderRadius: 10, fontSize: 8, cursor: "pointer", fontFamily: ff.body, background: filterStatus === "_tester" ? `${TESTER_COLOR}18` : "transparent", border: `1px solid ${filterStatus === "_tester" ? TESTER_COLOR + "44" : PAL.border}`, color: filterStatus === "_tester" ? TESTER_COLOR : PAL.muted }}>Tester ({bottles.filter(b => b.hasTester).length})</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 6px", scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent` }}>
            {filtered.map(b => {
              const isSelected = b._i === selectedIdx;
              return (
                <div key={b._i} onClick={() => setSelectedIdx(b._i)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 1, background: isSelected ? `${PAL.gold}0a` : "transparent", border: `1px solid ${isSelected ? PAL.gold + "28" : "transparent"}`, transition: "all .15s" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[b.status] || PAL.muted }} />
                    {b.hasTester && <span style={{ width: 4, height: 4, borderRadius: "50%", border: `1px solid ${TESTER_COLOR}` }} />}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontFamily: ff.display, fontSize: 13, fontStyle: "italic", color: b.name.trim() ? PAL.cream : PAL.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name || "Unnamed"}</div>
                    <div style={{ fontSize: 9, color: PAL.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.house || "—"}</div>
                  </div>
                  {b.cost > 0 && <span style={{ fontSize: 10, color: PAL.muted, flexShrink: 0 }}>${b.cost}</span>}
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "24px 10px", color: PAL.muted, fontSize: 11 }}>No matches</div>}
          </div>

          <div style={{ padding: "10px 14px", borderTop: `1px solid ${PAL.border}` }}>
            <button onClick={addNew} style={{ width: "100%", padding: "9px", background: `${PAL.gold}10`, border: `1px dashed ${PAL.gold}44`, borderRadius: 8, color: PAL.gold, fontFamily: ff.body, fontSize: 11, cursor: "pointer" }}>+ Add Fragrance</button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent` }}>
          {selected ? (
            <div>
              {/* Name + House */}
              <div style={{ marginBottom: 20 }}>
                <input value={selected.name} onChange={e => updateField("name", e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", fontFamily: ff.display, fontSize: 28, fontStyle: "italic", color: PAL.cream, width: "100%", padding: 0, marginBottom: 4 }}
                  placeholder="Fragrance name" />
                <input value={selected.house || ""} onChange={e => updateField("house", e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", fontFamily: ff.body, fontSize: 15, color: PAL.muted, width: "100%", padding: 0 }}
                  placeholder="House / brand" />
              </div>

              {/* Status + Type + Tester + Cost row */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "end" }}>
                <div style={{ minWidth: 120 }}>
                  <label style={lab}>Status</label>
                  <select style={selectCss} value={selected.status} onChange={e => updateField("status", e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s} style={{ background: PAL.bg }}>{s}</option>)}
                  </select>
                </div>
                <div style={{ minWidth: 90 }}>
                  <label style={lab}>Type</label>
                  <select style={{ ...selectCss, padding: "10px 28px 10px 12px" }} value={selected.concentration || ""} onChange={e => updateField("concentration", e.target.value)}>
                    <option value="" style={{ background: PAL.bg }}>—</option>
                    <option value="parfum" style={{ background: PAL.bg }}>Parfum</option>
                    <option value="edp" style={{ background: PAL.bg }}>EDP</option>
                    <option value="edt" style={{ background: PAL.bg }}>EDT</option>
                    <option value="edc" style={{ background: PAL.bg }}>EDC</option>
                    <option value="body" style={{ background: PAL.bg }}>Body</option>
                    <option value="oil" style={{ background: PAL.bg }}>Oil</option>
                  </select>
                </div>
                <div>
                  <label style={lab}>Tester</label>
                  <button onClick={() => updateField("hasTester", !selected.hasTester)}
                    style={{ width: 42, height: 42, borderRadius: 10, cursor: "pointer", background: selected.hasTester ? `${TESTER_COLOR}20` : "transparent", border: `2px solid ${selected.hasTester ? TESTER_COLOR : PAL.border}`, color: selected.hasTester ? TESTER_COLOR : PAL.muted, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                    {selected.hasTester ? "◉" : "○"}</button>
                </div>
                <div style={{ minWidth: 80 }}>
                  <label style={lab}>Cost ($)</label>
                  <input style={inputCss} type="number" value={selected.cost || 0} onChange={e => updateField("cost", +e.target.value)} />
                </div>
                <div style={{ minWidth: 70 }}>
                  <label style={lab}>Size (mL)</label>
                  <input style={inputCss} type="number" value={selected.ml || 0} onChange={e => updateField("ml", +e.target.value)} />
                </div>
                <div style={{ minWidth: 60 }}>
                  <label style={lab}>Frequency</label>
                  <input style={inputCss} type="number" value={selected.freq || 0} onChange={e => updateField("freq", +e.target.value)} />
                </div>
              </div>

              {/* Notes + Category pills */}
              <div style={{ marginBottom: 20 }}>
                <label style={lab}>Fragrance Notes</label>
                <input style={inputCss} value={selected.userNotes || ""} onChange={e => updateField("userNotes", e.target.value)}
                  placeholder="sandalwood, vetiver, amber, musk" />
                {(selected.userNotes || "").trim() && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {selected.userNotes.split(",").map(n => n.trim().toLowerCase()).filter(Boolean).map((note, j) => {
                      const family = getNoteFamily(note, noteOverrides);
                      const color = FAMILY_COLORS[family];
                      return (
                        <select key={j} value={family}
                          onChange={e => setNoteOverrides(prev => ({ ...prev, [note]: e.target.value }))}
                          style={{ appearance: "none", cursor: "pointer", background: `${color}20`, border: `1px solid ${color}50`, borderRadius: 5, padding: "3px 20px 3px 8px", color, fontFamily: ff.body, fontSize: 9, letterSpacing: 0.5, outline: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M2 3l2 2 2-2' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center" }}>
                          {FAMILY_ORDER.map(f => (
                            <option key={f} value={f} style={{ background: PAL.bg, color: FAMILY_COLORS[f] }}>{note} → {FAMILY_LABELS[f]}</option>
                          ))}
                        </select>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 20 }}>
                <label style={lab}>When to Wear</label>
                <FragranceTags tags={selected.tags || {}} onChange={t => updateField("tags", t)} />
              </div>

              {/* Thoughts */}
              <div style={{ marginBottom: 20 }}>
                <label style={lab}>Thoughts & Impressions</label>
                <textarea style={{ ...inputCss, minHeight: 70, resize: "vertical", lineHeight: 1.6 }}
                  value={selected.thoughts || ""} onChange={e => updateField("thoughts", e.target.value)}
                  placeholder="Your impressions, memories, when you wear it…" />
              </div>

              {/* Add to Tested button */}
              {selected.hasTester && selected.name.trim() && (
                <div style={{ marginBottom: 20 }}>
                  <button onClick={() => {
                    if (isTested) return;
                    setTestedScents(prev => [...prev, { name: selected.name, house: selected.house || "", date: new Date().toISOString().split("T")[0], notes: selected.userNotes || "", thoughts: selected.thoughts || "", ratings: {}, id: Date.now() }]);
                  }}
                  style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", background: isTested ? `${PAL.sage}12` : `${TESTER_COLOR}12`, border: `1px solid ${isTested ? PAL.sage + "40" : TESTER_COLOR + "40"}`, color: isTested ? PAL.sage : TESTER_COLOR, fontFamily: ff.body, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                    {isTested ? "✓ In Tested" : "→ Add to Tested"}
                  </button>
                </div>
              )}

              {/* Delete + Reset */}
              <div style={{ paddingTop: 16, borderTop: `1px solid ${PAL.border}`, display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <button onClick={() => { if (window.confirm(`Remove "${selected.name}" from your collection?`)) deleteSelected(); }}
                  style={{ background: `${PAL.rose}08`, border: `1px solid ${PAL.rose}25`, borderRadius: 8, padding: "8px 16px", color: PAL.rose, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>Remove Fragrance</button>

                <div style={{ marginLeft: "auto" }}>
                  {resetStep === 0 && (
                    <button onClick={() => setResetStep(1)} style={{ background: `${PAL.rose}06`, border: `1px solid ${PAL.rose}15`, borderRadius: 8, padding: "8px 14px", color: PAL.muted, fontFamily: ff.body, fontSize: 9, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>Reset All Data</button>
                  )}
                  {resetStep === 1 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: PAL.rose }}>Are you sure?</span>
                      <button onClick={() => setResetStep(2)} style={{ padding: "6px 12px", borderRadius: 6, background: `${PAL.rose}18`, border: `1px solid ${PAL.rose}40`, color: PAL.rose, fontSize: 10, fontFamily: ff.body, cursor: "pointer" }}>Yes</button>
                      <button onClick={() => setResetStep(0)} style={{ padding: "6px 12px", borderRadius: 6, background: "transparent", border: `1px solid ${PAL.border}`, color: PAL.muted, fontSize: 10, fontFamily: ff.body, cursor: "pointer" }}>Cancel</button>
                    </div>
                  )}
                  {resetStep === 2 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: PAL.rose }}>Type <strong>reset</strong>:</span>
                      <input value={resetInput} onChange={e => setResetInput(e.target.value)} autoFocus
                        style={{ width: 80, background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.rose}40`, borderRadius: 6, padding: "6px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none" }} />
                      <button onClick={() => { if (resetInput.toLowerCase().trim() === "reset") { onReset(); setResetStep(0); setResetInput(""); } }}
                        disabled={resetInput.toLowerCase().trim() !== "reset"}
                        style={{ padding: "6px 12px", borderRadius: 6, background: resetInput.toLowerCase().trim() === "reset" ? `${PAL.rose}30` : `${PAL.rose}08`, border: `1px solid ${resetInput.toLowerCase().trim() === "reset" ? PAL.rose : PAL.rose + "25"}`, color: resetInput.toLowerCase().trim() === "reset" ? PAL.cream : PAL.muted, fontSize: 10, fontFamily: ff.body, cursor: resetInput.toLowerCase().trim() === "reset" ? "pointer" : "not-allowed" }}>Delete All</button>
                      <button onClick={() => { setResetStep(0); setResetInput(""); }} style={{ padding: "6px 10px", borderRadius: 6, background: "transparent", border: `1px solid ${PAL.border}`, color: PAL.muted, fontSize: 10, fontFamily: ff.body, cursor: "pointer" }}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>❋</div>
              <p style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream }}>Select a fragrance to edit</p>
              <p style={{ fontSize: 12, color: PAL.muted, marginTop: 4 }}>Or click "+ Add Fragrance" to add a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPanel;
