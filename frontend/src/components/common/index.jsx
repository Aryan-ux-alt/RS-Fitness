import React from "react";
import { C } from "../../constants/data";

export function Avatar({ name, size = 40 }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:C.primary,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:size*0.35, color:"#fff", flexShrink:0,
      fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1, minWidth:size, minHeight:size }}>
      {initials}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block", marginBottom:5, fontSize:"clamp(10px, 2vw, 11px)", color:C.muted,
        fontWeight:600, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>}
      {children}
    </div>
  );
}

export function TextInput({ label, ...props }) {
  return (
    <Field label={label}>
      <input {...props} style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`,
        borderRadius:8, padding:"10px 14px", color:C.dark, fontSize:"clamp(13px, 3vw, 14px)", outline:"none",
        fontFamily:"'Barlow',sans-serif", boxSizing:"border-box", ...props.style }}
        onFocus={e => e.target.style.borderColor = C.primary}
        onBlur={e => e.target.style.borderColor = C.border} />
    </Field>
  );
}

export function PrimaryBtn({ children, onClick, style: s }) {
  return (
    <button onClick={onClick} style={{ width:"100%", background:C.primary, border:"none",
      borderRadius:8, padding:"11px 20px", color:"#fff", fontSize:"clamp(12px, 3vw, 14px)", fontWeight:700,
      cursor:"pointer", letterSpacing:0.5, fontFamily:"'Barlow Condensed',sans-serif",
      textTransform:"uppercase", transition:"opacity 0.15s", minHeight:40, ...s }}
      onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, style: s }) {
  return (
    <button onClick={onClick} style={{ width:"100%", background:"transparent",
      border:`1px solid ${C.border}`, borderRadius:8, padding:"11px 20px", color:C.dark,
      fontSize:"clamp(12px, 3vw, 14px)", fontWeight:700, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
      textTransform:"uppercase", transition:"background 0.15s", minHeight:40, ...s }}
      onMouseEnter={e=>e.currentTarget.style.background=C.surface}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      {children}
    </button>
  );
}

export function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(30,58,95,0.45)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"clamp(12px, 5vw, 16px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card, borderRadius:16, padding:"clamp(16px, 4vw, 24px)",
        width:"100%", maxWidth:420, border:`1px solid ${C.border}`,
        boxShadow:"0 16px 48px rgba(59,130,246,0.15)", maxHeight:"90vh", overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ children }) {
  return <h2 style={{ color:C.dark, fontFamily:"'Barlow Condensed',sans-serif",
    fontSize:"clamp(18px, 5vw, 22px)", fontWeight:800, margin:"0 0 16px" }}>{children}</h2>;
}

export function StatCard({ label, value, color, badge }) {
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
      <div style={{ fontSize:"clamp(9px, 2vw, 10px)", color:C.muted, textTransform:"uppercase", letterSpacing:1,
        fontWeight:600, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:"clamp(15px, 4vw, 17px)", fontWeight:800, color:color||C.primary,
        fontFamily:"'Barlow Condensed',sans-serif" }}>{value}</div>
    </div>
  );
}

export const authInputStyle = {
  width:"100%", background:"#EEF4FF", border:"1.5px solid #DBEAFE",
  borderRadius:9, padding:"13px 14px", color:"#1E3A5F", fontSize:"16px",
  outline:"none", fontFamily:"'Barlow',sans-serif", boxSizing:"border-box",
  transition:"border-color 0.2s", WebkitAppearance:"none",
};

export function AuthInput({ label, style: extraStyle, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", marginBottom:5, fontSize:"clamp(10px, 2vw, 11px)", color:"#93A8C8",
        fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>
      <input {...props} style={{ ...authInputStyle, ...extraStyle }}
        onFocus={e => e.target.style.borderColor="#3B82F6"}
        onBlur={e => e.target.style.borderColor="#DBEAFE"}/>
    </div>
  );
}

