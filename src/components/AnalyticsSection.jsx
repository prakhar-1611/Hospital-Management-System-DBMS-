/* ============================================================
   AnalyticsSection.jsx — every number here comes from the aggregation
   pipelines A1-A7 (GET /api/reports/*, admin only). Charts are drawn
   in plain HTML and SVG, so they work offline and take the portal
   accent and the light / dark theme. One question per card.
   ============================================================ */
import { useEffect, useState, useCallback } from "react";
import * as api from "../api";
import { Card, SectionTitle, Button, Skeleton } from "../ui/kit";
import Icon from "../ui/Icon";

const tag = (t) => <span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>{t}</span>;

/* ranked horizontal bars; `soft` is an optional second part drawn in grey (e.g. cancelled) */
function BarList({ rows, unit = "" }) {
  const max = Math.max(1, ...rows.map(r => r.value + (r.soft || 0)));
  return (
    <div className="mc-bars">
      {rows.map(r => (
        <div key={r.label} className="mc-bar-row">
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
          <strong style={{ fontWeight: 600 }}>{r.value + (r.soft || 0)}{unit}{r.soft ? <span style={{ fontWeight: 400, color: "var(--muted)" }}> ({r.soft} cancelled)</span> : null}</strong>
          <span className="mc-bar-track" style={{ display: "flex" }}>
            <span className="mc-bar-fill" style={{ width: `${(r.value / max) * 100}%`, borderRadius: r.soft ? "3px 0 0 3px" : 3 }}/>
            {r.soft ? <span style={{ display: "block", height: "100%", width: `${(r.soft / max) * 100}%`, background: "var(--control)" }}/> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

/* grouped columns drawn as SVG; series: [{name, values, color}] */
function Columns({ labels, series, height = 200 }) {
  const W = 520, padL = 34, padB = 26, padT = 10, H = height;
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const top = Math.ceil(max / 20) * 20 || 20;
  const ticks = [0, top / 2, top];
  const gw = (W - padL) / labels.length, bw = Math.min(26, (gw - 14) / series.length);
  const y = (v) => padT + (H - padT - padB) * (1 - v / top);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img"
      aria-label={labels.map((l, i) => `${l}: ${series.map(s => `${s.name} ${s.values[i]}`).join(", ")}`).join(". ")}>
      {ticks.map(t => (
        <g key={t}>
          <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--rule)" strokeWidth="1"/>
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{t}</text>
        </g>
      ))}
      {labels.map((l, i) => {
        const x0 = padL + gw * i + (gw - bw * series.length) / 2;
        return (
          <g key={l}>
            {series.map((s, k) => {
              const v = s.values[i], h = Math.max(0, y(0) - y(v));
              return (
                <g key={s.name}>
                  <rect x={x0 + bw * k} y={y(v)} width={bw - 2} height={h} rx="3" fill={s.color}/>
                  <text x={x0 + bw * k + (bw - 2) / 2} y={y(v) - 5} textAnchor="middle" fontSize="11" fill="var(--ink)">{v}</text>
                </g>
              );
            })}
            <text x={padL + gw * i + gw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--muted)">{l}</text>
          </g>
        );
      })}
    </svg>
  );
}

const Legend = ({ items }) => (
  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
    {items.map(([c, t]) => <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: c }}/>{t}</span>)}
  </div>
);

function DataTable({ headers, rows, right = [] }) {
  return (
    <div className="mc-table-wrap">
      <table className="mc-table" style={{ minWidth: 280 }}>
        <thead><tr>{headers.map((h, i) => <th key={h} className={right.includes(i) ? "num" : ""}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={right.includes(j) ? "num" : ""}>{c}</td>)}</tr>)
            : <tr><td colSpan={headers.length} style={{ color: "var(--muted)" }}>No data yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsSection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [byDept, topDoctors, trend, peak, cancel, demo, upcoming] = await Promise.all([
        api.getByDepartment(), api.getTopDoctors(), api.getMonthlyTrend(), api.getPeakSlots(),
        api.getCancellationRate(), api.getDemographics(), api.getUpcomingLoad(),
      ]);
      setData({ byDept, topDoctors, trend, peak, cancel, demo: demo[0] || { ageBands: [], gender: [] }, upcoming });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading && !data) return (
    <div className="mc-stack" aria-busy="true" aria-label="Running the seven reports">
      <div className="mc-grid-2"><Skeleton h={300} r={8}/><Skeleton h={300} r={8}/></div>
      <div className="mc-grid-2"><Skeleton h={260} r={8}/><Skeleton h={260} r={8}/></div>
    </div>
  );
  if (error && !data) return (
    <Card style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}><Icon name="alert" size={18} color="var(--negative)" style={{ marginTop: 2 }}/>
        <div><div style={{ fontWeight: 600 }}>Could not load the reports</div><div style={{ color: "var(--muted)", fontSize: 13.5 }}>{error}</div></div></div>
      <Button icon="refresh" onClick={load}>Try again</Button>
    </Card>
  );

  const ageLabel = { 0: "0 to 17", 18: "18 to 35", 36: "36 to 50", 51: "51 to 65", 66: "66 and over", unknown: "Unknown" };
  const genderTotal = data.demo.gender.reduce((s, g) => s + g.count, 0) || 1;
  const trend = data.trend;
  const deptRows = data.byDept.map(d => {
    const cancelled = d.byStatus.find(s => s.status === "Cancelled")?.n || 0;
    return { label: d.department, value: d.total - cancelled, soft: cancelled };
  });
  const lastTwo = trend.slice(-2);
  const busiest = data.peak[0];

  return (
    <div className="mc-stack">
      <div className="mc-split">
        <Card>
          <SectionTitle title="Which departments carry the load?" subtitle="All appointments by department; grey is cancelled" right={tag("A1 · by-department")}/>
          <BarList rows={deptRows}/>
        </Card>
        <Card>
          <SectionTitle title="Are cancellations rising?" subtitle={lastTwo.length === 2 ? `${lastTwo[1].month}: ${lastTwo[1].cancelled} of ${lastTwo[1].total} cancelled, ${lastTwo[0].month}: ${lastTwo[0].cancelled} of ${lastTwo[0].total}` : "Bookings and cancellations by month"} right={tag("A3 · monthly-trend")}/>
          <Columns labels={trend.map(t => t.month)} series={[
            { name: "Bookings", values: trend.map(t => t.total), color: "var(--accent)" },
            { name: "Cancelled", values: trend.map(t => t.cancelled), color: "var(--negative)" },
          ]}/>
          <Legend items={[["var(--accent)", "Bookings"], ["var(--negative)", "Cancelled"]]}/>
        </Card>
      </div>

      <div className="mc-grid-2">
        <Card>
          <SectionTitle title="When is it busiest?" subtitle={busiest ? `${busiest.timeSlot} is the busiest slot with ${busiest.count} visits` : "Top time slots"} right={tag("A4 · peak-slots")}/>
          <Columns height={190} labels={data.peak.map(p => p.timeSlot)} series={[{ name: "Appointments", values: data.peak.map(p => p.count), color: "var(--accent)" }]}/>
        </Card>
        <Card>
          <SectionTitle title="Who delivers the most care?" subtitle="Top 5 doctors by completed consultations" right={tag("A2 · top-doctors")}/>
          <DataTable right={[2, 3]} headers={["Doctor", "Department", "Completed", "Value"]}
            rows={data.topDoctors.map(d => [d.doctor, d.department, d.completed, d.consultationValue.toLocaleString("en-IN")])}/>
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>Value is completed visits times the department's consultation fee.</p>
        </Card>
      </div>

      <div className="mc-grid-2">
        <Card>
          <SectionTitle title="Whose bookings fall through?" subtitle="Highest cancellation rates, doctors with 5 or more bookings" right={tag("A5 · cancellation-rate")}/>
          <DataTable right={[1, 2, 3]} headers={["Doctor", "Bookings", "Cancelled", "Rate"]}
            rows={data.cancel.map(c => [c.doctor, c.total, c.cancelled, c.ratePct + "%"])}/>
        </Card>
        <Card>
          <SectionTitle title="Who is busy this week?" subtitle="Scheduled visits per doctor, next 7 days" right={tag("A7 · upcoming-load")}/>
          {data.upcoming.length ? <BarList rows={data.upcoming.slice(0, 8).map(u => ({ label: u.doctor, value: u.scheduled }))}/> : <p style={{ color: "var(--muted)" }}>Nothing scheduled in the next 7 days.</p>}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Who are our patients?" subtitle="Age bands and gender of all registered patients" right={tag("A6 · demographics")}/>
        <div className="mc-grid-2">
          <BarList rows={data.demo.ageBands.map(b => ({ label: ageLabel[b._id] ?? String(b._id), value: b.count }))}/>
          <div>
            <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "var(--active)", marginBottom: 12 }} role="img"
              aria-label={data.demo.gender.map(g => `${g._id || "Not given"} ${g.count}`).join(", ")}>
              {data.demo.gender.map((g, i) => <span key={g._id || i} style={{ width: `${(g.count / genderTotal) * 100}%`, background: ["var(--accent)", "var(--control)", "var(--muted)"][i % 3] }}/>)}
            </div>
            {data.demo.gender.map((g, i) => (
              <div key={g._id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: ["var(--accent)", "var(--control)", "var(--muted)"][i % 3] }}/>{g._id || "Not given"}
                <strong style={{ marginLeft: "auto", fontWeight: 600 }}>{g.count} <span style={{ fontWeight: 400, color: "var(--muted)" }}>({Math.round(g.count / genderTotal * 100)}%)</span></strong>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
