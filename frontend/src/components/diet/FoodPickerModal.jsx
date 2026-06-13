import { useState } from "react";
import { C, INDIAN_FOODS } from "../../constants/data";
import { Overlay } from "../common";

export default function FoodPickerModal({ meal, onAdd, onClose }) {
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

// ─── AI DIET ADVISOR COMPONENT ────────────────────────────────────────────────
