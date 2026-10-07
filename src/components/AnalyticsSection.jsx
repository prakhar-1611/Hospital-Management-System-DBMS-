/* ============================================================
   AnalyticsSection.jsx — every number on this screen comes from the
   aggregation pipelines A1–A7 (GET /api/reports/*, admin only).
   Charts are drawn with Chart.js (loaded from the jsDelivr CDN); the
   tables show the same data, so it is readable even if the CDN is blocked.
   ============================================================ */
import { useRef, useEffect, useState, useCallback } from "react";
import * as api from "../api";
import { btnStyle } from "../constants";

let chartJsPromise = null;
function loadChartJs() {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (!chartJsPromise) {
    chartJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
      s.onload = () => resolve(window.Chart);
      s.onerror = () => { chartJsPromise = null; reject(new Error("Chart.js could not be loaded")); };
      document.head.appendChild(s);
    });
  }
  return chartJsPromise;
}

const PALETTE = ["#4361ee","#ef233c","#2ec4b6","#ff9f1c","#3f37c9","#f72585","#4cc9f0","#7209b7","#06d6a0","#ffd166","#118ab2","#8d99ae"];

export default function AnalyticsSection({ css, showToast }) {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(true);
  const [chartsOk, setChartsOk] = useState(true);
  const refs   = { dept: useRef(null), trend: useRef(null), slots: useRef(null) };
  const charts = useRef([]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [byDept, topDoctors, trend, peak, cancel, demo, upcoming] = await Promise.all([
        api.getByDepartment(), api.getTopDoctors(), api.getMonthlyTrend(), api.getPeakSlots(),
        api.getCancellationRate(), api.getDemographics(), api.getUpcomingLoad(),
      ]);
      setData({ byDept, topDoctors, trend, peak, cancel, demo: demo[0] || { ageBands: [], gender: [] }, upcoming });
      showToast("Analytics loaded from 7 aggregation pipelines","success");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!data) return;
    let dead = false;
    loadChartJs().then(Chart => {
      if (dead) return;
      charts.current.forEach(c => c?.destroy());
      const opts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:css.textGray } } },
                     scales:{ x:{ ticks:{ color:css.textGray } }, y:{ ticks:{ color:css.textGray }, beginAtZero:true } } };
      charts.current = [
        new Chart(refs.dept.current, { type:"doughnut",
          data:{ labels:data.byDept.map(d => d.department), datasets:[{ data:data.byDept.map(d => d.total), backgroundColor:PALETTE }] },
          options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:"right", labels:{ color:css.textGray, boxWidth:12 } } } } }),
        new Chart(refs.trend.current, { type:"bar",
          data:{ labels:data.trend.map(t => t.month), datasets:[
            { label:"Bookings", data:data.trend.map(t => t.total), backgroundColor:"#4361ee", borderRadius:5 },
            { label:"Cancelled", data:data.trend.map(t => t.cancelled), backgroundColor:"#ef233c", borderRadius:5 },
          ] }, options:opts }),
        new Chart(refs.slots.current, { type:"bar",
          data:{ labels:data.peak.map(p => p.timeSlot), datasets:[{ label:"Appointments (not cancelled)", data:data.peak.map(p => p.count), backgroundColor:"#2ec4b6", borderRadius:5 }] },
          options:opts }),
      ];
      setChartsOk(true);
    }).catch(() => { if (!dead) setChartsOk(false); });
    return () => { dead = true; charts.current.forEach(c => c?.destroy()); charts.current = []; };
  }, [data, css.textGray]); // eslint-disable-line react-hooks/exhaustive-deps

  const card  = { background:css.card, padding:"clamp(16px, 3vw, 24px)", borderRadius:14, border:`1px solid ${css.border}`, minWidth:0 };
  const th    = { textAlign:"left", padding:"10px 14px", color:css.textGray, fontSize:12, borderBottom:`1px solid ${css.border}`, whiteSpace:"nowrap" };
  const td    = { padding:"10px 14px", fontSize:13, color:css.text, borderBottom:`1px solid ${css.border}` };
  const grid  = { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap:20, marginBottom:20 };
  const title = (t, tag) => (
    <h3 style={{marginBottom:14,color:css.text,fontSize:15,display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
      {t}<span style={{fontSize:11,fontWeight:600,color:"#4361ee"}}>{tag}</span>
    </h3>
  );
  const table = (headers, rows) => (
    <div className="mc-table-wrap">
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:300}}>
        <thead><tr>{headers.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={td}>{c}</td>)}</tr>)
                       : <tr><td colSpan={headers.length} style={{...td,color:css.textGray}}>No data</td></tr>}
        </tbody>
      </table>
    </div>
  );

  if (loading && !data) return <div style={{...card,color:css.textGray}}>⏳ Running aggregation pipelines A1–A7...</div>;
  if (error && !data) return (
    <div style={{...card,color:"#991b1b",background:"#fee2e2",border:"1px solid #fecaca",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
      <span>⛔ Could not load reports: {error}</span>
      <button onClick={load} style={{...btnStyle,padding:"6px 14px",fontSize:12}}>Retry</button>
    </div>
  );

  const ageLabel = { 0:"0–17", 18:"18–35", 36:"36–50", 51:"51–65", 66:"66–120", unknown:"Unknown" };
  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      {!chartsOk && (
        <div className="mc-banner" style={{background:"#fef9c3",color:"#854d0e",border:"1px solid #fde68a"}}>
          Chart.js could not be loaded from the CDN, so charts are hidden. All report data is still shown in the tables.
        </div>
      )}
      <div style={grid}>
        <div style={card}>
          {title("Appointments by department", "A1 /by-department")}
          <div style={{height:280,display:chartsOk?"block":"none"}}><canvas ref={refs.dept}/></div>
          {!chartsOk && table(["Department","Total"], data.byDept.map(d => [d.department, d.total]))}
        </div>
        <div style={card}>
          {title("Monthly bookings vs cancellations", "A3 /monthly-trend")}
          <div style={{height:280,display:chartsOk?"block":"none"}}><canvas ref={refs.trend}/></div>
          {!chartsOk && table(["Month","Bookings","Cancelled"], data.trend.map(t => [t.month, t.total, t.cancelled]))}
        </div>
      </div>

      <div style={grid}>
        <div style={card}>
          {title("Busiest time slots", "A4 /peak-slots")}
          <div style={{height:240,display:chartsOk?"block":"none"}}><canvas ref={refs.slots}/></div>
          {!chartsOk && table(["Slot","Appointments"], data.peak.map(p => [p.timeSlot, p.count]))}
        </div>
        <div style={card}>
          {title("Top 5 doctors by completed consultations", "A2 /top-doctors")}
          {table(["Doctor","Department","Completed","Value (fee × completed)"],
            data.topDoctors.map(d => [d.doctor, d.department, d.completed, d.consultationValue.toLocaleString()]))}
        </div>
      </div>

      <div style={grid}>
        <div style={card}>
          {title("Highest cancellation rate (≥ 5 bookings)", "A5 /cancellation-rate")}
          {table(["Doctor","Bookings","Cancelled","Rate"],
            data.cancel.map(c => [c.doctor, c.total, c.cancelled, c.ratePct + "%"]))}
        </div>
        <div style={card}>
          {title("Scheduled load, next 7 days", "A7 /upcoming-load")}
          {table(["Doctor","Scheduled"], data.upcoming.map(u => [u.doctor, u.scheduled]))}
        </div>
      </div>

      <div style={card}>
        {title("Patient demographics ($facet)", "A6 /demographics")}
        <div style={grid}>
          {table(["Age band","Patients"], data.demo.ageBands.map(b => [ageLabel[b._id] ?? b._id, b.count]))}
          {table(["Gender","Patients"], data.demo.gender.map(g => [g._id || "Not given", g.count]))}
        </div>
      </div>
    </div>
  );
}
