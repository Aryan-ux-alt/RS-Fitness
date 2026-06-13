import { getSubscriptionDays } from "../../utils/date";
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
  const memberRows = users.map(u => {
    const subscription = readJSON(`rs_subscription_${u.email}`, null);
    const transactions = readJSON(`rs_subscription_tx_${u.email}`, []);
    return {
      ...u,
      subscription,
      transactions,
      daysLeft: getSubscriptionDays(subscription),
    };
  });
  const allTransactions = memberRows.flatMap(m => m.transactions.map(tx => ({ ...tx, memberName:m.name, memberEmail:m.email })));
  const activeMembers = memberRows.filter(m => m.daysLeft > 0);
  const revenue = allTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const recentTransactions = allTransactions
    .sort((a,b) => new Date(b.paidAt) - new Date(a.paidAt))
    .slice(0, 6);

  return (
    <>
      <SectionTitle>Admin Dashboard</SectionTitle>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Members", value:memberRows.length },
          { label:"Active", value:activeMembers.length, color:C.success },
          { label:"Revenue", value:`Rs ${revenue}`, color:C.primary },
          { label:"Receipts", value:allTransactions.length, color:C.warning },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px" }}>
            <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:5 }}>{s.label}</div>
            <div style={{ color:s.color || C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:16 }}>
        <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, marginBottom:12 }}>Members</div>
        {memberRows.length === 0 ? (
          <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"18px" }}>No members have signed up yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {memberRows.map(m => (
              <div key={m.email} style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center",
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px" }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ color:C.dark, fontWeight:800, fontSize:14 }}>{m.name}</div>
                  <div style={{ color:C.muted, fontSize:12, overflow:"hidden", textOverflow:"ellipsis" }}>{m.email}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ color:m.daysLeft > 0 ? C.success : C.red, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                    {m.daysLeft > 0 ? `${m.daysLeft} days` : "Inactive"}
                  </div>
                  <div style={{ color:C.muted, fontSize:11 }}>{m.subscription?.planLabel || "No plan"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px" }}>
        <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, marginBottom:12 }}>Recent Transactions</div>
        {recentTransactions.length === 0 ? (
          <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"18px" }}>No membership payments yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {recentTransactions.map(tx => (
              <div key={`${tx.memberEmail}-${tx.receiptId}`} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:5 }}>
                  <div style={{ color:C.dark, fontWeight:800, fontSize:14 }}>{tx.memberName}</div>
                  <div style={{ color:C.primary, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>Rs {tx.amount}</div>
                </div>
                <div style={{ color:C.muted, fontSize:12, lineHeight:1.5 }}>
                  {tx.planLabel} · {formatDate(tx.paidAt)} · {tx.receiptId}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
