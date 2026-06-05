import { PAL, ff } from "../constants.js";

export const ChartTooltip = ({ active, payload, label, units }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,13,9,0.95)", backdropFilter: "blur(10px)", border: `1px solid ${PAL.border}`, borderRadius: 10, padding: "14px 18px", fontFamily: ff.body, fontSize: 12 }}>
      <div style={{ color: PAL.gold, fontFamily: ff.display, fontSize: 14, marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: PAL.muted, flex: 1 }}>{p.name}</span>
          <span style={{ color: PAL.cream, fontWeight: 500 }}>{units?.[p.dataKey] ? `${units[p.dataKey][0]}${p.value}${units[p.dataKey][1]}` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const Pill = ({ label, value, accent }) => (
  <div style={{ background: PAL.card, border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "14px 18px", flex: "1 1 140px", display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontFamily: ff.body, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: PAL.muted }}>{label}</span>
    <span style={{ fontFamily: ff.display, fontSize: 26, fontWeight: 400, color: accent || PAL.cream, lineHeight: 1.1 }}>{value}</span>
  </div>
);


export const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: ff.display, fontSize: 24, fontWeight: 400, color: PAL.cream, margin: 0 }}>{title}</h2>
    <p style={{ fontFamily: ff.body, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, margin: "4px 0 0" }}>{sub}</p>
  </div>
);

/* ─── Edit Panel ─────────────────────────────────────────── */

import { RATING_CATEGORIES } from "../noteCategories.js";
export { RATING_CATEGORIES };

export const RatingSlider = ({ value, onChange, color, label, compact }) => {
  const displayVal = value || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 10, flex: 1, minWidth: compact ? 0 : 180 }}>
      {label && <span style={{ fontFamily: ff.body, fontSize: compact ? 9 : 10, color: PAL.muted, letterSpacing: 1.5, textTransform: "uppercase", minWidth: compact ? 50 : 65, flexShrink: 0 }}>{label}</span>}
      <input
        type="range" min="0" max="10" step="0.5" value={displayVal}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1, height: 4, appearance: "none", background: PAL.border, borderRadius: 2, outline: "none", cursor: "pointer",
          accentColor: color || PAL.gold,
        }}
      />
      <span style={{
        fontFamily: ff.display, fontSize: compact ? 14 : 16, color: displayVal > 0 ? (color || PAL.gold) : PAL.muted,
        minWidth: 28, textAlign: "right", fontWeight: 400,
      }}>{displayVal > 0 ? displayVal.toFixed(1) : "—"}</span>
    </div>
  );
};


export const RatingBadge = ({ ratings, size }) => {
  const avg = ratings && ratings.overall > 0 ? ratings.overall : null;
  if (!avg) return null;
  const sz = size || 28;
  return (
    <div style={{
      width: sz, height: sz, borderRadius: sz / 2, flexShrink: 0,
      background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}33`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: ff.display, fontSize: sz * 0.45, color: PAL.gold,
    }}>{avg.toFixed(1)}</div>
  );
};
