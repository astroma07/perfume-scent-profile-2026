import { useState, useMemo } from "react";
import { PAL, ff, STATUS_COLORS, TESTER_COLOR } from "../constants.js";
import { RATING_CATEGORIES, RatingSlider, RatingBadge, SectionTitle, FragranceTags, TagIcons } from "./ui.jsx";

const TestedTab = ({ testedScents, setTestedScents, bottles, setBottles, bottleRatings, setBottleRatings }) => {
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [collapsedSections, setCollapsedSections] = useState({});
  const emptyForm = { name: "", house: "", date: new Date().toISOString().split("T")[0], notes: "", thoughts: "", overall: 0, sillage: 0, longevity: 0, scent: 0, tags: {}, concentration: "", hasTester: false };
  const [form, setForm] = useState(emptyForm);

  const saveEntry = () => {
    if (!form.name.trim()) return;
    const entry = {
      ...form,
      name: form.name.trim(), house: form.house.trim(), notes: form.notes.trim(),
      avg: RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).length > 0
        ? RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).reduce((s, c) => s + form[c.key], 0) / RATING_CATEGORIES.filter(c => (form[c.key] || 0) > 0).length
        : 0,
      createdAt: editIdx !== null ? (testedScents[editIdx]?.createdAt || Date.now()) : Date.now(),
    };
    if (editIdx !== null) {
      const updated = [...testedScents]; updated[editIdx] = entry; setTestedScents(updated);
    } else {
      setTestedScents(prev => [entry, ...prev]);
    }
    /* Sync ratings to bottleRatings so My Collection picks them up */
    const ratingData = {};
    RATING_CATEGORIES.forEach(c => { if (form[c.key] > 0) ratingData[c.key] = form[c.key]; });
    if (Object.keys(ratingData).length > 0) {
      setBottleRatings(prev => ({ ...prev, [form.name.trim()]: { ...(prev[form.name.trim()] || {}), ...ratingData } }));
    }
    resetForm();
  };

  const deleteEntry = (idx) => { setTestedScents(prev => prev.filter((_, i) => i !== idx)); };
  const resetForm = () => { setForm(emptyForm); setEditIdx(null); setShowForm(false); };
  const editEntry = (origIdx) => {
    const e = testedScents[origIdx];
    setForm({ name: e.name || "", house: e.house || "", date: e.date || "", notes: e.notes || "", thoughts: e.thoughts || "",
      overall: e.overall || 0, sillage: e.sillage || 0, longevity: e.longevity || 0, scent: e.scent || 0,
      tags: e.tags || {}, concentration: e.concentration || "", hasTester: e.hasTester || false });
    setEditIdx(origIdx); setShowForm(true);
  };

  const addToCollection = (entry, status) => {
    setBottles(prev => [...prev, {
      name: entry.name, fullName: entry.house ? `${entry.name} — ${entry.house}` : entry.name,
      house: entry.house || "", cost: 0, ml: 0, freq: 0, status,
      userNotes: entry.notes || "", thoughts: entry.thoughts || "",
      tags: entry.tags || {}, concentration: entry.concentration || "",
      hasTester: entry.hasTester || status === "tester",
    }]);
    /* Also sync ratings */
    const ratingData = {};
    RATING_CATEGORIES.forEach(c => { if (entry[c.key] > 0) ratingData[c.key] = entry[c.key]; });
    if (Object.keys(ratingData).length > 0) {
      setBottleRatings(prev => ({ ...prev, [entry.name]: { ...(prev[entry.name] || {}), ...ratingData } }));
    }
  };

  const alreadyInCollection = (name) => bottles.some(b => b.name.toLowerCase() === name.toLowerCase());

  const sorted = useMemo(() => {
    const copy = [...testedScents];
    if (sortBy === "rating") copy.sort((a, b) => (b.avg || 0) - (a.avg || 0));
    else if (sortBy === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    else copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return copy.map((e) => ({ ...e, _origIdx: testedScents.indexOf(e) }));
  }, [testedScents, sortBy]);

  const inputCss = { background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 8, padding: "10px 14px", color: PAL.cream, fontFamily: ff.body, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const selectCss = { ...inputCss, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238a7e6b' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 28 };
  const lab = { fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 };

  return (
    <div>
      <div onClick={() => setCollapsedSections(p => ({ ...p, tested: !p.tested }))} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 14, userSelect: "none" }}>
        <span style={{ fontSize: 10, color: PAL.muted, transition: "transform .2s", transform: collapsedSections.tested ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
        <SectionTitle title="Tested Fragrances" sub={`${testedScents.length} scent${testedScents.length !== 1 ? "s" : ""} sampled`} />
      </div>

      {!collapsedSections.tested && !showForm && (
        <button onClick={() => { setShowForm(true); setEditIdx(null); setForm(emptyForm); }} style={{
          width: "100%", padding: "14px", marginBottom: 20, background: `${PAL.gold}10`,
          border: `1px dashed ${PAL.gold}44`, borderRadius: 10, color: PAL.gold,
          fontFamily: ff.body, fontSize: 13, cursor: "pointer", letterSpacing: 0.5,
        }}>+ Log a tested fragrance</button>
      )}

      {!collapsedSections.tested && showForm && (
        <div style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.gold}22`, borderRadius: 14, padding: "20px 18px", marginBottom: 20, animation: "cardIn .3s both" }}>

          {/* Row 1: Name, House, Date */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 180px" }}><label style={lab}>Fragrance name *</label><input style={inputCss} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tam Dao" /></div>
            <div style={{ flex: "1 1 140px" }}><label style={lab}>House</label><input style={inputCss} value={form.house} onChange={e => setForm({ ...form, house: e.target.value })} placeholder="e.g. Diptyque" /></div>
            <div style={{ flex: "0.7 1 100px" }}><label style={lab}>Date tested</label><input style={inputCss} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          </div>

          {/* Row 2: Concentration, Tester toggle */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "end" }}>
            <div style={{ flex: "0 0 110px" }}>
              <label style={lab}>Type</label>
              <select style={selectCss} value={form.concentration || ""} onChange={e => setForm({ ...form, concentration: e.target.value })}>
                <option value="" style={{ background: PAL.bg }}>—</option>
                <option value="parfum" style={{ background: PAL.bg }}>Parfum</option>
                <option value="edp" style={{ background: PAL.bg }}>EDP</option>
                <option value="edt" style={{ background: PAL.bg }}>EDT</option>
                <option value="edc" style={{ background: PAL.bg }}>EDC</option>
                <option value="body" style={{ background: PAL.bg }}>Body</option>
                <option value="oil" style={{ background: PAL.bg }}>Oil</option>
              </select>
            </div>
            <div style={{ textAlign: "center" }}>
              <label style={lab}>Tester</label>
              <button onClick={() => setForm({ ...form, hasTester: !form.hasTester })}
                style={{
                  width: 38, height: 38, borderRadius: 8, cursor: "pointer",
                  background: form.hasTester ? `${TESTER_COLOR}20` : "transparent",
                  border: `1.5px solid ${form.hasTester ? TESTER_COLOR : PAL.border}`,
                  color: form.hasTester ? TESTER_COLOR : PAL.muted,
                  fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .2s",
                }}>{form.hasTester ? "◉" : "○"}</button>
            </div>
            <div style={{ flex: 1 }} />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 12 }}>
            <label style={lab}>Notes you detected</label>
            <input style={inputCss} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. sandalwood, cedar, rosewood, cypress" />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 14 }}>
            <label style={lab}>When to wear</label>
            <FragranceTags tags={form.tags || {}} onChange={t => setForm({ ...form, tags: t })} />
          </div>

          {/* Rating sliders */}
          <div style={{ marginBottom: 14 }}>
            <label style={lab}>Ratings</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RATING_CATEGORIES.map(cat => (
                <RatingSlider key={cat.key} label={cat.label} color={cat.color}
                  value={form[cat.key] || 0} onChange={v => setForm({ ...form, [cat.key]: v })} />
              ))}
            </div>
          </div>

          {/* Thoughts */}
          <div style={{ marginBottom: 16 }}>
            <label style={lab}>Thoughts / impressions</label>
            <textarea style={{ ...inputCss, minHeight: 60, resize: "vertical" }} value={form.thoughts} onChange={e => setForm({ ...form, thoughts: e.target.value })} placeholder="How did it wear? Would you buy a full bottle?" />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveEntry} disabled={!form.name.trim()} style={{
              flex: 1, padding: "12px", background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
              color: PAL.gold, fontFamily: ff.body, fontSize: 13, fontWeight: 500, cursor: "pointer",
              opacity: form.name.trim() ? 1 : .4, letterSpacing: 0.5,
            }}>{editIdx !== null ? "Save Changes" : "Log Scent"}</button>
            <button onClick={resetForm} style={{ padding: "12px 20px", background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 8, color: PAL.muted, fontFamily: ff.body, fontSize: 12, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Sort controls */}
      {!collapsedSections.tested && testedScents.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {[{ k: "date", l: "Recent" }, { k: "rating", l: "Top Rated" }, { k: "name", l: "A–Z" }].map(s => (
            <button key={s.k} onClick={() => setSortBy(s.k)} style={{
              background: sortBy === s.k ? `${PAL.gold}14` : "transparent",
              border: `1px solid ${sortBy === s.k ? PAL.gold + "44" : PAL.border}`,
              borderRadius: 8, padding: "5px 12px",
              fontFamily: ff.body, fontSize: 10, color: sortBy === s.k ? PAL.gold : PAL.muted, cursor: "pointer", letterSpacing: 1,
            }}>{s.l}</button>
          ))}
        </div>
      )}

      {/* Entries list */}
      {!collapsedSections.tested && sorted.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>◉</div>
          <p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>No scents tested yet</p>
          <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 4, lineHeight: 1.6 }}>
            Click the button above to log your first sample or tester experience.
          </p>
        </div>
      )}

      {!collapsedSections.tested && (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((entry, idx) => {
          const i = entry._origIdx;
          const exists = alreadyInCollection(entry.name);
          const catsFilled = RATING_CATEGORIES.filter(c => (entry[c.key] || 0) > 0);
          const concLabel = { parfum: "Parfum", edp: "EDP", edt: "EDT", edc: "EDC", body: "Body", oil: "Oil" }[entry.concentration] || "";
          return (
            <div key={idx} style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {entry.avg > 0 && <RatingBadge ratings={{ overall: entry.avg }} size={32} />}
                    <span style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic", color: PAL.cream }}>{entry.name}</span>
                    <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted }}>— {entry.house}</span>
                    {concLabel && <span style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: PAL.muted, border: `1px solid ${PAL.border}`, borderRadius: 4, padding: "1px 6px" }}>{concLabel}</span>}
                    {entry.hasTester && <span style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: TESTER_COLOR, border: `1px solid ${TESTER_COLOR}30`, borderRadius: 4, padding: "1px 6px" }}>tester</span>}
                  </div>
                  {entry.date && <p style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, margin: "6px 0 0" }}>Tested {entry.date}</p>}

                  {entry.notes && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                      {entry.notes.split(",").map(n => n.trim()).filter(Boolean).map((n, j) => (
                        <span key={j} style={{ fontFamily: ff.body, fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: PAL.gold, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}20`, borderRadius: 3, padding: "1px 6px" }}>{n}</span>
                      ))}
                    </div>
                  )}

                  {/* Tags preview */}
                  {entry.tags && Object.values(entry.tags).some(arr => arr.length > 0) && (
                    <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                      {Object.entries(entry.tags).flatMap(([, keys]) =>
                        keys.map(k => <span key={k} style={{ display: "inline-flex", width: 16, height: 16, opacity: .6 }}>{TagIcons[k] && TagIcons[k](true, 16)}</span>)
                      )}
                    </div>
                  )}

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
                      <button onClick={() => addToCollection(entry, "tester")} style={{ padding: "6px 12px", borderRadius: 6, background: `${TESTER_COLOR}10`, border: `1px solid ${TESTER_COLOR}35`, color: TESTER_COLOR, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>+ Tester</button>
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
      )}

      {/* To Test section */}
      {(() => {
        const toTestItems = bottles.filter(b => b.status === "to test" && b.name.trim());
        if (toTestItems.length === 0) return null;
        return (
          <div style={{ marginTop: 24, borderTop: `1px solid ${PAL.border}`, paddingTop: 16 }}>
            <div onClick={() => setCollapsedSections(p => ({ ...p, toTest: !p.toTest }))} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 14, userSelect: "none" }}>
              <span style={{ fontSize: 10, color: PAL.muted, transition: "transform .2s", transform: collapsedSections.toTest ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
              <SectionTitle title="To Test" sub={`${toTestItems.length} fragrance${toTestItems.length !== 1 ? "s" : ""} on your list`} />
            </div>
            {!collapsedSections.toTest && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {toTestItems.map((b, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: ff.display, fontSize: 16, fontStyle: "italic", color: PAL.cream }}>{b.name}</span>
                      {b.house && <span style={{ fontSize: 11, color: PAL.muted }}>— {b.house}</span>}
                    </div>
                    {(b.userNotes || "").trim() && (
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                        {b.userNotes.split(",").map(n => n.trim()).filter(Boolean).map((n, j) => (
                          <span key={j} style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, color: PAL.gold, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}20` }}>{n}</span>
                        ))}
                      </div>
                    )}
                    {b.thoughts && <p style={{ fontFamily: ff.body, fontSize: 11, color: `${PAL.cream}55`, margin: "6px 0 0", fontStyle: "italic" }}>"{b.thoughts}"</p>}
                  </div>
                  <button onClick={() => { setForm({ ...emptyForm, name: b.name, house: b.house || "", notes: b.userNotes || "", thoughts: b.thoughts || "" }); setEditIdx(null); setShowForm(true); }}
                    style={{ padding: "6px 12px", borderRadius: 6, background: `${STATUS_COLORS["to test"]}10`, border: `1px solid ${STATUS_COLORS["to test"]}35`, color: STATUS_COLORS["to test"], fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1, flexShrink: 0 }}>Log Test</button>
                </div>
              ))}
            </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default TestedTab;
