/* ============================================================
   AnalyticsSection.jsx
   Place this file at: src/components/AnalyticsSection.jsx
   ============================================================ */
import { useRef, useEffect } from "react";

export default function AnalyticsSection({ css, showToast }) {
  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);
  const charts     = useRef([]);
  const toasted    = useRef(false);

  useEffect(() => {
    toasted.current = false;
    if (window.Chart) { renderCharts(); return; }
    if (document.querySelector("script[data-chartjs]")) return;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.setAttribute("data-chartjs","1");
    s.onload = renderCharts;
    document.head.appendChild(s);
    return () => charts.current.forEach(c => c?.destroy());
  }, []);

  function renderCharts() {
    const diseases = ["Viral Flu","Fracture","Cardiac","Migraine","Gastritis","Pneumonia","Covid-19","Diabetes"];
    const depts    = ["Cardiology","Neurology","Orthopedics","Gastroenterology","General","Pediatrics"];
    const dCounts  = {}, ptCounts = {};
    for (let i = 0; i < 150; i++) {
      const d = diseases[Math.floor(Math.random()*diseases.length)];
      const p = depts[Math.floor(Math.random()*depts.length)];
      dCounts[d]  = (dCounts[d]  || 0) + 1;
      ptCounts[p] = (ptCounts[p] || 0) + 1;
    }
    charts.current.forEach(c => c?.destroy());
    if (canvasRef1.current && window.Chart)
      charts.current[0] = new window.Chart(canvasRef1.current.getContext("2d"), {
        type:"doughnut",
        data:{ labels:Object.keys(dCounts), datasets:[{ data:Object.values(dCounts), backgroundColor:["#4361ee","#ef233c","#2ec4b6","#ff9f1c","#3f37c9","#f72585","#4cc9f0","#7209b7"] }] },
        options:{ responsive:true, maintainAspectRatio:false },
      });
    if (canvasRef2.current && window.Chart)
      charts.current[1] = new window.Chart(canvasRef2.current.getContext("2d"), {
        type:"bar",
        data:{ labels:Object.keys(ptCounts), datasets:[{ label:"Patient Load (30 Days)", data:Object.values(ptCounts), backgroundColor:"#4361ee", borderRadius:5 }] },
        options:{ responsive:true, maintainAspectRatio:false },
      });
    if (!toasted.current) { toasted.current = true; showToast("Analytics refreshed (150 records)","success"); }
  }

  const riskData = [
    ["Seniors (60+)", "Ischemic Heart Disease", "Critical", "#fee2e2","#991b1b","↑ +3.2%"],
    ["Adults (18-50)","Musculoskeletal",         "Chronic",  "#fef9c3","#854d0e","→ Stable"],
    ["Children (0-12)","Respiratory Infections", "Seasonal", "#fef9c3","#854d0e","↓ Falling"],
    ["Global",         "Mental Health / Stress", "Emerging", "#dbeafe","#1e40af","↑ Rising"],
  ];

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20,marginBottom:20}}>
        <div style={{background:css.card,padding:24,borderRadius:14,border:`1px solid ${css.border}`}}>
          <h3 style={{marginBottom:14,color:css.text}}>Disease Distribution</h3>
          <div style={{height:280}}><canvas ref={canvasRef1}/></div>
        </div>
        <div style={{background:css.card,padding:24,borderRadius:14,border:`1px solid ${css.border}`}}>
          <h3 style={{marginBottom:14,color:css.text}}>Specialist Workload</h3>
          <div style={{height:280}}><canvas ref={canvasRef2}/></div>
        </div>
      </div>
      <div style={{background:css.card,padding:24,borderRadius:14,border:`1px solid ${css.border}`}}>
        <h3 style={{marginBottom:14,color:css.text}}>High-Risk Demographics</h3>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:420}}>
            <thead>
              <tr>{["Age Group","Clinical Risk","Risk Level","Trend"].map(h => (
                <th key={h} style={{textAlign:"left",padding:"10px 14px",color:css.textGray,fontSize:12,borderBottom:`1px solid ${css.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {riskData.map(([age,risk,level,bg,c,trend]) => (
                <tr key={age}>
                  <td style={{padding:"12px 14px",fontSize:13,color:css.text}}>{age}</td>
                  <td style={{padding:"12px 14px",fontSize:13,color:css.text}}>{risk}</td>
                  <td style={{padding:"12px 14px"}}><span style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:bg,color:c}}>{level}</span></td>
                  <td style={{padding:"12px 14px",fontSize:13,color:css.textGray}}>{trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
