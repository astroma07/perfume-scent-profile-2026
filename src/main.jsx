import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import ScentDashboard from "./ScentDashboard.jsx";
import AuthPage from "./components/AuthPage.jsx";
import { supabase } from "./supabaseClient.js";
import { hasLocalData, isMigrated, migrateLocalToSupabase } from "./migrate.js";

const PAL = { bg: "#0f0d09", cream: "#e8dfd0", muted: "#8a7e6b", border: "#2a2318", gold: "#c5a46d", sage: "#7a927a" };
const ff = { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', sans-serif" };

function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = no session
  const [skipped, setSkipped] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  useEffect(() => {
    if (!supabase) { setSession(null); return; }
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      /* Ensure profile exists for new users (Google OAuth or email) */
      if (session?.user && _event === "SIGNED_IN") {
        const { data: existing } = await supabase.from("profiles").select("id").eq("id", session.user.id).single();
        if (!existing) {
          await supabase.from("profiles").upsert({ id: session.user.id, display_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User" });
          await supabase.from("user_preferences").upsert({ user_id: session.user.id });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* After login, check for localStorage data to migrate */
  useEffect(() => {
    if (session && hasLocalData() && !isMigrated()) {
      // Show migration prompt
      setMigrationResult("prompt");
    }
  }, [session]);

  const doMigration = async () => {
    setMigrating(true);
    const results = await migrateLocalToSupabase(session.user.id);
    setMigrationResult(results);
    setMigrating(false);
  };

  const skipMigration = () => {
    localStorage.setItem("scent_migrated", "skipped");
    setMigrationResult(null);
  };

  // Loading
  if (session === undefined) {
    return (
      <div style={{ background: PAL.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <p style={{ fontFamily: ff.display, fontSize: 18, fontStyle: "italic", color: PAL.muted }}>Loading…</p>
      </div>
    );
  }

  // Not logged in and hasn't skipped — show auth page
  if (!session && !skipped && supabase) {
    return <AuthPage onSkip={() => setSkipped(true)} />;
  }

  // Migration prompt
  if (migrationResult === "prompt") {
    const bottles = JSON.parse(localStorage.getItem("scent_bottles") || "[]");
    const tested = JSON.parse(localStorage.getItem("scent_testedScents") || "[]");
    return (
      <div style={{ background: PAL.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>❋</div>
          <h2 style={{ fontFamily: ff.display, fontSize: 24, fontStyle: "italic", margin: "0 0 10px", color: PAL.cream }}>Welcome back!</h2>
          <p style={{ fontFamily: ff.body, fontSize: 13, color: PAL.muted, lineHeight: 1.6, marginBottom: 20 }}>
            We found your existing collection on this device — {bottles.filter(b => b.name?.trim()).length} fragrances
            {tested.length > 0 ? ` and ${tested.length} tested scents` : ""}. Link this data to your new account?
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={doMigration} disabled={migrating} style={{
              padding: "14px 28px", borderRadius: 10, cursor: migrating ? "wait" : "pointer",
              background: `${PAL.gold}20`, border: `1px solid ${PAL.gold}50`,
              color: PAL.gold, fontFamily: ff.body, fontSize: 14, fontWeight: 500,
              opacity: migrating ? 0.6 : 1,
            }}>{migrating ? "Migrating…" : "Yes, link my data"}</button>
            <button onClick={skipMigration} style={{
              padding: "14px 20px", borderRadius: 10, cursor: "pointer",
              background: "transparent", border: `1px solid ${PAL.border}`,
              color: PAL.muted, fontFamily: ff.body, fontSize: 13,
            }}>Start fresh</button>
          </div>
        </div>
      </div>
    );
  }

  // Migration complete
  if (migrationResult && migrationResult !== "prompt") {
    return (
      <div style={{ background: PAL.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontFamily: ff.display, fontSize: 24, fontStyle: "italic", margin: "0 0 10px", color: PAL.sage }}>Data linked!</h2>
          <p style={{ fontFamily: ff.body, fontSize: 13, color: PAL.muted, lineHeight: 1.6, marginBottom: 8 }}>
            Migrated {migrationResult.bottles} fragrances, {migrationResult.tested} tested scents, and {migrationResult.wearLog} wear log entries.
          </p>
          <p style={{ fontFamily: ff.body, fontSize: 11, color: PAL.muted, marginBottom: 20 }}>
            Your data is now synced to your account and accessible from any device.
          </p>
          <button onClick={() => setMigrationResult(null)} style={{
            padding: "14px 32px", borderRadius: 10, cursor: "pointer",
            background: `${PAL.gold}20`, border: `1px solid ${PAL.gold}50`,
            color: PAL.gold, fontFamily: ff.body, fontSize: 14, fontWeight: 500,
          }}>Continue to Dashboard</button>
        </div>
      </div>
    );
  }

  // Main app — pass session for logout button etc.
  return <ScentDashboard session={session} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>,
);
