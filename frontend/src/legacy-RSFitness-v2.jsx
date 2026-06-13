import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── DATA ──────────────────────────────────────────────────────────────────────

const EXERCISES = {
  Push: ["Bench Press","Incline Bench","Overhead Press","Tricep Pushdown","Chest Fly","Dips","Lateral Raise"],
  Pull: ["Deadlift","Barbell Row","Pull-ups","Lat Pulldown","Cable Row","Face Pull","Bicep Curl"],
  Legs: ["Squat","Leg Press","Romanian Deadlift","Leg Curl","Leg Extension","Calf Raise","Hack Squat"],
  Core: ["Plank","Ab Wheel","Cable Crunch","Hanging Leg Raise","Russian Twist"],
};

const INDIAN_FOODS = {
  Breakfast: [
    { name:"Poha", cal:250, unit:"1 plate" },{ name:"Idli (2 pcs)", cal:140, unit:"2 pcs" },
    { name:"Dosa", cal:170, unit:"1 pc" },{ name:"Upma", cal:200, unit:"1 bowl" },
    { name:"Paratha (butter)", cal:300, unit:"1 pc" },{ name:"Bread + Egg", cal:250, unit:"2 slices" },
    { name:"Oats", cal:150, unit:"1 bowl" },{ name:"Banana", cal:90, unit:"1 pc" },
    { name:"Boiled Eggs", cal:78, unit:"1 egg" },{ name:"Milk (full fat)", cal:150, unit:"1 glass" },
    { name:"Aloo Paratha", cal:350, unit:"1 pc" },{ name:"Rava Idli", cal:160, unit:"2 pcs" },
  ],
  Lunch: [
    { name:"Dal Chawal", cal:450, unit:"1 plate" },{ name:"Rajma Chawal", cal:500, unit:"1 plate" },
    { name:"Chole Bhature", cal:650, unit:"1 plate" },{ name:"Chicken Curry + Rice", cal:550, unit:"1 plate" },
    { name:"Roti (wheat)", cal:70, unit:"1 roti" },{ name:"Paneer Sabzi", cal:280, unit:"1 bowl" },
    { name:"Sambar Rice", cal:380, unit:"1 plate" },{ name:"Biryani (veg)", cal:450, unit:"1 plate" },
    { name:"Biryani (chicken)", cal:550, unit:"1 plate" },{ name:"Dahi (curd)", cal:100, unit:"1 bowl" },
    { name:"Chapati + Dal", cal:350, unit:"2 chapati" },{ name:"Pav Bhaji", cal:500, unit:"1 plate" },
  ],
  Dinner: [
    { name:"Khichdi", cal:350, unit:"1 bowl" },{ name:"Sabzi + Roti", cal:400, unit:"2 rotis" },
    { name:"Egg Bhurji + Roti", cal:420, unit:"1 plate" },{ name:"Dal Tadka + Rice", cal:430, unit:"1 plate" },
    { name:"Palak Paneer + Roti", cal:380, unit:"1 plate" },{ name:"Moong Dal", cal:200, unit:"1 bowl" },
    { name:"Chicken Tikka", cal:250, unit:"100g" },{ name:"Grilled Fish", cal:200, unit:"100g" },
    { name:"Tandoori Roti", cal:120, unit:"2 pcs" },{ name:"Paneer Tikka", cal:300, unit:"100g" },
  ],
  Snacks: [
    { name:"Chana (roasted)", cal:200, unit:"1 cup" },{ name:"Peanuts", cal:285, unit:"50g" },
    { name:"Sprouts salad", cal:120, unit:"1 bowl" },{ name:"Samosa", cal:260, unit:"1 pc" },
    { name:"Bhel Puri", cal:180, unit:"1 plate" },{ name:"Protein Bar", cal:220, unit:"1 bar" },
    { name:"Greek Yogurt", cal:130, unit:"1 cup" },{ name:"Whey Protein", cal:120, unit:"1 scoop" },
    { name:"Almonds", cal:170, unit:"30g" },{ name:"Apple", cal:80, unit:"1 pc" },
    { name:"Makhana", cal:100, unit:"1 cup" },{ name:"Buttermilk (Chaas)", cal:60, unit:"1 glass" },
  ],
};

const EXERCISE_VIDEOS = {
  Push: [
    { name:"Bench Press",       id:"rT7DgCr-3pg", tips:"Keep shoulder blades pinched, feet flat, bar over lower chest." },
    { name:"Incline Bench",     id:"DbFgADa2PL8", tips:"Set bench 30–45°. Control the descent, press toward chin." },
    { name:"Overhead Press",    id:"2yjwXTZQDDI", tips:"Brace core, tuck elbows slightly, squeeze glutes at top." },
    { name:"Tricep Pushdown",   id:"2-LAMcpzODU", tips:"Keep elbows pinned to sides, full extension at bottom." },
    { name:"Chest Fly",         id:"eozdVDA78K0", tips:"Slight bend in elbows throughout, feel the stretch at bottom." },
    { name:"Dips",              id:"2z8JmcrW-As", tips:"Lean forward for chest, upright for triceps. Full ROM." },
    { name:"Lateral Raise",     id:"3VcKaXpzqRo", tips:"Lead with elbows, slight bend, stop at shoulder height." },
  ],
  Pull: [
    { name:"Deadlift",          id:"op9kVnSso6Q", tips:"Bar over mid-foot, neutral spine, drive floor away." },
    { name:"Barbell Row",       id:"FWJR5Ve8qqQ", tips:"Hinge to 45°, pull bar to lower chest, squeeze at top." },
    { name:"Pull-ups",          id:"eGo4IYlbE5g", tips:"Dead hang start, drive elbows to hips, chin over bar." },
    { name:"Lat Pulldown",      id:"CAwf7n6Luuc", tips:"Lean back slightly, pull to upper chest, control the rise." },
    { name:"Cable Row",         id:"GZbfZ033f74", tips:"Sit tall, pull to navel, squeeze shoulder blades together." },
    { name:"Face Pull",         id:"rep-qVOkqgk", tips:"Pull to forehead level, external rotation at end." },
    { name:"Bicep Curl",        id:"ykJmrZ5v0Oo", tips:"Keep elbows fixed, full extension, slow on the way down." },
  ],
  Legs: [
    { name:"Squat",             id:"ultWZbUMPL8", tips:"Chest up, knees track toes, break parallel if mobile." },
    { name:"Leg Press",         id:"IZxyjW7SKSA", tips:"Feet shoulder-width, don't lock knees at top, full depth." },
    { name:"Romanian Deadlift", id:"JCXUYuzwNrM", tips:"Soft knee bend, push hips back, bar stays close to legs." },
    { name:"Leg Curl",          id:"ELOCsoDSmrg", tips:"Control the return, full contraction at top." },
    { name:"Leg Extension",     id:"YyvSfVjQeL0", tips:"Pause at top, lower slowly, don't swing." },
    { name:"Calf Raise",        id:"gwLzBvsD8uU", tips:"Full range — heel below platform, pause at top." },
    { name:"Hack Squat",        id:"0tn5K9NlCfo", tips:"Feet high on plate for glutes, low for quads." },
  ],
  Core: [
    { name:"Plank",             id:"ASdvN_XEl_c", tips:"Neutral spine, squeeze glutes & abs, breathe steadily." },
    { name:"Ab Wheel",          id:"sxe-moya9S0", tips:"Start on knees, brace hard, don't let hips sag." },
    { name:"Cable Crunch",      id:"AV5Ph6mb_WY", tips:"Crunch with abs, not hip flexors. Elbows to thighs." },
    { name:"Hanging Leg Raise", id:"hdng3vmZz4E", tips:"Dead hang, raise legs with control, avoid swinging." },
    { name:"Russian Twist",     id:"JyUqwkVpsi8", tips:"Lean back 45°, rotate fully each side, feet off floor." },
  ],
};

const C = {
  primary:  "#3B82F6",
  bg:       "#F0F5FF",
  card:     "#FFFFFF",
  border:   "#DBEAFE",
  muted:    "#93A8C8",
  success:  "#22C55E",
  warning:  "#F59E0B",
  surface:  "#EEF4FF",
  dark:     "#1E3A5F",
  red:      "#EF4444",
};

const MEAL_EMOJI = { Breakfast:"🌅", Lunch:"☀️", Dinner:"🌙", Snacks:"🍎" };

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

const MEMBERSHIP_MONTHLY_FEE = 1000;
const MEMBERSHIP_PLANS = [
  { id:"monthly", label:"Monthly", months:1 },
  { id:"quarterly", label:"3 Months", months:3 },
  { id:"halfyearly", label:"6 Months", months:6 },
  { id:"yearly", label:"Yearly", months:12 },
];

function addMonthsToDate(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

function getSubscriptionDays(subscription) {
  if (!subscription?.expiryDate) return 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const expiry = new Date(subscription.expiryDate);
  expiry.setHours(23, 59, 59, 999);
  return Math.max(0, Math.ceil((expiry - todayStart) / 86400000));
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

// ─── TINY SHARED COMPONENTS ────────────────────────────────────────────────────

function Avatar({ name, size = 40 }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:C.primary,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:size*0.35, color:"#fff", flexShrink:0,
      fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}>
      {initials}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block", marginBottom:5, fontSize:11, color:C.muted,
        fontWeight:600, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>}
      {children}
    </div>
  );
}

function TextInput({ label, ...props }) {
  return (
    <Field label={label}>
      <input {...props} style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`,
        borderRadius:8, padding:"10px 14px", color:C.dark, fontSize:14, outline:"none",
        fontFamily:"'Barlow',sans-serif", boxSizing:"border-box", ...props.style }}
        onFocus={e => e.target.style.borderColor = C.primary}
        onBlur={e => e.target.style.borderColor = C.border} />
    </Field>
  );
}

function PrimaryBtn({ children, onClick, style: s }) {
  return (
    <button onClick={onClick} style={{ width:"100%", background:C.primary, border:"none",
      borderRadius:8, padding:"11px 20px", color:"#fff", fontSize:14, fontWeight:700,
      cursor:"pointer", letterSpacing:0.5, fontFamily:"'Barlow Condensed',sans-serif",
      textTransform:"uppercase", transition:"opacity 0.15s", ...s }}
      onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style: s }) {
  return (
    <button onClick={onClick} style={{ width:"100%", background:"transparent",
      border:`1px solid ${C.border}`, borderRadius:8, padding:"11px 20px", color:C.dark,
      fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
      textTransform:"uppercase", transition:"background 0.15s", ...s }}
      onMouseEnter={e=>e.currentTarget.style.background=C.surface}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      {children}
    </button>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(30,58,95,0.45)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card, borderRadius:16, padding:24,
        width:"100%", maxWidth:420, border:`1px solid ${C.border}`,
        boxShadow:"0 16px 48px rgba(59,130,246,0.15)", maxHeight:"90vh", overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif",
    fontSize:22, fontWeight:800, margin:"0 0 18px" }}>{children}</h2>;
}

function StatCard({ label, value, color, badge }) {
  return (
    <div style={{ background:C.card,
      border:`1px solid ${badge==="!" ? C.red : badge==="✓" ? C.success : C.border}`,
      borderRadius:12, padding:"12px 14px", position:"relative" }}>
      {badge && (
        <div style={{ position:"absolute", top:7, right:8, width:17, height:17, borderRadius:"50%",
          background:badge==="✓" ? C.success : C.red, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:10, color:"#fff", fontWeight:900 }}>
          {badge}
        </div>
      )}
      <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1,
        fontWeight:600, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:17, fontWeight:800, color:color||C.primary,
        fontFamily:"'Barlow Condensed',sans-serif" }}>{value}</div>
    </div>
  );
}

const authInputStyle = {
  width:"100%", background:"#EEF4FF", border:"1.5px solid #DBEAFE",
  borderRadius:9, padding:"13px 14px", color:"#1E3A5F", fontSize:"16px",
  outline:"none", fontFamily:"'Barlow',sans-serif", boxSizing:"border-box",
  transition:"border-color 0.2s", WebkitAppearance:"none",
};

function AuthInput({ label, style: extraStyle, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", marginBottom:5, fontSize:11, color:"#93A8C8",
        fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>
      <input {...props} style={{ ...authInputStyle, ...extraStyle }}
        onFocus={e => e.target.style.borderColor="#3B82F6"}
        onBlur={e => e.target.style.borderColor="#DBEAFE"}/>
    </div>
  );
}

// ─── AUTH ──────────────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"", otp:"" });
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [shownOtp, setShownOtp] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const getUsers = () => { try { return JSON.parse(localStorage.getItem("rs_users") || "{}"); } catch { return {}; } };
  const saveUser = u => {
    try { const us = getUsers(); us[u.email] = u; localStorage.setItem("rs_users", JSON.stringify(us)); } catch {}
  };

  const handleLogin = () => {
    setError("");
    const u = getUsers()[form.email.trim()];
    if (!u) return setError("No account with that email.");
    if (u.password !== form.password) return setError("Incorrect password.");
    onAuth(u);
  };

  const handleSignup = () => {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.phone.trim()) return setError("All fields required.");
    if (form.phone.replace(/\D/g,"").length < 10) return setError("Enter a valid phone number.");
    if (getUsers()[form.email.trim()]) return setError("Account already exists with this email.");
    const otp = generateOTP();
    setGeneratedOtp(otp); setShownOtp(otp);
    setPendingUser({ name:form.name.trim(), email:form.email.trim(), password:form.password, phone:form.phone.trim(), joinedAt:new Date().toISOString() });
    setMode("otp");
  };

  const handleVerify = () => {
    setError("");
    if (!pendingUser) return setError("Session expired. Please sign up again.");
    if (form.otp.trim() !== generatedOtp) return setError("Wrong OTP. Try again.");
    saveUser(pendingUser);
    onAuth(pendingUser);
  };

  const copyOtp = () => {
    setForm(f => ({ ...f, otp: shownOtp }));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #EEF4FF 0%, #DBEAFE 50%, #BFDBFE 100%)",
      padding:"24px 16px 40px", fontFamily:"'Barlow',sans-serif", overflowY:"auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&display=swap');
        *{box-sizing:border-box}
        input,textarea,select{font-size:16px !important;}
      `}</style>
      <div style={{ width:"100%", maxWidth:400, margin:"0 auto" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:8,
            background:"#fff", borderRadius:16, padding:"10px 20px",
            boxShadow:"0 4px 20px rgba(59,130,246,0.15)" }}>
            <div style={{ width:36, height:36, background:"#3B82F6", borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect x="2" y="10" width="4" height="4" rx="1" fill="#fff"/>
                <rect x="18" y="10" width="4" height="4" rx="1" fill="#fff"/>
                <rect x="5" y="8" width="2" height="8" rx="1" fill="#fff"/>
                <rect x="17" y="8" width="2" height="8" rx="1" fill="#fff"/>
                <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff"/>
              </svg>
            </div>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800,
              color:"#1E3A5F", letterSpacing:2 }}>RS FITNESS</span>
          </div>
          <p style={{ color:"#93A8C8", fontSize:13, margin:0, fontWeight:600, letterSpacing:0.5 }}>Track. Lift. Evolve.</p>
        </div>

        {/* Card */}
        <div style={{ background:"#fff", borderRadius:20, padding:"28px 28px 24px",
          boxShadow:"0 12px 40px rgba(59,130,246,0.14)", border:"1px solid #DBEAFE" }}>

          {mode === "otp" ? (
            <>
              {/* OTP screen header */}
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ width:52, height:52, background:"#EEF4FF", borderRadius:14,
                  display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:26 }}>📱</div>
                <h2 style={{ color:"#1E3A5F", margin:"0 0 6px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Verify your phone</h2>
                <p style={{ color:"#93A8C8", fontSize:13, margin:0 }}>We generated a demo OTP for {form.phone}</p>
              </div>

              {/* OTP Display Box - big and obvious */}
              {shownOtp && (
                <div style={{ background:"linear-gradient(135deg,#EEF4FF,#DBEAFE)", border:"2px solid #3B82F6",
                  borderRadius:14, padding:"18px 16px", marginBottom:20, textAlign:"center",
                  boxShadow:"0 4px 16px rgba(59,130,246,0.12)" }}>
                  <div style={{ fontSize:11, color:"#93A8C8", marginBottom:8, textTransform:"uppercase",
                    letterSpacing:1.5, fontWeight:700 }}>🔐 Your Demo OTP</div>
                  <div style={{ fontSize:42, fontWeight:800, color:"#1E3A5F", letterSpacing:12,
                    fontFamily:"'Barlow Condensed',sans-serif", marginBottom:12, lineHeight:1 }}>{shownOtp}</div>
                  <button onClick={copyOtp} style={{
                    background: copied ? "#22C55E" : "#3B82F6",
                    border:"none", borderRadius:8, padding:"8px 20px", color:"#fff",
                    fontSize:13, fontWeight:700, cursor:"pointer",
                    fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase",
                    letterSpacing:0.5, transition:"background 0.2s", width:"100%",
                  }}>
                    {copied ? "✓ Copied & filled below!" : "Tap to copy & auto-fill"}
                  </button>
                  <div style={{ fontSize:11, color:"#93A8C8", marginTop:8 }}>In production this is sent via SMS</div>
                </div>
              )}

              <AuthInput label="Enter 6-digit OTP" value={form.otp} onChange={set("otp")}
                placeholder="123456" maxLength={6} inputMode="numeric"
                style={{ ...authInputStyle, textAlign:"center", fontSize:"20px", fontWeight:700,
                  letterSpacing:8, fontFamily:"'Barlow Condensed',sans-serif" }}/>
              {error && <p style={{ color:"#EF4444", fontSize:13, margin:"-6px 0 14px" }}>{error}</p>}

              <button onClick={handleVerify} style={{
                width:"100%", background:"#3B82F6", border:"none", borderRadius:9,
                padding:"12px", color:"#fff", fontSize:15, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase",
                letterSpacing:0.5, marginBottom:10,
              }}>Verify &amp; Create Account</button>
              <button onClick={() => { setMode("signup"); setError(""); }} style={{
                width:"100%", background:"transparent", border:"1.5px solid #DBEAFE",
                borderRadius:9, padding:"11px", color:"#93A8C8", fontSize:14, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase",
              }}>← Back</button>
            </>

          ) : mode === "signup" ? (
            <>
              <h2 style={{ color:"#1E3A5F", margin:"0 0 20px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Create account</h2>
              <AuthInput label="Full name" value={form.name} onChange={set("name")} placeholder="Alex Johnson"/>
              <AuthInput label="Email" type="email" value={form.email} onChange={set("email")} placeholder="alex@email.com"/>
              <AuthInput label="Phone number" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210"/>
              <AuthInput label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••"/>
              {error && <p style={{ color:"#EF4444", fontSize:13, margin:"-6px 0 14px" }}>{error}</p>}
              <button onClick={handleSignup} style={{
                width:"100%", background:"#3B82F6", border:"none", borderRadius:9,
                padding:"12px", color:"#fff", fontSize:15, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
                textTransform:"uppercase", letterSpacing:0.5, marginBottom:16,
              }}>Send OTP &amp; Continue →</button>
              <p style={{ textAlign:"center", color:"#93A8C8", fontSize:13, margin:0 }}>
                Already have an account?{" "}
                <span onClick={() => { setMode("login"); setError(""); }}
                  style={{ color:"#3B82F6", cursor:"pointer", fontWeight:700 }}>Sign in</span>
              </p>
            </>

          ) : (
            <>
              <h2 style={{ color:"#1E3A5F", margin:"0 0 6px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Welcome back 👋</h2>
              <p style={{ color:"#93A8C8", fontSize:13, margin:"0 0 20px" }}>Sign in to continue your journey</p>
              <AuthInput label="Email" type="email" value={form.email} onChange={set("email")} placeholder="alex@email.com"/>
              <AuthInput label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••"/>
              {error && <p style={{ color:"#EF4444", fontSize:13, margin:"-6px 0 14px" }}>{error}</p>}
              <button onClick={handleLogin} style={{
                width:"100%", background:"#3B82F6", border:"none", borderRadius:9,
                padding:"12px", color:"#fff", fontSize:15, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
                textTransform:"uppercase", letterSpacing:0.5, marginBottom:16,
              }}>Sign in</button>
              <p style={{ textAlign:"center", color:"#93A8C8", fontSize:13, margin:0 }}>
                New to RS Fitness?{" "}
                <span onClick={() => { setMode("signup"); setError(""); }}
                  style={{ color:"#3B82F6", cursor:"pointer", fontWeight:700 }}>Create account</span>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign:"center", color:"#93A8C8", fontSize:12, marginTop:16 }}>
          🏋️ RS Fitness · Your personal gym companion
        </p>
      </div>
    </div>
  );
}

// ─── LOG EXERCISE MODAL ────────────────────────────────────────────────────────

function LogModal({ onClose, onSave, goal }) {
  const [cat, setCat] = useState("Push");
  const [exercise, setExercise] = useState(EXERCISES["Push"][0]);
  const [sets, setSets] = useState([{ weight:"", reps:"" }]);
  const [mode, setMode] = useState(goal || "bulking");
  const [note, setNote] = useState("");

  const addSet = () => setSets(s => [...s, { weight:"", reps:"" }]);
  const removeSet = i => setSets(s => s.filter((_,j) => j !== i));
  const updateSet = (i, k, v) => setSets(s => s.map((s2,j) => j===i ? { ...s2, [k]:v } : s2));

  const save = () => {
    const valid = sets.filter(s => s.weight && s.reps);
    if (!valid.length) return;
    const maxWeight = Math.max(...valid.map(s => parseFloat(s.weight)||0));
    onSave({ category:cat, exercise, sets:valid, mode, note, maxWeight, date:new Date().toISOString() });
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ color:C.dark, margin:"0 0 18px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:700 }}>Log Exercise</h3>

      <Field label="Category">
        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          {Object.keys(EXERCISES).map(catKey => (
            <button key={catKey} onClick={() => { setCat(catKey); setExercise(EXERCISES[catKey][0]); }}
              style={{ padding:"5px 13px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                background:cat===catKey ? C.primary : C.surface, color:cat===catKey ? "#fff" : C.muted,
                fontFamily:"'Barlow',sans-serif" }}>{catKey}</button>
          ))}
        </div>
      </Field>

      <Field label="Exercise">
        <select value={exercise} onChange={e => setExercise(e.target.value)}
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"10px 14px", color:C.dark, fontSize:14, outline:"none", fontFamily:"'Barlow',sans-serif" }}>
          {EXERCISES[cat].map(ex => <option key={ex}>{ex}</option>)}
        </select>
      </Field>

      <Field label="Goal">
        <div style={{ display:"flex", gap:8 }}>
          {["bulking","cutting"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex:1, padding:"8px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13,
              fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:1,
              border:`1px solid ${mode===m ? (m==="bulking" ? C.success : C.warning) : C.border}`,
              background:mode===m ? (m==="bulking" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)") : "transparent",
              color:mode===m ? (m==="bulking" ? C.success : C.warning) : C.muted,
            }}>{m==="bulking" ? "💪 Bulking" : "🔥 Cutting"}</button>
          ))}
        </div>
      </Field>

      <Field label="Sets">
        <div style={{ display:"grid", gridTemplateColumns:"24px 1fr 1fr 24px", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:11, color:C.muted, textAlign:"center" }}>#</span>
          <span style={{ fontSize:11, color:C.muted, textAlign:"center" }}>kg</span>
          <span style={{ fontSize:11, color:C.muted, textAlign:"center" }}>reps</span>
          <span/>
          {sets.map((s,i) => (
            <div key={i} style={{ display:"contents" }}>
              <span style={{ fontSize:13, color:C.muted, textAlign:"center" }}>{i+1}</span>
              <input type="number" value={s.weight} onChange={e => updateSet(i,"weight",e.target.value)} placeholder="0"
                style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6,
                  padding:"7px 10px", color:C.dark, fontSize:14, outline:"none", textAlign:"center", fontFamily:"'Barlow',sans-serif" }}/>
              <input type="number" value={s.reps} onChange={e => updateSet(i,"reps",e.target.value)} placeholder="0"
                style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6,
                  padding:"7px 10px", color:C.dark, fontSize:14, outline:"none", textAlign:"center", fontFamily:"'Barlow',sans-serif" }}/>
              <button onClick={() => removeSet(i)}
                style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:16, padding:0 }}>×</button>
            </div>
          ))}
        </div>
        <button onClick={addSet}
          style={{ background:"none", border:"none", color:C.primary, cursor:"pointer",
            fontSize:13, fontWeight:700, padding:"6px 0 0", fontFamily:"'Barlow',sans-serif" }}>
          + Add Set
        </button>
      </Field>

      <Field label="Note (optional)">
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="How did it feel?"
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"9px 14px", color:C.dark, fontSize:14, outline:"none", resize:"none",
            fontFamily:"'Barlow',sans-serif", boxSizing:"border-box" }}/>
      </Field>

      <div style={{ display:"flex", gap:10, marginTop:4 }}>
        <GhostBtn onClick={onClose} style={{ flex:1 }}>Cancel</GhostBtn>
        <PrimaryBtn onClick={save} style={{ flex:2 }}>Save</PrimaryBtn>
      </div>
    </Overlay>
  );
}

// ─── PROGRESS CHART ────────────────────────────────────────────────────────────

function ProgressChart({ logs, exercise }) {
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

function CalSetupModal({ onClose, onSave, goal, initial }) {
  const [form, setForm] = useState(initial || { height:"", weight:"", age:"", gender:"male", activity:"moderate" });
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }));

  const calcGoal = (p) => {
    const w=parseFloat(p.weight), h=parseFloat(p.height), a=parseInt(p.age);
    if (!w||!h||!a) return null;
    const bmr = p.gender==="male" ? 10*w+6.25*h-5*a+5 : 10*w+6.25*h-5*a-161;
    const acts = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 };
    const tdee = bmr*(acts[p.activity]||1.55);
    return Math.round(goal==="bulking" ? tdee+300 : tdee-400);
  };

  const preview = calcGoal(form);

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ color:C.dark, margin:"0 0 18px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:700 }}>🎯 Calorie Goal Setup</h3>
      {[{ label:"Height (cm)", key:"height", ph:"e.g. 175" },
        { label:"Weight (kg)",  key:"weight", ph:"e.g. 72" },
        { label:"Age",          key:"age",    ph:"e.g. 24" }].map(f => (
        <Field key={f.key} label={f.label}>
          <input type="number" value={form[f.key]} onChange={set(f.key)} placeholder={f.ph}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
              padding:"9px 14px", color:C.dark, fontSize:14, outline:"none", fontFamily:"'Barlow',sans-serif", boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor=C.primary}
            onBlur={e=>e.target.style.borderColor=C.border}/>
        </Field>
      ))}
      <Field label="Gender">
        <div style={{ display:"flex", gap:8 }}>
          {["male","female"].map(g => (
            <button key={g} onClick={() => setForm(f=>({...f,gender:g}))} style={{
              flex:1, padding:"8px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13,
              fontFamily:"'Barlow',sans-serif", textTransform:"capitalize",
              border:`1px solid ${form.gender===g ? C.primary : C.border}`,
              background:form.gender===g ? "rgba(59,130,246,0.1)" : "transparent",
              color:form.gender===g ? C.primary : C.muted,
            }}>{g}</button>
          ))}
        </div>
      </Field>
      <Field label="Activity Level">
        <select value={form.activity} onChange={set("activity")}
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"9px 14px", color:C.dark, fontSize:13, outline:"none", fontFamily:"'Barlow',sans-serif" }}>
          <option value="sedentary">Sedentary (desk job, little/no exercise)</option>
          <option value="light">Light (1–2 days/week)</option>
          <option value="moderate">Moderate (3–5 days/week)</option>
          <option value="active">Active (6–7 days/week)</option>
          <option value="very_active">Very Active (2× per day)</option>
        </select>
      </Field>
      {preview && (
        <div style={{ background:C.surface, borderRadius:10, padding:"12px 16px", marginBottom:16, textAlign:"center" }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>
            Your estimated goal ({goal})
          </div>
          <div style={{ fontSize:30, fontWeight:800, color:C.primary, fontFamily:"'Barlow Condensed',sans-serif" }}>
            {preview} <span style={{ fontSize:14, color:C.muted, fontWeight:500 }}>kcal/day</span>
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
            {goal==="bulking" ? "TDEE + 300 kcal surplus" : "TDEE − 400 kcal deficit"}
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:10 }}>
        <GhostBtn onClick={onClose} style={{ flex:1 }}>Cancel</GhostBtn>
        <PrimaryBtn onClick={() => { onSave(form); onClose(); }} style={{ flex:2 }}>Save Goal</PrimaryBtn>
      </div>
    </Overlay>
  );
}

// ─── FOOD PICKER MODAL ─────────────────────────────────────────────────────────

function FoodPickerModal({ meal, onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const allFoods = Object.entries(INDIAN_FOODS).flatMap(([cat, items]) => items.map(i => ({ ...i, cat })));
  const filtered = search.trim()
    ? allFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(30,58,95,0.45)",
      display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:300 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card, borderRadius:"20px 20px 0 0",
        padding:"20px 20px 32px", width:"100%", maxWidth:680, maxHeight:"78vh",
        overflowY:"auto", border:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ fontWeight:800, fontSize:18, color:C.dark, fontFamily:"'Barlow Condensed',sans-serif" }}>
            🇮🇳 Add to {meal}
          </span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer", padding:0 }}>×</button>
        </div>

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search food..."
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"9px 14px", color:C.dark, fontSize:14, outline:"none", fontFamily:"'Barlow',sans-serif",
            boxSizing:"border-box", marginBottom:16 }}
          onFocus={e=>e.target.style.borderColor=C.primary}
          onBlur={e=>e.target.style.borderColor=C.border}/>

        {(filtered || Object.entries(INDIAN_FOODS)).map((entry, idx) => {
          const isSearch = !!filtered;
          const cat = isSearch ? null : entry[0];
          const items = isSearch ? filtered : entry[1];
          return (
            <div key={isSearch ? idx : cat} style={{ marginBottom:isSearch?0:16 }}>
              {!isSearch && <div style={{ fontSize:12, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>{cat}</div>}
              {(isSearch ? filtered : items).map(item => (
                <div key={item.name} onClick={() => { onAdd({ ...item, id:Date.now()+Math.random() }); onClose(); }}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 12px", background:C.surface, borderRadius:9, marginBottom:6, cursor:"pointer", transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.border}
                  onMouseLeave={e=>e.currentTarget.style.background=C.surface}>
                  <div>
                    <span style={{ color:C.dark, fontWeight:600, fontSize:14 }}>{item.name}</span>
                    <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>{item.unit}</span>
                  </div>
                  <span style={{ color:C.primary, fontWeight:800, fontSize:14, fontFamily:"'Barlow Condensed',sans-serif" }}>{item.cal} kcal</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

function SubscriptionPanel({ subscription, transactions, onPay }) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);

  const buildContext = () => {
    const parts = [];
    parts.push(`User: ${user.name}`);
    parts.push(`Fitness goal: ${goal === "bulking" ? "Bulking — muscle gain" : "Cutting — fat loss"}`);
    if (calProfile) {
      parts.push(`Body: ${calProfile.height}cm tall, ${calProfile.weight}kg, ${calProfile.age} years old, ${calProfile.gender}`);
      parts.push(`Activity: ${calProfile.activity}`);
      if (calGoal) parts.push(`Daily calorie target: ${calGoal} kcal`);
    }
    if (todaySteps > 0) parts.push(`Steps today: ${todaySteps.toLocaleString()} steps = ${calBurned} kcal burned`);
    if (totalCal > 0) parts.push(`Calories eaten today: ${totalCal} kcal`);
    const recentExs = [...new Set(logs.slice(-10).map(l => l.exercise))];
    if (recentExs.length) parts.push(`Recent exercises logged: ${recentExs.join(", ")}`);
    return parts.join("\n");
  };

  const makeDemoChatGPTResponse = q => {
    const proteinTip = goal === "bulking"
      ? "Add paneer, eggs, chicken, dal, curd, soy chunks, or whey so each meal has a clear protein source."
      : "Keep protein high with eggs, dal, curd, sprouts, chicken, paneer, or soy chunks while controlling oil and sugar.";
    return `Here is a ChatGPT-style diet answer for you:\n\n• Goal: ${goal === "bulking" ? "Muscle gain" : "Fat loss"}\n• Today's calories logged: ${totalCal || 0} kcal${calGoal ? ` / target ${calGoal} kcal` : ""}\n• Steps today: ${todaySteps || 0}\n\nRecommended approach:\n1. ${proteinTip}\n2. Build meals around Indian staples like roti, rice, dal, sabzi, curd, eggs, paneer, chicken, sprouts, poha, oats, and fruit.\n3. Keep one simple pre-workout option: banana + black coffee, poha, oats, or curd with fruit.\n4. After training, take a protein-heavy meal within 1-2 hours.\n\nYour question: ${q}\n\nFor a published app, connect this screen to an OpenAI backend endpoint so replies come from ChatGPT securely.`;
  };

  const askChatGPT = async () => {
    const q = (selectedQuick || aiPrompt).trim();
    if (!q) return;
    const nextUserMessage = { role:"user", content:q };
    setAiMessages(prev => [...prev, nextUserMessage]);
    setAiLoading(true); setAiError(""); setAiResponse("");
    try {
      const apiKey = localStorage.getItem("rs_openai_api_key") || import.meta.env?.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        const answer = makeDemoChatGPTResponse(q);
        setAiMessages(prev => [...prev, { role:"assistant", content:answer }]);
        setAiResponse(answer);
        setAiPrompt("");
        setSelectedQuick(null);
        return;
      }
      const transcript = [...aiMessages, nextUserMessage].map(m => `${m.role === "user" ? "User" : "ChatGPT"}: ${m.content}`).join("\n\n");
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-5-mini",
          max_output_tokens: 900,
          instructions: `You are ChatGPT acting as a professional Indian fitness and diet coach at RS Fitness gym. Give specific, practical, motivating advice. Use bullet points and clear sections. Always recommend Indian foods. Keep it concise. User data:\n\n${buildContext()}`,
          input: transcript,
        }),
      });
      const data = await res.json();
      const answer = data.output_text || data.output?.flatMap(o => o.content || []).map(c => c.text).filter(Boolean).join("\n") || "";
      if (answer) {
        setAiMessages(prev => [...prev, { role:"assistant", content:answer }]);
        setAiResponse(answer);
        setAiPrompt("");
        setSelectedQuick(null);
      } else {
        setAiError(data.error?.message || "No response. Please try again.");
      }
    } catch { setAiError("Connection failed. Please try again."); }
    finally { setAiLoading(false); }
  };

  const quickPrompts = [
    { icon:"🍽️", label:"Full day meal plan",    text:"Give me a full day Indian meal plan based on my calorie goal and fitness goal" },
    { icon:"💪", label:"Pre-workout food",       text:"What should I eat 1 hour before my workout for maximum energy and performance?" },
    { icon:"🥗", label:"High protein Indian diet", text:"Suggest a high protein Indian diet plan suited to my body stats and goal" },
    { icon:"⚖️", label:"Meal timing guide",      text:"How many meals per day should I have and when should I eat them for my goal?" },
    { icon:"🚫", label:"Foods to avoid",          text:"Which foods should I completely avoid or limit for my fitness goal?" },
    { icon:"🌙", label:"Post-workout nutrition",  text:"What should I eat after my workout to maximize recovery and results?" },
  ];

  const resetChat = () => { setAiResponse(""); setAiPrompt(""); setSelectedQuick(null); setAiError(""); setAiMessages([]); };
  const activeQ = selectedQuick || aiPrompt;

  return (
    <div style={{ marginTop:28 }}>

      {/* Header banner */}
      <div style={{ background:"linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)", borderRadius:16,
        padding:"18px 20px", marginBottom:18, position:"relative", overflow:"hidden" }}>
        {/* decorative circles */}
        <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%",
          background:"rgba(255,255,255,0.08)" }}/>
        <div style={{ position:"absolute", bottom:-30, right:40, width:100, height:100, borderRadius:"50%",
          background:"rgba(255,255,255,0.05)" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:12, position:"relative" }}>
          <div style={{ width:44, height:44, background:"rgba(255,255,255,0.2)", borderRadius:12,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0,
            backdropFilter:"blur(10px)" }}>🤖</div>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800,
              color:"#fff", letterSpacing:0.5 }}>AI Diet Advisor</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:1 }}>
              Powered by ChatGPT · Unlimited follow-up questions
            </div>
          </div>
        </div>

        {/* Stats row */}
        {calProfile && (
          <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
            {[
              { label:calProfile.weight+"kg",  sub:"weight" },
              { label:calGoal+" kcal",         sub:"daily goal" },
              { label:goal,                    sub:"mode" },
              ...(todaySteps > 0 ? [{ label:calBurned+" kcal", sub:"burned today" }] : []),
            ].map(s => (
              <div key={s.sub} style={{ background:"rgba(255,255,255,0.15)", borderRadius:8,
                padding:"5px 10px", backdropFilter:"blur(4px)" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'Barlow Condensed',sans-serif" }}>{s.label}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:0.5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}
        {!calProfile && (
          <div style={{ marginTop:10, fontSize:12, color:"rgba(255,255,255,0.75)" }}>
            ⚠ Set up your calorie profile in the Body tab for personalized advice
          </div>
        )}
      </div>

      {/* Quick prompts grid */}
      {aiMessages.length === 0 && (
        <>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase",
            letterSpacing:1, marginBottom:10 }}>Quick questions</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
            {quickPrompts.map((qp, i) => (
              <button key={i} onClick={() => { setSelectedQuick(qp.text); setAiPrompt(""); setAiError(""); }}
                style={{ background:selectedQuick===qp.text ? "rgba(59,130,246,0.12)" : C.card,
                  border:`1.5px solid ${selectedQuick===qp.text ? C.primary : C.border}`,
                  borderRadius:12, padding:"11px 12px", textAlign:"left", cursor:"pointer",
                  transition:"all 0.15s", display:"flex", flexDirection:"column", gap:4 }}
                onMouseEnter={e => { if (selectedQuick!==qp.text) e.currentTarget.style.background=C.surface; }}
                onMouseLeave={e => { if (selectedQuick!==qp.text) e.currentTarget.style.background=C.card; }}>
                <span style={{ fontSize:18 }}>{qp.icon}</span>
                <span style={{ fontSize:12, fontWeight:600, color:selectedQuick===qp.text?C.primary:C.dark,
                  lineHeight:1.3, fontFamily:"'Barlow',sans-serif" }}>{qp.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Custom input */}
      {true && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase",
            letterSpacing:1, marginBottom:8 }}>Or type your own question</div>
          <textarea value={aiPrompt}
            onChange={e => { setAiPrompt(e.target.value); setSelectedQuick(null); setAiError(""); }}
            placeholder="e.g. What should I eat on rest days to stay on track with my goal?"
            rows={3}
            style={{ width:"100%", background:C.card, border:`1.5px solid ${C.border}`,
              borderRadius:12, padding:"12px 14px", color:C.dark, fontSize:"16px",
              outline:"none", resize:"none", fontFamily:"'Barlow',sans-serif",
              boxSizing:"border-box", lineHeight:1.6 }}
            onFocus={e => e.target.style.borderColor=C.primary}
            onBlur={e => e.target.style.borderColor=C.border}/>
        </div>
      )}

      {/* CTA button */}
      {true && (
        <button onClick={askChatGPT} disabled={aiLoading || !activeQ.trim()}
          style={{ width:"100%", border:"none", borderRadius:12, padding:"14px",
            color:"#fff", fontSize:15, fontWeight:700, letterSpacing:0.5, marginBottom:14,
            fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase",
            cursor:aiLoading||!activeQ.trim() ? "not-allowed" : "pointer",
            background:aiLoading||!activeQ.trim()
              ? C.muted
              : "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            boxShadow:aiLoading||!activeQ.trim() ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
            transition:"all 0.2s" }}>
          {aiLoading ? "🤔 ChatGPT is analysing..." : "✨ Ask ChatGPT"}
        </button>
      )}

      {/* Loading animation */}
      {aiLoading && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px",
          textAlign:"center", marginBottom:14 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🧠</div>
          <div style={{ color:C.dark, fontWeight:600, fontSize:14, marginBottom:4 }}>ChatGPT is thinking...</div>
          <div style={{ color:C.muted, fontSize:12 }}>Building your personalised plan based on your data</div>
        </div>
      )}

      {/* Error */}
      {aiError && (
        <div style={{ background:"rgba(239,68,68,0.07)", border:`1px solid ${C.red}`,
          borderRadius:12, padding:"12px 16px", marginBottom:14,
          display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <span style={{ color:C.red, fontSize:13 }}>{aiError}</span>
        </div>
      )}

      {/* Response card */}
      {aiResponse && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
          {/* Response header */}
          <div style={{ background:"linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:30, height:30, background:"rgba(255,255,255,0.2)", borderRadius:8,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:"#fff" }}>
                  Your Personalised Plan
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>by ChatGPT · RS Fitness</div>
              </div>
            </div>
            <button onClick={resetChat}
              style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8,
                padding:"6px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>
              New ↺
            </button>
          </div>
          {/* Response content */}
          <div style={{ padding:"18px", color:C.dark, fontSize:14, lineHeight:1.9,
            whiteSpace:"pre-wrap", fontFamily:"'Barlow',sans-serif" }}>
            {aiResponse}
          </div>
          {/* Footer */}
          <div style={{ padding:"0 18px 16px", display:"flex", gap:8 }}>
            <button onClick={resetChat}
              style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
                padding:"10px", color:C.dark, fontSize:13, fontWeight:600, cursor:"pointer",
                fontFamily:"'Barlow',sans-serif" }}>
              Clear chat
            </button>
            <button onClick={resetChat}
              style={{ flex:1, background:"linear-gradient(135deg,#3B82F6,#6366F1)", border:"none",
                borderRadius:10, padding:"10px", color:"#fff", fontSize:13, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>
              New topic ↻
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

function SubscriptionPanel({ subscription, transactions, onPay }) {
  const [selectedPlan, setSelectedPlan] = useState(MEMBERSHIP_PLANS[0].id);
  const [gymName, setGymName] = useState(subscription?.gymName || "RS Fitness Gym");
  const [showPlans, setShowPlans] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const plan = MEMBERSHIP_PLANS.find(p => p.id === selectedPlan) || MEMBERSHIP_PLANS[0];
  const amount = plan.months * MEMBERSHIP_MONTHLY_FEE;
  const daysLeft = getSubscriptionDays(subscription);
  const isActive = daysLeft > 0;

  const startCheckout = selected => {
    if (isActive) return;
    setSelectedPlan(selected.id);
    setShowCheckout(true);
  };

  const completeCheckout = () => {
    if (isActive) return;
    onPay(plan, gymName.trim() || "RS Fitness Gym");
    setShowCheckout(false);
    setShowPlans(false);
  };

  return (
    <div style={{ marginBottom:14 }}>
      <button onClick={() => { setShowPlans(v => !v); setShowCheckout(false); }}
        style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
          padding:"16px 18px", color:C.dark, cursor:"pointer", fontFamily:"'Barlow',sans-serif",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:14 }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:21, fontWeight:800 }}>Subscription</div>
          <div style={{ color:C.muted, fontSize:13, marginTop:3 }}>
            {isActive ? `${daysLeft} day${daysLeft===1?"":"s"} left in your gym membership` : "View membership plans"}
          </div>
        </div>
        <span style={{ color:C.primary, fontSize:20, fontWeight:800 }}>{showPlans ? "−" : "+"}</span>
      </button>

      {showPlans && isActive && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:800, marginBottom:6 }}>
            {daysLeft} day{daysLeft===1?"":"s"} left
          </div>
          <div style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>
            Repayment is locked until your current {subscription.planLabel} membership ends.
          </div>
        </div>
      )}

      {showPlans && !isActive && showCheckout && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px" }}>
          <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, marginBottom:4 }}>Sample checkout</div>
          <div style={{ color:C.muted, fontSize:13, marginBottom:16 }}>Demo payment screen for preview only</div>

          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px", marginBottom:14 }}>
            {[
              ["Gym", gymName.trim() || "RS Fitness Gym"],
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

          <PrimaryBtn onClick={completeCheckout}>Complete demo payment</PrimaryBtn>
          <GhostBtn onClick={() => setShowCheckout(false)} style={{ marginTop:10 }}>Back to plans</GhostBtn>
        </div>
      )}

      {showPlans && !isActive && !showCheckout && (
        <div>
          <TextInput label="Gym name" value={gymName} onChange={e => setGymName(e.target.value)} placeholder="Enter gym name"/>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))", gap:14 }}>
            {MEMBERSHIP_PLANS.map(p => {
              const selected = selectedPlan === p.id;
              const tone = p.id==="monthly" ? "#22D3EE" : p.id==="quarterly" ? "#3B82F6" : p.id==="halfyearly" ? "#7C3AED" : "#A855F7";
              return (
                <div key={p.id} style={{ position:"relative", background:"#fff", border:`1px solid ${selected ? tone : C.border}`,
                  borderRadius:16, padding:"44px 14px 16px", minHeight:210, overflow:"hidden",
                  boxShadow:selected ? `0 18px 34px ${tone}40` : "0 10px 28px rgba(30,58,95,0.10)" }}>
                  <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
                    width:"78%", height:78, background:tone, borderRadius:"0 0 46px 46px",
                    boxShadow:`0 18px 28px ${tone}70` }}/>
                  <div style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
                    color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontSize:16,
                    fontWeight:800, textTransform:"uppercase", letterSpacing:1 }}>
                    {p.label}
                  </div>
                  <div style={{ position:"relative", textAlign:"center", paddingTop:12 }}>
                    <div style={{ color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontSize:30, fontWeight:800, marginBottom:28 }}>
                      Rs {p.months * MEMBERSHIP_MONTHLY_FEE}
                    </div>
                    <div style={{ color:C.dark, fontSize:13, fontWeight:700, marginBottom:4 }}>
                      {p.months} month{p.months===1?"":"s"}
                    </div>
                    <div style={{ color:C.muted, fontSize:12, marginBottom:18 }}>Gym membership</div>
                    <button onClick={() => startCheckout(p)}
                      style={{ width:"100%", background:selected ? tone : "#CBD5E1", border:"none",
                        borderRadius:24, padding:"10px", color:"#fff", cursor:"pointer",
                        fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:800,
                        textTransform:"uppercase" }}>
                      Activate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
                <div key={tx.receiptId} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 13px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:7 }}>
                    <div style={{ color:C.dark, fontWeight:800, fontSize:14 }}>{tx.planLabel}</div>
                    <div style={{ color:C.primary, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>Rs {tx.amount}</div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, color:C.muted, fontSize:12, lineHeight:1.4 }}>
                    <div>Receipt: <strong style={{ color:C.dark }}>{tx.receiptId}</strong></div>
                    <div>Paid: {formatDate(tx.paidAt)}</div>
                    <div>Gym: {tx.gymName}</div>
                    <div>Duration: {tx.months} month{tx.months===1?"":"s"}</div>
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

function AdminDashboard() {
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

function UserAdminDashboard({ user, subscription, transactions, logs, weekLogs, uniqueExs, totalVol, totalCal, calGoal, todaySteps }) {
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
            { label:"Steps", value:todaySteps },
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

function App({ user, onLogout }) {
  const email = user?.email || "";
  const LS = key => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { localStorage.removeItem(key); return null; } };
  const saveLS = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const [tab, setTab] = useState("dashboard");
  const [goal, setGoal] = useState(LS(`rs_goal_${user.email}`) || "bulking");
  const [subscription, setSubscription] = useState(LS(`rs_subscription_${user.email}`));
  const [subscriptionTransactions, setSubscriptionTransactions] = useState(LS(`rs_subscription_tx_${user.email}`) || []);
  const subscriptionDaysLeft = getSubscriptionDays(subscription);
  const subscriptionActive = subscriptionDaysLeft > 0;

  const saveSubscriptionPayment = (plan, gymName) => {
    if (subscriptionActive) return;
    const now = new Date();
    const expiryDate = addMonthsToDate(now, plan.months);
    const receiptId = `RS-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const next = {
      gymName,
      planId: plan.id,
      planLabel: plan.label,
      months: plan.months,
      amount: plan.months * MEMBERSHIP_MONTHLY_FEE,
      receiptId,
      paidAt: now.toISOString(),
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
    };
    const receipt = { ...next, status:"Paid" };
    const updatedTransactions = [receipt, ...subscriptionTransactions];
    setSubscription(next);
    setSubscriptionTransactions(updatedTransactions);
    saveLS(`rs_subscription_${user.email}`, next);
    saveLS(`rs_subscription_tx_${user.email}`, updatedTransactions);
  };

  // Exercise logs
  const [logs, setLogs] = useState(LS(`rs_logs_${user.email}`) || []);
  const saveLogs = v => { setLogs(v); saveLS(`rs_logs_${user.email}`, v); };

  // Weight logs
  const [wLogs, setWLogs] = useState(LS(`rs_wlogs_${user.email}`) || []);
  const saveWLogs = v => { setWLogs(v); saveLS(`rs_wlogs_${user.email}`, v); };
  const [wInput, setWInput] = useState("");
  const [wNote, setWNote] = useState("");

  // Calorie logs (keyed by date string)
  const [today, setToday] = useState(new Date().toDateString());
  useEffect(() => {
    const interval = setInterval(() => {
      const newDay = new Date().toDateString();
      if (newDay !== today) setToday(newDay);
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, [today]);
  const [selectedCalDate, setSelectedCalDate] = useState(today);
  const [calAllLogs, setCalAllLogs] = useState(LS(`rs_cal_${user.email}`) || {});
  const calLogs = calAllLogs[selectedCalDate] || { Breakfast:[], Lunch:[], Dinner:[], Snacks:[] };
  const saveCalDay = updated => {
    const all = { ...calAllLogs, [selectedCalDate]: updated };
    setCalAllLogs(all);
    saveLS(`rs_cal_${user.email}`, all);
  };

  const [calProfile, setCalProfile] = useState(LS(`rs_calprofile_${user.email}`));
  const [showCalSetup, setShowCalSetup] = useState(false);
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [activeMeal, setActiveMeal] = useState("Breakfast");
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");

  // Misc UI
  const [showLog, setShowLog] = useState(false);
  const [selectedEx, setSelectedEx] = useState("Bench Press");
  const [filterCat, setFilterCat] = useState("All");
  const [workoutCat, setWorkoutCat] = useState("Push");
  const [workoutEx, setWorkoutEx] = useState(EXERCISE_VIDEOS["Push"][0]);

  // Step tracker
  const [stepLogs, setStepLogs] = useState(LS(`rs_steps_${email}`) || {});
  const todaySteps = stepLogs[today] || 0;
  const stepWeight = calProfile ? parseFloat(calProfile.weight) || 70 : 70;
  const calBurned = Math.round(todaySteps * 0.04 * (stepWeight / 70));
  const [stepInput, setStepInput] = useState("");
  const [editingSteps, setEditingSteps] = useState(false);
  const saveSteps = steps => {
    const updated = { ...stepLogs, [today]: steps };
    setStepLogs(updated);
    saveLS(`rs_steps_${email}`, updated);
  };

  const toggleGoal = () => {
    const next = goal==="bulking" ? "cutting" : "bulking";
    setGoal(next); saveLS(`rs_goal_${user.email}`, next);
  };

  // Calorie helpers
  const calcCalGoal = (p, g) => {
    if (!p) return null;
    const w=parseFloat(p.weight), h=parseFloat(p.height), a=parseInt(p.age);
    if (!w||!h||!a) return null;
    const bmr = p.gender==="male" ? 10*w+6.25*h-5*a+5 : 10*w+6.25*h-5*a-161;
    const acts = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 };
    const tdee = bmr*(acts[p.activity]||1.55);
    return Math.round((g||goal)==="bulking" ? tdee+300 : tdee-400);
  };
  const calGoal = calcCalGoal(calProfile, goal);
  const totalCal = Object.values(calLogs).flat().reduce((a,e) => a+e.cal, 0);
  const effectiveGoal = calGoal ? calGoal + calBurned : null;
  const remaining = effectiveGoal ? effectiveGoal - totalCal : null;
  const calPct = effectiveGoal ? Math.min((totalCal/effectiveGoal)*100, 100) : 0;
  const calOver = effectiveGoal && totalCal > effectiveGoal;

  const addFood = (meal, item) => saveCalDay({ ...calLogs, [meal]: [...(calLogs[meal]||[]), item] });
  const removeFood = (meal, id) => saveCalDay({ ...calLogs, [meal]: calLogs[meal].filter(e=>e.id!==id) });

  // Derived
  const todayLogs = logs.filter(l => new Date(l.date).toDateString()===today);
  const weekLogs  = logs.filter(l => (Date.now()-new Date(l.date)) < 7*86400000);
  const uniqueExs = [...new Set(logs.map(l=>l.exercise))];
  const totalVol  = logs.reduce((a,l) => a+l.sets.reduce((b,s) => b+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0), 0);

  const goalBg   = goal==="bulking" ? "rgba(34,197,94,0.13)"  : "rgba(245,158,11,0.13)";
  const goalBdr  = goal==="bulking" ? C.success : C.warning;
  const goalClr  = goal==="bulking" ? C.success : C.warning;
  const hoverBg  = goal==="bulking" ? "#DCFCE7" : "#FDEBD0";

  const [statsSubTab, setStatsSubTab] = useState("history");
  const [bodySubTab, setBodySubTab] = useState("weight");

  const navItems = [
    { id:"dashboard", icon:"ti-home",      label:"Home" },
    { id:"stats",     icon:"ti-chart-bar", label:"Stats" },
    { id:"workouts",  icon:"ti-video",     label:"Workouts" },
    { id:"admin",     icon:"ti-dashboard", label:"Admin" },
    { id:"body",      icon:"ti-heart-rate-monitor", label:"Body" },
    { id:"profile",   icon:"ti-user",      label:"Profile" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Barlow',sans-serif", paddingBottom:84 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&display=swap');
        *{box-sizing:border-box}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#BFDBFE;border-radius:4px}
        select option{background:#fff;color:#1E3A5F}
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
        <button onClick={toggleGoal} style={{
          background:goalBg, border:`1px solid ${goalBdr}`, borderRadius:20,
          padding:"5px 13px", cursor:"pointer", color:goalClr,
          fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1,
          fontFamily:"'Barlow Condensed',sans-serif", transition:"all 0.2s",
        }}>{goal==="bulking" ? "💪 Bulking" : "🔥 Cutting"}</button>
      </div>

      {/* Content */}
      <div style={{ maxWidth:680, margin:"0 auto", padding:"20px 16px" }}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <>
            <div style={{ marginBottom:22 }}>
              <h1 style={{ color:C.dark, margin:"0 0 4px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800 }}>
                Hey, {user.name.split(" ")[0]} 👋
              </h1>
              <p style={{ color:C.muted, margin:0, fontSize:14 }}>
                {todayLogs.length===0 ? "No workouts logged today. Let's go!" : `${todayLogs.length} exercise${todayLogs.length>1?"s":""} logged today. Keep it up!`}
              </p>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"15px 16px",
              marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
              <div>
                <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1, fontWeight:700, marginBottom:4 }}>Gym membership</div>
                <div style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:21, fontWeight:800 }}>
                  {subscriptionActive ? `${subscriptionDaysLeft} day${subscriptionDaysLeft===1?"":"s"} left` : "No active membership"}
                </div>
                <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>
                  {subscriptionActive ? "Manage your subscription from Profile" : "Activate your gym membership from Profile"}
                </div>
              </div>
              <button onClick={() => setTab("profile")}
                style={{ background:C.primary, border:"none", borderRadius:8, padding:"9px 13px",
                  color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer",
                  fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", flexShrink:0 }}>
                Manage
              </button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
              {[
                { label:"Today",       value:todayLogs.length,               unit:"logged" },
                { label:"This week",   value:weekLogs.length,                unit:"sessions" },
                { label:"Total vol.",  value:`${(totalVol/1000).toFixed(1)}t`, unit:"lifted" },
              ].map(s => (
                <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px" }}>
                  <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginBottom:5 }}>{s.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:C.primary, fontFamily:"'Barlow Condensed',sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{s.unit}</div>
                </div>
              ))}
            </div>

            {/* Calorie mini-summary */}
            {calGoal && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontWeight:700, color:C.dark, fontSize:14 }}>Calories today</span>
                  <span style={{ fontSize:13, color:calOver?C.red:C.success, fontWeight:700 }}>
                    {calOver ? `${totalCal - effectiveGoal} over` : `${remaining} left`}
                  </span>
                </div>
                <div style={{ height:8, background:C.surface, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${calPct}%`, background:calOver?C.red:(goal==="bulking"?C.success:C.warning), borderRadius:99, transition:"width 0.4s" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:12, color:C.muted }}>
                  <span>{totalCal} eaten{calBurned>0?` · ${calBurned} burned`:""}</span>
                  <span>Budget: {effectiveGoal} kcal{calBurned>0?` (+${calBurned})`:""}</span>
                </div>
              </div>
            )}

            <PrimaryBtn onClick={() => setShowLog(true)} style={{ marginBottom:20, padding:"13px" }}>+ Log Exercise</PrimaryBtn>

            {todayLogs.length>0 && (
              <>
                <h2 style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, margin:"0 0 12px" }}>Today's Workout</h2>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {todayLogs.map((l,i) => (
                    <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 15px", display:"flex", alignItems:"center", gap:13 }}>
                      <div style={{ width:40, height:40, background:`${C.primary}18`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>
                        {l.category==="Push"?"🫷":l.category==="Pull"?"🫸":l.category==="Legs"?"🦵":"🔥"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ color:C.dark, fontWeight:600, fontSize:15 }}>{l.exercise}</div>
                        <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{l.sets.length} sets · Max {l.maxWeight} kg{l.note?` · "${l.note}"`:""}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ background:l.mode==="bulking"?"rgba(34,197,94,0.12)":"rgba(245,158,11,0.12)",
                          border:`1px solid ${l.mode==="bulking"?C.success:C.warning}`,
                          borderRadius:20, padding:"3px 10px", color:l.mode==="bulking"?C.success:C.warning,
                          fontSize:10, fontWeight:700, textTransform:"uppercase" }}>
                          {l.mode==="bulking"?"Bulk":"Cut"}
                        </div>
                        <button onClick={() => saveLogs(logs.filter((_,j)=>j!==logs.indexOf(l)))}
                          style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:18, padding:0 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── STEP TRACKER ── */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", marginTop:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:38, height:38, background:"rgba(59,130,246,0.1)", borderRadius:10,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>👟</div>
                  <div>
                    <div style={{ fontWeight:700, color:C.dark, fontSize:14 }}>Steps Today</div>
                    <div style={{ fontSize:11, color:C.muted }}>Burns calories and adds to your budget</div>
                  </div>
                </div>
                <button onClick={() => { setEditingSteps(true); setStepInput(todaySteps > 0 ? String(todaySteps) : ""); }}
                  style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                    padding:"5px 12px", color:C.primary, fontSize:12, fontWeight:700,
                    cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>
                  {todaySteps > 0 ? "Edit" : "+ Add"}
                </button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:editingSteps?12:0 }}>
                {[
                  { label:"Steps",    value:todaySteps.toLocaleString(), color:C.primary },
                  { label:"Burned",   value:`${calBurned} kcal`,         color:C.success },
                  { label:"Distance", value:`${(todaySteps*0.00078).toFixed(2)} km`, color:C.dark },
                ].map(s => (
                  <div key={s.label} style={{ background:C.surface, borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:s.color, fontFamily:"'Barlow Condensed',sans-serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {todaySteps > 0 && !editingSteps && (
                <div style={{ marginTop:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:11, color:C.muted }}>
                    <span>{todaySteps.toLocaleString()} / 10,000 steps</span>
                    <span>{Math.min(Math.round((todaySteps/10000)*100),100)}%</span>
                  </div>
                  <div style={{ height:7, background:C.surface, borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${Math.min((todaySteps/10000)*100,100)}%`,
                      background:todaySteps>=10000?C.success:C.primary, borderRadius:99, transition:"width 0.5s ease" }}/>
                  </div>
                  {todaySteps>=10000 && (
                    <div style={{ fontSize:12, color:C.success, fontWeight:700, marginTop:5, textAlign:"center" }}>Goal reached! Great work!</div>
                  )}
                </div>
              )}

              {editingSteps && (
                <div style={{ display:"flex", gap:8 }}>
                  <input type="number" value={stepInput} onChange={e=>setStepInput(e.target.value)}
                    placeholder="Enter steps e.g. 8000" autoFocus
                    style={{ flex:1, background:C.surface, border:`1px solid ${C.primary}`, borderRadius:8,
                      padding:"9px 13px", color:C.dark, fontSize:"16px", outline:"none", fontFamily:"'Barlow',sans-serif" }}/>
                  <button onClick={() => { const s=parseInt(stepInput); if(s>=0) saveSteps(s); setEditingSteps(false); setStepInput(""); }}
                    style={{ background:C.primary, border:"none", borderRadius:8, padding:"9px 16px",
                      color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"'Barlow Condensed',sans-serif" }}>Save</button>
                  <button onClick={() => { setEditingSteps(false); setStepInput(""); }}
                    style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                      padding:"9px 12px", color:C.muted, fontWeight:700, cursor:"pointer", fontSize:14 }}>x</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── STATS (History + Progress) ── */}
        {tab==="stats" && (
          <>
            {/* Sub-tab switcher */}
            <div style={{ display:"flex", background:C.surface, borderRadius:12, padding:4, marginBottom:20, gap:4 }}>
              {[{id:"history",label:"History",icon:"📋"},{id:"progress",label:"Progress",icon:"📈"}].map(st => (
                <button key={st.id} onClick={() => setStatsSubTab(st.id)} style={{
                  flex:1, padding:"9px", borderRadius:9, border:"none", cursor:"pointer",
                  background:statsSubTab===st.id ? C.card : "transparent",
                  color:statsSubTab===st.id ? C.primary : C.muted,
                  fontWeight:statsSubTab===st.id ? 700 : 500,
                  fontSize:13, fontFamily:"'Barlow',sans-serif",
                  boxShadow:statsSubTab===st.id ? "0 2px 8px rgba(59,130,246,0.1)" : "none",
                  transition:"all 0.2s",
                }}>{st.icon} {st.label}</button>
              ))}
            </div>

            {statsSubTab==="history" && (
              <>
                <div style={{ display:"flex", gap:7, marginBottom:18, flexWrap:"wrap" }}>
                  {["All",...Object.keys(EXERCISES)].map(c => (
                    <button key={c} onClick={() => setFilterCat(c)}
                      style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                        background:filterCat===c?C.primary:C.surface, color:filterCat===c?"#fff":C.muted, fontFamily:"'Barlow',sans-serif" }}>{c}</button>
                  ))}
                </div>
                {logs.length===0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:C.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>No workouts logged yet.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                {[...logs].reverse().filter(l => filterCat==="All"||l.category===filterCat).map((l,i) => (
                  <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 15px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <span style={{ color:C.dark, fontWeight:600, fontSize:15 }}>{l.exercise}</span>
                        <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>{l.category}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:C.muted, fontSize:12 }}>{new Date(l.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                        <div style={{ background:l.mode==="bulking"?"rgba(34,197,94,0.12)":"rgba(245,158,11,0.12)",
                          borderRadius:20, padding:"2px 9px", color:l.mode==="bulking"?C.success:C.warning, fontSize:10, fontWeight:700, textTransform:"uppercase" }}>
                          {l.mode==="bulking"?"Bulk":"Cut"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                      {l.sets.map((s,j) => (
                        <div key={j} style={{ background:C.surface, borderRadius:6, padding:"3px 10px", fontSize:13 }}>
                          <span style={{ color:C.dark, fontWeight:600 }}>{s.weight}kg</span>
                          <span style={{ color:C.muted }}> × {s.reps}</span>
                        </div>
                      ))}
                    </div>
                    {l.note && <div style={{ color:C.muted, fontSize:12, marginTop:7, fontStyle:"italic" }}>"{l.note}"</div>}
                  </div>
                ))}
              </div>
            )}
            </>
            )}

            {statsSubTab==="progress" && (
              <>
                {uniqueExs.length===0 ? (
                  <div style={{ textAlign:"center", padding:"60px 20px", color:C.muted }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>📈</div>Log workouts to see progress!
                  </div>
                ) : (
                  <>
                    <Field label="Select Exercise">
                      <select value={selectedEx} onChange={e => setSelectedEx(e.target.value)}
                        style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                          padding:"10px 14px", color:C.dark, fontSize:14, outline:"none", fontFamily:"'Barlow',sans-serif" }}>
                        {uniqueExs.map(ex => <option key={ex}>{ex}</option>)}
                      </select>
                    </Field>
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 16px", marginBottom:20 }}>
                      <ProgressChart logs={logs} exercise={selectedEx}/>
                    </div>
                    <h3 style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:700, margin:"0 0 12px" }}>All Exercises</h3>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:10 }}>
                      {uniqueExs.map(ex => {
                        const el = logs.filter(l=>l.exercise===ex).sort((a,b)=>new Date(a.date)-new Date(b.date));
                        const best=Math.max(...el.map(l=>l.maxWeight));
                        const last=el[el.length-1]?.maxWeight, first=el[0]?.maxWeight;
                        const up=last>first;
                        return (
                          <div key={ex} onClick={() => setSelectedEx(ex)} style={{
                            background:C.card, border:`1px solid ${selectedEx===ex?C.primary:C.border}`,
                            borderRadius:12, padding:14, cursor:"pointer", transition:"border-color 0.2s" }}>
                            <div style={{ color:C.dark, fontWeight:600, fontSize:14, marginBottom:5 }}>{ex}</div>
                            <div style={{ color:C.primary, fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>{best} kg</div>
                            <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>best · {el.length} sessions</div>
                            {el.length>1 && (
                              <div style={{ marginTop:5, fontSize:11, fontWeight:700, color:up?C.success:C.red }}>
                                {up?"▲":"▼"} {Math.abs(last-first).toFixed(1)} kg
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── BODY (Weight + Calories) ── */}
        {tab==="body" && (() => {
          const sorted = [...wLogs].sort((a,b) => new Date(a.date)-new Date(b.date));
          const chartData = sorted.map(l => ({ date:new Date(l.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}), weight:l.weight }));
          const latest=sorted[sorted.length-1]?.weight, wFirst=sorted[0]?.weight;
          const delta = latest&&wFirst ? latest-wFirst : null;
          const lowest=sorted.length?Math.min(...sorted.map(l=>l.weight)):null;
          const highest=sorted.length?Math.max(...sorted.map(l=>l.weight)):null;

          return (
            <>
              {/* Sub-tab switcher */}
              <div style={{ display:"flex", background:C.surface, borderRadius:12, padding:4, marginBottom:20, gap:4 }}>
                {[{id:"weight",label:"Weight",icon:"⚖️"},{id:"calories",label:"Calories",icon:"🔥"}].map(st => (
                  <button key={st.id} onClick={() => setBodySubTab(st.id)} style={{
                    flex:1, padding:"9px", borderRadius:9, border:"none", cursor:"pointer",
                    background:bodySubTab===st.id ? C.card : "transparent",
                    color:bodySubTab===st.id ? C.primary : C.muted,
                    fontWeight:bodySubTab===st.id ? 700 : 500,
                    fontSize:13, fontFamily:"'Barlow',sans-serif",
                    boxShadow:bodySubTab===st.id ? "0 2px 8px rgba(59,130,246,0.1)" : "none",
                    transition:"all 0.2s",
                  }}>{st.icon} {st.label}</button>
                ))}
              </div>

              {bodySubTab==="weight" && (
              <>
              <SectionTitle>Body Weight</SectionTitle>
              {/* Log input */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", marginBottom:18 }}>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Log today's weight</div>
                <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
                  <div style={{ position:"relative", flex:"0 0 120px" }}>
                    <input type="number" value={wInput} onChange={e=>setWInput(e.target.value)} placeholder="72.5"
                      style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                        padding:"9px 36px 9px 12px", color:C.dark, fontSize:15, outline:"none", fontFamily:"'Barlow',sans-serif" }}
                      onFocus={e=>e.target.style.borderColor=C.primary}
                      onBlur={e=>e.target.style.borderColor=C.border}/>
                    <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:C.muted, fontWeight:600 }}>kg</span>
                  </div>
                  <input value={wNote} onChange={e=>setWNote(e.target.value)} placeholder="Note (optional)"
                    style={{ flex:1, minWidth:110, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                      padding:"9px 12px", color:C.dark, fontSize:13, outline:"none", fontFamily:"'Barlow',sans-serif" }}
                    onFocus={e=>e.target.style.borderColor=C.primary}
                    onBlur={e=>e.target.style.borderColor=C.border}/>
                  <PrimaryBtn onClick={() => {
                    const wVal=parseFloat(wInput);
                    if (!wVal||wVal<20||wVal>300) return;
                    saveWLogs([...wLogs, { weight:wVal, note:wNote, date:new Date().toISOString() }]);
                    setWInput(""); setWNote("");
                  }} style={{ flex:"0 0 auto", width:"auto", padding:"9px 18px", fontSize:13 }}>Save</PrimaryBtn>
                </div>
              </div>

              {/* Stats */}
              {sorted.length>0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:9, marginBottom:18 }}>
                  <StatCard label="Current" value={`${latest} kg`}/>
                  <StatCard label="Change"
                    value={delta!==null ? `${delta>=0?"+":""}${delta.toFixed(1)} kg` : "—"}
                    color={delta!==null ? (goal==="bulking"?(delta>=0?C.success:C.red):(delta<=0?C.success:C.red)) : C.muted}
                    badge={delta!==null ? (goal==="bulking"?(delta>=0?"✓":"!"):(delta<=0?"✓":"!")) : null}/>
                  <StatCard label="Lowest"  value={`${lowest} kg`} color={goal==="cutting"?C.success:C.muted}/>
                  <StatCard label="Highest" value={`${highest} kg`} color={goal==="bulking"?C.success:C.muted}/>
                </div>
              )}

              {/* Chart */}
              {chartData.length>=2 ? (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 16px", marginBottom:18 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:14, textTransform:"uppercase", letterSpacing:1, fontFamily:"'Barlow Condensed',sans-serif" }}>Weight over time</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                      <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:11 }}/>
                      <YAxis tick={{ fill:C.muted, fontSize:11 }} domain={["auto","auto"]}/>
                      <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.dark }} formatter={v=>[`${v} kg`,"Weight"]}/>
                      {lowest && <ReferenceLine y={lowest} stroke={C.success} strokeDasharray="4 4" strokeWidth={1.5}/>}
                      <Line type="monotone" dataKey="weight" stroke={C.primary} strokeWidth={2.5} dot={{ fill:C.primary, r:4 }} activeDot={{ r:6 }}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : sorted.length===1 ? (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28, textAlign:"center", color:C.muted, fontSize:14, marginBottom:18 }}>Log one more entry to see your progress chart 📈</div>
              ) : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:40, textAlign:"center", marginBottom:18 }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>⚖️</div>
                  <div style={{ color:C.muted, fontSize:14 }}>No entries yet. Log your first weight above!</div>
                </div>
              )}

              {/* History */}
              {sorted.length>0 && (
                <>
                  <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10, textTransform:"uppercase", letterSpacing:1, fontFamily:"'Barlow Condensed',sans-serif" }}>History</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[...sorted].reverse().map((l,i,arr) => {
                      const prev = arr[i+1];
                      const diff = prev ? l.weight-prev.weight : null;
                      const isGood = diff===null ? null : (goal==="bulking" ? diff>=0 : diff<=0);
                      return (
                        <div key={i}
                          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 15px", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"background 0.18s, border-color 0.18s", cursor:"default" }}
                          onMouseEnter={e => { e.currentTarget.style.background=hoverBg; e.currentTarget.style.borderColor=goalBdr; }}
                          onMouseLeave={e => { e.currentTarget.style.background=C.card; e.currentTarget.style.borderColor=C.border; }}>
                          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                            <div style={{ width:38, height:38, background:C.surface, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚖️</div>
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <span style={{ color:C.dark, fontWeight:700, fontSize:16, fontFamily:"'Barlow Condensed',sans-serif" }}>{l.weight} kg</span>
                                {diff!==null && (
                                  <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:20,
                                    background:isGood?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",
                                    color:isGood?C.success:C.red }}>
                                    {diff>=0?"▲":"▼"} {Math.abs(diff).toFixed(1)} kg
                                  </span>
                                )}
                              </div>
                              {l.note && <div style={{ color:C.muted, fontSize:12, fontStyle:"italic" }}>"{l.note}"</div>}
                            </div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ color:C.muted, fontSize:12 }}>{new Date(l.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                            <button onClick={() => saveWLogs(wLogs.filter((_,j)=>j!==wLogs.indexOf(l)))}
                              style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:17, padding:0 }}>×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
            )}

            {bodySubTab==="calories" && (
            <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <SectionTitle>Calories</SectionTitle>
              <button onClick={() => setShowCalSetup(true)}
                style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px",
                  color:C.dark, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Barlow',sans-serif" }}>
                ⚙ Setup Goal
              </button>
            </div>

            {/* Date Navigator */}
            {(() => {
              const selDate = new Date(selectedCalDate);
              const isToday = selectedCalDate === today;
              const goBack = () => { const d=new Date(selectedCalDate); d.setDate(d.getDate()-1); setSelectedCalDate(d.toDateString()); };
              const goFwd  = () => { if (!isToday) { const d=new Date(selectedCalDate); d.setDate(d.getDate()+1); setSelectedCalDate(d.toDateString()); }};
              const label  = isToday ? "Today" : selectedCalDate === new Date(Date.now()-86400000).toDateString() ? "Yesterday"
                : selDate.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" });
              return (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", marginBottom:16 }}>
                  <button onClick={goBack} style={{ background:C.surface, border:`1px solid ${C.border}`,
                    borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:16, color:C.dark,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:17, color:C.dark }}>{label}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{selDate.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
                  </div>
                  <button onClick={goFwd} style={{ background:isToday?C.surface:"#EEF4FF", border:`1px solid ${C.border}`,
                    borderRadius:8, width:34, height:34, cursor:isToday?"not-allowed":"pointer", fontSize:16,
                    color:isToday?C.border:C.dark, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                </div>
              );
            })()}

            {/* Circle + summary */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 20px", marginBottom:16 }}>
              {calGoal ? (
                <div style={{ display:"flex", alignItems:"center", gap:24 }}>
                  {/* SVG ring */}
                  <div style={{ position:"relative", width:110, height:110, flexShrink:0 }}>
                    <svg width="110" height="110" viewBox="0 0 110 110">
                      <circle cx="55" cy="55" r="45" fill="none" stroke={C.surface} strokeWidth="10"/>
                      <circle cx="55" cy="55" r="45" fill="none"
                        stroke={calOver?C.red:(goal==="bulking"?C.success:C.warning)}
                        strokeWidth="10" strokeDasharray={`${2*Math.PI*45}`}
                        strokeDashoffset={`${2*Math.PI*45*(1-calPct/100)}`}
                        strokeLinecap="round" transform="rotate(-90 55 55)"
                        style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
                    </svg>
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ fontSize:20, fontWeight:800, color:C.dark, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>{totalCal}</div>
                      <div style={{ fontSize:10, color:C.muted, fontWeight:600 }}>kcal</div>
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>Goal</div>
                      <div style={{ fontSize:26, fontWeight:800, color:C.primary, fontFamily:"'Barlow Condensed',sans-serif" }}>{calGoal} <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>kcal</span></div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                      <div style={{ background:C.surface, borderRadius:10, padding:"9px 12px" }}>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>Consumed</div>
                        <div style={{ fontSize:18, fontWeight:800, color:C.dark, fontFamily:"'Barlow Condensed',sans-serif" }}>{totalCal}</div>
                      </div>
                      <div style={{ background:calOver?"rgba(239,68,68,0.08)":C.surface, borderRadius:10, padding:"9px 12px", border:`1px solid ${calOver?C.red:"transparent"}` }}>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{calOver?"Over":"Remaining"}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:calOver?C.red:C.success, fontFamily:"'Barlow Condensed',sans-serif" }}>{Math.abs(remaining)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"16px 0" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🎯</div>
                  <div style={{ color:C.dark, fontWeight:700, marginBottom:6 }}>Set your calorie goal</div>
                  <div style={{ color:C.muted, fontSize:13, marginBottom:14 }}>Enter your stats to get a personalized daily goal</div>
                  <PrimaryBtn onClick={() => setShowCalSetup(true)} style={{ width:"auto", padding:"9px 28px" }}>Setup Now</PrimaryBtn>
                </div>
              )}
            </div>

            {/* Meal cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {["Breakfast","Lunch","Dinner","Snacks"].map(meal => {
                const mCal = (calLogs[meal]||[]).reduce((a,e)=>a+e.cal,0);
                const share = calGoal ? Math.min((mCal/calGoal)*100,100) : 0;
                const active = activeMeal===meal;
                return (
                  <div key={meal} onClick={() => setActiveMeal(meal)}
                    style={{ background:active?goalBg:C.card, border:`1px solid ${active?goalBdr:C.border}`,
                      borderRadius:12, padding:"12px 14px", cursor:"pointer", transition:"all 0.2s" }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background=hoverBg; e.currentTarget.style.borderColor=goalBdr; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background=C.card; e.currentTarget.style.borderColor=C.border; }}}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{MEAL_EMOJI[meal]} {meal}</span>
                      <span style={{ fontSize:14, fontWeight:800, color:C.primary, fontFamily:"'Barlow Condensed',sans-serif" }}>{mCal}</span>
                    </div>
                    <div style={{ height:5, background:C.surface, borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${share}%`, background:goalClr, borderRadius:99, transition:"width 0.4s" }}/>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>{(calLogs[meal]||[]).length} items logged</div>
                  </div>
                );
              })}
            </div>

            {/* Active meal food log */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ fontWeight:700, color:C.dark, fontSize:15 }}>{MEAL_EMOJI[activeMeal]} {activeMeal}</span>
                <button onClick={() => setShowFoodPicker(true)}
                  style={{ background:C.primary, border:"none", borderRadius:8, padding:"6px 14px",
                    color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                    fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>+ Add Food</button>
              </div>

              {/* Manual entry row */}
              <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                <input value={manualName} onChange={e=>setManualName(e.target.value)} placeholder="Item name"
                  style={{ flex:2, minWidth:100, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                    padding:"8px 11px", color:C.dark, fontSize:13, outline:"none", fontFamily:"'Barlow',sans-serif" }}
                  onFocus={e=>e.target.style.borderColor=C.primary}
                  onBlur={e=>e.target.style.borderColor=C.border}/>
                <input value={manualCal} onChange={e=>setManualCal(e.target.value)} placeholder="kcal" type="number"
                  style={{ flex:1, minWidth:65, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                    padding:"8px 11px", color:C.dark, fontSize:13, outline:"none", fontFamily:"'Barlow',sans-serif" }}
                  onFocus={e=>e.target.style.borderColor=C.primary}
                  onBlur={e=>e.target.style.borderColor=C.border}/>
                <button onClick={() => {
                  const calVal=parseInt(manualCal);
                  if (!calVal||calVal<1) return;
                  addFood(activeMeal, { name:manualName||"Custom", cal:calVal, unit:"manual", id:Date.now() });
                  setManualCal(""); setManualName("");
                }} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                  padding:"8px 13px", color:C.dark, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif" }}>Add</button>
              </div>

              {(calLogs[activeMeal]||[]).length===0 ? (
                <div style={{ textAlign:"center", padding:"20px", color:C.muted, fontSize:13 }}>
                  Nothing logged for {activeMeal} yet
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {(calLogs[activeMeal]||[]).map((item,i) => (
                    <div key={item.id||i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"8px 11px", background:C.surface, borderRadius:8 }}>
                      <div>
                        <span style={{ color:C.dark, fontWeight:600, fontSize:14 }}>{item.name}</span>
                        <span style={{ color:C.muted, fontSize:12, marginLeft:7 }}>{item.unit}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <span style={{ color:C.primary, fontWeight:800, fontSize:14, fontFamily:"'Barlow Condensed',sans-serif" }}>{item.cal} kcal</span>
                        <button onClick={() => removeFood(activeMeal, item.id)}
                          style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:17, padding:0 }}>×</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:9, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Total</span>
                    <span style={{ color:C.primary, fontWeight:800, fontSize:15, fontFamily:"'Barlow Condensed',sans-serif" }}>
                      {(calLogs[activeMeal]||[]).reduce((a,e)=>a+e.cal,0)} kcal
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── CALORIE HISTORY CHART ── */}
            {(() => {
              const last14 = [...Array(14)].map((_,i) => {
                const d = new Date();
                d.setDate(d.getDate() - (13 - i));
                const key = d.toDateString();
                const dayLogs = calAllLogs[key] || { Breakfast:[], Lunch:[], Dinner:[], Snacks:[] };
                const total = Object.values(dayLogs).flat().reduce((a,e) => a+e.cal, 0);
                return {
                  date: d.toLocaleDateString("en-IN", { day:"numeric", month:"short" }),
                  cal: total,
                  isToday: key === today,
                };
              }).filter(d => d.cal > 0 || d.isToday);

              if (last14.filter(d => d.cal > 0).length < 2) return (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
                  padding:"28px 20px", marginTop:16, textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
                  <div style={{ color:C.dark, fontWeight:600, fontSize:14, marginBottom:4 }}>Calorie History</div>
                  <div style={{ color:C.muted, fontSize:13 }}>Log calories on at least 2 days to see your history chart</div>
                </div>
              );

              const maxCal = Math.max(...last14.map(d => d.cal), calGoal || 0);
              const avgCal = Math.round(last14.filter(d=>d.cal>0).reduce((a,d)=>a+d.cal,0) / last14.filter(d=>d.cal>0).length);

              return (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 16px", marginTop:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800, color:C.dark }}>Calorie History</div>
                      <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Last 14 days</div>
                    </div>
                    <div style={{ display:"flex", gap:12 }}>
                      {calGoal && (
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Goal</div>
                          <div style={{ fontSize:14, fontWeight:800, color:C.primary, fontFamily:"'Barlow Condensed',sans-serif" }}>{calGoal}</div>
                        </div>
                      )}
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Avg</div>
                        <div style={{ fontSize:14, fontWeight:800, color:C.dark, fontFamily:"'Barlow Condensed',sans-serif" }}>{avgCal}</div>
                      </div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={last14} margin={{ top:8, right:8, left:-24, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                      <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:10 }} interval={1}/>
                      <YAxis tick={{ fill:C.muted, fontSize:10 }} domain={[0, Math.ceil(maxCal/100)*100]}/>
                      <Tooltip
                        contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, color:C.dark, fontSize:13 }}
                        formatter={(val, name) => [`${val} kcal`, "Calories"]}
                        labelStyle={{ fontWeight:700, color:C.dark }}
                      />
                      {calGoal && (
                        <ReferenceLine y={calGoal} stroke={goalClr} strokeDasharray="5 5" strokeWidth={1.5}
                          label={{ value:`Goal ${calGoal}`, fill:goalClr, fontSize:10, position:"insideTopRight" }}/>
                      )}
                      <Line
                        type="monotone" dataKey="cal" stroke={C.primary} strokeWidth={2.5}
                        dot={({ cx, cy, payload }) => (
                          <circle key={cx} cx={cx} cy={cy} r={payload.isToday ? 6 : 4}
                            fill={payload.cal > (calGoal||Infinity) ? C.red : payload.isToday ? C.primary : C.primary}
                            stroke={payload.isToday ? "#fff" : "none"} strokeWidth={2}/>
                        )}
                        activeDot={{ r:7, fill:C.primary }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:C.primary, border:"2px solid #fff", boxShadow:"0 0 0 2px "+C.primary }}/>
                      <span style={{ fontSize:11, color:C.muted }}>Today</span>
                    </div>
                    {calGoal && (
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:16, height:2, background:goalClr, borderRadius:1 }}/>
                        <span style={{ fontSize:11, color:C.muted }}>{goal==="bulking"?"Bulk":"Cut"} goal</span>
                      </div>
                    )}
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:C.red }}/>
                      <span style={{ fontSize:11, color:C.muted }}>Over goal</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            </>
            )}
            </>
          );
        })()}

        {/* ── WORKOUTS ── */}
        {tab==="workouts" && (
          <>
            <SectionTitle>Exercise Library</SectionTitle>
            <p style={{ color:C.muted, fontSize:13, margin:"-10px 0 16px" }}>Tap any exercise to watch the correct form tutorial</p>

            {/* Category pills */}
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {Object.keys(EXERCISE_VIDEOS).map(cat => (
                <button key={cat} onClick={() => { setWorkoutCat(cat); setWorkoutEx(EXERCISE_VIDEOS[cat][0]); }}
                  style={{ padding:"6px 16px", borderRadius:20, border:"none", cursor:"pointer",
                    fontSize:13, fontWeight:700, fontFamily:"'Barlow',sans-serif", transition:"all 0.15s",
                    background:workoutCat===cat ? C.primary : C.surface,
                    color:workoutCat===cat ? "#fff" : C.muted }}>
                  {cat==="Push"?"🫷":cat==="Pull"?"🫸":cat==="Legs"?"🦵":"🔥"} {cat}
                </button>
              ))}
            </div>

            {/* Video Player */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", marginBottom:16 }}>
              <div style={{ position:"relative", paddingBottom:"56.25%", background:"#000" }}>
                <iframe
                  key={workoutEx.id}
                  src={`https://www.youtube.com/embed/${workoutEx.id}?rel=0&modestbranding=1`}
                  title={workoutEx.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }}
                />
              </div>
              <div style={{ padding:"16px 18px" }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.dark, marginBottom:8 }}>
                  {workoutEx.name}
                </div>
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:14 }}>
                  <span style={{ fontSize:16 }}>💡</span>
                  <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.6 }}>
                    <strong style={{ color:C.dark }}>Form tip: </strong>{workoutEx.tips}
                  </p>
                </div>
                <button onClick={() => setShowLog(true)} style={{
                  width:"100%", background:C.primary, border:"none", borderRadius:9,
                  padding:"11px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
                  fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:0.5,
                }}>+ Log This Exercise</button>
              </div>
            </div>

            {/* Exercise list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {EXERCISE_VIDEOS[workoutCat].map(ex => (
                <div key={ex.name} onClick={() => setWorkoutEx(ex)}
                  style={{ display:"flex", alignItems:"center", gap:12,
                    background:workoutEx.name===ex.name ? `${C.primary}12` : C.card,
                    border:`1px solid ${workoutEx.name===ex.name ? C.primary : C.border}`,
                    borderRadius:12, padding:"12px 14px", cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e => { if (workoutEx.name!==ex.name) e.currentTarget.style.background=C.surface; }}
                  onMouseLeave={e => { if (workoutEx.name!==ex.name) e.currentTarget.style.background=C.card; }}>
                  <div style={{ width:64, height:42, borderRadius:8, overflow:"hidden", flexShrink:0, background:"#000", position:"relative" }}>
                    <img src={`https://img.youtube.com/vi/${ex.id}/mqdefault.jpg`} alt={ex.name}
                      style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.9 }}/>
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(255,255,255,0.85)",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:8, marginLeft:2 }}>▶</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:C.dark, fontWeight:700, fontSize:14 }}>{ex.name}</div>
                    <div style={{ color:C.muted, fontSize:11, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ex.tips}</div>
                  </div>
                  {workoutEx.name===ex.name && (
                    <div style={{ width:8, height:8, borderRadius:"50%", background:C.primary, flexShrink:0 }}/>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PROFILE ── */}
        {tab==="profile" && (
          <>
            <SectionTitle>Profile</SectionTitle>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 20px", marginBottom:14, display:"flex", alignItems:"center", gap:16 }}>
              <Avatar name={user.name} size={62}/>
              <div>
                <div style={{ color:C.dark, fontWeight:700, fontSize:20, fontFamily:"'Barlow Condensed',sans-serif" }}>{user.name}</div>
                <div style={{ color:C.muted, fontSize:13 }}>{user.email}</div>
                <div style={{ color:C.muted, fontSize:13 }}>{user.phone}</div>
                <div style={{ color:C.muted, fontSize:12, marginTop:3 }}>Member since {new Date(user.joinedAt).toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</div>
              </div>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 18px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ color:C.dark, fontWeight:600 }}>Current goal</span>
                <button onClick={toggleGoal} style={{ background:goalBg, border:`1px solid ${goalBdr}`,
                  borderRadius:20, padding:"5px 14px", cursor:"pointer", color:goalClr,
                  fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>
                  {goal==="bulking" ? "💪 Bulking" : "🔥 Cutting"} · tap to switch
                </button>
              </div>
            </div>

            <SubscriptionPanel subscription={subscription} transactions={subscriptionTransactions} onPay={saveSubscriptionPayment}/>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 18px", marginBottom:10 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { label:"Total workouts",   value:logs.length },
                  { label:"Unique exercises",  value:uniqueExs.length },
                  { label:"Total volume",      value:`${(totalVol/1000).toFixed(1)}t` },
                  { label:"This week",         value:weekLogs.length },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginBottom:4 }}>{s.label}</div>
                    <div style={{ color:C.primary, fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={onLogout}
              onMouseEnter={e => { e.currentTarget.style.background=hoverBg; e.currentTarget.style.color="#c0392b"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.red; }}
              style={{ marginTop:6, width:"100%", background:"transparent", border:`1px solid ${C.red}`,
                borderRadius:8, padding:"11px 20px", color:C.red, fontSize:14, fontWeight:700,
                cursor:"pointer", letterSpacing:0.5, fontFamily:"'Barlow Condensed',sans-serif",
                textTransform:"uppercase", transition:"background 0.2s, color 0.2s" }}>
              Sign out
            </button>
          </>
        )}

        {tab==="admin" && (
          <UserAdminDashboard
            user={user}
            subscription={subscription}
            transactions={subscriptionTransactions}
            logs={logs}
            weekLogs={weekLogs}
            uniqueExs={uniqueExs}
            totalVol={totalVol}
            totalCal={totalCal}
            calGoal={calGoal}
            todaySteps={todaySteps}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.card,
        borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 6px", zIndex:50,
        boxShadow:"0 -1px 12px rgba(59,130,246,0.06)" }}>
        {navItems.map(({ id, icon, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, background:"none", border:"none", cursor:"pointer", padding:"5px 0",
            display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            color:tab===id ? C.primary : C.muted, transition:"color 0.2s",
          }}>
            <i className={`ti ${icon}`} style={{ fontSize:20 }}/>
            <span style={{ fontSize:10, fontWeight:tab===id?700:500, fontFamily:"'Barlow',sans-serif" }}>{label}</span>
          </button>
        ))}
      </div>

      {showLog      && <LogModal onClose={() => setShowLog(false)} onSave={entry => saveLogs([...logs, entry])} goal={goal}/>}
      {showCalSetup && <CalSetupModal onClose={() => setShowCalSetup(false)} onSave={p => { setCalProfile(p); saveLS(`rs_calprofile_${user.email}`,p); }} goal={goal} initial={calProfile}/>}
      {showFoodPicker && <FoodPickerModal meal={activeMeal} onAdd={item => addFood(activeMeal, item)} onClose={() => setShowFoodPicker(false)}/>}
    </div>
  );
}

export default function Root() {
  useEffect(() => {
    try {
      Object.keys(localStorage).filter(k => k.startsWith("rs_")).forEach(k => {
        try { const v = localStorage.getItem(k); if (v) JSON.parse(v); }
        catch { localStorage.removeItem(k); }
      });
    } catch {}
  }, []);

  const [user, setUser] = useState(() => {
    try {
      const v = localStorage.getItem("rs_session");
      if (!v) return null;
      const p = JSON.parse(v);
      if (!p || !p.email || !p.name) { localStorage.removeItem("rs_session"); return null; }
      return p;
    } catch { localStorage.removeItem("rs_session"); return null; }
  });

  const handleAuth = u => {
    try { localStorage.setItem("rs_session", JSON.stringify(u)); } catch {}
    setUser(u);
  };
  const handleLogout = () => {
    try { localStorage.removeItem("rs_session"); } catch {}
    setUser(null);
  };

  if (!user) return <AuthScreen onAuth={handleAuth}/>;
  return <App user={user} onLogout={handleLogout}/>;
}
