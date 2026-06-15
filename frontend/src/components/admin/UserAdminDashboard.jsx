import { C } from "../../constants/data";
import { Avatar, SectionTitle, StatCard } from "../common";

export default function UserAdminDashboard({ user, logs, weekLogs, uniqueExs, totalVol, totalCal, calGoal }) {

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .user-admin-gradient {
            padding: 14px !important;
            border-radius: 12px !important;
            margin-bottom: 12px !important;
          }
          .user-admin-avatar {
            width: 44px !important;
            height: 44px !important;
            gap: 10px !important;
          }
          .user-admin-name {
            font-size: 20px !important;
          }
          .user-admin-email {
            font-size: 12px !important;
          }
          .user-admin-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .user-admin-stat-card {
            padding: 12px !important;
            border-radius: 10px !important;
          }
          .user-admin-stat-label {
            font-size: 9px !important;
          }
          .user-admin-stat-value {
            font-size: 20px !important;
          }
          .user-admin-summary {
            padding: 12px !important;
            border-radius: 12px !important;
          }
          .user-admin-summary-title {
            font-size: 18px !important;
            margin-bottom: 10px !important;
          }
          .user-admin-summary-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .user-admin-summary-item {
            padding: 10px !important;
            border-radius: 8px !important;
          }
          .user-admin-summary-item-label {
            font-size: 9px !important;
          }
          .user-admin-summary-item-value {
            font-size: 18px !important;
            margin-top: 4px !important;
          }
        }
      `}</style>

      <SectionTitle>Admin Dashboard</SectionTitle>

      <div className="user-admin-gradient" style={{ background:"linear-gradient(135deg,#2563EB,#7C3AED)", borderRadius:16, padding:"18px",
        color:"#fff", marginBottom:16, boxShadow:"0 14px 36px rgba(79,70,229,0.22)" }}>
        <div className="user-admin-avatar" style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <Avatar name={user.name} size={54}/>
          <div style={{ minWidth:0, flex:1 }}>
            <div className="user-admin-name" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(20px, 5vw, 25px)", fontWeight:800 }}>{user.name}</div>
            <div className="user-admin-email" style={{ fontSize:13, opacity:0.82, overflow:"hidden", textOverflow:"ellipsis" }}>{user.email}</div>
          </div>
        </div>
      </div>

      <div className="user-admin-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Workouts", value:logs.length, color:C.warning },
          { label:"This week", value:weekLogs.length, color:C.success },
        ].map(s => (
          <div key={s.label} className="user-admin-stat-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px" }}>
            <div className="user-admin-stat-label" style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:5 }}>{s.label}</div>
            <div className="user-admin-stat-value" style={{ color:s.color || C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(20px, 5vw, 24px)", fontWeight:800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="user-admin-summary" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:16 }}>
        <div className="user-admin-summary-title" style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(18px, 5vw, 20px)", fontWeight:800, marginBottom:12 }}>Fitness Summary</div>
        <div className="user-admin-summary-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { label:"Exercises", value:uniqueExs.length },
            { label:"Volume", value:`${(totalVol/1000).toFixed(1)}t` },
            { label:"Calories", value:totalCal },

          ].map(item => (
            <div key={item.label} className="user-admin-summary-item" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px" }}>
              <div className="user-admin-summary-item-label" style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:4 }}>{item.label}</div>
              <div className="user-admin-summary-item-value" style={{ color:C.primary, fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(16px, 4vw, 21px)", fontWeight:800 }}>{item.value}</div>
            </div>
          ))}
        </div>
        {calGoal && <div style={{ color:C.muted, fontSize:12, marginTop:10 }}>Daily calorie target: {calGoal} kcal</div>}
      </div>
    </>
  );
}
