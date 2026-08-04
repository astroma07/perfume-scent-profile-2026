import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient.js";
import { PAL, ff, STATUS_COLORS, TESTER_COLOR } from "../constants.js";
import { FAMILY_ORDER, FAMILY_COLORS, FAMILY_LABELS, getNoteFamily } from "../noteCategories.js";
import FragranceNose from "./FragranceNose.jsx";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";

const PublicProfile = ({ username }) => {
  const [profile, setProfile] = useState(null);
  const [bottles, setBottles] = useState([]);
  const [testedScents, setTestedScents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("collection");
  const [sortBy, setSortBy] = useState("status");
  const [filterStatus, setFilterStatus] = useState(null);

  useEffect(() => {
    if (!supabase || !username) return;
    const load = async () => {
      setLoading(true);
      /* Fetch profile */
      const { data: prof, error: profErr } = await supabase
        .from("profiles").select("*")
        .eq("username", username)
        .in("visibility", ["public", "link-only"])
        .single();

      if (profErr || !prof) { setError("Profile not found or is private."); setLoading(false); return; }
      setProfile(prof);

      const sharing = prof.sharing || {};
      const userId = prof.id;

      /* Fetch shared data */
      if (sharing.collection !== false) {
        const { data } = await supabase.from("bottles").select("*").eq("user_id", userId).order("sort_order");
        setBottles((data || []).map(b => ({
          name: b.name || "", fullName: b.full_name || "", house: b.house || "",
          status: b.status || "to test", cost: parseFloat(b.cost) || 0,
          ml: b.ml || 0, freq: b.freq || 0,
          userNotes: b.user_notes || "", thoughts: sharing.thoughts !== false ? (b.thoughts || "") : "",
          tags: b.tags || {}, hasTester: b.has_tester || false,
          concentration: b.concentration || "", vibes: b.vibes || [],
        })));
      }
      if (sharing.tested !== false) {
        const { data } = await supabase.from("tested_scents").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        setTestedScents((data || []).map(t => ({
          name: t.name || "", house: t.house || "", date: t.date_tested || "",
          notes: t.notes || "", thoughts: sharing.thoughts !== false ? (t.thoughts || "") : "",
          overall: parseFloat(t.overall) || 0, sillage: parseFloat(t.sillage) || 0,
          longevity: parseFloat(t.longevity) || 0, scent: parseFloat(t.scent) || 0,
          avg: parseFloat(t.avg) || 0,
        })));
      }
      setLoading(false);
    };
    load();
  }, [username]);

  const sharing = profile?.sharing || {};
  const STATUSES = ["owned", "had", "tried it", "wishlist", "to test"];

  const visibleBottles = useMemo(() => {
    let list = [...bottles];
    if (sharing.wishlist === false) list = list.filter(b => b.status !== "wishlist" && b.status !== "to test");
    if (sharing.costs === false) list = list.map(b => ({ ...b, cost: 0 }));
    if (filterStatus) {
      if (filterStatus === "tester") list = list.filter(b => b.hasTester);
      else list = list.filter(b => b.status === filterStatus);
    }
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "house") list.sort((a, b) => (a.house || "").localeCompare(b.house || ""));
    else if (sortBy === "notes") {
      list.sort((a, b) => {
        const getFam = (bot) => {
          const notes = (bot.userNotes || "").split(",").map(n => n.trim().toLowerCase()).filter(Boolean);
          if (notes.length === 0) return "zzz";
          const counts = {};
          notes.forEach(n => { const f = getNoteFamily(n, {}); counts[f] = (counts[f] || 0) + 1; });
          let best = "zzz", max = 0;
          for (const [f, c] of Object.entries(counts)) { if (c > max) { max = c; best = f; } }
          return best;
        };
        return FAMILY_ORDER.indexOf(getFam(a)) - FAMILY_ORDER.indexOf(getFam(b)) || a.name.localeCompare(b.name);
      });
    } else if (sortBy === "cost") list.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    else list.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.name.localeCompare(b.name));
    return list;
  }, [bottles, sharing, filterStatus, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = {};
    visibleBottles.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return counts;
  }, [visibleBottles]);

  if (loading) {
    return (
      <div style={{ background: PAL.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <link href={FONT_LINK} rel="stylesheet" />
        <p style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic", color: PAL.muted }}>Loading profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: PAL.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <link href={FONT_LINK} rel="stylesheet" />
        <div style={{ fontSize: 40, opacity: 0.3 }}>❋</div>
        <p style={{ fontFamily: ff.display, fontSize: 20, fontStyle: "italic", color: PAL.cream }}>{error}</p>
        <a href="/" style={{ fontFamily: ff.body, fontSize: 12, color: PAL.gold, textDecoration: "underline" }}>Go to Scent Profile</a>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: ff.body, background: PAL.bg, minHeight: "100vh", color: PAL.cream }}>
      <link href={FONT_LINK} rel="stylesheet" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 9, letterSpacing: 6, textTransform: "uppercase", color: PAL.muted, marginBottom: 6 }}>Scent Profile</div>
          <h1 style={{ fontFamily: ff.display, fontSize: 32, fontWeight: 400, fontStyle: "italic", margin: "0 0 6px" }}>{profile.display_name || profile.username}</h1>
          <p style={{ fontSize: 12, color: PAL.muted }}>
            {visibleBottles.length} fragrances
            {Object.entries(statusCounts).length > 0 && " · "}
            {Object.entries(statusCounts).map(([status, count]) => `${count} ${status}`).join(" · ")}
          </p>
          <div style={{ marginTop: 12 }}>
            <a href="/" style={{ fontFamily: ff.body, fontSize: 11, color: PAL.gold, textDecoration: "none", padding: "6px 16px", border: `1px solid ${PAL.gold}33`, borderRadius: 16 }}>Create your own →</a>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
          {sharing.collection !== false && <button onClick={() => setActiveTab("collection")} style={{ background: activeTab === "collection" ? `${PAL.gold}14` : "transparent", border: `1px solid ${activeTab === "collection" ? PAL.gold + "44" : PAL.border}`, borderRadius: 20, padding: "6px 16px", fontFamily: ff.body, fontSize: 11, color: activeTab === "collection" ? PAL.gold : PAL.muted, cursor: "pointer" }}>Collection</button>}
          {sharing.nose !== false && <button onClick={() => setActiveTab("nose")} style={{ background: activeTab === "nose" ? `${PAL.gold}14` : "transparent", border: `1px solid ${activeTab === "nose" ? PAL.gold + "44" : PAL.border}`, borderRadius: 20, padding: "6px 16px", fontFamily: ff.body, fontSize: 11, color: activeTab === "nose" ? PAL.gold : PAL.muted, cursor: "pointer" }}>Fragrance Nose</button>}
          {sharing.tested !== false && <button onClick={() => setActiveTab("tested")} style={{ background: activeTab === "tested" ? `${PAL.gold}14` : "transparent", border: `1px solid ${activeTab === "tested" ? PAL.gold + "44" : PAL.border}`, borderRadius: 20, padding: "6px 16px", fontFamily: ff.body, fontSize: 11, color: activeTab === "tested" ? PAL.gold : PAL.muted, cursor: "pointer" }}>Tested</button>}
        </div>

        {/* Collection view */}
        {activeTab === "collection" && (
          <div>
            {/* Sort buttons */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
              {[{k:"status",l:"Status"},{k:"name",l:"A-Z"},{k:"house",l:"House"},{k:"notes",l:"Notes"},{k:"cost",l:"Cost"}].map(s => (
                <button key={s.k} onClick={() => setSortBy(s.k)} style={{ padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontFamily: ff.body, fontSize: 10, background: sortBy === s.k ? `${PAL.gold}14` : "transparent", border: `1px solid ${sortBy === s.k ? PAL.gold + "44" : PAL.border}`, color: sortBy === s.k ? PAL.gold : PAL.muted }}>{s.l}</button>
              ))}
            </div>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => setFilterStatus(null)} style={{ padding: "4px 10px", borderRadius: 14, cursor: "pointer", fontFamily: ff.body, fontSize: 9, background: !filterStatus ? `${PAL.gold}14` : "transparent", border: `1px solid ${!filterStatus ? PAL.gold + "44" : PAL.border}`, color: !filterStatus ? PAL.gold : PAL.muted }}>All ({bottles.length})</button>
              {STATUSES.filter(s => sharing.wishlist !== false || (s !== "wishlist" && s !== "to test")).map(s => {
                const count = bottles.filter(b => b.status === s).length;
                if (count === 0) return null;
                return (
                  <button key={s} onClick={() => setFilterStatus(filterStatus === s ? null : s)} style={{ padding: "4px 10px", borderRadius: 14, cursor: "pointer", fontFamily: ff.body, fontSize: 9, textTransform: "capitalize", background: filterStatus === s ? `${STATUS_COLORS[s]}18` : "transparent", border: `1px solid ${filterStatus === s ? STATUS_COLORS[s] + "44" : PAL.border}`, color: filterStatus === s ? STATUS_COLORS[s] : PAL.muted }}>{s} ({count})</button>
                );
              })}
              {bottles.some(b => b.hasTester) && (
                <button onClick={() => setFilterStatus(filterStatus === "tester" ? null : "tester")} style={{ padding: "4px 10px", borderRadius: 14, cursor: "pointer", fontFamily: ff.body, fontSize: 9, background: filterStatus === "tester" ? `${TESTER_COLOR}18` : "transparent", border: `1px solid ${filterStatus === "tester" ? TESTER_COLOR + "44" : PAL.border}`, color: filterStatus === "tester" ? TESTER_COLOR : PAL.muted }}>Tester ({bottles.filter(b => b.hasTester).length})</button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleBottles.map((b, i) => {
              const statusColor = STATUS_COLORS[b.status] || PAL.muted;
              return (
                <div key={i} style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic" }}>{b.name}</span>
                    <span style={{ fontSize: 11, color: PAL.muted }}>— {b.house}</span>
                    <span style={{ marginLeft: "auto", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", padding: "3px 10px", borderRadius: 12, color: statusColor, background: `${statusColor}14`, border: `1px solid ${statusColor}30`, fontFamily: ff.body }}>{b.status}</span>
                    {b.hasTester && b.status !== "tester" && (
                      <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", padding: "3px 10px", borderRadius: 12, color: TESTER_COLOR, background: `${TESTER_COLOR}14`, border: `1px solid ${TESTER_COLOR}30`, fontFamily: ff.body }}>tester</span>
                    )}
                  </div>
                  {b.userNotes && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                      {b.userNotes.split(",").map(n => n.trim()).filter(Boolean).map((n, j) => (
                        <span key={j} style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: PAL.gold, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}20` }}>{n}</span>
                      ))}
                    </div>
                  )}
                  {sharing.thoughts !== false && b.thoughts && (
                    <p style={{ fontSize: 12, color: `${PAL.cream}66`, fontStyle: "italic", margin: "4px 0 0" }}>"{b.thoughts}"</p>
                  )}
                  <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: PAL.muted }}>
                    {sharing.costs !== false && b.cost > 0 && <span>${b.cost}</span>}
                    {b.ml > 0 && <span>{b.ml}mL</span>}
                    {b.concentration && <span style={{ textTransform: "uppercase" }}>{b.concentration}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

        {/* Fragrance Nose */}
        {activeTab === "nose" && sharing.nose !== false && (
          <FragranceNose bottles={visibleBottles} testedScents={testedScents} noteOverrides={{}}
            likedNotes={[]} setLikedNotes={() => {}} dislikedNotes={[]} setDislikedNotes={() => {}} />
        )}

        {/* Tested */}
        {activeTab === "tested" && sharing.tested !== false && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {testedScents.map((t, i) => (
              <div key={i} style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {t.avg > 0 && <span style={{ fontFamily: ff.display, fontSize: 20, color: PAL.gold }}>{t.avg.toFixed(1)}</span>}
                  <span style={{ fontFamily: ff.display, fontSize: 16, fontStyle: "italic" }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: PAL.muted }}>— {t.house}</span>
                  {t.date && <span style={{ marginLeft: "auto", fontSize: 10, color: PAL.muted }}>{t.date}</span>}
                </div>
                {t.notes && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                    {t.notes.split(",").map(n => n.trim()).filter(Boolean).map((n, j) => (
                      <span key={j} style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, color: PAL.gold, background: `${PAL.gold}10`, border: `1px solid ${PAL.gold}20` }}>{n}</span>
                    ))}
                  </div>
                )}
                {sharing.thoughts !== false && t.thoughts && (
                  <p style={{ fontSize: 12, color: `${PAL.cream}66`, fontStyle: "italic", margin: "6px 0 0" }}>"{t.thoughts}"</p>
                )}
              </div>
            ))}
            {testedScents.length === 0 && <p style={{ textAlign: "center", color: PAL.muted, padding: 30 }}>No tested scents shared.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
