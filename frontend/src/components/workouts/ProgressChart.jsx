import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "../../constants/data";

export default function ProgressChart({ logs, exercise }) {
  const data = logs.filter(l => l.exercise===exercise)
    .sort((a,b) => new Date(a.date)-new Date(b.date))
    .map(l => ({ date:new Date(l.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}), weight:l.maxWeight }));

  if (data.length < 2) return (
    <div style={{ textAlign:"center", padding:"36px 20px", color:C.muted, fontSize:14 }}>
      Log at least 2 sessions of <strong style={{ color:C.dark }}>{exercise}</strong> to see progress
    </div>
  );

  const first = data[0].weight, last = data[data.length-1].weight;
  const delta = last - first;
  const pct = ((delta/first)*100).toFixed(1);

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        {[
          { label:"Starting",  value:`${first} kg` },
          { label:"Current",   value:`${last} kg` },
          { label:"Change",    value:`${delta>=0?"+":""}${delta.toFixed(1)} kg`, color:delta>=0 ? C.success : C.red },
          { label:"% Change",  value:`${pct}%`, color:delta>=0 ? C.success : C.red },
        ].map(m => (
          <div key={m.label} style={{ background:C.surface, borderRadius:10, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:3, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{m.label}</div>
            <div style={{ fontSize:16, fontWeight:800, color:m.color||C.dark, fontFamily:"'Barlow Condensed',sans-serif" }}>{m.value}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
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
