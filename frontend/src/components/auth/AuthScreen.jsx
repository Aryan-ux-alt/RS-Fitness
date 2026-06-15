import { useState, useEffect } from "react";
import { generateOTP } from "../../utils/date";
import { signup, login, signupGymOwner, loginGymOwner, checkGym, getRegisteredGyms } from "../../services/api";
import { AuthInput, authInputStyle } from "../common";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"", gymName:"", otp:"" });
  const [gymForm, setGymForm] = useState({ gymName:"", phone:"", email:"", password:"", city:"" });
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingGymOwner, setPendingGymOwner] = useState(null);
  const [shownOtp, setShownOtp] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [registeredGyms, setRegisteredGyms] = useState([]);

  useEffect(() => {
    if (mode === "signup") {
      getRegisteredGyms()
        .then(gyms => setRegisteredGyms(gyms))
        .catch(err => console.warn("Failed to fetch registered gyms:", err));
    }
  }, [mode]);


  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setGym = k => e => setGymForm(f => ({ ...f, [k]: e.target.value }));
  const handleLogin = async () => {
    setError("");
    try {
      const session = await login({ email: form.email.trim(), password: form.password });
      onAuth(session);
    } catch (err) {
      setError(err.message || "Login failed.");
    }
  };

  const handleSignup = async () => {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.phone.trim() || !form.gymName.trim()) return setError("All fields required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) return setError("Phone number must be exactly 10 digits.");
    try {
      const checkRes = await checkGym(form.gymName.trim());
      const exactGymName = checkRes.gymName;
      const otp = generateOTP();
      setGeneratedOtp(otp); setShownOtp(otp);
      setPendingUser({ name:form.name.trim(), email:form.email.trim(), password:form.password, phone:form.phone.trim(), gymName: exactGymName });
      setMode("otp");
    } catch (err) {
      setError(err.message || "Failed to verify gym registration.");
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!pendingUser) return setError("Session expired. Please sign up again.");
    if (form.otp.trim() !== generatedOtp) return setError("Wrong OTP. Try again.");
    try {
      // Validate all required fields before sending
      if (!pendingUser.name || pendingUser.name.length < 2) return setError("Name must be at least 2 characters.");
      if (!pendingUser.email || !pendingUser.email.includes("@")) return setError("Valid email is required.");
      if (!pendingUser.password || pendingUser.password.length < 6) return setError("Password must be at least 6 characters.");
      const cleanPhone = pendingUser.phone.replace(/\D/g, "");
      if (!pendingUser.phone || cleanPhone.length !== 10) return setError("Phone number must be exactly 10 digits.");
      if (!pendingUser.gymName || pendingUser.gymName.length < 2) return setError("Gym name is required.");

      const session = await signup(pendingUser);
      onAuth(session);
    } catch (err) {
      const errMsg = err.message || "Signup failed.";
      // Parse specific error messages
      if (errMsg.includes("already exists")) {
        setError("Email or phone number already registered.");
      } else if (errMsg.includes("not registered")) {
        setError("Gym is not registered. Please select from the list.");
      } else if (errMsg.includes("Invalid request")) {
        setError("Please check all fields are filled correctly and try again.");
      } else {
        setError(errMsg);
      }
    }
  };

  const handleGymSignup = async () => {
    setError("");
    if (!gymForm.gymName.trim() || !gymForm.phone.trim() || !gymForm.email.trim() || !gymForm.password || !gymForm.city.trim()) {
      return setError("All gym owner fields required.");
    }
    if (gymForm.password.length < 6) return setError("Password must be at least 6 characters.");
    const cleanPhone = gymForm.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) return setError("Phone number must be exactly 10 digits.");
    if (gymForm.gymName.trim().length < 2) return setError("Gym name must be at least 2 characters.");
    if (gymForm.city.trim().length < 2) return setError("City must be at least 2 characters.");
    try {
      const result = await signupGymOwner({
        gymName:gymForm.gymName.trim(),
        phone:gymForm.phone.trim(),
        email:gymForm.email.trim(),
        password:gymForm.password,
        city:gymForm.city.trim(),
      });
      setPendingGymOwner(result.gymOwner);
      setMode("gymApprovalPending");
    } catch (err) {
      const errMsg = err.message || "Gym owner signup failed.";
      // Parse specific error messages
      if (errMsg.includes("already exists")) {
        setError("Email or phone number already registered.");
      } else if (errMsg.includes("already registered")) {
        setError("A gym with this name already exists.");
      } else if (errMsg.includes("Invalid input")) {
        setError("Please check all fields are valid and try again.");
      } else {
        setError(errMsg);
      }
    }
  };

  const handleGymLogin = async () => {
    setError("");
    try {
      const session = await loginGymOwner({ email:gymForm.email.trim(), password:gymForm.password });
      onAuth(session);
    } catch (err) {
      setError(err.message || "Gym owner login failed.");
    }
  };

  const copyOtp = () => {
    setForm(f => ({ ...f, otp: shownOtp }));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #EEF4FF 0%, #DBEAFE 50%, #BFDBFE 100%)",
      padding:"clamp(16px, 5vw, 24px)", fontFamily:"'Barlow',sans-serif", overflowY:"auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&display=swap');
        *{box-sizing:border-box}
        input,textarea,select{font-size:16px !important;}
        
        @media (max-width: 640px) {
          .auth-card {
            padding: 20px 16px 18px !important;
            border-radius: 16px !important;
            max-width: 100% !important;
          }
          .auth-logo {
            margin-bottom: 20px !important;
          }
          .auth-logo-icon {
            width: 32px !important;
            height: 32px !important;
            border-radius: 6px !important;
            padding: 8px 16px !important;
          }
          .auth-logo-text {
            font-size: 22px !important;
            letter-spacing: 1.5px !important;
          }
          .auth-tagline {
            font-size: 12px !important;
          }
          .auth-form-title {
            font-size: 20px !important;
            margin-bottom: 4px !important;
          }
          .auth-form-desc {
            font-size: 12px !important;
            margin-bottom: 16px !important;
          }
          .auth-button {
            font-size: 14px !important;
            padding: 11px !important;
          }
          .auth-otp-header-title {
            font-size: 20px !important;
            margin-bottom: 4px !important;
          }
          .auth-otp-display {
            font-size: 36px !important;
            letter-spacing: 8px !important;
            padding: 14px 12px !important;
          }
          .auth-otp-copy-btn {
            font-size: 12px !important;
            padding: 7px 16px !important;
          }
          .auth-input-box {
            padding: 10px 12px !important;
            border-radius: 8px !important;
          }
        }
        
        @media (max-width: 360px) {
          .auth-card {
            padding: 16px 12px 14px !important;
          }
          .auth-form-title {
            font-size: 18px !important;
          }
          .auth-otp-display {
            font-size: 32px !important;
            letter-spacing: 6px !important;
          }
        }
      `}</style>
      <div style={{ width:"100%", maxWidth:400, margin:"0 auto" }}>

        {/* Logo */}
        <div className="auth-logo" style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"clamp(8px, 3vw, 10px)", marginBottom:8,
            background:"#fff", borderRadius:16, padding:"clamp(8px, 2vw, 10px) clamp(14px, 5vw, 20px)",
            boxShadow:"0 4px 20px rgba(59,130,246,0.15)" }}>
            <div className="auth-logo-icon" style={{ width:36, height:36, background:"#3B82F6", borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect x="2" y="10" width="4" height="4" rx="1" fill="#fff"/>
                <rect x="18" y="10" width="4" height="4" rx="1" fill="#fff"/>
                <rect x="5" y="8" width="2" height="8" rx="1" fill="#fff"/>
                <rect x="17" y="8" width="2" height="8" rx="1" fill="#fff"/>
                <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff"/>
              </svg>
            </div>
            <span className="auth-logo-text" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(20px, 6vw, 26px)", fontWeight:800,
              color:"#1E3A5F", letterSpacing:2, whiteSpace:"nowrap" }}>RS FITNESS</span>
          </div>
          <p className="auth-tagline" style={{ color:"#93A8C8", fontSize:13, margin:0, fontWeight:600, letterSpacing:0.5 }}>Track. Lift. Evolve.</p>
        </div>

        {/* Card */}
        <div className="auth-card" style={{ background:"#fff", borderRadius:20, padding:"28px 28px 24px",
          boxShadow:"0 12px 40px rgba(59,130,246,0.14)", border:"1px solid #DBEAFE" }}>

          {mode === "otp" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} style={{ margin: 0 }}>
              {/* OTP screen header */}
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ width:52, height:52, background:"#EEF4FF", borderRadius:14,
                  display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:26 }}>📱</div>
                <h2 className="auth-otp-header-title" style={{ color:"#1E3A5F", margin:"0 0 6px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Verify your phone</h2>
                <p style={{ color:"#93A8C8", fontSize:13, margin:0 }}>We generated a demo OTP for {form.phone}</p>
              </div>

              {/* OTP Display Box - big and obvious */}
              {shownOtp && (
                <div style={{ background:"linear-gradient(135deg,#EEF4FF,#DBEAFE)", border:"2px solid #3B82F6",
                  borderRadius:14, padding:"18px 16px", marginBottom:20, textAlign:"center",
                  boxShadow:"0 4px 16px rgba(59,130,246,0.12)" }}>
                  <div style={{ fontSize:11, color:"#93A8C8", marginBottom:8, textTransform:"uppercase",
                    letterSpacing:1.5, fontWeight:700 }}>🔐 Your Demo OTP</div>
                  <div className="auth-otp-display" style={{ fontSize:42, fontWeight:800, color:"#1E3A5F", letterSpacing:12,
                    fontFamily:"'Barlow Condensed',sans-serif", marginBottom:12, lineHeight:1 }}>{shownOtp}</div>
                  <button type="button" onClick={copyOtp} style={{
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

              <button type="submit" className="auth-button" style={{
                width:"100%", background:"#3B82F6", border:"none", borderRadius:9,
                padding:"12px", color:"#fff", fontSize:15, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase",
                letterSpacing:0.5, marginBottom:10,
              }}>Verify &amp; Create Account</button>
              <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="auth-button" style={{
                width:"100%", background:"transparent", border:"1.5px solid #DBEAFE",
                borderRadius:9, padding:"11px", color:"#93A8C8", fontSize:14, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase",
              }}>← Back</button>
            </form>

          ) : mode === "gymApprovalPending" ? (
            <>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ width:52, height:52, background:"#EEF4FF", borderRadius:14,
                  display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:26 }}>✓</div>
                <h2 className="auth-form-title" style={{ color:"#1E3A5F", margin:"0 0 6px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Approval pending</h2>
                <p style={{ color:"#93A8C8", fontSize:13, margin:0 }}>You will get a call within 24 hours from our team.</p>
              </div>
              {pendingGymOwner && (
                <div className="auth-input-box" style={{ background:"#EEF4FF", border:"1.5px solid #DBEAFE", borderRadius:9, padding:"13px 14px", marginBottom:16 }}>
                  <div style={{ color:"#1E3A5F", fontWeight:700, fontSize:14 }}>{pendingGymOwner.gymName}</div>
                  <div style={{ color:"#93A8C8", fontSize:12, marginTop:3 }}>{pendingGymOwner.city} · {pendingGymOwner.phone}</div>
                </div>
              )}
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="auth-button"
                style={{ width:"100%", background:"#3B82F6", border:"none", borderRadius:9,
                  padding:"12px", color:"#fff", fontSize:15, fontWeight:700,
                  cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
                  textTransform:"uppercase", letterSpacing:0.5 }}>Back to sign in</button>
            </>

          ) : mode === "gymSignup" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleGymSignup(); }} style={{ margin: 0 }}>
              <h2 className="auth-form-title" style={{ color:"#1E3A5F", margin:"0 0 6px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Register your GYM</h2>
              <p className="auth-form-desc" style={{ color:"#93A8C8", fontSize:13, margin:"0 0 20px" }}>Create your gym owner account</p>
              <AuthInput label="Gym name" value={gymForm.gymName} onChange={setGym("gymName")} placeholder="RS Fitness Gym"/>
              <AuthInput label="Phone number" type="tel" value={gymForm.phone} onChange={setGym("phone")} placeholder="+91 98765 43210"/>
              <AuthInput label="Email" type="email" value={gymForm.email} onChange={setGym("email")} placeholder="owner@gym.com"/>
              <AuthInput label="Password" type="password" value={gymForm.password} onChange={setGym("password")} placeholder="••••••••"/>
              <AuthInput label="City" value={gymForm.city} onChange={setGym("city")} placeholder="Mumbai"/>
              {error && <p style={{ color:"#EF4444", fontSize:13, margin:"-6px 0 14px" }}>{error}</p>}
              <button type="submit" style={{
                width:"100%", background:"#3B82F6", border:"none", borderRadius:9,
                padding:"12px", color:"#fff", fontSize:15, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
                textTransform:"uppercase", letterSpacing:0.5, marginBottom:12,
              }}>Create Gym Owner Account</button>
              <p style={{ textAlign:"center", color:"#93A8C8", fontSize:13, margin:"0 0 8px" }}>
                Already registered?{" "}
                <span onClick={() => { setMode("gymLogin"); setError(""); }}
                  style={{ color:"#3B82F6", cursor:"pointer", fontWeight:700 }}>Login as a gym owner</span>
              </p>
              <p style={{ textAlign:"center", color:"#93A8C8", fontSize:13, margin:0 }}>
                Member account?{" "}
                <span onClick={() => { setMode("login"); setError(""); }}
                  style={{ color:"#3B82F6", cursor:"pointer", fontWeight:700 }}>Sign in</span>
              </p>
            </form>

          ) : mode === "gymLogin" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleGymLogin(); }} style={{ margin: 0 }}>
              <h2 style={{ color:"#1E3A5F", margin:"0 0 6px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Gym owner login</h2>
              <p style={{ color:"#93A8C8", fontSize:13, margin:"0 0 20px" }}>Sign in to your gym owner account</p>
              <AuthInput label="Email" type="email" value={gymForm.email} onChange={setGym("email")} placeholder="owner@gym.com"/>
              <AuthInput label="Password" type="password" value={gymForm.password} onChange={setGym("password")} placeholder="••••••••"/>
              {error && <p style={{ color:"#EF4444", fontSize:13, margin:"-6px 0 14px" }}>{error}</p>}
              <button type="submit" style={{
                width:"100%", background:"#3B82F6", border:"none", borderRadius:9,
                padding:"12px", color:"#fff", fontSize:15, fontWeight:700,
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
                textTransform:"uppercase", letterSpacing:0.5, marginBottom:12,
              }}>Login as Gym Owner</button>
              <p style={{ textAlign:"center", color:"#93A8C8", fontSize:13, margin:"0 0 8px" }}>
                Need a gym owner account?{" "}
                <span onClick={() => { setMode("gymSignup"); setError(""); }}
                  style={{ color:"#3B82F6", cursor:"pointer", fontWeight:700 }}>Register your GYM</span>
              </p>
              <p style={{ textAlign:"center", color:"#93A8C8", fontSize:13, margin:0 }}>
                Member account?{" "}
                <span onClick={() => { setMode("login"); setError(""); }}
                  style={{ color:"#3B82F6", cursor:"pointer", fontWeight:700 }}>Sign in</span>
              </p>
            </form>

          ) : mode === "signup" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} style={{ margin: 0 }}>
              <h2 style={{ color:"#1E3A5F", margin:"0 0 20px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Create account</h2>
              <AuthInput label="Full name" value={form.name} onChange={set("name")} placeholder="Alex Johnson"/>
              <AuthInput label="Email" type="email" value={form.email} onChange={set("email")} placeholder="alex@email.com"/>
              <AuthInput label="Phone number" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210"/>
              <AuthInput label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••"/>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#93A8C8", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>GYM NAME</label>
                <select value={form.gymName} onChange={set("gymName")} style={{
                  ...authInputStyle,
                  width:"100%",
                  appearance:"none",
                  backgroundImage:`url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2393A8C8' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat:"no-repeat",
                  backgroundPosition:"right 12px center",
                  backgroundSize:"20px",
                  paddingRight:40,
                }}>
                  <option value="" disabled>Select your gym</option>
                  {registeredGyms.map(gym => (
                    <option key={gym} value={gym}>{gym}</option>
                  ))}
                </select>
              </div>
              {error && <p style={{ color:"#EF4444", fontSize:13, margin:"-6px 0 14px" }}>{error}</p>}
              <button type="submit" style={{
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
            </form>

          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ margin: 0 }}>
              <h2 style={{ color:"#1E3A5F", margin:"0 0 6px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>Welcome back 👋</h2>
              <p style={{ color:"#93A8C8", fontSize:13, margin:"0 0 20px" }}>Sign in to continue your journey</p>
              <AuthInput label="Email" type="email" value={form.email} onChange={set("email")} placeholder="alex@email.com"/>
              <AuthInput label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••"/>
              {error && <p style={{ color:"#EF4444", fontSize:13, margin:"-6px 0 14px" }}>{error}</p>}
              <button type="submit" style={{
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
              <div style={{ height:1, background:"#DBEAFE", margin:"16px 0 14px" }}/>
              <p style={{ textAlign:"center", color:"#93A8C8", fontSize:13, margin:"0 0 8px" }}>
                Register your GYM?{" "}
                <span onClick={() => { setMode("gymSignup"); setError(""); }}
                  style={{ color:"#3B82F6", cursor:"pointer", fontWeight:700 }}>Create gym owner account</span>
              </p>
              <p style={{ textAlign:"center", color:"#93A8C8", fontSize:13, margin:0 }}>
                Already a gym owner?{" "}
                <span onClick={() => { setMode("gymLogin"); setError(""); }}
                  style={{ color:"#3B82F6", cursor:"pointer", fontWeight:700 }}>Login as a gym owner</span>
              </p>
            </form>
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
