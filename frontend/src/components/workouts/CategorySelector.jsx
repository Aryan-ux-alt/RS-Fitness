import { C } from "../../constants/data";

const CATEGORIES = [
  { name: "Push", emoji: "💪", color: "#FF6B6B", description: "Chest, Shoulders, Triceps" },
  { name: "Pull", emoji: "🔗", color: "#4ECDC4", description: "Back, Biceps, Lats" },
  { name: "Legs", emoji: "🦵", color: "#45B7D1", description: "Quads, Hamstrings, Glutes" },
  { name: "Core", emoji: "🎯", color: "#FFA07A", description: "Abs, Obliques, Lower Back" },
  { name: "Cardio", emoji: "🏃", color: "#FFD93D", description: "Running, Cycling, HIIT" },
  { name: "Mobility", emoji: "🧘", color: "#95E1D3", description: "Stretching, Flexibility, Recovery" },
];

export default function CategorySelector({ onSelectCategory, onClose }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "600px",
        width: "100%",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <div style={{ marginBottom: "8px" }}>
          <h2 style={{
            color: C.dark,
            margin: "0 0 8px",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: "24px",
            fontWeight: 700,
          }}>
            🏋️ What are you training?
          </h2>
          <p style={{
            color: C.muted,
            margin: "0",
            fontSize: "14px",
            fontFamily: "'Barlow',sans-serif",
          }}>
            Select a category to get started
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "24px",
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              style={{
                padding: "20px 16px",
                background: "white",
                border: `2px solid ${cat.color}`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "'Barlow',sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: C.dark,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = `${cat.color}15`;
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "white";
                e.target.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{cat.emoji}</div>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>{cat.name}</div>
              <div style={{ fontSize: "12px", color: C.muted, fontWeight: 400 }}>
                {cat.description}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "10px 16px",
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            cursor: "pointer",
            color: C.muted,
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "'Barlow',sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = C.light;
            e.target.style.color = C.dark;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = C.muted;
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
