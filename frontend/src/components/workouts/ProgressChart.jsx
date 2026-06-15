import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "../../constants/data";

export default function ProgressChart({ logs, exercise }) {
  const data = logs.filter(l => l.exercise===exercise)
    .sort((a,b) => new Date(a.date)-new Date(b.date))
    .map(l => ({ date:new Date(l.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}), weight:l.maxWeight }));

  if (data.length < 2) return (
    <div style={{ textAlign:"center", padding:"clamp(24px, 5vw, 36px) clamp(12px, 3vw, 20px)", color:C.muted, fontSize:"clamp(13px, 3vw, 14px)" }}>
      Log at least 2 sessions of <strong style={{ color:C.dark }}>{exercise}</strong> to see progress
    </div>
  );

  const first = data[0].weight, last = data[data.length-1].weight;
  const delta = last - first;
  const pct = ((delta/first)*100).toFixed(1);

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .progress-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .progress-card { padding: 8px 10px !important; }
          .progress-card-label { font-size: 9px !important; }
          .progress-card-value { font-size: 14px !important; }
          .progress-chart { height: 180px !important; }
        }
      `}</style>
      <div className="progress-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        {[
          { label:"Starting",  value:`${first} kg` },
          { label:"Current",   value:`${last} kg` },
          { label:"Change",    value:`${delta>=0?"+":""}${delta.toFixed(1)} kg`, color:delta>=0 ? C.success : C.red },
          { label:"% Change",  value:`${pct}%`, color:delta>=0 ? C.success : C.red },
        ].map(m => (
          <div key={m.label} className="progress-card" style={{ background:C.surface, borderRadius:10, padding:"10px 12px" }}>
            <div className="progress-card-label" style={{ fontSize:"clamp(9px, 2vw, 10px)", color:C.muted, marginBottom:3, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{m.label}</div>
            <div className="progress-card-value" style={{ fontSize:"clamp(14px, 4vw, 16px)", fontWeight:800, color:m.color||C.dark, fontFamily:"'Barlow Condensed',sans-serif" }}>{m.value}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200} className="progress-chart">
        <LineChart data={data} margin={{ top:5, right:10, left:-20, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:11 }} />
          <YAxis tick={{ fill:C.muted, fontSize:11 }} />
          <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.dark }}/>
          <Line type="monotone" dataKey="weight" stroke={C.primary} strokeWidth={2.5}
            dot={{ fill:C.primary, r:4 }} activeDot={{ r:6 }}/>
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

// ─── CALORIE SETUP MODAL ───────────────────────────────────────────────────────
