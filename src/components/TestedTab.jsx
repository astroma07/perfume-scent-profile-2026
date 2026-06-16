import { useState, useMemo } from "react";
import { PAL, ff, STATUS_COLORS, TESTER_COLOR } from "../constants.js";
import { RATING_CATEGORIES, RatingSlider, RatingBadge, SectionTitle } from "./ui.jsx";

const TestedTab = ({ testedScents, setTestedScents, bottles, setBottles }) => {
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ name: "", house: "", notes: "", date: "", overall: 0, sillage: 0, longevity: 0, scent: 0, thoughts: "" });
  const [sortBy, setSortBy] = useState("date"); /* date | rating | name */

  const resetForm = () => {
    setForm({ name: "", house: "", notes: "", date: new Date().toISOString().slice(0, 10), overall: 0, sillage: 0, longevity: 0, scent: 0, thoughts: "" });
    setEditIdx(null);
    setShowForm(false);
  };

  const saveEntry = () => {
    if (!form.name.trim()) return;
    const entry = {
      ...form,
      name: form.name.trim(),
      house: form.house.trim(),
      notes: form.notes.trim(),
      avg: RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).length > 0
        ? RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).reduce((s, c) => s + form[c.key], 0) / RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).length
        : 0,
      createdAt: editIdx !== null ? (testedScents[editIdx]?.createdAt || Date.now()) : Date.now(),
    };
    if (editIdx !== null) {
      const updated = [...testedScents];
      updated[editIdx] = entry;
      setTestedScents(updated);
    } else {
      setTestedScents(prev => [entry, ...prev]);
    }
    resetForm();
  };

  const deleteEntry = (idx) => {
    setTestedScents(prev => prev.filter((_, i) => i !== idx));
  };

  const editEntry = (idx) => {
    const e = testedScents[idx];
    setForm({ name: e.name, house: e.house || "", notes: e.notes || "", date: e.date || "", overall: e.overall || 0, sillage: e.sillage || 0, longevity: e.longevity || 0, scent: e.scent || 0, thoughts: e.thoughts || "" });
    setEditIdx(idx);
    setShowForm(true);
  };

  const addToCollection = (entry, status, hasTester = false) => {
    const newBottle = {
      name: entry.name,
      fullName: entry.house ? `${entry.name} — ${entry.house}` : entry.name,
      house: entry.house || "",
      cost: 0, ml: 0, freq: 0, status,
      userNotes: entry.notes || "",
      thoughts: entry.thoughts || "",
      hasTester,
    };
    setBottles(prev => [...prev, newBottle]);
  };

  const alreadyInCollection = (name) => bottles.some(b => b.name.toLowerCase() === name.toLowerCase());

  const sorted = useMemo(() => {
    const copy = [...testedScents];
    if (sortBy === "rating") copy.sort((a, b) => (b.avg || 0) - (a.avg || 0));
    else if (sortBy === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    else copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return copy.map((e, i) => ({ ...e, _origIdx: testedScents.indexOf(e) }));
  }, [testedScents, sortBy]);

  const inputCss = { background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "10px 14px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div>
      <SectionTitle title="Tested Fragrances" sub={`${testedScents.length} scent${testedScents.length !== 1 ? "s" : ""} sampled`} />

      {/* Add button */}
      {!showForm && (
        <button onClick={() => { setForm({ ...form, date: new Date().toISOString().slice(0, 10) }); setShowForm(true); }} style={{
          width: "100%", padding: "14px",
          background: `linear-gradient(135deg, ${PAL.gold}12, ${PAL.rose}08)`,
          border: `1px dashed ${PAL.gold}44`, borderRadius: 12,
          color: PAL.gold, fontFamily: ff.display, fontSize: 15, fontStyle: "italic",
          cursor: "pointer", marginBottom: 20, letterSpacing: 0.5,
        }}>+ Log a new scent</button>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div style={{
          background: `${PAL.cream}04`, border: `1px solid ${PAL.border}`, borderRadius: 14,
          padding: "20px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: ff.display, fontSize: 17, color: PAL.cream, margin: 0 }}>{editIdx !== null ? "Edit Entry" : "Log a Scent"}</h3>
            <button onClick={resetForm} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 180px" }}>
              <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Fragrance name *</label>
              <input style={inputCss} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tam Dao" />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>House</label>
              <input style={inputCss} value={form.house} onChange={e => setForm({ ...form, house: e.target.value })} placeholder="e.g. Diptyque" />
            </div>
            <div style={{ flex: "0.7 1 100px" }}>
              <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Date tested</label>
              <input style={inputCss} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Notes you detected</label>
            <input style={inputCss} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. sandalwood, cedar, rosewood, cypress" />
          </div>

          {/* Rating sliders */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 8 }}>Ratings</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RATING_CATEGORIES.map(cat => (
                <RatingSlider key={cat.key} label={cat.label} color={cat.color}
                  value={form[cat.key] || 0}
                  onChange={v => setForm({ ...form, [cat.key]: v })}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Thoughts / impressions</label>
            <textarea style={{ ...inputCss, minHeight: 60, resize: "vertical" }} value={form.thoughts} onChange={e => setForm({ ...form, thoughts: e.target.value })} placeholder="How did it wear? Would you buy a full bottle?" />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveEntry} disabled={!form.name.trim()} style={{
              flex: 1, padding: "12px",
              background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
              color: PAL.gold, fontFamily: ff.body, fontSize: 13, fontWeight: 500, cursor: "pointer",
              opacity: form.name.trim() ? 1 : .4, letterSpacing: 0.5,
            }}>{editIdx !== null ? "Save Changes" : "Log Scent"}</button>
            <button onClick={resetForm} style={{
              padding: "12px 20px",
              background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8,
              color: PAL.muted, fontFamily: ff.body, fontSize: 12, cursor: "pointer",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Sort controls */}
      {testedScents.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {[{ k: "date", l: "Recent" }, { k: "rating", l: "Top Rated" }, { k: "name", l: "A–Z" }].map(s => (
            <button key={s.k} onClick={() => setSortBy(s.k)} style={{
              background: sortBy === s.k ? `${PAL.gold}14` : "transparent",
              border: `1px solid ${sortBy === s.k ? PAL.gold + "44" : PAL.border}`,
              borderRadius: 8, padding: "5px 12px",
              fontFamily: ff.body, fontSize: 10, color: sortBy === s.k ? PAL.gold : PAL.muted,
              cursor: "pointer", letterSpacing: 1,
            }}>{s.l}</button>
          ))}
        </div>
      )}

      {/* Entries list */}
      {sorted.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>◉</div>
          <p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>No scents tested yet</p>
          <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 4, lineHeight: 1.6 }}>
            Log fragrances you sample at stores, from decants, or borrowed from friends.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((entry) => {
          const i = entry._origIdx;
          const exists = alreadyInCollection(entry.name);
          const catsFilled = RATING_CATEGORIES.filter(c => (entry[c.key] || 0) > 0);
          return (
            <div key={entry.createdAt + entry.name} style={{
              background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 12,
              padding: "14px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {entry.avg > 0 && <RatingBadge ratings={{ overall: entry.avg }} size={32} />}
                    <div>
                      <span style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>{entry.name}</span>
                      {entry.house && <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginLeft: 6 }}>{entry.house}</span>}
                    </div>
                  </div>
                  {entry.date && <p style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, margin: "6px 0 0" }}>Tested {entry.date}</p>}

                  {/* Notes pills */}
                  {entry.notes && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                      {entry.notes.split(",").map(n => n.trim()).filter(Boolean).map((n, j) => (
                        <span key={j} style={{ fontFamily: ff.body, fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: PAL.gold, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}20`, borderRadius: 3, padding: "1px 6px" }}>{n}</span>
                      ))}
                    </div>
                  )}

                  {/* Category ratings */}
                  {catsFilled.length > 0 && (
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      {RATING_CATEGORIES.map(cat => (
                        <div key={cat.key} style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: ff.body, fontSize: 7, color: PAL.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{cat.label.slice(0, 4)}</div>
                          <div style={{ fontFamily: ff.display, fontSize: 14, color: (entry[cat.key] || 0) > 0 ? cat.color : PAL.muted }}>
                            {(entry[cat.key] || 0) > 0 ? entry[cat.key].toFixed(1) : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.thoughts && (
                    <p style={{ fontFamily: ff.body, fontSize: 12, color: `${PAL.cream}77`, margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>"{entry.thoughts}"</p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => editEntry(i)} style={{ padding: "6px 12px", borderRadius: 6, background: "transparent", border: `1px solid ${PAL.border}`, color: PAL.muted, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>Edit</button>
                  {!exists ? (
                    <>
                      <button onClick={() => addToCollection(entry, "wishlist", true)} style={{ padding: "6px 12px", borderRadius: 6, background: `${TESTER_COLOR}10`, border: `1px solid ${TESTER_COLOR}35`, color: TESTER_COLOR, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>+ Sample</button>
                      <button onClick={() => addToCollection(entry, "wishlist")} style={{ padding: "6px 12px", borderRadius: 6, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}35`, color: PAL.gold, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>+ Wishlist</button>
                    </>
                  ) : (
                    <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.sage, textAlign: "center", letterSpacing: 1 }}>✓ In collection</span>
                  )}
                  <button onClick={() => { if (window.confirm(`Remove "${entry.name}" from tested?`)) deleteEntry(i); }} style={{ padding: "6px 12px", borderRadius: 6, background: "transparent", border: `1px solid ${PAL.rose}25`, color: PAL.rose, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1, opacity: .6 }}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestedTab;
