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

/* ═══ Fragrance Tag Icons ═══ */

const iconStyle = (active, size) => ({
  width: size || 28, height: size || 28, cursor: "pointer", opacity: active ? 1 : 0.25,
  transition: "all .2s",
});

export const TagIcons = {
  /* Time of Day */
  day: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="5" fill={active ? "#d4944a" : "#666"} />
      {[0,45,90,135,180,225,270,315].map(a => {
        const r = (a * Math.PI) / 180;
        return <line key={a} x1={12 + Math.cos(r)*7.5} y1={12 + Math.sin(r)*7.5} x2={12 + Math.cos(r)*10} y2={12 + Math.sin(r)*10} stroke={active ? "#d4944a" : "#666"} strokeWidth="1.5" strokeLinecap="round" />;
      })}
    </svg>
  ),
  night: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill={active ? "#8a8acd" : "#666"} />
    </svg>
  ),
  spring: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22V12M12 12C9 9 5 10 5 6c3.5 0 6 1.5 7 6zM12 12c3-3 7-2 7-6-3.5 0-6 1.5-7 6z" stroke={active ? "#d4849a" : "#666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="5" r="2.5" fill={active ? "#d4849a" : "#666"} opacity=".6" />
    </svg>
  ),
  summer: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="5.5" fill={active ? "#c5a46d" : "#666"} />
      {[0,60,120,180,240,300].map(a => {
        const r = (a * Math.PI) / 180;
        return <line key={a} x1={12 + Math.cos(r)*8} y1={12 + Math.sin(r)*8} x2={12 + Math.cos(r)*11} y2={12 + Math.sin(r)*11} stroke={active ? "#c5a46d" : "#666"} strokeWidth="2" strokeLinecap="round" />;
      })}
    </svg>
  ),
  fall: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3c0 6-3.5 9-7 12M10 15c-3-1-5.5-1-7 1 2 1 5 .5 7-1zM10 15c-1-3-1-6 2-8" stroke={active ? "#d4944a" : "#666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8c2 1 5 2 8 0-1 3-4 5-7 4" stroke={active ? "#c47a6b" : "#666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22v-7" stroke={active ? "#8a6a4a" : "#666"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  winter: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="2" x2="12" y2="22" stroke={active ? "#7bafc4" : "#666"} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="12" x2="22" y2="12" stroke={active ? "#7bafc4" : "#666"} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="5" x2="19" y2="19" stroke={active ? "#7bafc4" : "#666"} strokeWidth="1" strokeLinecap="round" />
      <line x1="19" y1="5" x2="5" y2="19" stroke={active ? "#7bafc4" : "#666"} strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.5" fill={active ? "#7bafc4" : "#666"} opacity=".5" />
      <circle cx="12" cy="19" r="1.5" fill={active ? "#7bafc4" : "#666"} opacity=".5" />
      <circle cx="5" cy="12" r="1.5" fill={active ? "#7bafc4" : "#666"} opacity=".5" />
      <circle cx="19" cy="12" r="1.5" fill={active ? "#7bafc4" : "#666"} opacity=".5" />
    </svg>
  ),
  casual: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4h12l-1 6H7L6 4z" fill={active ? "#6b9e6b" : "#666"} opacity=".4" />
      <path d="M6 4h12M7 10h10M8 10v10M16 10v10M5 20h14" stroke={active ? "#6b9e6b" : "#666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  date: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={active ? "#b5546a" : "#666"} />
    </svg>
  ),
  work: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="18" height="12" rx="2" stroke={active ? "#8a9e7a" : "#666"} strokeWidth="1.5" />
      <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" stroke={active ? "#8a9e7a" : "#666"} strokeWidth="1.5" />
      <line x1="3" y1="14" x2="21" y2="14" stroke={active ? "#8a9e7a" : "#666"} strokeWidth="1" opacity=".4" />
    </svg>
  ),
  evening: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 22l4-11 4 11H8z" stroke={active ? "#c5a46d" : "#666"} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 11V7" stroke={active ? "#c5a46d" : "#666"} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="5" r="2" fill={active ? "#c5a46d" : "#666"} opacity=".5" />
      <path d="M6 22h12" stroke={active ? "#c5a46d" : "#666"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  special: (active, size) => (
    <svg viewBox="0 0 24 24" style={iconStyle(active, size)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 14.5,9 22,9 16,13.5 18,21 12,17 6,21 8,13.5 2,9 9.5,9" fill={active ? "#c49bd4" : "#666"} />
    </svg>
  ),
};

export const TAG_DEFS = {
  timeOfDay: { label: "Time of Day", options: [
    { key: "day", label: "Day" }, { key: "night", label: "Night" },
  ]},
  seasons: { label: "Seasons", options: [
    { key: "spring", label: "Spring" }, { key: "summer", label: "Summer" },
    { key: "fall", label: "Fall" }, { key: "winter", label: "Winter" },
  ]},
  occasions: { label: "Occasion", options: [
    { key: "casual", label: "Casual" }, { key: "date", label: "Date" },
    { key: "work", label: "Work" }, { key: "evening", label: "Evening" },
    { key: "special", label: "Special" },
  ]},
};

export const FragranceTags = ({ tags, onChange, compact }) => {
  const toggle = (category, key) => {
    const current = tags?.[category] || [];
    const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
    onChange({ ...tags, [category]: next });
  };

  const iconSize = compact ? 20 : 24;

  return (
    <div style={{ display: "flex", gap: compact ? 8 : 14, flexWrap: "wrap", alignItems: "center" }}>
      {Object.entries(TAG_DEFS).map(([cat, def]) => (
        <div key={cat} style={{ display: "flex", gap: compact ? 2 : 4, alignItems: "center" }}>
          {def.options.map(opt => {
            const active = (tags?.[cat] || []).includes(opt.key);
            return (
              <div key={opt.key} onClick={() => toggle(cat, opt.key)}
                title={opt.label}
                style={{ display: "flex", alignItems: "center" }}>
                {TagIcons[opt.key](active, iconSize)}
              </div>
            );
          })}
          {cat !== "occasions" && <span style={{ width: 1, height: iconSize - 4, background: "#2a2318", margin: "0 2px" }} />}
        </div>
      ))}
    </div>
  );
};
