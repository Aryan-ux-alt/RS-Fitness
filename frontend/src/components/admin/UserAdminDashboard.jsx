import { C } from "../../constants/data";
import { Avatar, SectionTitle, StatCard } from "../common";

export default function UserAdminDashboard({ user, logs, weekLogs, uniqueExs, totalVol, totalCal, calGoal }) {

  return (
    <>
      <SectionTitle>Admin Dashboard</SectionTitle>

      <div style={{ background:"linear-gradient(135deg,#2563EB,#7C3AED)", borderRadius:16, padding:"18px",
        color:"#fff", marginBottom:16, boxShadow:"0 14px 36px rgba(79,70,229,0.22)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <Avatar name={user.name} size={54}/>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:25, fontWeight:800 }}>{user.name}</div>
            <div style={{ fontSize:13, opacity:0.82 }}>{user.email}</div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Workouts", value:logs.length, color:C.warning },
          { label:"This week", value:weekLogs.length, color:C.success },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px" }}>
            <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:5 }}>{s.label}</div>
            <div style={{ color:s.color || C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:16 }}>
        <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, marginBottom:12 }}>Fitness Summary</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { label:"Exercises", value:uniqueExs.length },
            { label:"Volume", value:`${(totalVol/1000).toFixed(1)}t` },
            { label:"Calories", value:totalCal },

          ].map(item => (
            <div key={item.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px" }}>
              <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:4 }}>{item.label}</div>
              <div style={{ color:C.primary, fontFamily:"'Barlow Condensed',sans-serif", fontSize:21, fontWeight:800 }}>{item.value}</div>
            </div>
          ))}
        </div>
        {calGoal && <div style={{ color:C.muted, fontSize:12, marginTop:10 }}>Daily calorie target: {calGoal} kcal</div>}
      </div>
    </>
  );
}
