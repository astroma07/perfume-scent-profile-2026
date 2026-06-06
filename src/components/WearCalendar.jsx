import { useState, useMemo, useCallback, useRef } from "react";
import { PAL, ff, NOTE_COLORS, MONTHS, DAYS_SHORT, getDaysInMonth, getFirstDayOfWeek, dateKey } from "../constants.js";
import { RATING_CATEGORIES, RatingSlider } from "./ui.jsx";

const WearCalendar = ({ wearLog, setWearLog, bottles, wearRatings, setWearRatings }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerMouseDown = useRef(null);

  /* Show owned and tester bottles in the picker */
  const ownedBottles = useMemo(() => bottles.filter(b => b.status === "owned" || b.status === "tester"), [bottles]);

  /* Generate a stable color for any bottle name */
  const bottleColor = useCallback((name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return NOTE_COLORS[Math.abs(hash) % NOTE_COLORS.length];
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleDayClick = (day) => {
    const key = dateKey(viewYear, viewMonth, day);
    setSelectedDay(key);
    setPickerOpen(true);
  };

  const toggleFragrance = (bottleName) => {
    setWearLog(prev => {
      const current = prev[selectedDay] || [];
      const exists = current.includes(bottleName);
      const updated = exists ? current.filter(n => n !== bottleName) : [...current, bottleName];
      if (updated.length === 0) { const n = { ...prev }; delete n[selectedDay]; return n; }
      return { ...prev, [selectedDay]: updated };
    });
  };

  const clearDay = () => {
    setWearLog(prev => { const n = { ...prev }; delete n[selectedDay]; return n; });
    setPickerOpen(false);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(viewYear, viewMonth, d);
    const worn = wearLog[key] || [];
    const isToday = key === todayKey;
    const hasWear = worn.length > 0;
    cells.push(
      <div key={d} onClick={() => handleDayClick(d)} style={{
        position: "relative", aspectRatio: "1", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", borderRadius: 10, cursor: "pointer",
        border: isToday ? `1.5px solid ${PAL.gold}66` : `1px solid ${PAL.border}`,
        background: hasWear ? `${bottleColor(worn[0])}12` : "transparent",
        transition: "all .2s",
      }}>
        <span style={{ fontFamily: ff.body, fontSize: 12, color: isToday ? PAL.gold : PAL.cream, fontWeight: isToday ? 600 : 400 }}>{d}</span>
        {hasWear && (
          <div style={{
            position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 2,
          }}>
            {worn.slice(0, 4).map((name, i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: bottleColor(name),
                boxShadow: `0 0 4px ${bottleColor(name)}88`,
              }} />
            ))}
            {worn.length > 4 && (
              <span style={{ fontSize: 7, color: PAL.muted, lineHeight: 1, marginLeft: 1 }}>+{worn.length - 4}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${PAL.border}`, borderRadius: 6, width: 32, height: 32, color: PAL.muted, cursor: "pointer", fontSize: 14 }}>‹</button>
        <span style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${PAL.border}`, borderRadius: 6, width: 32, height: 32, color: PAL.muted, cursor: "pointer", fontSize: 14 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: "center", fontFamily: ff.body, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells}
      </div>

      {/* Legend */}
      {(() => {
        const monthEntries = Object.entries(wearLog).filter(([k]) => k.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}`));
        const uniqueNames = [...new Set(monthEntries.flatMap(([,v]) => v))];
        if (uniqueNames.length === 0) return (
          <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, textAlign: "center", marginTop: 14 }}>
            Tap a day to log what you wore
          </p>
        );
        return (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, justifyContent: "center" }}>
            {uniqueNames.map(name => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: bottleColor(name), flexShrink: 0 }} />
                <span style={{ fontFamily: ff.body, fontSize: 11, color: PAL.cream }}>{name}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Fragrance picker popover */}
      {pickerOpen && (
        <div
          onMouseDown={e => { pickerMouseDown.current = e.target; }}
          onClick={e => { if (e.target === e.currentTarget && pickerMouseDown.current === e.currentTarget) setPickerOpen(false); }}
          style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: PAL.bg, border: `1px solid ${PAL.border}`, borderRadius: 16,
            padding: 24, width: "88%", maxWidth: 400, maxHeight: "70vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h4 style={{ fontFamily: ff.display, fontSize: 18, color: PAL.cream, margin: 0 }}>Log Your Wear</h4>
                <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, margin: "2px 0 0" }}>
                  {selectedDay} · {(wearLog[selectedDay] || []).length > 0 ? `${(wearLog[selectedDay] || []).length} selected` : "select one or more"}
                </p>
              </div>
              <button onClick={() => setPickerOpen(false)} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {ownedBottles.length === 0 ? (
              <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, textAlign: "center", padding: "20px 0", lineHeight: 1.6 }}>
                No owned or tester fragrances yet. Add bottles to your collection to start logging wears.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ownedBottles.map((b) => {
                  const dayArr = wearLog[selectedDay] || [];
                  const isActive = dayArr.includes(b.name);
                  const color = bottleColor(b.name);
                  return (
                    <button key={b.name} onClick={() => toggleFragrance(b.name)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      borderRadius: 10, cursor: "pointer", transition: "all .2s",
                      background: isActive ? `${color}22` : "transparent",
                      border: isActive ? `1px solid ${color}55` : `1px solid ${PAL.border}`,
                      textAlign: "left",
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: isActive ? `2px solid ${color}` : `1.5px solid ${PAL.border}`,
                        background: isActive ? color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .2s",
                      }}>
                        {isActive && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: ff.body, fontSize: 13, color: PAL.cream, display: "block" }}>{b.name}</span>
                        {b.house && <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted }}>{b.house}</span>}
                      </div>
                      {isActive && <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.gold, letterSpacing: 1 }}>WORN</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {/* Daily wear rating */}
            {(wearLog[selectedDay] || []).length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${PAL.border}` }}>
                <span style={{ fontFamily: ff.display, fontStyle: "italic", fontSize: 12, color: PAL.gold, display: "block", marginBottom: 10 }}>Rate today's wear</span>
                {RATING_CATEGORIES.map(cat => (
                  <div key={cat.key} style={{ marginBottom: 6 }}>
                    <RatingSlider
                      compact
                      label={cat.label}
                      color={cat.color}
                      value={(wearRatings[selectedDay] || {})[cat.key] || 0}
                      onChange={v => setWearRatings(prev => ({
                        ...prev,
                        [selectedDay]: { ...(prev[selectedDay] || {}), [cat.key]: v }
                      }))}
                    />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setPickerOpen(false)} style={{
                flex: 1, padding: "11px",
                background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, borderRadius: 8,
                color: PAL.gold, fontFamily: ff.body, fontSize: 12, fontWeight: 500, cursor: "pointer",
                letterSpacing: 1,
              }}>Done</button>
              {(wearLog[selectedDay] || []).length > 0 && (
                <button onClick={clearDay} style={{
                  padding: "11px 16px",
                  background: "transparent", border: `1px solid ${PAL.rose}44`, borderRadius: 8,
                  color: PAL.rose, fontFamily: ff.body, fontSize: 12, cursor: "pointer",
                }}>Clear</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WearCalendar;
