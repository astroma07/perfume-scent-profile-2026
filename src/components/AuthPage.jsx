import { useState } from "react";
import { supabase } from "../supabaseClient.js";

const PAL = { bg: "#0f0d09", cream: "#e8dfd0", muted: "#8a7e6b", border: "#2a2318", gold: "#c5a46d", rose: "#b5546a", sage: "#7a927a" };
const ff = { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', sans-serif" };

const AuthPage = ({ onSkip }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const inputCss = { width: "100%", background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 10, padding: "14px 18px", color: PAL.cream, fontFamily: ff.body, fontSize: 14, outline: "none", boxSizing: "border-box" };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError(null); setMessage(null);

    if (!supabase) { setError("Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel."); setLoading(false); return; }

    try {
      if (mode === "signup") {
        const result = await supabase.auth.signUp({ email, password });
        console.log("Signup result:", JSON.stringify(result));
        if (result.error) {
          setError(result.error?.message || result.error?.error_description || JSON.stringify(result.error));
        } else if (result.data?.user?.identities?.length === 0) {
          setError("An account with this email already exists. Try logging in instead.");
        } else if (result.data?.user && !result.data?.session) {
          setMessage("Account created! Check your email to confirm, then log in.");
          setMode("login");
        } else {
          setMessage("Account created!");
        }
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        console.log("Login result:", JSON.stringify(result));
        if (result.error) {
          setError(result.error?.message || result.error?.error_description || JSON.stringify(result.error));
        }
      }
    } catch (err) {
      console.error("Auth catch:", err);
      setError(`Unexpected error: ${err?.message || JSON.stringify(err)}`);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ background: PAL.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 9, letterSpacing: 6, textTransform: "uppercase", color: PAL.muted, marginBottom: 8 }}>Olfactory · Identity</div>
          <h1 style={{ fontFamily: ff.display, fontSize: 36, fontWeight: 400, fontStyle: "italic", color: PAL.cream, margin: "0 0 6px" }}>Scent Profile</h1>
          <p style={{ fontFamily: ff.body, fontSize: 13, color: PAL.muted, lineHeight: 1.5 }}>Track, explore, and understand your fragrance collection</p>
        </div>

        {/* Form card */}
        <div style={{ background: `${PAL.cream}03`, border: `1px solid ${PAL.border}`, borderRadius: 16, padding: "28px 24px" }}>
          <h2 style={{ fontFamily: ff.display, fontSize: 22, fontStyle: "italic", margin: "0 0 20px", textAlign: "center", color: PAL.cream }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>

          {/* Google login */}
          <button onClick={handleGoogle} style={{
            width: "100%", padding: "12px", marginBottom: 16,
            background: "transparent", border: `1px solid ${PAL.border}`, borderRadius: 10,
            color: PAL.cream, fontFamily: ff.body, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: PAL.border }} />
            <span style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, letterSpacing: 2, textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: PAL.border }} />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email address" required autoComplete="email"
                style={inputCss} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password" required autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={6} style={inputCss} />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", marginBottom: 14, background: `${PAL.rose}10`, border: `1px solid ${PAL.rose}30`, borderRadius: 8 }}>
                <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.rose, margin: 0 }}>{error}</p>
              </div>
            )}
            {message && (
              <div style={{ padding: "10px 14px", marginBottom: 14, background: `${PAL.sage}10`, border: `1px solid ${PAL.sage}30`, borderRadius: 8 }}>
                <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.sage, margin: 0 }}>{message}</p>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "14px", borderRadius: 10, cursor: loading ? "wait" : "pointer",
              background: `${PAL.gold}20`, border: `1px solid ${PAL.gold}50`,
              color: PAL.gold, fontFamily: ff.body, fontSize: 14, fontWeight: 500,
              letterSpacing: 0.5, opacity: loading ? 0.6 : 1,
            }}>{loading ? "…" : mode === "login" ? "Log In" : "Create Account"}</button>
          </form>

          {/* Toggle login/signup */}
          <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, textAlign: "center", marginTop: 16 }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setMessage(null); }}
              style={{ color: PAL.gold, cursor: "pointer", textDecoration: "underline" }}>
              {mode === "login" ? "Sign up" : "Log in"}
            </span>
          </p>
        </div>

        {/* Continue without account */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={onSkip} style={{
            background: "transparent", border: "none", color: PAL.muted,
            fontFamily: ff.body, fontSize: 12, cursor: "pointer", textDecoration: "underline",
            opacity: 0.6,
          }}>Continue without an account</button>
          <p style={{ fontFamily: ff.body, fontSize: 10, color: PAL.muted, marginTop: 6, opacity: 0.4 }}>Data stays on this device only</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
