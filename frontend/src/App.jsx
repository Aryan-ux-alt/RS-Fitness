import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { C, EXERCISES, EXERCISE_VIDEOS, MEAL_EMOJI } from "./constants/data";
import { Avatar, Field, PrimaryBtn, SectionTitle, StatCard, TextInput } from "./components/common";
import LogModal from "./components/workouts/LogModal";
import ProgressChart from "./components/workouts/ProgressChart";
import CalSetupModal from "./components/diet/CalSetupModal";
import FoodPickerModal from "./components/diet/FoodPickerModal";
import UserAdminDashboard from "./components/admin/UserAdminDashboard";
import * as api from "./services/api";

export default function App({ user, onLogout }) {
  const email = user?.email || "";
  const LS = key => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { localStorage.removeItem(key); return null; } };
  const saveLS = (key, val) => localStorage.setItem(key, JSON.stringify(val));
  const sync = promise => promise.catch(err => console.warn("RS Fitness sync failed:", err.message));

  const [tab, setTab] = useState("dashboard");
  const [goal, setGoal] = useState(LS(`rs_goal_${user.email}`) || "bulking");

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

  const toggleGoal = () => {
    const next = goal==="bulking" ? "cutting" : "bulking";
    setGoal(next); saveLS(`rs_goal_${user.email}`, next);
    sync(api.updateGoal({ goal: next }));
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

  const addFood = (meal, item) => {
    const food = { ...item, qty:item.qty || 1, baseCal:item.baseCal || item.cal };
    saveCalDay({ ...calLogs, [meal]: [...(calLogs[meal]||[]), food] });
    sync(api.addFoodEntry({
      meal,
      name: food.name,
      unit: food.unit,
      calories: food.cal,
      eatenOn: new Date(selectedCalDate).toISOString().slice(0, 10),
    }));
  };
  const removeFood = (meal, id) => saveCalDay({ ...calLogs, [meal]: calLogs[meal].filter(e=>e.id!==id) });
  const updateFoodQty = (meal, id, delta) => {
    saveCalDay({
      ...calLogs,
      [meal]: (calLogs[meal]||[]).map(e => {
        if (e.id !== id) return e;
        const baseCal = e.baseCal || e.cal;
        const qty = Math.max(1, (e.qty || 1) + delta);
        return { ...e, baseCal, qty, cal:baseCal * qty };
      }),
    });
  };

  // Hydrate user data from backend database on mount
  useEffect(() => {
    let active = true;
    api.hydrateUserData()
      .then(data => {
        if (!active) return;

        const parseDbDateToLocal = (dateStr) => {
          if (!dateStr) return new Date();
          const [y, m, d] = dateStr.slice(0, 10).split("-");
          return new Date(y, m - 1, d);
        };

        if (data.goal) {
          setGoal(data.goal);
          saveLS(`rs_goal_${user.email}`, data.goal);
        }

        if (data.workouts) {
          const parsedLogs = data.workouts.map(w => {
            const mappedSets = (w.sets || []).map(s => ({
              weight: s.weight ? String(s.weight) : "",
              reps: s.reps ? String(s.reps) : ""
            }));
            const maxWeight = mappedSets.length > 0 ? Math.max(...mappedSets.map(s => parseFloat(s.weight) || 0)) : 0;
            return {
              category: w.category,
              exercise: w.exercise_name,
              note: w.note || "",
              mode: w.mode,
              date: w.performed_at,
              sets: mappedSets,
              maxWeight
            };
          });
          setLogs(parsedLogs);
          saveLS(`rs_logs_${user.email}`, parsedLogs);
        }

        if (data.bodyMetrics) {
          const parsedWLogs = data.bodyMetrics.map(m => ({
            weight: parseFloat(m.weight_kg),
            note: m.note || "",
            date: m.measured_at
          }));
          setWLogs(parsedWLogs);
          saveLS(`rs_wlogs_${user.email}`, parsedWLogs);
        }

        if (data.calorieProfile) {
          const cp = data.calorieProfile;
          const parsedCalProfile = {
            gender: cp.gender,
            age: cp.age,
            height: String(cp.height_cm),
            weight: String(cp.weight_kg),
            activity: cp.activity,
            targetCalories: cp.target_calories
          };
          setCalProfile(parsedCalProfile);
          saveLS(`rs_calprofile_${user.email}`, parsedCalProfile);
        }

        if (data.foodEntries) {
          const mappedFoodAll = {};
          data.foodEntries.forEach(f => {
            const dateKey = parseDbDateToLocal(f.eaten_on).toDateString();
            if (!mappedFoodAll[dateKey]) {
              mappedFoodAll[dateKey] = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
            }
            mappedFoodAll[dateKey][f.meal].push({
              id: f.id,
              name: f.name,
              unit: f.unit || "",
              cal: f.calories,
              qty: 1,
              baseCal: f.calories
            });
          });
          setCalAllLogs(mappedFoodAll);
          saveLS(`rs_cal_${user.email}`, mappedFoodAll);
        }


      })
      .catch(err => console.warn("Failed to hydrate user data from backend:", err.message));

    return () => { active = false; };
  }, [user.email]);

  // Derived
  const todayLogs = logs.filter(l => new Date(l.date).toDateString()===today);
  const weekLogs  = logs.filter(l => (Date.now()-new Date(l.date)) < 7*86400000);
  const uniqueExs = [...new Set(logs.map(l=>l.exercise))];

  // Keep selectedEx state in sync with visual select options when selectedEx is not in uniqueExs
  useEffect(() => {
    if (uniqueExs.length > 0 && !uniqueExs.includes(selectedEx)) {
      setSelectedEx(uniqueExs[0]);
    }
  }, [uniqueExs, selectedEx]);

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
        
        /* ─────── MOBILE RESPONSIVE (max-width: 640px) ─────── */
        @media (max-width: 640px) {
          * { margin: 0; padding: 0; }
          body { font-size: 14px; }
          h1 { font-size: 20px !important; }
          h2 { font-size: 16px !important; }
          h3 { font-size: 14px !important; }
          p { font-size: 13px !important; }
          button { font-size: 12px !important; padding: 8px 10px !important; }
          input, select { font-size: 14px !important; }
          [style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          [style*="display:flex"] {
            flex-wrap: wrap !important;
          }
        }
        
        @media (max-width: 360px) {
          h1 { font-size: 18px !important; }
          h2 { font-size: 14px !important; }
          button { font-size: 11px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"10px 16px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 12px rgba(59,130,246,0.06)", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:0 }}>
          <div style={{ width:28, height:28, background:C.primary, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <rect x="2" y="10" width="4" height="4" rx="1" fill="#fff"/>
              <rect x="18" y="10" width="4" height="4" rx="1" fill="#fff"/>
              <rect x="5" y="8" width="2" height="8" rx="1" fill="#fff"/>
              <rect x="17" y="8" width="2" height="8" rx="1" fill="#fff"/>
              <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff"/>
            </svg>
          </div>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(16px, 5vw, 18px)", fontWeight:800, color:C.dark, letterSpacing:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>RS FITNESS</span>
        </div>
        <button onClick={toggleGoal} style={{
          background:goalBg, border:`1px solid ${goalBdr}`, borderRadius:20,
          padding:"6px 12px", cursor:"pointer", color:goalClr,
          fontSize:"clamp(10px, 3vw, 12px)", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5,
          fontFamily:"'Barlow Condensed',sans-serif", transition:"all 0.2s", whiteSpace:"nowrap"
        }}>{goal==="bulking" ? "💪 Bulking" : "🔥 Cutting"}</button>
      </div>

      {/* Content */}
      <div style={{ maxWidth:680, margin:"0 auto", padding:"clamp(12px, 3vw, 20px)" }}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <>
            <div style={{ marginBottom:20 }}>
              <h1 style={{ color:C.dark, margin:"0 0 4px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(22px, 6vw, 26px)", fontWeight:800 }}>
                Hey, {user.name.split(" ")[0]} 👋
              </h1>
              <p style={{ color:C.muted, margin:0, fontSize:"clamp(12px, 3vw, 14px)" }}>
                {todayLogs.length===0 ? "No workouts logged today. Let's go!" : `${todayLogs.length} exercise${todayLogs.length>1?"s":""} logged today. Keep it up!`}
              </p>
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
                    const measuredAt = new Date().toISOString();
                    saveWLogs([...wLogs, { weight:wVal, note:wNote, date:measuredAt }]);
                    sync(api.addBodyMetric({ weightKg:wVal, note:wNote, measuredAt }));
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
                        <span style={{ display:"inline-flex", alignItems:"center", gap:6, marginLeft:9 }}>
                          <button onClick={() => updateFoodQty(activeMeal, item.id, -1)}
                            style={{ width:22, height:22, background:C.card, border:`1px solid ${C.border}`, borderRadius:6,
                              color:C.dark, cursor:"pointer", fontSize:13, fontWeight:700, lineHeight:1, padding:0 }}>-</button>
                          <span style={{ color:C.dark, fontSize:12, fontWeight:700 }}>x{item.qty || 1}</span>
                          <button onClick={() => updateFoodQty(activeMeal, item.id, 1)}
                            style={{ width:22, height:22, background:C.card, border:`1px solid ${C.border}`, borderRadius:6,
                              color:C.dark, cursor:"pointer", fontSize:13, fontWeight:700, lineHeight:1, padding:0 }}>+</button>
                        </span>
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
                  src={`https://www.youtube-nocookie.com/embed/${workoutEx.id}?rel=0&modestbranding=1&enablejsapi=1&fs=1`}
                  title={workoutEx.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
            logs={logs}
            weekLogs={weekLogs}
            uniqueExs={uniqueExs}
            totalVol={totalVol}
            totalCal={totalCal}
            calGoal={calGoal}
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

      {showLog      && <LogModal onClose={() => setShowLog(false)} onSave={entry => {
        saveLogs([...logs, entry]);
        sync(api.createWorkout({
          category: entry.category,
          exercise: entry.exercise,
          note: entry.note,
          mode: entry.mode,
          performedAt: entry.date,
          sets: entry.sets.map(s => ({ weight: Number(s.weight), reps: Number(s.reps) })),
        }));
      }} goal={goal}/>}
      {showCalSetup && <CalSetupModal onClose={() => setShowCalSetup(false)} onSave={p => {
        setCalProfile(p); saveLS(`rs_calprofile_${user.email}`,p);
        sync(api.saveCalorieProfile({
          gender: p.gender,
          age: Number(p.age),
          heightCm: Number(p.height),
          weightKg: Number(p.weight),
          activity: p.activity,
          targetCalories: calcCalGoal(p, goal),
        }));
      }} goal={goal} initial={calProfile}/>}
      {showFoodPicker && <FoodPickerModal meal={activeMeal} onAdd={item => addFood(activeMeal, item)} onClose={() => setShowFoodPicker(false)}/>}
    </div>
  );
}
