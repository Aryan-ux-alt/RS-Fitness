import { useState, useMemo } from "react";
import { C, EXERCISES } from "../../constants/data";
import { Field, GhostBtn, Overlay, PrimaryBtn } from "../common";

export default function LogModal({ onClose, onSave, goal }) {
  const [cat, setCat] = useState("All");
  const [exercise, setExercise] = useState(null);
  const [sets, setSets] = useState([{ weight:"", reps:"" }]);
  const [mode, setMode] = useState(goal || "bulking");
  const [note, setNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter exercises based on search term
  const filteredExercises = useMemo(() => {
    let exercises = [];
    if (cat === "All") {
      // Get all exercises from all categories
      Object.values(EXERCISES).forEach(catExercises => {
        exercises = [...exercises, ...catExercises];
      });
      // Remove duplicates
      exercises = [...new Set(exercises)];
    } else {
      exercises = EXERCISES[cat] || [];
    }
    
    if (!searchTerm.trim()) {
      return exercises;
    }
    return exercises.filter(ex => 
      ex.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cat, searchTerm]);

  // Get all exercises across all categories for global search
  const allExercisesFlat = useMemo(() => {
    const result = [];
    Object.entries(EXERCISES).forEach(([category, exercises]) => {
      exercises.forEach(exercise => {
        if (!result.includes(exercise)) {
          result.push(exercise);
        }
      });
    });
    return result;
  }, []);

  const globalSearchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return allExercisesFlat.filter(ex => 
      ex.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allExercisesFlat]);

  const handleExerciseSelect = (ex) => {
    setExercise(ex);
    setSearchTerm("");
  };

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
      <h3 style={{ color:C.dark, margin:"0 0 18px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:700 }}>Workout Hub</h3>

      <Field label="Category">
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", maxHeight:120, overflowY:"auto", paddingRight:8 }}>
          <button onClick={() => { setCat("All"); setExercise(null); setSearchTerm(""); }}
            style={{ padding:"5px 13px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
              background:cat==="All" ? C.primary : C.surface, color:cat==="All" ? "#fff" : C.muted,
              fontFamily:"'Barlow',sans-serif", whiteSpace:"nowrap" }}>All</button>
          {Object.keys(EXERCISES).map(catKey => (
            <button key={catKey} onClick={() => { setCat(catKey); setExercise(EXERCISES[catKey][0]); setSearchTerm(""); }}
              style={{ padding:"5px 13px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                background:cat===catKey ? C.primary : C.surface, color:cat===catKey ? "#fff" : C.muted,
                fontFamily:"'Barlow',sans-serif", whiteSpace:"nowrap" }}>{catKey}</button>
          ))}
        </div>
      </Field>

      <Field label="Search Exercise">
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by exercise name..."
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"10px 14px", color:C.dark, fontSize:14, outline:"none", fontFamily:"'Barlow',sans-serif" }}/>
        {searchTerm && globalSearchResults.length > 0 && (
          <div style={{ marginTop:8, maxHeight:180, overflowY:"auto", border:`1px solid ${C.border}`, borderRadius:6, background:"#fff" }}>
            {globalSearchResults.map((ex, i) => (
              <button key={i} onClick={() => handleExerciseSelect(ex)}
                style={{ display:"block", width:"100%", padding:"8px 12px", border:"none", background:exercise===ex ? C.surface : "transparent",
                  textAlign:"left", cursor:"pointer", fontSize:13, color:C.dark, fontFamily:"'Barlow',sans-serif",
                  borderBottom:i < globalSearchResults.length-1 ? `1px solid ${C.border}` : "none",
                  fontWeight:exercise===ex ? 600 : 400 }}>
                {ex}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label="Exercise">
        <select value={exercise || ""} onChange={e => handleExerciseSelect(e.target.value)}
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"10px 14px", color:C.dark, fontSize:14, outline:"none", fontFamily:"'Barlow',sans-serif" }}>
          <option value="" disabled>Select an exercise</option>
          {filteredExercises.length > 0 ? (
            filteredExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)
          ) : (
            <option disabled>No exercises found</option>
          )}
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
