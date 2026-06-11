import { useState, useMemo } from "react";
import { PAL, ff } from "../constants.js";
import { FAMILY_COLORS, getNoteFamily } from "../noteCategories.js";
import { SectionTitle } from "./ui.jsx";

const PurchaseList = ({ bottles, noteOverrides, purchaseData, setPurchaseData }) => {
  const [sortBy, setSortBy] = useState("priority");
  const [editingId, setEditingId] = useState(null);
  const [showPurchased, setShowPurchased] = useState(false);

  const inputCss = { background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "8px 10px", color: PAL.cream, fontFamily: ff.body, fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box" };

  const items = useMemo(() => {
    const wishlist = bottles.filter(b => b.status === "wishlist" && b.name.trim());
    return wishlist.map((b, i) => {
      const saved = (purchaseData || {})[b.name] || {};
      return { ...b, id: b.name, priority: saved.priority ?? i + 1, whereToBuy: saved.whereToBuy || "", budgetNote: saved.budgetNote || "", purchased: saved.purchased || false, notes: (b.userNotes || "").split(",").map(n => n.trim()).filter(Boolean) };
    });
  }, [bottles, purchaseData]);

  const sorted = useMemo(() => {
    const active = items.filter(i => !i.purchased), done = items.filter(i => i.purchased);
    let list = [...active];
    if (sortBy === "priority") list.sort((a, b) => a.priority - b.priority);
    else if (sortBy === "cost-low") list.sort((a, b) => (a.cost || 0) - (b.cost || 0));
    else if (sortBy === "cost-high") list.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return { active: list, done };
  }, [items, sortBy]);

  const totalCost = sorted.active.reduce((s, i) => s + (i.cost || 0), 0);
  const updateItem = (name, updates) => setPurchaseData(prev => ({ ...prev, [name]: { ...(prev?.[name] || {}), ...updates } }));
  const getNoteColor = (note) => FAMILY_COLORS[getNoteFamily(note, noteOverrides)] || PAL.gold;

  const movePriority = (name, direction) => {
    const list = [...sorted.active];
    const idx = list.findIndex(i => i.name === name);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const newData = { ...(purchaseData || {}) };
    newData[list[idx].name] = { ...(newData[list[idx].name] || {}), priority: list[swapIdx].priority };
    newData[list[swapIdx].name] = { ...(newData[list[swapIdx].name] || {}), priority: list[idx].priority };
    setPurchaseData(newData);
  };

  if (items.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>🛒</div>
      <p style={{ fontFamily: ff.display, fontSize: 17, color: PAL.cream }}>No wishlist fragrances yet</p>
      <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginTop: 6 }}>Add fragrances with "wishlist" status to build your shopping list.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <SectionTitle title="Purchase List" sub={`${sorted.active.length} remaining`} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: ff.display, fontSize: 26, color: PAL.gold }}>${totalCost.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: PAL.muted }}>total remaining</div>
        </div>
      </div>

      {sorted.active.length > 0 && (
        <div style={{ display: "flex", gap: 3, marginBottom: 16, height: 5, borderRadius: 3, overflow: "hidden", background: PAL.border }}>
          {sorted.active.filter(i => i.cost > 0).map((item, i) => (
            <div key={item.id} style={{ flex: item.cost, background: `hsl(${30 + i * 25}, 45%, ${50 - i * 3}%)` }} title={`${item.name}: $${item.cost}`} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[{k:"priority",l:"Priority"},{k:"cost-low",l:"Cost ↑"},{k:"cost-high",l:"Cost ↓"},{k:"name",l:"A-Z"}].map(s => (
          <button key={s.k} onClick={() => setSortBy(s.k)} style={{
            background: sortBy === s.k ? `${PAL.gold}14` : "transparent",
            border: `1px solid ${sortBy === s.k ? PAL.gold + "44" : PAL.border}`,
            borderRadius: 16, padding: "4px 12px", fontFamily: ff.body, fontSize: 10, color: sortBy === s.k ? PAL.gold : PAL.muted, cursor: "pointer",
          }}>{s.l}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.active.map((item, visualIdx) => {
          const isEditing = editingId === item.id;
          return (
            <div key={item.id} style={{ background: `${PAL.cream}03`, border: `1px solid ${isEditing ? PAL.gold + "33" : PAL.border}`, borderRadius: 14, padding: "14px 16px", transition: "border-color .2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", minWidth: 28 }}>
                  <button onClick={() => movePriority(item.name, -1)} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 10, cursor: "pointer", padding: 0 }}>▲</button>
                  <span style={{ fontFamily: ff.display, fontSize: 20, color: PAL.gold, lineHeight: 1 }}>{visualIdx + 1}</span>
                  <button onClick={() => movePriority(item.name, 1)} style={{ background: "none", border: "none", color: PAL.muted, fontSize: 10, cursor: "pointer", padding: 0 }}>▼</button>
                </div>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setEditingId(isEditing ? null : item.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic" }}>{item.name}</span>
                    {item.house && <span style={{ fontSize: 12, color: PAL.muted }}>— {item.house}</span>}
                  </div>
                  {item.notes.length > 0 && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                      {item.notes.map((n, j) => (
                        <span key={j} style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, color: getNoteColor(n), background: `${getNoteColor(n)}12`, border: `1px solid ${getNoteColor(n)}22` }}>{n}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", minWidth: 80, flexShrink: 0 }}>
                  <div style={{ fontFamily: ff.display, fontSize: 20, color: PAL.cream }}>{item.cost > 0 ? `$${item.cost}` : "—"}</div>
                  {item.ml > 0 && item.cost > 0 && <div style={{ fontSize: 10, color: PAL.muted }}>{item.ml}mL · ${(item.cost / item.ml).toFixed(2)}/mL</div>}
                  {item.whereToBuy && <div style={{ fontSize: 9, color: PAL.sage, marginTop: 2 }}>📍 {item.whereToBuy}</div>}
                </div>
                <div onClick={() => updateItem(item.name, { purchased: true })}
                  style={{ width: 28, height: 28, borderRadius: 14, border: `2px solid ${PAL.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  title="Mark purchased" />
              </div>
              {isEditing && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${PAL.border}` }} onClick={e => e.stopPropagation()}>
                  {item.thoughts && (
                    <div style={{ marginBottom: 10, padding: "8px 12px", background: `${PAL.gold}06`, borderRadius: 8, border: `1px solid ${PAL.gold}15` }}>
                      <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted }}>Notes from collection</span>
                      <p style={{ fontFamily: ff.body, fontSize: 13, color: PAL.cream, margin: "4px 0 0", lineHeight: 1.5 }}>{item.thoughts}</p>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Where to Buy</label>
                      <input style={inputCss} value={item.whereToBuy} onChange={e => updateItem(item.name, { whereToBuy: e.target.value })} placeholder="Store, website, link…" />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, display: "block", marginBottom: 4 }}>Budget Note</label>
                      <input style={inputCss} value={item.budgetNote} onChange={e => updateItem(item.name, { budgetNote: e.target.value })} placeholder="Wait for sale, birthday…" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sorted.done.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowPurchased(!showPurchased)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: ff.body, fontSize: 11, color: PAL.sage, letterSpacing: 1.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <span style={{ fontSize: 8, transition: "transform .2s", transform: showPurchased ? "rotate(90deg)" : "none" }}>▶</span>
            Purchased ({sorted.done.length}) · ${sorted.done.reduce((s, i) => s + (i.cost || 0), 0).toLocaleString()} spent
          </button>
          {showPurchased && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {sorted.done.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${PAL.sage}04`, border: `1px solid ${PAL.sage}15`, borderRadius: 10, opacity: .6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: `${PAL.sage}20`, border: `2px solid ${PAL.sage}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: PAL.sage, fontSize: 12 }}>✓</span></div>
                  <span style={{ fontFamily: ff.display, fontSize: 14, fontStyle: "italic", textDecoration: "line-through", opacity: .7, flex: 1 }}>{item.name}</span>
                  <span style={{ fontSize: 10, color: PAL.muted }}>{item.house}</span>
                  <span style={{ fontFamily: ff.display, fontSize: 15, color: PAL.muted }}>${item.cost || 0}</span>
                  <button onClick={() => updateItem(item.name, { purchased: false })} style={{ background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 6, padding: "3px 8px", color: PAL.muted, fontSize: 9, cursor: "pointer" }}>Undo</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, padding: "14px 18px", background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 3 }}>Remaining</div>
          <span style={{ fontFamily: ff.display, fontSize: 22, color: PAL.gold }}>${totalCost.toLocaleString()}</span>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 3 }}>Purchased</div>
          <span style={{ fontFamily: ff.display, fontSize: 22, color: PAL.sage }}>${sorted.done.reduce((s, i) => s + (i.cost || 0), 0).toLocaleString()}</span>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: PAL.muted, marginBottom: 3 }}>Best Value Next</div>
          {sorted.active.filter(i => i.ml > 0 && i.cost > 0).length > 0 ? (() => {
            const best = [...sorted.active].filter(i => i.ml > 0 && i.cost > 0).sort((a, b) => (a.cost / a.ml) - (b.cost / b.ml))[0];
            return <span style={{ fontFamily: ff.display, fontSize: 15, fontStyle: "italic", color: PAL.cream }}>{best.name} <span style={{ color: PAL.sage, fontSize: 11 }}>${(best.cost / best.ml).toFixed(2)}/mL</span></span>;
          })() : <span style={{ color: PAL.muted }}>—</span>}
        </div>
      </div>
    </div>
  );
};

export default PurchaseList;
