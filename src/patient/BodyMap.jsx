/* ============================================================
   BodyMap.jsx — "Help me choose": the patient taps where it hurts
   (front or back of the body) or picks a category such as skin, mind,
   child's health; then picks a symptom. The symptom decides the
   department and becomes the visit reason. Data: symptoms.js
   ============================================================ */
import { useState } from "react";
import Icon from "../ui/Icon";
import { BODY_AREAS, CATEGORIES } from "./symptoms";
import { money } from "../ui/records";

// clickable shapes on a 220 x 440 figure
const FRONT = [
  ["arms",    "rect",    { x: 36, y: 104, width: 24, height: 128, rx: 12, transform: "rotate(9 48 104)" }],
  ["arms",    "rect",    { x: 160, y: 104, width: 24, height: 128, rx: 12, transform: "rotate(-9 172 104)" }],
  ["legs",    "rect",    { x: 77, y: 228, width: 30, height: 186, rx: 14 }],
  ["legs",    "rect",    { x: 113, y: 228, width: 30, height: 186, rx: 14 }],
  ["head",    "circle",  { cx: 110, cy: 48, r: 32 }],
  ["eyes",    "ellipse", { cx: 110, cy: 42, rx: 21, ry: 8 }],
  ["ent",     "rect",    { x: 100, y: 53, width: 20, height: 22, rx: 8 }],
  ["neck",    "rect",    { x: 97, y: 80, width: 26, height: 18, rx: 6 }],
  ["chest",   "rect",    { x: 66, y: 98, width: 88, height: 68, rx: 16 }],
  ["abdomen", "rect",    { x: 72, y: 166, width: 76, height: 62, rx: 14 }],
];
const BACK = [
  ["arms",      "rect",   { x: 36, y: 104, width: 24, height: 128, rx: 12, transform: "rotate(9 48 104)" }],
  ["arms",      "rect",   { x: 160, y: 104, width: 24, height: 128, rx: 12, transform: "rotate(-9 172 104)" }],
  ["legs",      "rect",   { x: 77, y: 228, width: 30, height: 186, rx: 14 }],
  ["legs",      "rect",   { x: 113, y: 228, width: 30, height: 186, rx: 14 }],
  ["head",      "circle", { cx: 110, cy: 48, r: 32 }],
  ["neck",      "rect",   { x: 97, y: 80, width: 26, height: 18, rx: 6 }],
  ["upperBack", "rect",   { x: 66, y: 98, width: 88, height: 68, rx: 16 }],
  ["lowerBack", "rect",   { x: 72, y: 166, width: 76, height: 62, rx: 14 }],
];
const SHAPE = { rect: "rect", circle: "circle", ellipse: "ellipse" };

export default function BodyMap({ css, accent, isDark, departments, onPick }) {
  const [view, setView] = useState("front");
  const [area, setArea] = useState(null);           // key in BODY_AREAS or CATEGORIES
  const [hover, setHover] = useState(null);
  const group = area ? (BODY_AREAS[area] || CATEGORIES[area]) : null;
  const deptByName = Object.fromEntries(departments.map(d => [d.name, d]));
  const shapes = view === "front" ? FRONT : BACK;

  const fillFor = (key) => key === area ? accent : key === hover ? `${accent}80` : isDark ? "#334155" : "#e2e8f0";
  const strokeFor = (key) => key === area ? accent : isDark ? "#475569" : "#cbd5e1";

  return (
    <div className="mc-bodymap" style={{ display: "grid", gridTemplateColumns: "minmax(200px, 260px) minmax(0, 1fr)", gap: 22 }}>
      {/* figure */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", padding: 3, borderRadius: 10, background: css.subtle, border: `1px solid ${css.border}` }}>
          {[["front", "Front"], ["back", "Back"]].map(([id, label]) => (
            <button key={id} onClick={() => { setView(id); if (BODY_AREAS[area] && !(id === "front" ? FRONT : BACK).some(s => s[0] === area)) setArea(null); }}
              style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 650,
                background: view === id ? css.card : "transparent", color: view === id ? accent : css.textGray, boxShadow: view === id ? `0 1px 3px ${css.ring}` : "none" }}>
              {label}
            </button>
          ))}
        </div>
        <svg viewBox="0 0 220 430" style={{ width: "100%", maxWidth: 230 }} role="img" aria-label={`Body diagram, ${view} view`}>
          {shapes.map(([key, type, attrs], i) => {
            const Tag = SHAPE[type];
            return (
              <Tag key={`${key}-${i}`} {...attrs} fill={fillFor(key)} stroke={strokeFor(key)} strokeWidth="2"
                style={{ cursor: "pointer", transition: "fill .15s" }}
                onClick={() => setArea(key)} onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)}>
                <title>{BODY_AREAS[key].label}</title>
              </Tag>
            );
          })}
          {view === "front" && (
            <g pointerEvents="none" fill={area === "eyes" ? "white" : isDark ? "#94a3b8" : "#64748b"}>
              <circle cx="101" cy="42" r="2.5"/><circle cx="119" cy="42" r="2.5"/>
            </g>
          )}
        </svg>
        <div style={{ fontSize: 12, color: css.textGray, textAlign: "center", minHeight: 18 }}>
          {hover ? BODY_AREAS[hover].label : view === "front" ? "Tap where it hurts. Turn around for back pain." : "Tap the part of your back that hurts."}
        </div>
      </div>

      {/* categories + symptoms */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 650, color: css.textGray, marginBottom: 8 }}>Not about one body part?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 8, marginBottom: 18 }}>
          {Object.entries(CATEGORIES).map(([key, c]) => {
            const on = key === area;
            return (
              <button key={key} onClick={() => setArea(key)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 10, cursor: "pointer", textAlign: "left", fontSize: 12.5, fontWeight: 600,
                  border: `1px solid ${on ? accent : css.border}`, background: on ? `${accent}14` : css.card, color: on ? accent : css.text }}>
                <Icon name={c.icon} size={16}/>{c.label}
              </button>
            );
          })}
        </div>

        {!group ? (
          <div style={{ padding: 20, borderRadius: 14, border: `1px dashed ${css.border}`, color: css.textGray, fontSize: 13, textAlign: "center" }}>
            <Icon name="info" size={20} style={{ margin: "0 auto 8px" }}/>
            Choose a body part on the figure or one of the categories above, then pick what fits best.
            We'll suggest the right department.
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: css.text, marginBottom: 10 }}>{group.label}: what's the problem?</div>
            <div style={{ display: "grid", gap: 8 }}>
              {group.symptoms.map(([text, deptName]) => {
                const dept = deptByName[deptName] || deptByName.General;
                return (
                  <button key={text} disabled={!dept} onClick={() => onPick(dept, text)} className="mc-row-hover"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, cursor: dept ? "pointer" : "not-allowed",
                      border: `1px solid ${css.border}`, background: css.card, color: css.text, textAlign: "left" }}>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{text}</span>
                    {dept && <span style={{ fontSize: 11.5, color: accent, fontWeight: 650, whiteSpace: "nowrap" }}>{dept.name} · {money(dept.consultationFee)}</span>}
                    <Icon name="chevronRight" size={16} color={css.textGray}/>
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 11.5, color: css.textGray, marginTop: 12 }}>
              This is a guide to find the right department, not a diagnosis. For severe chest pain, breathing trouble or heavy bleeding, call 108 now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
