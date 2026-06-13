import { useState, useEffect } from "react";
import { getGymMembers, getGymRevenue, sendMemberReminder, getPaymentsByMonth } from "../../services/api";

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
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "members", "payments", or "profile"
  const [members, setMembers] = useState([]);
  const [revenue, setRevenue] = useState({ today: 0, thisMonth: 0, thisYear: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderError, setReminderError] = useState(null); // NEW: for showing reminder errors
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthPayments, setMonthPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const membersData = await getGymMembers();
        setMembers(membersData);
        
        const revenueData = await getGymRevenue();
        setRevenue(revenueData);
      } catch (err) {
        console.error("Failed to load data", err);
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter members by query
  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.plan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats dynamically
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.membership_type === "active").length;
  const expiredMembers = members.filter(m => m.membership_type === "expired").length;
  const noMembershipMembers = members.filter(m => m.membership_type === "no_membership").length;
  const inactiveMembers = members.filter(m => m.membership_type === "inactive").length;
  
  // Count members expiring today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const expiringToday = members.filter(m => {
    if (!m.expiry_date) return false;
    const expiryDate = new Date(m.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate.getTime() === today.getTime();
  }).length;

  // Get members expiring soon (next 7 days) - ACTIVE only
  const membersExpiringSoon = members
    .filter(m => {
      const daysLeft = parseInt(m.days_remaining || 0);
      return m.membership_type === "active" && daysLeft > 0 && daysLeft <= 7;
    })
    .sort((a, b) => parseInt(a.days_remaining) - parseInt(b.days_remaining))
    .slice(0, 5); // Show top 5

  // Get expired members that need renewal
  const expiredMembersNeedRenewal = members
    .filter(m => m.membership_type === "expired")
    .sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))
    .slice(0, 5); // Show top 5

  // Get members without any membership
  const noMembershipList = members
    .filter(m => m.membership_type === "no_membership")
    .sort((a, b) => a.name.localeCompare(b.name));

  // Format paise to rupees
  const formatRupees = paise => {
    const rupees = paise / 100;
    return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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

  // Generate payment heatmap data
  const getPaymentDates = () => {
    // Mock payment dates - in real app, fetch from backend
    // Format: array of dates when payments were received
    const dates = [];
    for (let i = 0; i < members.length; i++) {
      if (members[i].start_date) {
        const date = new Date(members[i].start_date);
        // Set to same year as selected
        date.setFullYear(selectedYear);
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return [...new Set(dates)]; // Remove duplicates
  };

  const paymentDates = getPaymentDates();

  // Generate calendar for each month
  const generateMonthCalendar = (month) => {
    const firstDay = new Date(selectedYear, month, 1);
    const lastDay = new Date(selectedYear, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const hasPayment = (day, month) => {
    if (!day) return false;
    const dateStr = `${selectedYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return paymentDates.includes(dateStr);
  };

  const handleMonthClick = async (monthIdx) => {
    setSelectedMonth(monthIdx);
    setLoadingPayments(true);
    try {
      const monthNum = monthIdx + 1;
      const data = await getPaymentsByMonth(selectedYear, monthNum);
      setMonthPayments(data.payments || []);
      setShowPaymentsModal(true);
    } catch (err) {
      alert(`Failed to fetch payments: ${err.message}`);
    } finally {
      setLoadingPayments(false);
    }
  };

  const generatePaymentReceipt = (payment) => {
    const date = new Date(payment.paidAt).toLocaleDateString("en-IN");
    const time = new Date(payment.paidAt).toLocaleTimeString("en-IN");
    const amount = (payment.amount / 100).toFixed(2);
    
    return `
═══════════════════════════════
        PAYMENT RECEIPT
═══════════════════════════════

Gym Name: ${gymOwner.gymName}
Member Name: ${payment.userName}
Email: ${payment.userEmail}
Phone: ${payment.userPhone}

Plan: ${payment.planName}
Amount: ₹${amount}
Date & Time: ${date} ${time}
Transaction ID: ${payment.id}

Status: ${payment.status.toUpperCase()}

═══════════════════════════════
Thank you for your payment!
═══════════════════════════════
    `;
  };

  const downloadReceipt = (payment) => {
    const receipt = generatePaymentReceipt(payment);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(receipt));
    element.setAttribute("download", `receipt_${payment.id}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "dashboard" && (
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

            {/* 🔄 EXPIRED MEMBERSHIPS - RENEWAL SECTION */}
            {expiredMembers > 0 && (
              <div style={{ marginBottom:22, background:"linear-gradient(135deg,#FEE2E2,#FEC2C2)", border:"1.5px solid #FECACA", borderRadius:12, padding:"16px", overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ fontSize:20 }}>🔄</div>
                  <h2 style={{ color:"#991B1B", margin:0, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                    {expiredMembers} Membership{expiredMembers !== 1 ? "s" : ""} Expired - Renew Now
                  </h2>
                </div>
                <p style={{ color:"#991B1B", fontSize:13, margin:"0 0 12px", fontWeight:500 }}>
                  These members' gym memberships have expired. Reach out to renew their plans and maintain your revenue stream.
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
                          background: sendingReminderId === member.user_id ? C.muted : C.red,
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
                        {sendingReminderId === member.user_id ? "Sending..." : "🔔 Renew"}
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

            {/* Revenue Section */}
            <div style={{ marginBottom:20 }}>
              <h2 style={{ color:C.dark, margin:"0 0 12px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                💰 Revenue
              </h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {[
                  { label:"Today", value:formatRupees(revenue.today), color:C.primary },
                  { label:"This Month", value:formatRupees(revenue.thisMonth), color:C.success },
                  { label:"This Year", value:formatRupees(revenue.thisYear), color:C.warning },
                ].map(s => (
                  <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px" }}>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginBottom:5 }}>{s.label}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:"'Barlow Condensed',sans-serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Members Expiring Soon */}
            <div>
              <h2 style={{ color:C.dark, margin:"0 0 12px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>
                ⏰ Expiring Soon (Next 7 Days)
              </h2>

              {/* Reminder Message Alert */}
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
                        <div style={{
                          background: member.days_remaining <= 2 ? "#FEE2E2" : "#FEF3C7",
                          color: member.days_remaining <= 2 ? "#991B1B" : "#92400E",
                          padding:"6px 12px",
                          borderRadius:8,
                          fontWeight:700,
                          fontSize:13,
                          whiteSpace:"nowrap"
                        }}>
                          {member.days_remaining} day{member.days_remaining !== "1" ? "s" : ""}
                        </div>
                        <button
                          onClick={() => handleSendReminder(member)}
                          disabled={sendingReminderId === member.user_id}
                          style={{
                            background: sendingReminderId === member.user_id ? C.muted : C.primary,
                            border:"none",
                            color:"white",
                            padding:"6px 12px",
                            borderRadius:8,
                            fontWeight:700,
                            fontSize:12,
                            cursor: sendingReminderId === member.user_id ? "not-allowed" : "pointer",
                            whiteSpace:"nowrap",
                            transition:"all 0.2s",
                            opacity: sendingReminderId === member.user_id ? 0.6 : 1
                          }}
                          title="Send WhatsApp reminder"
                        >
                          {sendingReminderId === member.user_id ? "Sending..." : "📱 Remind"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ❌ MEMBERS WITH NO MEMBERSHIP - URGENT SECTION */}
            {noMembershipMembers > 0 && (
              <div style={{ marginTop:40, marginBottom:22, background:"linear-gradient(135deg,#FEF3C7,#FEE2E2)", border:"1.5px solid #FCD34D", borderRadius:12, padding:"16px", overflow:"hidden" }}>
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
                marginTop:40,
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

        {/* ── PAYMENTS TAB ── */}
        {activeTab === "payments" && (
          <>
            <div style={{ marginBottom:22 }}>
              <h1 style={{ color:C.dark, margin:"0 0 4px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800 }}>
                Payment Heatmap
              </h1>
              <p style={{ color:C.muted, margin:0, fontSize:14 }}>
                View payment activity across the year. Green dots show payment dates.
              </p>
            </div>

            {/* Year Filter */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:20 }}>
              <label style={{ display:"block", marginBottom:8, color:C.dark, fontWeight:700, fontSize:13 }}>Select Year:</label>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <button onClick={() => setSelectedYear(selectedYear - 1)} style={{
                  padding:"6px 12px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:6,
                  color:C.dark, cursor:"pointer", fontSize:13, fontWeight:600
                }}>← Prev</button>
                
                <span style={{ fontSize:16, fontWeight:800, color:C.primary, minWidth:60, textAlign:"center" }}>
                  {selectedYear}
                </span>
                
                <button onClick={() => setSelectedYear(selectedYear + 1)} style={{
                  padding:"6px 12px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:6,
                  color:C.dark, cursor:"pointer", fontSize:13, fontWeight:600
                }}>Next →</button>
              </div>
            </div>

            {/* 12 Month Heatmap */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14 }}>
              {monthNames.map((month, idx) => {
                const days = generateMonthCalendar(idx);
                return (
                  <div key={month} onClick={() => handleMonthClick(idx)} className="month-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:12, overflow:"hidden" }}>
                    <div style={{ textAlign:"center", marginBottom:10, fontWeight:700, color:C.dark, fontSize:13 }}>
                      {month} {selectedYear}
                    </div>
                    
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:4 }}>
                      {["S", "M", "T", "W", "T", "F", "S"].map(day => (
                        <div key={day} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C.muted, padding:"3px 0" }}>
                          {day}
                        </div>
                      ))}
                      {days.map((day, dayIdx) => (
                        <div key={dayIdx} style={{
                          width:"100%",
                          aspectRatio:"1",
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"center",
                          fontSize:11,
                          fontWeight:600,
                          borderRadius:6,
                          background: hasPayment(day, idx) ? "#DCFCE7" : C.surface,
                          color: hasPayment(day, idx) ? "#166534" : C.muted,
                          position:"relative"
                        }}>
                          {day}
                          {hasPayment(day, idx) && (
                            <div style={{
                              position:"absolute",
                              top:1,
                              right:1,
                              width:4,
                              height:4,
                              background:"#10B981",
                              borderRadius:"50%"
                            }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginTop:20, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:20, height:20, background:"#DCFCE7", borderRadius:6, position:"relative" }}>
                <div style={{ position:"absolute", top:1, right:1, width:4, height:4, background:"#10B981", borderRadius:"50%" }} />
              </div>
              <span style={{ fontSize:13, color:C.dark, fontWeight:500 }}>Payment received on this date</span>
            </div>
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

      {/* Payments Modal */}
      {showPaymentsModal && (
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
            maxWidth: 500,
            background: C.card,
            borderRadius: 14,
            padding: "24px",
            border: `1px solid ${C.border}`,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ color: C.dark, margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800 }}>
                Payments: {monthNames[selectedMonth]} {selectedYear}
              </h2>
              <button
                onClick={() => setShowPaymentsModal(false)}
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

            <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 16 }}>
              {loadingPayments ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontWeight: 600 }}>
                  Loading payments...
                </div>
              ) : monthPayments.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 14 }}>
                  No payments received in {monthNames[selectedMonth]} {selectedYear}.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {monthPayments.map((payment) => {
                    const date = new Date(payment.paidAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    });
                    const amount = (payment.amount / 100).toFixed(2);
                    return (
                      <div key={payment.id} style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: C.dark, fontSize: 15 }}>
                              {payment.userName}
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                              {payment.userPhone || "No Phone"} • {payment.userEmail}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, color: C.success, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif" }}>
                              ₹{amount}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                              {date}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 12, color: C.dark, fontWeight: 500 }}>
                            Plan: <strong style={{ color: C.primary }}>{payment.planName}</strong>
                          </div>
                          <button
                            onClick={() => downloadReceipt(payment)}
                            style={{
                              background: C.primary,
                              border: "none",
                              color: "white",
                              padding: "5px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              transition: "background 0.2s"
                            }}
                            onMouseEnter={e => e.target.style.background = "#2563EB"}
                            onMouseLeave={e => e.target.style.background = C.primary}
                          >
                            📄 Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPaymentsModal(false)}
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

      {/* Bottom Nav Bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.card,
        borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 6px", zIndex:50,
        boxShadow:"0 -1px 12px rgba(59,130,246,0.06)" }}>
        {[
          { id:"dashboard", icon:"ti-home", label:"Dashboard" },
          { id:"members", icon:"ti-user", label:"Members" },
          { id:"payments", icon:"ti-calendar", label:"Payments" },
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
