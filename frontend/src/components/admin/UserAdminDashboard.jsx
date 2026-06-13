import { C } from "../../constants/data";
import { formatDate, getSubscriptionDays } from "../../utils/date";
import { Avatar, SectionTitle, StatCard } from "../common";

export default function UserAdminDashboard({ user, subscription, transactions, logs, weekLogs, uniqueExs, totalVol, totalCal, calGoal }) {
  const daysLeft = getSubscriptionDays(subscription);
  const membershipActive = daysLeft > 0;
  const totalPaid = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

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
          { label:"Membership", value:membershipActive ? `${daysLeft} days` : "Inactive", color:membershipActive ? C.success : C.red },
          { label:"Total paid", value:`Rs ${totalPaid}`, color:C.primary },
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
        <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, marginBottom:12 }}>Membership</div>
        {membershipActive ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              { label:"Plan", value:subscription.planLabel },
              { label:"Gym", value:subscription.gymName },
              { label:"Days left", value:daysLeft },
              { label:"Receipt", value:subscription.receiptId || "Generated" },
            ].map(item => (
              <div key={item.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px" }}>
                <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:4 }}>{item.label}</div>
                <div style={{ color:C.dark, fontWeight:800, fontSize:14, wordBreak:"break-word" }}>{item.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"18px" }}>No active membership yet. Activate one from Profile.</div>
        )}
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

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px" }}>
        <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, marginBottom:12 }}>Receipts</div>
        {transactions.length === 0 ? (
          <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"18px" }}>No membership payments yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.receiptId} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:5 }}>
                  <div style={{ color:C.dark, fontWeight:800, fontSize:14 }}>{tx.planLabel}</div>
                  <div style={{ color:C.primary, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>Rs {tx.amount}</div>
                </div>
                <div style={{ color:C.muted, fontSize:12, lineHeight:1.5 }}>
                  {formatDate(tx.paidAt)} · {tx.receiptId}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
