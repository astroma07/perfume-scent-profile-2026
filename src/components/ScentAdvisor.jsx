import { useState, useRef, useEffect } from "react";
import { PAL, ff } from "../constants.js";

const ScentAdvisor = ({ bottles, testedScents, likedNotes, dislikedNotes }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  /* Build collection context for Claude */
  const buildContext = () => {
    const owned = bottles.filter(b => b.status === "owned");
    const wishlist = bottles.filter(b => b.status === "wishlist");
    const tried = bottles.filter(b => b.status === "tried it" || b.status === "had");
    const tested = testedScents || [];

    return `You are a knowledgeable fragrance advisor. The user has shared their collection and preferences with you. Give personalized, specific recommendations based on their taste profile.

USER'S FRAGRANCE PROFILE:

Owned fragrances (${owned.length}):
${owned.map(b => `- ${b.name} by ${b.house}${b.userNotes ? ` (notes: ${b.userNotes})` : ""}${b.thoughts ? ` — "${b.thoughts}"` : ""}`).join("\n")}

Wishlist (${wishlist.length}):
${wishlist.map(b => `- ${b.name} by ${b.house}${b.userNotes ? ` (notes: ${b.userNotes})` : ""}`).join("\n")}

Previously owned/tried (${tried.length}):
${tried.map(b => `- ${b.name} by ${b.house}${b.userNotes ? ` (notes: ${b.userNotes})` : ""}${b.thoughts ? ` — "${b.thoughts}"` : ""}`).join("\n")}

Tested/sampled (${tested.length}):
${tested.map(t => `- ${t.name} by ${t.house}${t.notes ? ` (notes: ${t.notes})` : ""}${t.avg > 0 ? ` [rated ${t.avg.toFixed(1)}/10]` : ""}${t.thoughts ? ` — "${t.thoughts}"` : ""}`).join("\n")}

Notes they love: ${(likedNotes || []).join(", ") || "not specified"}
Notes they avoid: ${(dislikedNotes || []).join(", ") || "not specified"}

Be conversational, warm, and specific. Reference their collection when relevant. When recommending, explain WHY a fragrance fits their profile by connecting it to what they already own/enjoy. Format recommendations clearly with name, house, and key notes. Keep responses concise but helpful.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const history = [...messages, { role: "user", content: userMsg }];
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: buildContext(),
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const reply = data.content?.map(c => c.text || "").join("") || "Sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}. Make sure the app is configured correctly.` }]);
    }
    setLoading(false);
  };

  const quickPrompts = [
    "What should I try next based on my collection?",
    "Recommend something for date night",
    "What's a good summer fragrance for me?",
    "Find me something similar to my favorites",
    "What gaps do you see in my collection?",
    "Suggest a cozy fall fragrance",
  ];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: 6, textTransform: "uppercase", color: PAL.muted, marginBottom: 6 }}>AI · Powered</div>
        <h2 style={{ fontFamily: ff.display, fontSize: 24, fontWeight: 400, fontStyle: "italic", margin: "0 0 6px" }}>Scent Advisor</h2>
        <p style={{ fontSize: 12, color: PAL.muted, lineHeight: 1.5 }}>Ask about fragrances, get personalized recommendations based on your collection</p>
      </div>

      {/* Chat area */}
      <div ref={chatRef} style={{ maxHeight: 500, overflowY: "auto", marginBottom: 14, scrollbarWidth: "thin", scrollbarColor: `${PAL.border} transparent`, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.25 }}>❋</div>
            <p style={{ fontFamily: ff.body, fontSize: 12, color: PAL.muted, marginBottom: 16 }}>
              I know your collection of {bottles.filter(b => b.name.trim()).length} fragrances. Ask me anything!
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 360, margin: "0 auto" }}>
              {quickPrompts.map((q, i) => (
                <button key={i} onClick={() => { setInput(q); }}
                  style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", background: "transparent", border: `1px solid ${PAL.border}`, color: PAL.muted, fontFamily: ff.display, fontStyle: "italic", fontSize: 12, textAlign: "left" }}
                  onMouseEnter={e => { e.target.style.borderColor = PAL.gold + "44"; e.target.style.color = PAL.gold; }}
                  onMouseLeave={e => { e.target.style.borderColor = PAL.border; e.target.style.color = PAL.muted; }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            padding: "12px 16px",
            borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
            background: msg.role === "user" ? `${PAL.gold}14` : `${PAL.cream}05`,
            border: `1px solid ${msg.role === "user" ? PAL.gold + "30" : PAL.border}`,
          }}>
            {msg.role === "assistant" && <div style={{ fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: PAL.gold, marginBottom: 6 }}>Scent Advisor</div>}
            <div style={{ fontFamily: ff.body, fontSize: 13, color: PAL.cream, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "12px 16px", borderRadius: "14px 14px 14px 4px", background: `${PAL.cream}05`, border: `1px solid ${PAL.border}` }}>
            <div style={{ fontFamily: ff.display, fontSize: 14, fontStyle: "italic", color: PAL.muted }}>Thinking…</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask about fragrances…"
          style={{ flex: 1, background: "rgba(201,186,155,0.06)", border: `1px solid ${PAL.border}`, borderRadius: 12, padding: "14px 18px", color: PAL.cream, fontFamily: ff.body, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{ padding: "0 24px", borderRadius: 12, cursor: loading || !input.trim() ? "not-allowed" : "pointer", background: `${PAL.gold}18`, border: `1px solid ${PAL.gold}44`, color: PAL.gold, fontFamily: ff.body, fontSize: 13, fontWeight: 500, opacity: loading || !input.trim() ? 0.4 : 1 }}>
          {loading ? "…" : "Ask"}
        </button>
      </div>

      {/* Clear chat */}
      {messages.length > 0 && (
        <button onClick={() => setMessages([])} style={{ marginTop: 10, background: "transparent", border: "none", color: PAL.muted, fontFamily: ff.body, fontSize: 10, cursor: "pointer", opacity: 0.5, textDecoration: "underline" }}>Clear conversation</button>
      )}
    </div>
  );
};

export default ScentAdvisor;
