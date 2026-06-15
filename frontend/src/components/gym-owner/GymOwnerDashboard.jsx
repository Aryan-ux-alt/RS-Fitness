import { useState, useEffect } from "react";
import { getGymMembers, sendMemberReminder } from "../../services/api";
import AdminDashboard from "../admin/AdminDashboard";
import { MEMBERSHIP_PLANS } from "../../constants/membership";

const MEMBERSHIP_FEE = 1000; // Rs per month

const C = {
  bg: "#F3F4F6",
  card: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#3B82F6",
  dark: "#1F2937",
  muted: "#9CA3AF",
  surface: "#F9FAFB",
  success: "#10B981",
  warning: "#F59E0B",
  red: "#EF4444",
};

export default function GymOwnerDashboard({ gymOwner, onLogout }) {
  const [activeTab, setActiveTab] = useState("admin"); // "admin", "members", or "profile"
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderError, setReminderError] = useState(null);
  const [earnings, setEarnings] = useState(() => {
    const stored = localStorage.getItem(`gym_earnings_${gymOwner?.gym_id}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewingMember, setRenewingMember] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      setError("");
      try {
        const membersData = await getGymMembers();
        
        // Add demo expired member for testing
        const demoMember = {
          user_id: "demo_expired_001",
          name: "Demo - Expired Member",
          email: "demo@example.com",
          phone: "9876543210",
          plan: "3-Month Plan",
          start_date: "2025-12-14",
          expiry_date: "2026-03-14", // 3 months ago - expired
          status: "expired",
          membership_type: "expired",
          days_remaining: -91
        };
        
        setMembers([...membersData, demoMember]);
      } catch (err) {
        console.error("Failed to load members", err);
        setError(err.message || "Failed to load members.");
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  // Filter members by query
  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.plan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats dynamically
  const totalMembers = members.length;
  
  // Categorize members
  const today = new Date();
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const activeMembers = members.filter(m => {
    if (!m.expiry_date) return false;
    const expiryDate = new Date(m.expiry_date);
    return expiryDate > today;
  }).length;
  
  const expiredMembers = members.filter(m => {
    if (!m.expiry_date) return false;
    const expiryDate = new Date(m.expiry_date);
    return expiryDate <= today;
  }).length;
  
  const noMembershipMembers = members.filter(m => !m.expiry_date || m.status === "pending").length;
  
  const expiredMembersNeedRenewal = members.filter(m => {
    if (!m.expiry_date) return false;
    const expiryDate = new Date(m.expiry_date);
    return expiryDate <= today;
  });
  
  const membersExpiringSoon = members.filter(m => {
    if (!m.expiry_date) return false;
    const expiryDate = new Date(m.expiry_date);
    const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysRemaining > 0 && daysRemaining <= 7;
  }).map(m => ({
    ...m,
    days_remaining: Math.ceil((new Date(m.expiry_date) - today) / (1000 * 60 * 60 * 24))
  }));
  
  const noMembershipList = members.filter(m => !m.expiry_date || m.status === "pending");
  
  // Calculate earnings
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthEarnings = earnings
    .filter(e => {
      const eDate = new Date(e.date);
      return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  
  const lastMonthDate = new Date(currentYear, currentMonth - 1);
  const lastMonthEarnings = earnings
    .filter(e => {
      const eDate = new Date(e.date);
      return eDate.getMonth() === lastMonthDate.getMonth() && eDate.getFullYear() === lastMonthDate.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);
  
  const thisYearEarnings = earnings
    .filter(e => {
      const eDate = new Date(e.date);
      return eDate.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Handle membership renewal
  const handleRenewMembership = async () => {
    if (!renewingMember || !selectedPlan) return;

    const plan = MEMBERSHIP_PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    const amount = MEMBERSHIP_FEE * plan.months;
    const today = new Date();
    const newExpiryDate = new Date(today);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + plan.months);

    // Update member start and expiry dates
    const updatedMembers = members.map(m => {
      if (m.user_id === renewingMember.user_id) {
        const newExpiry = newExpiryDate.toISOString().split('T')[0];
        const daysLeft = Math.ceil((newExpiryDate - today) / (1000 * 60 * 60 * 24));
        return {
          ...m,
          start_date: today.toISOString().split('T')[0],
          expiry_date: newExpiry,
          plan: plan.label,
          membership_type: "active",
          status: "active",
          days_remaining: daysLeft
        };
      }
      return m;
    });
    setMembers(updatedMembers);

    // Add earning record
    const newEarning = {
      id: Date.now(),
      memberId: renewingMember.user_id,
      memberName: renewingMember.name,
      planId: selectedPlan,
      planLabel: plan.label,
      months: plan.months,
      amount: amount,
      date: new Date().toISOString()
    };
    
    const updatedEarnings = [...earnings, newEarning];
    setEarnings(updatedEarnings);
    localStorage.setItem(`gym_earnings_${gymOwner?.gym_id}`, JSON.stringify(updatedEarnings));

    const startDate = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const endDate = newExpiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    setReminderMessage(`✅ Membership renewed! Start: ${startDate} | End: ${endDate} | Added ₹${amount}`);
    setTimeout(() => setReminderMessage(""), 3000);
    
    setShowRenewModal(false);
    setRenewingMember(null);
    setSelectedPlan("monthly");
  };

  // Send reminder to member
  // Validate Indian phone number
  const isValidPhoneNumber = (phone) => {
    if (!phone) return false;
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Indian phone numbers: 10 digits starting with 6-9
    return /^[6-9]\d{9}$/.test(cleanPhone);
  };

  const handleSendReminder = async (member) => {
    // Validate phone number first
    if (!member.phone || !isValidPhoneNumber(member.phone)) {
      setReminderError({
        type: "invalid_phone",
        memberName: member.name,
        message: `Invalid number for ${member.name}`
      });
      setTimeout(() => setReminderError(null), 5000);
      return;
    }

    setSendingReminderId(member.user_id);
    setReminderMessage("");
    setReminderError(null);
    try {
      await sendMemberReminder({
        userId: member.user_id,
        memberName: member.name,
        gymName: gymOwner.gymName
      });
      setReminderMessage(`✅ Reminder sent to ${member.name}!`);
      setTimeout(() => setReminderMessage(""), 3000);
    } catch (err) {
      // Parse error response for specific error codes
      const errorData = err.data || {};
      const errorCode = errorData.errorCode;
      let errorMsg = "WhatsApp service unavailable";
      let errorType = "service_error";

      if (errorCode === "PHONE_MISSING" || errorCode === "INVALID_PHONE_FORMAT") {
        errorMsg = `Invalid number for ${member.name}`;
        errorType = "invalid_phone";
      } else if (errorCode === "WHATSAPP_SERVICE_FAILED") {
        errorMsg = "WhatsApp service unavailable";
        errorType = "service_error";
      } else if (err.message.includes("network") || err.message.includes("timeout")) {
        errorMsg = "WhatsApp service unavailable";
        errorType = "service_error";
      }

      setReminderError({
        type: errorType,
        memberName: member.name,
        message: errorMsg
      });
      setTimeout(() => setReminderError(null), 4000);
    } finally {
      setSendingReminderId(null);
    }
  };



  const formatDate = dateStr => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Barlow',sans-serif", paddingBottom:84 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');
        *{box-sizing:border-box}
        .member-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .member-table th {
          padding: 8px 6px;
          color: #9CA3AF;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 13px;
          border-bottom: 2px solid #F3F4F6;
        }
        .member-table td {
          padding: 11px 6px;
          color: #1F2937;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 1px solid #F3F4F6;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge.active {
          background: #DCFCE7;
          color: #166534;
        }
        .badge.expired {
          background: #FEE2E2;
          color: #991B1B;
        }
        .badge.cancelled {
          background: #F3F4F6;
          color: #374151;
        }
        .badge.inactive {
          background: #FEF3C7;
          color: #92400E;
        }
        .month-card {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .month-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.08);
          border-color: #3B82F6 !important;
        }
      `}</style>
      
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"13px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 12px rgba(59,130,246,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:32, height:32, background:C.primary, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <rect x="2" y="10" width="4" height="4" rx="1" fill="#fff"/>
              <rect x="18" y="10" width="4" height="4" rx="1" fill="#fff"/>
              <rect x="5" y="8" width="2" height="8" rx="1" fill="#fff"/>
              <rect x="17" y="8" width="2" height="8" rx="1" fill="#fff"/>
              <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff"/>
            </svg>
          </div>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.dark, letterSpacing:2 }}>RS FITNESS</span>
        </div>
        
        <button onClick={onLogout} style={{
          background:"transparent", border:`1px solid ${C.red}`, borderRadius:20,
          padding:"5px 13px", cursor:"pointer", color:C.red,
          fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1,
          fontFamily:"'Barlow Condensed',sans-serif", transition:"all 0.2s",
        }}>Sign out</button>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth:680, margin:"0 auto", padding:"20px 16px" }}>

        {/* ── MEMBERS TAB ── */}
        {activeTab === "members" && (
          <>
            <div style={{ marginBottom:22 }}>
              <h1 style={{ color:C.dark, margin:"0 0 4px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800 }}>
                Gym Members
              </h1>
              <p style={{ color:C.muted, margin:0, fontSize:14 }}>
                Search and view details of all members registered under <strong>{gymOwner.gymName}</strong>.
              </p>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:16 }}>
                <span style={{ color:C.dark, fontWeight:700, fontSize:15 }}>Members List ({filteredMembers.length})</span>
                
                <input 
                  type="text" 
                  placeholder="Search name or plan..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ 
                    padding:"8px 12px", 
                    borderRadius:8, 
                    border:`1.5px solid ${C.border}`,
                    background:C.surface,
                    color:C.dark,
                    outline:"none", 
                    fontSize:13, 
                    width:"100%", 
                    maxWidth:200,
                    fontFamily:"'Barlow',sans-serif"
                  }}
                />
              </div>

              {loading ? (
                <div style={{ padding:"40px 0", textAlign:"center", color:C.muted, fontWeight:600 }}>Loading members...</div>
              ) : error ? (
                <div style={{ color:C.red, padding:"12px", background:"#FEE2E2", borderRadius:8, fontWeight:600 }}>{error}</div>
              ) : filteredMembers.length === 0 ? (
                <div style={{ padding:"40px 0", textAlign:"center", color:C.muted, fontWeight:600 }}>
                  {searchQuery ? "No matching members found." : "No members registered yet."}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="member-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Plan</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Days Left</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member, idx) => {
                        const daysLeft = parseInt(member.days_remaining || 0);
                        const hasNoMembership = member.membership_type === "no_membership";
                        const isExpired = member.membership_type === "expired";
                        const isActive = member.membership_type === "active";
                        
                        return (
                          <tr key={idx} style={{ background: hasNoMembership ? "#FFFBEB" : isExpired ? "#FEF2F2" : "transparent" }}>
                            <td style={{ fontWeight: 700 }}>
                              {member.name}
                              {hasNoMembership && (
                                <span style={{ 
                                  marginLeft: 8, 
                                  padding: "2px 8px", 
                                  background: "#FCD34D", 
                                  color: "#92400E",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: "uppercase"
                                }}>
                                  ⚠ No Membership
                                </span>
                              )}
                            </td>
                            <td style={{ color: hasNoMembership ? "#F59E0B" : "inherit", fontWeight: hasNoMembership ? 700 : 500 }}>
                              {member.plan}
                            </td>
                            <td>{formatDate(member.start_date)}</td>
                            <td>{formatDate(member.expiry_date)}</td>
                            <td>
                              {hasNoMembership ? (
                                <span style={{ color: "#F59E0B", fontWeight: 700 }}>Pending</span>
                              ) : isExpired ? (
                                <span style={{ color: C.red, fontWeight: 700 }}>Expired</span>
                              ) : isActive && daysLeft <= 5 ? (
                                <span style={{ 
                                  color: C.warning, 
                                  fontWeight: 700 
                                }}>
                                  {daysLeft} days
                                </span>
                              ) : (
                                <span style={{ 
                                  color: C.success, 
                                  fontWeight: 700 
                                }}>
                                  {daysLeft} days
                                </span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${hasNoMembership ? "inactive" : isExpired ? "expired" : member.status}`}>
                                {hasNoMembership ? "pending" : isExpired ? "expired" : member.status}
                              </span>
                            </td>
                            <td>
                              {isExpired && (
                                <button
                                  onClick={() => handleSendReminder(member)}
                                  disabled={sendingReminderId === member.user_id}
                                  style={{
                                    padding: "5px 10px",
                                    background: sendingReminderId === member.user_id ? C.muted : C.warning,
                                    color: "white",
                                    border: "none",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: sendingReminderId === member.user_id ? "not-allowed" : "pointer",
                                    whiteSpace: "nowrap",
                                    opacity: sendingReminderId === member.user_id ? 0.6 : 1
                                  }}
                                >
                                  {sendingReminderId === member.user_id ? "Sending..." : "📢 Remind"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ADMIN TAB ── */}
        {activeTab === "admin" && (
          <>
            <div style={{ marginBottom:22 }}>
              <h1 style={{ color:C.dark, margin:"0 0 4px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800 }}>
                Hey, Gym Owner 👋
              </h1>
              <p style={{ color:C.muted, margin:0, fontSize:14 }}>
                Here is your gym management summary for <strong>{gymOwner.gymName}</strong>.
              </p>
            </div>

            {/* Metrics Row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10, marginBottom:20 }}>
              {[
                { label:"Total Members", value:totalMembers, color:C.primary, desc:"registered" },
                { label:"Active Plans", value:activeMembers, color:C.success, desc:"active" },
                { label:"Expired", value:expiredMembers, color:C.red, desc:"need renewal" },
                { label:"No Membership", value:noMembershipMembers, color:C.warning, desc:"pending signup" },
              ].map(s => (
                <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px" }}>
                  <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginBottom:5 }}>{s.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:"'Barlow Condensed',sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{s.desc}</div>
                </div>
              ))}
            </div>

            {/* � EARNINGS SECTION */}
            <div style={{ marginBottom:20 }}>
              <h2 style={{ color:C.dark, margin:"0 0 12px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                💰 Earnings
              </h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10 }}>
                {[
                  { label:"This Month", value:`₹${thisMonthEarnings}`, color:C.primary },
                  { label:"Last Month", value:`₹${lastMonthEarnings}`, color:C.warning },
                  { label:"This Year", value:`₹${thisYearEarnings}`, color:C.success },
                ].map(s => (
                  <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px" }}>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginBottom:5 }}>{s.label}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:"'Barlow Condensed',sans-serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* �🔄 EXPIRED MEMBERSHIPS - RENEWAL SECTION */}
            {expiredMembers > 0 && (
              <div style={{ marginBottom:22, background:"linear-gradient(135deg,#FEE2E2,#FEC2C2)", border:"1.5px solid #FECACA", borderRadius:12, padding:"16px", overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ fontSize:20 }}>🔄</div>
                  <h2 style={{ color:"#991B1B", margin:0, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                    {expiredMembers} Membership{expiredMembers !== 1 ? "s" : ""} Expired - Renew Now
                  </h2>
                </div>
                <p style={{ color:"#991B1B", fontSize:13, margin:"0 0 12px", fontWeight:500 }}>
                  These members' gym memberships have expired. Reach out to renew their plans.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:"200px", overflowY:"auto" }}>
                  {expiredMembersNeedRenewal.slice(0, 5).map((member, idx) => (
                    <div key={idx} style={{
                      background:"rgba(255,255,255,0.7)",
                      border:"1px solid #FECACA",
                      borderRadius:8,
                      padding:"10px 12px",
                      display:"flex",
                      justifyContent:"space-between",
                      alignItems:"center",
                      gap:10
                    }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, color:"#1F2937", fontSize:13 }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize:12, color:"#6B7280" }}>
                          Expired: {formatDate(member.expiry_date)} · {member.plan}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendReminder(member)}
                        disabled={sendingReminderId === member.user_id}
                        style={{
                          background: sendingReminderId === member.user_id ? C.muted : C.warning,
                          border:"none",
                          color:"white",
                          padding:"6px 12px",
                          borderRadius:6,
                          fontWeight:700,
                          fontSize:11,
                          cursor: sendingReminderId === member.user_id ? "not-allowed" : "pointer",
                          whiteSpace:"nowrap",
                          transition:"all 0.2s",
                          opacity: sendingReminderId === member.user_id ? 0.6 : 1
                        }}
                        title="Send renewal reminder"
                      >
                        {sendingReminderId === member.user_id ? "Sending..." : "📢 Remind"}
                      </button>
                    </div>
                  ))}
                  {expiredMembers > 5 && (
                    <div style={{ textAlign:"center", color:"#991B1B", fontSize:12, fontWeight:600, marginTop:4 }}>
                      +{expiredMembers - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ⏰ Members Expiring Soon */}
            <div style={{ marginBottom:22 }}>
              <h2 style={{ color:C.dark, margin:"0 0 12px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                ⏰ Expiring Soon (Next 7 Days)
              </h2>
              {reminderMessage && (
                <div style={{
                  background: reminderMessage.includes("✅") ? "#DCFCE7" : "#FEE2E2",
                  color: reminderMessage.includes("✅") ? "#166534" : "#991B1B",
                  padding:"10px 12px",
                  borderRadius:8,
                  marginBottom:12,
                  fontSize:13,
                  fontWeight:600,
                  border:`1px solid ${reminderMessage.includes("✅") ? "#86EFAC" : "#FECACA"}`
                }}>
                  {reminderMessage}
                </div>
              )}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px", overflow:"hidden" }}>
                {membersExpiringSoon.length === 0 ? (
                  <div style={{ textAlign:"center", color:C.muted, padding:"20px 0", fontSize:14 }}>
                    No members expiring in the next 7 days
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {membersExpiringSoon.map((member, idx) => (
                      <div key={idx} style={{
                        background:C.surface,
                        border:`1px solid ${C.border}`,
                        borderRadius:10,
                        padding:"12px",
                        display:"flex",
                        justifyContent:"space-between",
                        alignItems:"center",
                        gap:12
                      }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, color:C.dark, fontSize:14, marginBottom:3 }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize:12, color:C.muted }}>
                            {member.plan} Plan
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
                          <div style={{
                            background: member.days_remaining <= 2 ? "#FEE2E2" : "#FEF3C7",
                            color: member.days_remaining <= 2 ? "#991B1B" : "#92400E",
                            padding:"6px 12px",
                            borderRadius:8,
                            fontWeight:700,
                            fontSize:13
                          }}>
                            {member.days_remaining} day{member.days_remaining !== "1" ? "s" : ""}
                          </div>
                          <button
                            onClick={() => handleSendReminder(member)}
                            style={{
                              padding: "5px 10px",
                              background: C.warning,
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            📢 Remind
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ❌ MEMBERS WITH NO MEMBERSHIP - URGENT SECTION */}
            {noMembershipMembers > 0 && (
              <div style={{ marginBottom:22, background:"linear-gradient(135deg,#FEF3C7,#FEE2E2)", border:"1.5px solid #FCD34D", borderRadius:12, padding:"16px", overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ fontSize:20 }}>⚠️</div>
                  <h2 style={{ color:"#92400E", margin:0, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                    {noMembershipMembers} Member{noMembershipMembers !== 1 ? "s" : ""} - No Membership Yet
                  </h2>
                </div>
                <p style={{ color:"#92400E", fontSize:13, margin:"0 0 12px", fontWeight:500 }}>
                  These members created an account but haven't purchased any gym membership plan yet. Follow up with them to complete their membership.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:"200px", overflowY:"auto" }}>
                  {noMembershipList.slice(0, 5).map((member, idx) => (
                    <div key={idx} style={{
                      background:"rgba(255,255,255,0.7)",
                      border:"1px solid #FCD34D",
                      borderRadius:8,
                      padding:"10px 12px",
                      display:"flex",
                      justifyContent:"space-between",
                      alignItems:"center",
                      gap:10
                    }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, color:"#1F2937", fontSize:13 }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize:12, color:isValidPhoneNumber(member.phone) ? "#6B7280" : "#DC2626", fontWeight: isValidPhoneNumber(member.phone) ? 400 : 600 }}>
                          {isValidPhoneNumber(member.phone) ? (member.phone || "No phone") : `📵 Invalid: ${member.phone || "No phone"}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendReminder(member)}
                        disabled={sendingReminderId === member.user_id}
                        style={{
                          background: sendingReminderId === member.user_id ? C.muted : "#F59E0B",
                          border:"none",
                          color:"white",
                          padding:"6px 12px",
                          borderRadius:6,
                          fontWeight:700,
                          fontSize:11,
                          cursor: sendingReminderId === member.user_id ? "not-allowed" : "pointer",
                          whiteSpace:"nowrap",
                          transition:"all 0.2s",
                          opacity: sendingReminderId === member.user_id ? 0.6 : 1
                        }}
                        title="Send reminder to join"
                      >
                        {sendingReminderId === member.user_id ? "Sending..." : "📢 Remind"}
                      </button>
                    </div>
                  ))}
                  {noMembershipMembers > 5 && (
                    <div style={{ textAlign:"center", color:"#92400E", fontSize:12, fontWeight:600, marginTop:4 }}>
                      +{noMembershipMembers - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ⚠️ REMINDER ERROR ALERT - DISPLAYS FAILURES */}
            {reminderError && (
              <div style={{
                marginBottom:22,
                background: reminderError.type === "invalid_phone" ? "#FEF3C7" : "#FEE2E2",
                border: reminderError.type === "invalid_phone" ? "2px solid #F59E0B" : "2px solid #EF4444",
                borderRadius:12,
                padding:"14px 16px",
                display:"flex",
                alignItems:"center",
                gap:12
              }}>
                <div style={{ fontSize:24 }}>
                  {reminderError.type === "invalid_phone" ? "📱" : "❌"}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{
                    margin:0,
                    color: reminderError.type === "invalid_phone" ? "#92400E" : "#991B1B",
                    fontSize:13,
                    fontWeight:600
                  }}>
                    {reminderError.message}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <>
            <div style={{ marginBottom:22 }}>
              <h1 style={{ color:C.dark, margin:"0 0 4px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800 }}>
                Profile
              </h1>
              <p style={{ color:C.muted, margin:0, fontSize:14 }}>
                View and manage your account.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button 
                onClick={() => setShowAccountModal(true)}
                style={{
                  padding: "12px 18px",
                  background: "transparent",
                  color: C.success,
                  border: `2px solid ${C.success}`,
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 0.5
                }}
                onMouseEnter={e => { e.target.style.background = C.success; e.target.style.color = "white"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.success; }}
              >
                Account Details
              </button>

              <button 
                onClick={onLogout}
                style={{
                  padding: "12px 18px",
                  background: "transparent",
                  color: C.red,
                  border: `2px solid ${C.red}`,
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 0.5
                }}
                onMouseEnter={e => { e.target.style.background = C.red; e.target.style.color = "white"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.red; }}
              >
                Sign Out
              </button>
            </div>

            {/* Account Modal */}
            {showAccountModal && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px"
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: 400,
                  background: C.card,
                  borderRadius: 12,
                  padding: "24px",
                  border: `1px solid ${C.border}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ color: C.dark, margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700 }}>
                      Account Details
                    </h2>
                    <button
                      onClick={() => setShowAccountModal(false)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 24,
                        cursor: "pointer",
                        color: C.muted,
                        padding: 0,
                        width: 28,
                        height: 28
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 14 }}>
                    {[
                      { label: "Gym Name", value: gymOwner.gymName },
                      { label: "City", value: gymOwner.city },
                      { label: "Phone", value: gymOwner.phone },
                      { label: "Email", value: gymOwner.email },
                      { label: "Status", value: gymOwner.status, isStatus: true },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                          {item.label}
                        </div>
                        <div style={{ color: item.isStatus ? C.success : C.dark, fontWeight: 600, fontSize: 14, textTransform: item.isStatus ? "uppercase" : "none" }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowAccountModal(false)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "transparent",
                      color: C.primary,
                      border: `1.5px solid ${C.primary}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: 20,
                      fontFamily: "'Barlow', sans-serif",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.target.style.background = C.primary; e.target.style.color = "white"; }}
                    onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.primary; }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Renewal Modal */}
      {showRenewModal && renewingMember && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            width: "100%",
            maxWidth: 400,
            background: C.card,
            borderRadius: 14,
            padding: "24px",
            border: `1px solid ${C.border}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ color: C.dark, margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700 }}>
                Renew Membership
              </h2>
              <button
                onClick={() => setShowRenewModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: C.muted,
                  padding: 0,
                  width: 28,
                  height: 28
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ color: C.dark, fontWeight: 600, marginBottom: 4 }}>
                Member: <strong>{renewingMember.name}</strong>
              </p>
              <p style={{ color: C.muted, fontSize: 13 }}>
                Current Plan: {renewingMember.plan}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, color: C.dark, fontWeight: 600, fontSize: 13 }}>
                Select Membership Plan:
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.surface,
                  color: C.dark,
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {MEMBERSHIP_PLANS.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label} - ₹{MEMBERSHIP_FEE * plan.months}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ 
              background: C.surface, 
              borderRadius: 8, 
              padding: 12, 
              marginBottom: 20,
              borderLeft: `4px solid ${C.primary}`
            }}>
              <p style={{ color: C.dark, fontWeight: 700, margin: "0 0 4px" }}>
                Amount to Add: ₹{MEMBERSHIP_FEE * MEMBERSHIP_PLANS.find(p => p.id === selectedPlan)?.months}
              </p>
              <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
                Duration: {MEMBERSHIP_PLANS.find(p => p.id === selectedPlan)?.months} month(s)
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleRenewMembership}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: C.success,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Barlow', sans-serif",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.target.style.opacity = "0.9"}
                onMouseLeave={e => e.target.style.opacity = "1"}
              >
                ✅ Renew Membership
              </button>
              <button
                onClick={() => setShowRenewModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  color: C.primary,
                  border: `1.5px solid ${C.primary}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Barlow', sans-serif",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.target.style.background = C.primary; e.target.style.color = "white"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.primary; }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.card,
        borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 6px", zIndex:50,
        boxShadow:"0 -1px 12px rgba(59,130,246,0.06)" }}>
        {[
          { id:"admin", icon:"ti-stats-up", label:"Admin" },
          { id:"members", icon:"ti-user", label:"Members" },
          { id:"profile", icon:"ti-settings", label:"Profile" }
        ].map(({ id, icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex:1, background:"none", border:"none", cursor:"pointer", padding:"5px 0",
            display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            color:activeTab===id ? C.primary : C.muted, transition:"color 0.2s",
          }}>
            <i className={`ti ${icon}`} style={{ fontSize:20 }}/>
            <span style={{ fontSize:10, fontWeight:activeTab===id?700:500, fontFamily:"'Barlow',sans-serif" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
