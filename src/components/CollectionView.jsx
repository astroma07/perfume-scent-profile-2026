import { useState, useMemo } from "react";
import { PAL, ff, STATUS_COLORS, STATUSES, TESTER_COLOR } from "../constants.js";
import { FAMILY_COLORS, getNoteFamily } from "../noteCategories.js";
import { RATING_CATEGORIES, RatingSlider, RatingBadge, SectionTitle, FragranceTags, TagIcons } from "./ui.jsx";

const CollectionView = ({ bottles, setBottles, bottleRatings, setBottleRatings, noteOverrides }) => {
  const [sortBy, setSortBy] = useState("status");
  const [filterStatus, setFilterStatus] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const sorted = useMemo(() => {
    let list = bottles.map((b, i) => ({ ...b, _idx: i })).filter(b => b.name.trim());
    if (filterStatus) list = list.filter(b => b.status === filterStatus);
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "house") list.sort((a, b) => (a.house || "").localeCompare(b.house || ""));
    else if (sortBy === "cost") list.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    else if (sortBy === "rating") {
      list.sort((a, b) => {
        const ra = bottleRatings[a.name] || {};
        const rb = bottleRatings[b.name] || {};
        const avgA = RATING_CATEGORIES.filter(c => (ra[c.key] || 0) > 0).length > 0 ? RATING_CATEGORIES.filter(c => (ra[c.key] || 0) > 0).reduce((s, c) => s + ra[c.key], 0) / RATING_CATEGORIES.filter(c => (ra[c.key] || 0) > 0).length : 0;
        const avgB = RATING_CATEGORIES.filter(c => (rb[c.key] || 0) > 0).length > 0 ? RATING_CATEGORIES.filter(c => (rb[c.key] || 0) > 0).reduce((s, c) => s + rb[c.key], 0) / RATING_CATEGORIES.filter(c => (rb[c.key] || 0) > 0).length : 0;
        return avgB - avgA;
      });
    } else {
      const order = STATUSES;
      list.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.name.localeCompare(b.name));
    }
    return list;
  }, [bottles, sortBy, filterStatus, bottleRatings]);

  const updateBottle = (idx, updates) => {
    const a = [...bottles];
    a[idx] = { ...a[idx], ...updates };
    setBottles(a);
  };

  return (
    <div>
      <SectionTitle title="My Collection" sub={`${sorted.length} fragrance${sorted.length !== 1 ? "s" : ""}`} />

      {/* Sort + Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 2, textTransform: "uppercase", marginRight: 4 }}>Sort</span>
        {[{k:"status",l:"Status"},{k:"name",l:"A-Z"},{k:"house",l:"House"},{k:"cost",l:"Cost"},{k:"rating",l:"Rating"}].map(s => (
          <button key={s.k} onClick={() => setSortBy(s.k)} style={{
            background: sortBy === s.k ? `${PAL.gold}14` : "transparent",
            border: `1px solid ${sortBy === s.k ? PAL.gold + "44" : PAL.border}`,
            borderRadius: 16, padding: "4px 12px",
            fontFamily: ff.body, fontSize: 10, color: sortBy === s.k ? PAL.gold : PAL.muted,
            cursor: "pointer",
          }}>{s.l}</button>
        ))}
        <span style={{ width: 1, height: 16, background: PAL.border, margin: "0 4px" }} />
        <span style={{ fontFamily: ff.body, fontSize: 9, color: PAL.muted, letterSpacing: 2, textTransform: "uppercase", marginRight: 4 }}>Filter</span>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? null : s)} style={{
            background: filterStatus === s ? `${STATUS_COLORS[s]}18` : "transparent",
            border: `1px solid ${filterStatus === s ? STATUS_COLORS[s] + "44" : PAL.border}`,
            borderRadius: 16, padding: "4px 12px",
            fontFamily: ff.body, fontSize: 10, color: filterStatus === s ? STATUS_COLORS[s] : PAL.muted,
            cursor: "pointer", textTransform: "capitalize",
          }}>{s}</button>
        ))}
      </div>

      {/* Collection cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((b) => {
          const isExpanded = expandedIdx === b._idx;
          const ratings = bottleRatings[b.name] || {};
          const filledRatings = RATING_CATEGORIES.filter(c => (ratings[c.key] || 0) > 0);
          const avg = filledRatings.length > 0 ? filledRatings.reduce((s, c) => s + ratings[c.key], 0) / filledRatings.length : 0;
          const notes = (b.userNotes || "").split(",").map(n => n.trim()).filter(Boolean);
          const statusColor = STATUS_COLORS[b.status] || PAL.muted;

          return (
            <div key={b._idx} onClick={() => setExpandedIdx(isExpanded ? null : b._idx)}
              style={{
                background: `${PAL.cream}03`, border: `1px solid ${isExpanded ? PAL.gold + "33" : PAL.border}`,
                borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                transition: "border-color .2s",
              }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Rating badge */}
                {avg > 0 && (
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    background: `${PAL.gold}14`, border: `1px solid ${PAL.gold}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: ff.display, fontSize: 15, color: PAL.gold, flexShrink: 0,
                  }}>{avg.toFixed(1)}</div>
                )}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic", color: PAL.cream }}>{b.name}</span>
                    {b.house && <span style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted }}>— {b.house}</span>}
                  </div>
                </div>
                {/* Status badge */}
                <span style={{
                  fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", padding: "3px 10px",
                  borderRadius: 12, color: statusColor, background: `${statusColor}14`,
                  border: `1px solid ${statusColor}30`, fontFamily: ff.body, flexShrink: 0,
                }}>{b.status}</span>
                {b.hasTester && (
                  <span style={{
                    fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", padding: "3px 10px",
                    borderRadius: 12, color: TESTER_COLOR, background: `${TESTER_COLOR}14`,
                    border: `1px solid ${TESTER_COLOR}30`, fontFamily: ff.body, flexShrink: 0,
                  }}>tester</span>
                )}
                {/* Cost */}
                {b.cost > 0 && (
                  <span style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>
                    ${b.cost}{b.ml > 0 && <span style={{ fontSize: 11, color: PAL.muted }}> / {b.ml}mL</span>}
                  </span>
                )}
              </div>

              {/* Notes pills */}
              {notes.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 10 }}>
                  {notes.map((n, j) => {
                    const family = getNoteFamily(n, noteOverrides);
                    const color = FAMILY_COLORS[family];
                    return (
                      <span key={j} style={{
                        fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px",
                        borderRadius: 4, color, background: `${color}12`, border: `1px solid ${color}25`,
                        fontFamily: ff.body,
                      }}>{n}</span>
                    );
                  })}
                </div>
              )}

              {/* Tags preview (collapsed) */}
              {!isExpanded && b.tags && (
                <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                  {Object.entries(b.tags || {}).flatMap(([cat, keys]) =>
                    keys.map(k => <span key={`${cat}-${k}`} style={{ display: "inline-flex", width: 18, height: 18, opacity: .6 }}>{TagIcons[k] && TagIcons[k](true)}</span>)
                  )}
                </div>
              )}

              {/* Thoughts preview (collapsed) */}
              {!isExpanded && b.thoughts && (
                <p style={{ fontFamily: ff.body, fontSize: 12, color: `${PAL.cream}66`, marginTop: 8, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.thoughts}
                </p>
              )}

              {/* Expanded view */}
              {isExpanded && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${PAL.border}`, paddingTop: 14 }} onClick={e => e.stopPropagation()}>
                  {/* Thoughts */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 6 }}>Thoughts</label>
                    <textarea
                      value={b.thoughts || ""}
                      onChange={e => updateBottle(b._idx, { thoughts: e.target.value })}
                      placeholder="Your impressions, when you wear it, memories…"
                      style={{
                        width: "100%", minHeight: 60, resize: "vertical",
                        background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`,
                        borderRadius: 8, padding: "10px 12px", color: PAL.cream,
                        fontFamily: ff.body, fontSize: 13, lineHeight: 1.6, outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Notes edit */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 6 }}>Notes</label>
                    <input
                      value={b.userNotes || ""}
                      onChange={e => updateBottle(b._idx, { userNotes: e.target.value })}
                      placeholder="sandalwood, vetiver, amber, musk"
                      style={{
                        width: "100%", background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`,
                        borderRadius: 8, padding: "10px 12px", color: PAL.cream,
                        fontFamily: ff.body, fontSize: 13, outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Ratings */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 8 }}>Ratings</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {RATING_CATEGORIES.map(cat => (
                        <RatingSlider key={cat.key} label={cat.label} color={cat.color}
                          value={ratings[cat.key] || 0}
                          onChange={v => setBottleRatings(prev => ({
                            ...prev, [b.name]: { ...(prev[b.name] || {}), [cat.key]: v }
                          }))} />
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 8 }}>When to Wear</label>
                    <FragranceTags tags={b.tags || {}} onChange={t => updateBottle(b._idx, { tags: t })} />
                  </div>

                  {/* Details row */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Status</label>
                      <select value={b.status} onChange={e => updateBottle(b._idx, { status: e.target.value })}
                        style={{ background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "6px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none" }}>
                        {STATUSES.map(s => <option key={s} value={s} style={{ background: PAL.bg }}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Cost</label>
                      <input type="number" value={b.cost || 0} onChange={e => updateBottle(b._idx, { cost: +e.target.value })}
                        style={{ width: 80, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "6px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Size (mL)</label>
                      <input type="number" value={b.ml || 0} onChange={e => updateBottle(b._idx, { ml: +e.target.value })}
                        style={{ width: 80, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "6px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Freq</label>
                      <input type="number" value={b.freq || 0} onChange={e => updateBottle(b._idx, { freq: +e.target.value })}
                        style={{ width: 60, background: `${PAL.cream}06`, border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "6px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none" }} />
                    </div>
                  </div>

                  {/* Remove */}
                  <button onClick={() => { if (confirm("Remove " + b.name + " from your collection?")) setBottles(bottles.filter((_, j) => j !== b._idx)); setExpandedIdx(null); }}
                    style={{ marginTop: 14, background: `${PAL.rose}08`, border: `1px solid ${PAL.rose}25`, borderRadius: 8, padding: "8px 16px", color: PAL.rose, fontFamily: ff.body, fontSize: 10, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
                    Remove from Collection
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: .4 }}>❋</div>
            <p style={{ fontFamily: ff.display, fontSize: 16, color: PAL.cream }}>
              {filterStatus ? `No ${filterStatus} fragrances` : "Your collection is empty"}
            </p>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 4 }}>
              {filterStatus ? "Try a different filter" : "Add fragrances via Edit Collection"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionView;
