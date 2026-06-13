import { useState } from "react";
import { C } from "../../constants/data";

const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:4000/api").trim().replace(/\/+$/, "");

export default function AIDietAdvisor({ user, goal, calProfile, calGoal, totalCal, logs }) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);

  const buildContext = () => {
    const parts = [];
    parts.push(`User: ${user.name}`);
    parts.push(`Fitness goal: ${goal === "bulking" ? "Bulking — muscle gain" : "Cutting — fat loss"}`);
    if (calProfile) {
      parts.push(`Body: ${calProfile.height}cm tall, ${calProfile.weight}kg, ${calProfile.age} years old, ${calProfile.gender}`);
      parts.push(`Activity: ${calProfile.activity}`);
      if (calGoal) parts.push(`Daily calorie target: ${calGoal} kcal`);
    }
    if (totalCal > 0) parts.push(`Calories eaten today: ${totalCal} kcal`);
    const recentExs = [...new Set(logs.slice(-10).map(l => l.exercise))];
    if (recentExs.length) parts.push(`Recent exercises logged: ${recentExs.join(", ")}`);
    return parts.join("\n");
  };

  const askChatGPT = async () => {
    const q = (selectedQuick || aiPrompt).trim();
    if (!q) return;
    const nextUserMessage = { role:"user", content:q };
    setAiMessages(prev => [...prev, nextUserMessage]);
    setAiLoading(true); 
    setAiError(""); 
    setAiResponse("");
    try {
      // Get token from session (parse it correctly)
      const sessionStr = localStorage.getItem("rs_session") || localStorage.getItem("rs_gym_owner_session");
      let token = null;
      
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          token = session.accessToken;
        } catch (e) {
          token = sessionStr; // Fallback if not JSON
        }
      }
      
      if (!token) {
        throw new Error("Not authenticated. Please log in first.");
      }

      // Call your new Google Gemini backend endpoint
      const res = await fetch(`${API_URL}/ai/ask`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: q,
          context: "nutrition",
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "AI service unavailable");
      }

      const data = await res.json();
      const answer = data.response || "";
      
      if (answer) {
        setAiMessages(prev => [...prev, { role:"assistant", content:answer }]);
        setAiResponse(answer);
        setAiPrompt("");
        setSelectedQuick(null);
      } else {
        setAiError("No response received. Please try again.");
      }
    } catch (err) {
      setAiError(err.message || "Connection failed. Make sure backend is running.");
    }
    finally { 
      setAiLoading(false); 
    }
  };

  const quickPrompts = [
    { icon:"🍽️", label:"Full day meal plan",    text:"Give me a full day Indian meal plan based on my calorie goal and fitness goal" },
    { icon:"💪", label:"Pre-workout food",       text:"What should I eat 1 hour before my workout for maximum energy and performance?" },
    { icon:"🥗", label:"High protein Indian diet", text:"Suggest a high protein Indian diet plan suited to my body stats and goal" },
    { icon:"⚖️", label:"Meal timing guide",      text:"How many meals per day should I have and when should I eat them for my goal?" },
    { icon:"🚫", label:"Foods to avoid",          text:"Which foods should I completely avoid or limit for my fitness goal?" },
    { icon:"🌙", label:"Post-workout nutrition",  text:"What should I eat after my workout to maximize recovery and results?" },
  ];

  const resetChat = () => { setAiResponse(""); setAiPrompt(""); setSelectedQuick(null); setAiError(""); setAiMessages([]); };
  const activeQ = selectedQuick || aiPrompt;

  return (
    <div style={{ marginTop:28 }}>

      {/* Header banner */}
      <div style={{ background:"linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)", borderRadius:16,
        padding:"18px 20px", marginBottom:18, position:"relative", overflow:"hidden" }}>
        {/* decorative circles */}
        <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%",
          background:"rgba(255,255,255,0.08)" }}/>
        <div style={{ position:"absolute", bottom:-30, right:40, width:100, height:100, borderRadius:"50%",
          background:"rgba(255,255,255,0.05)" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:12, position:"relative" }}>
          <div style={{ width:44, height:44, background:"rgba(255,255,255,0.2)", borderRadius:12,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0,
            backdropFilter:"blur(10px)" }}>🤖</div>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800,
              color:"#fff", letterSpacing:0.5 }}>AI Diet Advisor</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:1 }}>
              Powered by AI · Unlimited follow-up questions
            </div>
          </div>
        </div>

        {/* Stats row */}
        {calProfile && (
          <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
            {[
              { label:calProfile.weight+"kg",  sub:"weight" },
              { label:calGoal+" kcal",         sub:"daily goal" },
              { label:goal,                    sub:"mode" },
              ...(todaySteps > 0 ? [{ label:calBurned+" kcal", sub:"burned today" }] : []),
            ].map(s => (
              <div key={s.sub} style={{ background:"rgba(255,255,255,0.15)", borderRadius:8,
                padding:"5px 10px", backdropFilter:"blur(4px)" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'Barlow Condensed',sans-serif" }}>{s.label}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:0.5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}
        {!calProfile && (
          <div style={{ marginTop:10, fontSize:12, color:"rgba(255,255,255,0.75)" }}>
            ⚠ Set up your calorie profile in the Body tab for personalized advice
          </div>
        )}
      </div>

      {/* Quick prompts grid */}
      {aiMessages.length === 0 && (
        <>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase",
            letterSpacing:1, marginBottom:10 }}>Quick questions</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
            {quickPrompts.map((qp, i) => (
              <button key={i} onClick={() => { setSelectedQuick(qp.text); setAiPrompt(""); setAiError(""); }}
                style={{ background:selectedQuick===qp.text ? "rgba(59,130,246,0.12)" : C.card,
                  border:`1.5px solid ${selectedQuick===qp.text ? C.primary : C.border}`,
                  borderRadius:12, padding:"11px 12px", textAlign:"left", cursor:"pointer",
                  transition:"all 0.15s", display:"flex", flexDirection:"column", gap:4 }}
                onMouseEnter={e => { if (selectedQuick!==qp.text) e.currentTarget.style.background=C.surface; }}
                onMouseLeave={e => { if (selectedQuick!==qp.text) e.currentTarget.style.background=C.card; }}>
                <span style={{ fontSize:18 }}>{qp.icon}</span>
                <span style={{ fontSize:12, fontWeight:600, color:selectedQuick===qp.text?C.primary:C.dark,
                  lineHeight:1.3, fontFamily:"'Barlow',sans-serif" }}>{qp.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Custom input */}
      {true && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase",
            letterSpacing:1, marginBottom:8 }}>Or type your own question</div>
          <textarea value={aiPrompt}
            onChange={e => { setAiPrompt(e.target.value); setSelectedQuick(null); setAiError(""); }}
            placeholder="e.g. What should I eat on rest days to stay on track with my goal?"
            rows={3}
            style={{ width:"100%", background:C.card, border:`1.5px solid ${C.border}`,
              borderRadius:12, padding:"12px 14px", color:C.dark, fontSize:"16px",
              outline:"none", resize:"none", fontFamily:"'Barlow',sans-serif",
              boxSizing:"border-box", lineHeight:1.6 }}
            onFocus={e => e.target.style.borderColor=C.primary}
            onBlur={e => e.target.style.borderColor=C.border}/>
        </div>
      )}

      {/* CTA button */}
      {true && (
        <button onClick={askChatGPT} disabled={aiLoading || !activeQ.trim()}
          style={{ width:"100%", border:"none", borderRadius:12, padding:"14px",
            color:"#fff", fontSize:15, fontWeight:700, letterSpacing:0.5, marginBottom:14,
            fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase",
            cursor:aiLoading||!activeQ.trim() ? "not-allowed" : "pointer",
            background:aiLoading||!activeQ.trim()
              ? C.muted
              : "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            boxShadow:aiLoading||!activeQ.trim() ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
            transition:"all 0.2s" }}>
          {aiLoading ? "🤔 AI is analysing..." : "✨ Ask AI Coach"}
        </button>
      )}

      {/* Loading animation */}
      {aiLoading && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px",
          textAlign:"center", marginBottom:14 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🧠</div>
          <div style={{ color:C.dark, fontWeight:600, fontSize:14, marginBottom:4 }}>ChatGPT is thinking...</div>
          <div style={{ color:C.muted, fontSize:12 }}>Building your personalised plan based on your data</div>
        </div>
      )}

      {/* Error */}
      {aiError && (
        <div style={{ background:"rgba(239,68,68,0.07)", border:`1px solid ${C.red}`,
          borderRadius:12, padding:"12px 16px", marginBottom:14,
          display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <span style={{ color:C.red, fontSize:13 }}>{aiError}</span>
        </div>
      )}

      {/* Response card */}
      {aiResponse && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
          {/* Response header */}
          <div style={{ background:"linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:30, height:30, background:"rgba(255,255,255,0.2)", borderRadius:8,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:"#fff" }}>
                  Your Personalized Plan
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>by AI Coach · RS Fitness</div>
              </div>
            </div>
            <button onClick={resetChat}
              style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8,
                padding:"6px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>
              New ↺
            </button>
          </div>
          {/* Response content */}
          <div style={{ padding:"18px", color:C.dark, fontSize:14, lineHeight:1.9,
            whiteSpace:"pre-wrap", fontFamily:"'Barlow',sans-serif" }}>
            {aiResponse}
          </div>
          {/* Footer */}
          <div style={{ padding:"0 18px 16px", display:"flex", gap:8 }}>
            <button onClick={resetChat}
              style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
                padding:"10px", color:C.dark, fontSize:13, fontWeight:600, cursor:"pointer",
                fontFamily:"'Barlow',sans-serif" }}>
              Clear chat
            </button>
            <button onClick={resetChat}
              style={{ flex:1, background:"linear-gradient(135deg,#3B82F6,#6366F1)", border:"none",
                borderRadius:10, padding:"10px", color:"#fff", fontSize:13, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>
              New topic ↻
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
