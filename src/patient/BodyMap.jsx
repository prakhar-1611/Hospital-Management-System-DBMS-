/* ============================================================
   BodyMap.jsx — "Help me choose": the patient taps where it hurts
   (front or back of the body) or picks a category such as skin, mind,
   child's health; then picks a symptom. The symptom decides the
   department and becomes the visit reason. Data: symptoms.js
   Every region on the figure is also a chip beside it, so the map works
   by keyboard, screen reader and on small touch screens.
   ============================================================ */
import { useState } from "react";
import Icon from "../ui/Icon";
import { Segmented } from "../ui/kit";
import { BODY_AREAS, CATEGORIES } from "./symptoms";
import { money } from "../ui/records";

// regions tile a 220 x 440 figure; mirrored limbs share a key
const ARM_L = "M60 104C50 106 45 116 44 130L37 204C35 220 31 236 31 248C31 258 40 262 45 255C48 248 48 240 49 232L55 206L61 160C62 140 62 120 60 104Z";
const ARM_R = "M160 104C170 106 175 116 176 130L183 204C185 220 189 236 189 248C189 258 180 262 175 255C172 248 172 240 171 232L165 206L159 160C158 140 158 120 160 104Z";
const LEG_L = "M64 236L108 236L106 300C104 330 100 360 99 400L100 414C101 422 96 426 88 426L72 426C66 426 64 421 68 416L76 404C74 370 70 340 68 310C66 285 64 260 64 236Z";
const LEG_R = "M156 236L112 236L114 300C116 330 120 360 121 400L120 414C119 422 124 426 132 426L148 426C154 426 156 421 152 416L144 404C146 370 150 340 152 310C154 285 156 260 156 236Z";
const UPPER = "M98 90C86 92 70 95 63 105C60 120 66 140 70 170L150 170C154 140 160 120 157 105C150 95 134 92 122 90Z";
const LOWER = "M70 170L150 170C151 190 154 215 156 236L64 236C66 215 69 190 70 170Z";
const NECK = "M99 68L121 68L123 92L97 92Z";
const HEAD = "M110 13C125 13 136 26 136 44C136 62 125 75 110 75C95 75 84 62 84 44C84 26 95 13 110 13Z";
const EARS = "M84 38C79 38 78 50 84 54ZM136 38C141 38 142 50 136 54Z";

const FRONT = [
  ["arms", ARM_L], ["arms", ARM_R], ["legs", LEG_L], ["legs", LEG_R],
  ["chest", UPPER], ["abdomen", LOWER], ["neck", NECK], ["head", HEAD],
  ["ent", `${EARS}M110 45C112 50 115 54 116 57C116 60 113 61 110 61C107 61 104 60 104 57C105 54 108 50 110 45Z`],
  ["eyes", "M93 40C93 36.5 96 35 100 35C104 35 107 36.5 107 40C107 43.5 104 45 100 45C96 45 93 43.5 93 40ZM113 40C113 36.5 116 35 120 35C124 35 127 36.5 127 40C127 43.5 124 45 120 45C116 45 113 43.5 113 40Z"],
];
const BACK = [
  ["arms", ARM_L], ["arms", ARM_R], ["legs", LEG_L], ["legs", LEG_R],
  ["upperBack", UPPER], ["lowerBack", LOWER], ["neck", NECK], ["head", `${HEAD}${EARS}`],
];
const VIEW_KEYS = { front: [...new Set(FRONT.map(s => s[0]))], back: [...new Set(BACK.map(s => s[0]))] };

export default function BodyMap({ departments, onPick }) {
  const [view, setView] = useState("front");
  const [area, setArea] = useState(null);           // key in BODY_AREAS or CATEGORIES
  const [hover, setHover] = useState(null);
  const group = area ? (BODY_AREAS[area] || CATEGORIES[area]) : null;
  const deptByName = Object.fromEntries(departments.map(d => [d.name, d]));
  const shapes = view === "front" ? FRONT : BACK;

  function turn(v) {
    setView(v);
    if (BODY_AREAS[area] && !VIEW_KEYS[v].includes(area)) setArea(null);
  }

  return (
    <div className="mc-bodymap" style={{ display: "grid", gridTemplateColumns: "minmax(180px, 240px) minmax(0, 1fr)", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Segmented label="Side of the body" value={view} onChange={turn} options={[{ value: "front", label: "Front" }, { value: "back", label: "Back" }]}/>
        <svg viewBox="0 0 220 440" style={{ width: "100%", maxWidth: "min(220px, 44vw)", maxHeight: "52vh" }} aria-label={`Body diagram, ${view}`}>
          {shapes.map(([key, d], i) => (
            <path key={`${key}-${i}`} d={d} tabIndex={0} role="button" aria-label={BODY_AREAS[key].label} aria-pressed={key === area}
              className={`mc-body-part${key === area ? " mc-body-part--on" : key === hover ? " mc-body-part--hot" : ""}`}
              onClick={() => setArea(key)} onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(key)} onBlur={() => setHover(null)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setArea(key); } }}>
              <title>{BODY_AREAS[key].label}</title>
            </path>
          ))}
          {view === "back" && <path d="M110 96V228" stroke="var(--sheet)" strokeWidth="2" strokeDasharray="3 5" pointerEvents="none"/>}
        </svg>
        <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", minHeight: 20 }} aria-live="polite">
          {hover ? BODY_AREAS[hover].label : view === "front" ? "Tap where it hurts. Turn around for back pain." : "Tap the part of your back that hurts."}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Where is the problem?</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {VIEW_KEYS[view].map(key => (
            <button key={key} type="button" aria-pressed={key === area} onClick={() => setArea(key)} className={key === area ? "mc-chip mc-chip--on" : "mc-chip"}>
              {key === area && <Icon name="check" size={14} stroke={2.5}/>}{BODY_AREAS[key].label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Not about one body part?</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button key={key} type="button" aria-pressed={key === area} onClick={() => setArea(key)} className={key === area ? "mc-chip mc-chip--on" : "mc-chip"}>
              <Icon name={key === area ? "check" : c.icon} size={15}/>{c.label}
            </button>
          ))}
        </div>

        {!group ? (
          <p style={{ padding: "16px 0", borderTop: "1px solid var(--rule)", color: "var(--muted)", fontSize: 14 }}>
            Choose a body part or a category, then the problem that fits best. We will suggest the right department.
          </p>
        ) : (
          <section aria-label={`${group.label} symptoms`}>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{group.label}: what is the problem?</h4>
            <div style={{ borderTop: "1px solid var(--rule)" }}>
              {group.symptoms.map(([text, deptName]) => {
                const dept = deptByName[deptName] || deptByName.General;
                return (
                  <button key={text} type="button" disabled={!dept} onClick={() => onPick(dept, text)} className="mc-list-btn">
                    <span style={{ flex: 1, fontWeight: 500 }}>{text}</span>
                    {dept && <span style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}>{dept.name}, {money(dept.consultationFee)}</span>}
                    <Icon name="chevronRight" size={16} color="var(--muted)"/>
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, maxWidth: "70ch" }}>
              This helps you find a department; it is not a diagnosis. For severe chest pain, trouble breathing or heavy bleeding, call 108 now.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
