import { useState } from "react";
import { C } from "../../constants/data";
import { MEMBERSHIP_MONTHLY_FEE, MEMBERSHIP_PLANS } from "../../constants/membership";
import { formatDate, getSubscriptionDays } from "../../utils/date";
import { GhostBtn, PrimaryBtn, TextInput } from "../common";

export default function SubscriptionPanel({ user, subscription, transactions, onPay }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  // Use user's gym name from account; fallback to subscription data or default
  const gymName = user?.gymName || subscription?.gymName || "RS Fitness Gym";
  const [showPlans, setShowPlans] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const plan = selectedPlan ? MEMBERSHIP_PLANS.find(p => p.id === selectedPlan) : null;
  const amount = plan ? plan.months * MEMBERSHIP_MONTHLY_FEE : 0;
  const daysLeft = getSubscriptionDays(subscription);
  const isActive = daysLeft > 0;

  const handleSelectPlan = selected => {
    if (isActive) return;
    setSelectedPlan(selected.id);
  };

  const completeCheckout = () => {
    if (isActive || !plan) return;
    onPay(plan, gymName);
    setSelectedPlan(null);
    setShowPlans(false);
  };

  return (
    <div style={{ marginBottom:14 }}>
      <style>{`
        @media (max-width: 640px) {
          .subscription-header { padding: 12px 14px !important; border-radius: 12px !important; }
          .subscription-title { font-size: 18px !important; }
          .subscription-desc { font-size: 12px !important; margin-top: 2px !important; }
          .subscription-toggle { font-size: 18px !important; }
          .subscription-info { padding: 12px 14px !important; border-radius: 12px !important; margin-bottom: 12px !important; }
          .subscription-info-title { font-size: 20px !important; margin-bottom: 4px !important; }
          .subscription-info-desc { font-size: 12px !important; }
          .subscription-plans-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .subscription-plan-card { padding: 40px 12px 14px !important; min-height: 180px !important; }
          .subscription-plan-label { font-size: 14px !important; }
          .subscription-plan-price { font-size: 26px !important; margin-bottom: 24px !important; }
          .subscription-plan-months { font-size: 12px !important; }
          .subscription-plan-btn { font-size: 13px !important; padding: 9px !important; }
        }
        
        @media (max-width: 360px) {
          .subscription-title { font-size: 16px !important; }
          .subscription-plan-price { font-size: 22px !important; }
        }
      `}</style>
      <button onClick={() => { setShowPlans(v => !v); }} className="subscription-header"
        style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
          padding:"16px 18px", color:C.dark, cursor:"pointer", fontFamily:"'Barlow',sans-serif",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:14 }}>
        <div style={{ textAlign:"left" }}>
          <div className="subscription-title" style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(18px, 5vw, 21px)", fontWeight:800 }}>Subscription</div>
          <div className="subscription-desc" style={{ color:C.muted, fontSize:13, marginTop:3 }}>
            {isActive ? `${daysLeft} day${daysLeft===1?"":"s"} left in your gym membership` : "View membership plans"}
          </div>
        </div>
        <span className="subscription-toggle" style={{ color:C.primary, fontSize:"clamp(16px, 4vw, 20px)", fontWeight:800 }}>{showPlans ? "−" : "+"}</span>
      </button>

      {showPlans && isActive && (
        <div className="subscription-info" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
          <div className="subscription-info-title" style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(20px, 5vw, 24px)", fontWeight:800, marginBottom:6 }}>
            {daysLeft} day{daysLeft===1?"":"s"} left
          </div>
          <div className="subscription-info-desc" style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>
            Repayment is locked until your current {subscription.planLabel} membership ends.
          </div>
        </div>
      )}

      {showPlans && !isActive && !selectedPlan && (
        <div>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
            <div style={{ color:C.muted, fontSize:12, marginBottom:4 }}>Select a plan to get started:</div>
            <div style={{ color:C.dark, fontSize:"clamp(13px, 3vw, 14px)", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis" }}>Billing for: {gymName}</div>
          </div>

          <div className="subscription-plans-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))", gap:14 }}>
            {MEMBERSHIP_PLANS.map(p => {
              const tone = p.id==="monthly" ? "#22D3EE" : p.id==="quarterly" ? "#3B82F6" : p.id==="halfyearly" ? "#7C3AED" : "#A855F7";
              return (
                <button key={p.id} onClick={() => handleSelectPlan(p)} className="subscription-plan-card"
                  style={{ position:"relative", background:"#fff", border:`2px solid ${tone}`,
                    borderRadius:16, padding:"44px 14px 16px", minHeight:210, overflow:"hidden",
                    boxShadow:`0 10px 28px rgba(30,58,95,0.10)`, cursor:"pointer", transition:"all 0.2s" }}>
                  <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
                    width:"78%", height:78, background:tone, borderRadius:"0 0 46px 46px",
                    boxShadow:`0 18px 28px ${tone}70` }}/>
                  <div className="subscription-plan-label" style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
                    color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontSize:16,
                    fontWeight:800, textTransform:"uppercase", letterSpacing:1 }}>
                    {p.label}
                  </div>
                  <div style={{ position:"relative", textAlign:"center", paddingTop:12 }}>
                    <div className="subscription-plan-price" style={{ color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(24px, 6vw, 30px)", fontWeight:800, marginBottom:28 }}>
                      Rs {p.months * MEMBERSHIP_MONTHLY_FEE}
                    </div>
                    <div className="subscription-plan-months" style={{ color:C.dark, fontSize:13, fontWeight:700, marginBottom:4 }}>
                      {p.months} month{p.months===1?"":"s"}
                    </div>
                    <div style={{ color:C.muted, fontSize:12, marginBottom:18 }}>Gym membership</div>
                    <div className="subscription-plan-btn" style={{ width:"100%", background:tone, border:"none",
                      borderRadius:24, padding:"10px", color:"#fff",
                      fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:800,
                      textTransform:"uppercase" }}>
                      Select
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showPlans && !isActive && selectedPlan && plan && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px" }}>
          <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, marginBottom:4 }}>Review your plan</div>
          <div style={{ color:C.muted, fontSize:13, marginBottom:16 }}>Complete payment to activate membership</div>

          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px", marginBottom:16 }}>
            {[
              ["Gym", gymName],
              ["Plan", plan.label],
              ["Membership length", `${plan.months} month${plan.months===1?"":"s"}`],
              ["Amount", `Rs ${amount}`],
            ].map(([label, value]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:label==="Amount" ? 0 : 8 }}>
                <span style={{ color:C.muted, fontSize:13 }}>{label}</span>
                <span style={{ color:C.dark, fontSize:13, fontWeight:800, textAlign:"right" }}>{value}</span>
              </div>
            ))}
          </div>

          <TextInput label="Card number" value="4242 4242 4242 4242" readOnly/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <TextInput label="Expiry" value="12/30" readOnly/>
            <TextInput label="CVV" value="123" readOnly/>
          </div>

          <PrimaryBtn onClick={completeCheckout}>Complete payment</PrimaryBtn>
          <GhostBtn onClick={() => setSelectedPlan(null)} style={{ marginTop:10 }}>Back to plans</GhostBtn>
        </div>
      )}

      <button onClick={() => setShowTransactions(v => !v)}
        style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
          padding:"14px 18px", color:C.dark, cursor:"pointer", fontFamily:"'Barlow',sans-serif",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, margin:"14px 0" }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ color:C.dark, fontWeight:800, fontSize:15 }}>Transaction History</div>
          <div style={{ color:C.muted, fontSize:12, marginTop:3 }}>
            {transactions.length ? `${transactions.length} receipt${transactions.length===1?"":"s"} generated` : "No membership payments yet"}
          </div>
        </div>
        <span style={{ color:C.primary, fontSize:18, fontWeight:800 }}>{showTransactions ? "−" : "+"}</span>
      </button>

      {showTransactions && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px", marginBottom:14 }}>
          {transactions.length === 0 ? (
            <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"12px" }}>Receipts will appear here after checkout.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {transactions.map(tx => (
                <div key={tx.id || tx.receiptId} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 13px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:7 }}>
                    <div style={{ color:C.dark, fontWeight:800, fontSize:14 }}>{tx.planLabel || tx.plan_label || "Membership"}</div>
                    <div style={{ color:C.primary, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                      Rs {Math.round((tx.amount || tx.amount_paise || 0) / 100 || (tx.amount_paise || 0) / 100)}
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, color:C.muted, fontSize:12, lineHeight:1.4 }}>
                    <div>ID: <strong style={{ color:C.dark }}>{tx.receiptId || tx.receipt_id || tx.id?.slice(0, 8) || 'N/A'}</strong></div>
                    <div>Status: <strong style={{ color:C.dark, textTransform:'capitalize' }}>{tx.status}</strong></div>
                    <div>Duration: {tx.months} month{tx.months===1?"":"s"}</div>
                    <div>Gym: {tx.gymName || tx.gym_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
