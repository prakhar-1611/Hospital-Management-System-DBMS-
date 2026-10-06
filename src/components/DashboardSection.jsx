/* ============================================================
   DashboardSection.jsx
   Place this file at: src/components/DashboardSection.jsx
   ============================================================ */
import { useState, useEffect } from "react";
import { btnStyle } from "../constants";

function ActivityDetail({ a, css }) {
  return (
    <div>
      {[["Patient",a.patient],["Action",a.action],["Date",a.date||"—"],["Time",a.time],["Doctor",a.doctor||"—"],["Status",a.status]].map(([k,v]) => (
        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:`1px solid ${css.border}`,fontSize:13}}>
          <strong style={{color:css.textGray}}>{k}</strong>
          <span style={{color:css.text}}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function RevenueDetail({ invoices, css }) {
  const paid  = invoices.filter(i => i.status === "Paid");
  const total = paid.reduce((s, i) => s + i.grandTotal, 0);
  const depts = {};
  paid.forEach(i => { depts[i.dept] = (depts[i.dept] || 0) + i.grandTotal; });
  return (
    <div>
      <div style={{fontSize:18,color:"#4361ee",fontWeight:700,marginBottom:16}}>
        Collected: ${total.toLocaleString(undefined,{minimumFractionDigits:2})}
      </div>
      {Object.entries(depts).map(([d, v]) => (
        <div key={d} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${css.border}`,fontSize:13}}>
          <strong style={{color:css.textGray}}>{d}</strong>
          <span style={{color:css.text}}>${v.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
      ))}
      <div style={{marginTop:16,padding:10,background:"#f0fdf4",color:"#166534",fontSize:12,borderRadius:8,textAlign:"center"}}>
        ✅ Based on {paid.length} paid invoice{paid.length !== 1 ? "s" : ""}.
      </div>
    </div>
  );
}

export { ActivityDetail, RevenueDetail };

export default function DashboardSection({ patients, doctors, appointments, invoices, totalRevenue, css, onViewActivity, onRevenue, onNavigate }) {
  const [counts, setCounts] = useState({ p:0, d:0, r:0 });

  useEffect(() => {
    let frame;
    const start = Date.now();
    const dur = 1200;
    function tick() {
      const p = Math.min((Date.now() - start) / dur, 1);
      setCounts({ p:Math.floor(p*patients.length), d:Math.floor(p*doctors.length), r:Math.floor(p*totalRevenue) });
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [patients.length, doctors.length, totalRevenue]);

  const unpaidCount = invoices.filter(i => i.status === "Unpaid").length;
  const stats = [
    { label:"Total Patients",     value:counts.p,                     icon:"🤕", bg:"#eff6ff", nav:"patients" },
    { label:"Doctors",            value:counts.d,                     icon:"👨‍⚕️", bg:"#f0fdf4", nav:"doctors"  },
    { label:"Revenue Collected",  value:"$"+counts.r.toLocaleString(),icon:"💰", bg:"#fef2f2", nav:null        },
    { label:"Unpaid Invoices",    value:unpaidCount,                  icon:"📄", bg:"#fef9c3", nav:"billing"  },
  ];
  const statusBadge = s => ({ Completed:{bg:"#dcfce7",color:"#166534"}, Pending:{bg:"#fef9c3",color:"#854d0e"}, Cancelled:{bg:"#fee2e2",color:"#991b1b"} }[s] || {bg:"#e5e7eb",color:"#374151"});

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:20,marginBottom:28}}>
        {stats.map(s => (
          <div key={s.label} onClick={() => s.nav ? onNavigate(s.nav) : onRevenue()}
            style={{background:css.card,padding:22,borderRadius:14,boxShadow:"0 2px 10px rgba(0,0,0,.05)",display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${css.border}`,cursor:"pointer",transition:"all .2s"}}>
            <div>
              <div style={{color:css.textGray,fontSize:12,marginBottom:6}}>{s.label}</div>
              <h2 style={{fontSize:28,fontWeight:800,color:css.text}}>{s.value}</h2>
            </div>
            <div style={{width:50,height:50,borderRadius:12,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{s.icon}</div>
          </div>
        ))}
      </div>
      <div style={{background:css.card,padding:24,borderRadius:14,border:`1px solid ${css.border}`}}>
        <h3 style={{marginBottom:16,color:css.text}}>Recent Activity</h3>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
            <thead>
              <tr>{["Patient","Action","Date","Time","Status","View"].map(h => (
                <th key={h} style={{textAlign:"left",padding:"10px 14px",color:css.textGray,fontSize:12,fontWeight:600,borderBottom:`1px solid ${css.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {appointments.slice(0, 8).map((a, i) => {
                const s = statusBadge(a.status);
                return (
                  <tr key={i}>
                    <td style={{padding:"12px 14px",color:css.text,fontSize:13}}><strong>{a.patient}</strong></td>
                    <td style={{padding:"12px 14px",color:css.text,fontSize:13}}>{a.action}</td>
                    <td style={{padding:"12px 14px",color:css.textGray,fontSize:12}}>{a.date||"—"}</td>
                    <td style={{padding:"12px 14px",color:css.textGray,fontSize:12}}>{a.time}</td>
                    <td style={{padding:"12px 14px"}}><span style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:s.bg,color:s.color}}>{a.status}</span></td>
                    <td style={{padding:"12px 14px"}}><button onClick={() => onViewActivity(a)} style={{...btnStyle,padding:"4px 10px",fontSize:11}}>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
