/* ============================================================
   AdmissionsSection.jsx
   Place this file at: src/components/AdmissionsSection.jsx
   ============================================================ */
import { useState } from "react";
import { DIAGNOSES, DAY_FULL, btnStyle } from "../constants";

/* ── Calendar Picker ── */
function CalendarPicker({ value, onChange, css }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewYear,  setViewYear]  = useState(value ? new Date(value+"T00:00:00").getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? new Date(value+"T00:00:00").getMonth()    : today.getMonth());

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW    = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function localStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function prevMonth() { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }
  function nextMonth() { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{background:css.card,border:`1px solid ${css.border}`,borderRadius:12,padding:14,userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button type="button" onClick={prevMonth} style={{width:28,height:28,border:`1px solid ${css.border}`,borderRadius:6,background:"transparent",cursor:"pointer",color:css.text,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <span style={{fontWeight:700,fontSize:13,color:css.text}}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} style={{width:28,height:28,border:`1px solid ${css.border}`,borderRadius:6,background:"transparent",cursor:"pointer",color:css.text,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {DOW.map(d => <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:css.textGray,padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`}/>;
          const cellDate = new Date(viewYear, viewMonth, day);
          const cellStr  = localStr(cellDate);
          const isPast   = cellDate < today;
          const isToday  = cellStr === localStr(today);
          const isSel    = cellStr === (value||"");
          return (
            <button type="button" key={cellStr} disabled={isPast} onClick={() => onChange(cellStr)}
              style={{padding:"6px 2px",borderRadius:7,border:"none",cursor:isPast?"not-allowed":"pointer",fontSize:12,fontWeight:isSel||isToday?700:400,background:isSel?"#4361ee":isToday?"#eef2ff":"transparent",color:isSel?"white":isPast?"#d1d5db":isToday?"#4361ee":css.text,outline:"none"}}>
              {day}
            </button>
          );
        })}
      </div>
      {value && (
        <div style={{marginTop:10,padding:"6px 10px",background:"#eef2ff",borderRadius:8,fontSize:12,color:"#4361ee",fontWeight:600,textAlign:"center"}}>
          📅 {new Date(value+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
        </div>
      )}
    </div>
  );
}

/* ── Admissions Section ── */
export default function AdmissionsSection({ doctors, bookForm, setBookForm, availableSlots, slotError, availableDoctors, selectedPart, setSelectedPart, onSubmit, css }) {
  const PARTS = {
    Head:       { cx:100, cy:50,  r:30,                 type:"circle", dept:"Neurology"   },
    Torso:      { x:70,  y:85,  w:60,  h:100, rx:10,   type:"rect",   dept:"Cardiology"  },
    "Left Arm": { x:32,  y:90,  w:28,  h:95,  rx:5, rot:"rotate(12 32 90)",   type:"rect", dept:"Orthopedics" },
    "Right Arm":{ x:140, y:90,  w:28,  h:95,  rx:5, rot:"rotate(-12 140 90)", type:"rect", dept:"Orthopedics" },
    "Left Leg": { x:75,  y:190, w:22,  h:115, rx:5,    type:"rect",   dept:"Orthopedics" },
    "Right Leg":{ x:103, y:190, w:22,  h:115, rx:5,    type:"rect",   dept:"Orthopedics" },
  };

  const partKey    = selectedPart ? (selectedPart.includes("Arm") ? "Arm" : selectedPart.includes("Leg") ? "Leg" : selectedPart) : null;
  const conditions = partKey ? (DIAGNOSES[partKey] || ["General Pain"]) : [];

  function selectPart(name, dept) {
    setSelectedPart(name);
    const conds = DIAGNOSES[name.includes("Arm") ? "Arm" : name.includes("Leg") ? "Leg" : name] || ["General Pain"];
    setBookForm(f => ({ ...f, dept, condition:conds[0], doctor:"" }));
  }

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{background:css.card,padding:28,borderRadius:14,border:`1px solid ${css.border}`,width:"100%"}}>
        <h3 style={{marginBottom:22,color:css.text}}>New Admission — Interactive Diagnosis</h3>
        <div style={{display:"flex",gap:28,flexWrap:"wrap",width:"100%"}}>

          {/* Body diagram */}
          <div style={{flex:"0 0 300px",minWidth:260,background:"radial-gradient(circle,#f8faff 0%,#eef2ff 100%)",borderRadius:14,border:`1px solid ${css.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,gap:12}}>
            <svg width="200" height="380" viewBox="0 0 200 380" style={{overflow:"visible"}}>
              {Object.entries(PARTS).map(([name, p]) => {
                const isActive = selectedPart === name;
                const fill     = isActive ? "#4361ee" : "#e2e8f0";
                const stroke   = isActive ? "#3f37c9" : "#94a3b8";
                return p.type === "circle"
                  ? <circle key={name} cx={p.cx} cy={p.cy} r={p.r} fill={fill} stroke={stroke} strokeWidth={2} style={{cursor:"pointer",transition:"all .25s",filter:isActive?"drop-shadow(0 0 6px rgba(67,97,238,.6))":"none"}} onClick={() => selectPart(name, p.dept)}/>
                  : <rect   key={name} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} fill={fill} stroke={stroke} strokeWidth={2} transform={p.rot||""} style={{cursor:"pointer",transition:"all .25s",filter:isActive?"drop-shadow(0 0 6px rgba(67,97,238,.6))":"none"}} onClick={() => selectPart(name, p.dept)}/>;
              })}
            </svg>
            <div style={{fontSize:12,color:css.textGray,textAlign:"center"}}>{selectedPart ? `✓ Selected: ${selectedPart}` : "Click a body part to select"}</div>
          </div>

          {/* Form */}
          <div style={{flex:1,minWidth:280}}>
            <form onSubmit={onSubmit} style={{display:"grid",gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:css.textGray,display:"block",marginBottom:5}}>Patient Name *</label>
                <input required value={bookForm.name} onChange={e => setBookForm(f => ({...f,name:e.target.value}))} placeholder="Enter full name"
                  style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13,outline:"none"}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:"#4361ee",display:"block",marginBottom:5}}>Detected Condition</label>
                <select value={bookForm.condition} onChange={e => setBookForm(f => ({...f,condition:e.target.value}))}
                  style={{width:"100%",padding:11,border:"2px solid #4361ee",borderRadius:8,background:css.inputBg,color:css.text,fontSize:13,outline:"none"}}>
                  <option value="">-- Select from diagram --</option>
                  {conditions.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:css.textGray,display:"block",marginBottom:5}}>Department</label>
                <select value={bookForm.dept} onChange={e => setBookForm(f => ({...f,dept:e.target.value,doctor:"",time:""}))}
                  style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13}}>
                  {["General","Cardiology","Neurology","Orthopedics","Gastroenterology","Surgery","Pediatrics"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:css.textGray,display:"block",marginBottom:5}}>Assign Doctor <span style={{fontWeight:400,color:css.textGray}}>({availableDoctors.length} available)</span></label>
                <select value={bookForm.doctor} onChange={e => setBookForm(f => ({...f,doctor:e.target.value,time:""}))}
                  style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13}}>
                  <option value="">-- Select doctor --</option>
                  {availableDoctors.map(d => <option key={d.id} value={d.name}>{d.name} · {d.dept} ({d.status})</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:css.textGray,display:"block",marginBottom:8}}>Appointment Date *</label>
                <CalendarPicker value={bookForm.date} onChange={date => setBookForm(f => ({...f,date,time:""}))} css={css}/>
              </div>
              {bookForm.doctor && bookForm.date && (
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:css.textGray,display:"block",marginBottom:8}}>
                    Available Time Slots {availableSlots.length > 0 && <span style={{color:"#22c55e",marginLeft:6}}>({availableSlots.length} free)</span>}
                  </label>
                  {slotError
                    ? <div style={{padding:12,background:"#fee2e2",borderRadius:8,color:"#991b1b",fontSize:12,border:"1px solid #fecaca"}}>⛔ {slotError}</div>
                    : <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                        {availableSlots.map(slot => (
                          <button type="button" key={slot} onClick={() => setBookForm(f => ({...f,time:slot}))}
                            style={{padding:"7px 13px",borderRadius:8,border:`2px solid ${bookForm.time===slot?"#4361ee":css.border}`,background:bookForm.time===slot?"#4361ee":"transparent",color:bookForm.time===slot?"white":css.text,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .15s"}}>
                            {slot}
                          </button>
                        ))}
                      </div>
                  }
                </div>
              )}
              <button type="submit" style={{...btnStyle,padding:"12px 0",fontSize:14,marginTop:4,width:"100%"}}>🏥 Admit Patient</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
