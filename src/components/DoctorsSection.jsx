/* ============================================================
   DoctorsSection.jsx
   Place this file at: src/components/DoctorsSection.jsx
   ============================================================ */
import { DAY_NAMES, btnStyle, btnOutlineStyle, generateTimeSlots } from "../constants";

/* ── Schedule Modal ── */
export function ScheduleModal({ doctor: doc, css, onClose }) {
  const today = new Date();
  const days  = Array.from({ length:14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:19999,backdropFilter:"blur(4px)"}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:css.card,width:580,maxHeight:"85vh",overflowY:"auto",padding:28,borderRadius:16,zIndex:20000,boxShadow:"0 25px 50px rgba(0,0,0,.25)",animation:"slideUp .3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <h3 style={{color:"#4361ee",marginBottom:4}}>📅 {doc.name}'s Schedule</h3>
            <p style={{color:css.textGray,fontSize:12}}>{doc.dept} · Works: {doc.workingDays.map(x=>DAY_NAMES[x]).join(", ")} · {doc.workingHours.start}–{doc.workingHours.end}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:css.textGray}}>✕</button>
        </div>
        <div style={{display:"grid",gap:12}}>
          {days.map(date => {
            const dow       = new Date(date).getDay();
            const isWorking = doc.workingDays.includes(dow);
            const allSlots  = isWorking ? generateTimeSlots(doc.workingHours.start, doc.workingHours.end) : [];
            const busyTimes = new Set(doc.busySlots.filter(s => s.date === date).map(s => s.time));
            const label     = new Date(date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
            return (
              <div key={date} style={{background:css.bg,borderRadius:10,padding:"12px 16px",border:`1px solid ${css.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isWorking?10:0}}>
                  <span style={{fontWeight:600,fontSize:13,color:css.text}}>{label}</span>
                  {!isWorking
                    ? <span style={{fontSize:11,padding:"3px 10px",background:"#fee2e2",color:"#991b1b",borderRadius:20}}>Day Off</span>
                    : <span style={{fontSize:11,padding:"3px 10px",background:"#dcfce7",color:"#166534",borderRadius:20}}>Working</span>
                  }
                </div>
                {isWorking && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {allSlots.map(slot => {
                      const busy = busyTimes.has(slot);
                      return (
                        <span key={slot} style={{padding:"3px 9px",borderRadius:6,fontSize:11,fontWeight:600,background:busy?"#fef9c3":css.card,color:busy?"#854d0e":"#22c55e",border:`1px solid ${busy?"#fde68a":"#bbf7d0"}`}}>
                          {busy ? "🔒" : "✓"} {slot}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Doctors Section ── */
export default function DoctorsSection({ doctors, filter, setFilter, css, showToast, onToggle, onSchedule }) {
  const depts       = ["All","Cardiology","Neurology","Orthopedics","General","Surgery","Gastroenterology","Pediatrics"];
  const statusColor = { Available:"#22c55e", Busy:"#f59e0b", "On Leave":"#ef4444" };
  const statusBg    = { Available:"#dcfce7", Busy:"#fef9c3", "On Leave":"#fee2e2" };

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {depts.map(d => (
          <button key={d} onClick={() => setFilter(d)}
            style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${filter===d?"#4361ee":css.border}`,background:filter===d?"#4361ee":"transparent",color:filter===d?"white":css.textGray,cursor:"pointer",fontSize:12,fontWeight:filter===d?600:400,transition:"all .2s"}}>
            {d}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:22}}>
        {doctors.map(d => (
          <div key={d.id} style={{background:css.card,padding:24,borderRadius:14,textAlign:"center",border:`1px solid ${css.border}`,transition:"all .25s",cursor:"pointer"}} onClick={() => onToggle(d.id)}>
            <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 14px",background:statusBg[d.status],display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:statusColor[d.status]}}>{d.img}</div>
            <h3 style={{fontSize:14,fontWeight:700,color:css.text,marginBottom:4}}>{d.name}</h3>
            <p style={{color:"#4361ee",fontSize:12,marginBottom:8}}>{d.dept}</p>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:20,background:statusBg[d.status],marginBottom:12}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:statusColor[d.status]}}/>
              <span style={{fontSize:11,fontWeight:600,color:statusColor[d.status]}}>{d.status}</span>
            </div>
            <div style={{fontSize:11,color:css.textGray,marginBottom:8}}>Works: {d.workingDays.map(x => DAY_NAMES[x]).join(", ")}</div>
            <div style={{fontSize:11,color:css.textGray,marginBottom:12}}>Hours: {d.workingHours.start} – {d.workingHours.end}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={e => { e.stopPropagation(); showToast(`Calling ${d.name}...`,"info"); }}
                style={{flex:1,...btnOutlineStyle(css),padding:"7px 0",fontSize:12,borderRadius:8}}>📞 Call</button>
              <button onClick={e => { e.stopPropagation(); onSchedule(d); }}
                style={{flex:1,...btnStyle,padding:"7px 0",fontSize:12}}>📅 Schedule</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
