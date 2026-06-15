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
      <SectionTitle>Admin Dashboard</SectionTitle>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Members", value:users.length },
          { label:"Registered", value:users.length, color:C.success },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px" }}>
            <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:5 }}>{s.label}</div>
            <div style={{ color:s.color || C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:16 }}>
        <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, marginBottom:12 }}>Members</div>
        {users.length === 0 ? (
          <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"18px" }}>No members have signed up yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {users.map(u => (
              <div key={u.email} style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center",
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px" }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ color:C.dark, fontWeight:800, fontSize:14 }}>{u.name}</div>
                  <div style={{ color:C.muted, fontSize:12, overflow:"hidden", textOverflow:"ellipsis" }}>{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
