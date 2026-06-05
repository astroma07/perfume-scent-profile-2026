import { useState, useMemo } from "react";
import { PAL, ff, STATUS_COLORS } from "../constants.js";

const BubbleChart = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });
  const containerRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDims({ w: rect.width, h: Math.min(440, Math.max(320, rect.width * 0.55)) });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (data.length === 0) return <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, textAlign: "center", padding: 40 }}>No fragrances in this filter</p>;

  const pad = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = dims.w - pad.left - pad.right;
  const plotH = dims.h - pad.top - pad.bottom;

  const maxCost = Math.max(...data.map(d => d.cost), 50);
  const maxMl = Math.max(...data.map(d => d.ml), 20);
  const maxFreq = Math.max(...data.map(d => d.freq), 1);

  const scaleX = (cost) => pad.left + (cost / maxCost) * plotW;
  const scaleY = (ml) => pad.top + plotH - (ml / maxMl) * plotH;
  const scaleR = (freq) => 8 + (freq / maxFreq) * 26;

  /* X-axis ticks */
  const xTicks = [];
  const xStep = maxCost <= 200 ? 50 : maxCost <= 500 ? 100 : 150;
  for (let v = 0; v <= maxCost; v += xStep) xTicks.push(v);

  /* Y-axis ticks */
  const yTicks = [];
  const yStep = maxMl <= 60 ? 10 : maxMl <= 120 ? 25 : 50;
  for (let v = 0; v <= maxMl; v += yStep) yTicks.push(v);

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <svg width={dims.w} height={dims.h} style={{ overflow: "visible" }}>
        {/* Grid lines */}
        {xTicks.map(v => (
          <line key={`xg${v}`} x1={scaleX(v)} y1={pad.top} x2={scaleX(v)} y2={pad.top + plotH} stroke={PAL.border} strokeDasharray="3 3" />
        ))}
        {yTicks.map(v => (
          <line key={`yg${v}`} x1={pad.left} y1={scaleY(v)} x2={pad.left + plotW} y2={scaleY(v)} stroke={PAL.border} strokeDasharray="3 3" />
        ))}

        {/* Axes */}
        <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke={PAL.border} />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke={PAL.border} />

        {/* X-axis labels */}
        {xTicks.map(v => (
          <text key={`xl${v}`} x={scaleX(v)} y={pad.top + plotH + 20} textAnchor="middle" fill={PAL.muted} fontFamily={ff.body} fontSize={10}>${v}</text>
        ))}
        <text x={pad.left + plotW / 2} y={dims.h - 4} textAnchor="middle" fill={PAL.muted} fontFamily={ff.body} fontSize={9} letterSpacing="2">COST ($)</text>

        {/* Y-axis labels */}
        {yTicks.map(v => (
          <text key={`yl${v}`} x={pad.left - 10} y={scaleY(v) + 4} textAnchor="end" fill={PAL.muted} fontFamily={ff.body} fontSize={10}>{v}mL</text>
        ))}
        <text x={14} y={pad.top + plotH / 2} textAnchor="middle" fill={PAL.muted} fontFamily={ff.body} fontSize={9} letterSpacing="2" transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}>VOLUME</text>

        {/* Bubbles */}
        {data.map((b, i) => {
          const cx = scaleX(b.cost);
          const cy = scaleY(b.ml);
          const r = scaleR(b.freq);
          const sc = STATUS_COLORS[b.status] || PAL.muted;
          const isHov = hoveredIdx === i;
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Glow */}
              {isHov && <circle cx={cx} cy={cy} r={r + 4} fill={sc} opacity={0.15} />}
              {/* Bubble */}
              <circle cx={cx} cy={cy} r={r}
                fill={sc}
                opacity={hoveredIdx !== null ? (isHov ? 0.85 : 0.2) : 0.65}
                stroke={isHov ? sc : "none"}
                strokeWidth={isHov ? 2 : 0}
                style={{ transition: "all .25s ease" }}
              />
              {/* Label — show on hover or if bubble is big enough */}
              {(isHov || r > 18) && (
                <text x={cx} y={cy - r - 6} textAnchor="middle" fill={isHov ? PAL.cream : PAL.muted}
                  fontFamily={ff.body} fontSize={isHov ? 11 : 9} fontWeight={isHov ? 500 : 400}
                  style={{ transition: "all .2s", pointerEvents: "none" }}>
                  {b.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (() => {
        const b = data[hoveredIdx];
        const sc = STATUS_COLORS[b.status] || PAL.muted;
        const cx = scaleX(b.cost);
        const cy = scaleY(b.ml);
        const tooltipLeft = cx > dims.w / 2 ? cx - 180 : cx + 20;
        const tooltipTop = Math.max(8, Math.min(cy - 40, dims.h - 120));
        return (
          <div style={{
            position: "absolute", left: tooltipLeft, top: tooltipTop,
            background: "rgba(15,13,9,0.95)", backdropFilter: "blur(10px)",
            border: `1px solid ${sc}40`, borderRadius: 10,
            padding: "12px 16px", fontFamily: ff.body, fontSize: 12,
            pointerEvents: "none", zIndex: 10, minWidth: 150,
          }}>
            <div style={{ fontFamily: ff.display, fontSize: 15, color: PAL.cream, marginBottom: 2 }}>{b.name}</div>
            {b.house && <div style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginBottom: 6 }}>{b.house}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 8, color: sc, background: `${sc}18`, border: `1px solid ${sc}30`, borderRadius: 3, padding: "1px 6px", letterSpacing: 1, textTransform: "uppercase" }}>{b.status}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: PAL.muted }}>Cost</span>
                <span style={{ color: PAL.cream, fontWeight: 500 }}>${b.cost}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: PAL.muted }}>Volume</span>
                <span style={{ color: PAL.cream, fontWeight: 500 }}>{b.ml}mL</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: PAL.muted }}>Frequency</span>
                <span style={{ color: PAL.cream, fontWeight: 500 }}>{b.freq}×/mo</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingTop: 4, borderTop: `1px solid ${PAL.border}` }}>
                <span style={{ color: PAL.muted }}>Cost/mL</span>
                <span style={{ color: PAL.gold, fontWeight: 500 }}>${(b.cost / (b.ml || 1)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default BubbleChart;
