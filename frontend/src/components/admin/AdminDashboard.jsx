import { C } from "../../constants/data";
import { Avatar, SectionTitle, StatCard } from "../common";

export default function AdminDashboard() {
  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const users = Object.values(readJSON("rs_users", {}));

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .admin-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .admin-stat-card {
            padding: 12px !important;
            border-radius: 10px !important;
          }
          .admin-stat-label {
            font-size: 9px !important;
          }
          .admin-stat-value {
            font-size: 20px !important;
          }
          .admin-section {
            padding: 12px !important;
            border-radius: 12px !important;
            margin-bottom: 12px !important;
          }
          .admin-member-item {
            padding: 10px !important;
            border-radius: 10px !important;
            gap: 8px !important;
          }
          .admin-member-name {
            font-size: 13px !important;
          }
          .admin-member-email {
            font-size: 11px !important;
          }
        }
      `}</style>

      <SectionTitle>Admin Dashboard</SectionTitle>

      <div className="admin-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Members", value:users.length },
          { label:"Registered", value:users.length, color:C.success },
        ].map(s => (
          <div key={s.label} className="admin-stat-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px" }}>
            <div className="admin-stat-label" style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:5 }}>{s.label}</div>
            <div className="admin-stat-value" style={{ color:s.color || C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(20px, 5vw, 24px)", fontWeight:800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-section" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:16 }}>
        <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(18px, 5vw, 20px)", fontWeight:800, marginBottom:12 }}>Members</div>
        {users.length === 0 ? (
          <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"18px" }}>No members have signed up yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {users.map(u => (
              <div key={u.email} className="admin-member-item" style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center",
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px", minWidth:0 }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div className="admin-member-name" style={{ color:C.dark, fontWeight:800, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name}</div>
                  <div className="admin-member-email" style={{ color:C.muted, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
