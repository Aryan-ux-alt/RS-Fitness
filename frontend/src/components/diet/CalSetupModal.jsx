import { useState } from "react";
import { C } from "../../constants/data";
import { Field, GhostBtn, Overlay, PrimaryBtn } from "../common";

export default function CalSetupModal({ onClose, onSave, goal, initial }) {
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
      <style>{`
        @media (max-width: 640px) {
          .cal-setup-title { font-size: 18px !important; }
          .cal-setup-gender-btn { font-size: 12px !important; padding: 7px !important; }
          .cal-setup-preview { padding: 10px 12px !important; }
          .cal-setup-preview-value { font-size: 26px !important; }
          .cal-setup-preview-unit { font-size: 12px !important; }
          .cal-setup-preview-desc { font-size: 11px !important; }
        }
      `}</style>
      <h3 className="cal-setup-title" style={{ color:C.dark, margin:"0 0 16px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(18px, 5vw, 20px)", fontWeight:700 }}>🎯 Calorie Goal Setup</h3>
      {[{ label:"Height (cm)", key:"height", ph:"e.g. 175" },
        { label:"Weight (kg)",  key:"weight", ph:"e.g. 72" },
        { label:"Age",          key:"age",    ph:"e.g. 24" }].map(f => (
        <Field key={f.key} label={f.label}>
          <input type="number" value={form[f.key]} onChange={set(f.key)} placeholder={f.ph}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
              padding:"9px 14px", color:C.dark, fontSize:"clamp(13px, 3vw, 14px)", outline:"none", fontFamily:"'Barlow',sans-serif", boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor=C.primary}
            onBlur={e=>e.target.style.borderColor=C.border}/>
        </Field>
      ))}
      <Field label="Gender">
        <div style={{ display:"flex", gap:8 }}>
          {["male","female"].map(g => (
            <button key={g} onClick={() => setForm(f=>({...f,gender:g}))} className="cal-setup-gender-btn" style={{
              flex:1, padding:"8px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:"clamp(12px, 3vw, 13px)",
              fontFamily:"'Barlow',sans-serif", textTransform:"capitalize", minHeight:36,
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
            padding:"9px 14px", color:C.dark, fontSize:"clamp(12px, 3vw, 13px)", outline:"none", fontFamily:"'Barlow',sans-serif", minHeight:36 }}>
          <option value="sedentary">Sedentary (desk job, little/no exercise)</option>
          <option value="light">Light (1–2 days/week)</option>
          <option value="moderate">Moderate (3–5 days/week)</option>
          <option value="active">Active (6–7 days/week)</option>
          <option value="very_active">Very Active (2× per day)</option>
        </select>
      </Field>
      {preview && (
        <div className="cal-setup-preview" style={{ background:C.surface, borderRadius:10, padding:"12px 16px", marginBottom:16, textAlign:"center" }}>
          <div style={{ fontSize:"clamp(10px, 2vw, 11px)", color:C.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>
            Your estimated goal ({goal})
          </div>
          <div className="cal-setup-preview-value" style={{ fontSize:"clamp(24px, 6vw, 30px)", fontWeight:800, color:C.primary, fontFamily:"'Barlow Condensed',sans-serif" }}>
            {preview} <span className="cal-setup-preview-unit" style={{ fontSize:"clamp(12px, 3vw, 14px)", color:C.muted, fontWeight:500 }}>kcal/day</span>
          </div>
          <div className="cal-setup-preview-desc" style={{ fontSize:"clamp(11px, 2vw, 12px)", color:C.muted, marginTop:4 }}>
            {goal==="bulking" ? "TDEE + 300 kcal surplus" : "TDEE − 400 kcal deficit"}
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:"clamp(8px, 2vw, 10px)", flexWrap:"wrap" }}>
        <GhostBtn onClick={onClose} style={{ flex:1, minWidth:"80px" }}>Cancel</GhostBtn>
        <PrimaryBtn onClick={() => { onSave(form); onClose(); }} style={{ flex:1.5, minWidth:"100px" }}>Save Goal</PrimaryBtn>
      </div>
    </Overlay>
  );
}

// ─── FOOD PICKER MODAL ─────────────────────────────────────────────────────────
