/* ============================================================
   AdminAppointments.jsx — every appointment in the hospital (online
   bookings by patients and walk-ins): tabs, department filter, search,
   and complete / cancel on the row that needs it.
   ============================================================ */
import { useState } from "react";
import { Card, Tabs, Badge, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { todayStr, fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";
import { byDateAsc, byDateDesc } from "../ui/records";

const PAGE = 50;

export default function AdminAppointments({ css, appts, departments, tab, setTab, onOpenAppt, onUpdate }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [limit, setLimit] = useState(PAGE);
  const today = todayStr();
  const groups = {
    today:     appts.filter(a => a.date === today).sort(byDateAsc),
    upcoming:  appts.filter(a => a.status === "Scheduled" && a.date > today).sort(byDateAsc),
    attention: appts.filter(a => a.status === "Scheduled" && isPastSlot(a.date, a.time)).sort(byDateDesc),
    completed: appts.filter(a => a.status === "Completed").sort(byDateDesc),
    cancelled: appts.filter(a => a.status === "Cancelled").sort(byDateDesc),
    all:       [...appts].sort(byDateDesc),
  };
  const tabs = [
    { id: "today", label: "Today" }, { id: "upcoming", label: "Upcoming" }, { id: "attention", label: "Needs update" },
    { id: "completed", label: "Completed" }, { id: "cancelled", label: "Cancelled" }, { id: "all", label: "All" },
  ].map(t => ({ ...t, count: groups[t.id].length }));

  const term = q.trim().toLowerCase();
  const rows = groups[tab].filter(a => (dept === "all" || a.deptName === dept) &&
    (!term || a.patientName.toLowerCase().includes(term) || a.doctorName.toLowerCase().includes(term) || a.reason.toLowerCase().includes(term)));

  return (
    <div>
      <Tabs tabs={tabs} value={tab} onChange={(t) => { setTab(t); setLimit(PAGE); }}/>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "16px 0" }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16}/></span>
          <input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search patient, doctor or reason" aria-label="Search appointments" style={{ ...inputStyle(css), paddingLeft: 32 }}/>
        </div>
        <select value={dept} onChange={e => { setDept(e.target.value); setLimit(PAGE); }} style={{ ...inputStyle(css), width: 190 }} aria-label="Department">
          <option value="all">All departments</option>
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>{rows.length} appointment{rows.length === 1 ? "" : "s"}</span>
      </div>

      {tab === "attention" && rows.length > 0 && (
        <div className="mc-banner" style={{ background: "var(--pill-warning-bg)", color: "var(--pill-warning-fg)" }}>
          <span>These slots have passed but are still marked Scheduled. Open each one to complete or cancel it.</span>
        </div>
      )}

      {rows.length === 0 ? (
        <Card><EmptyState icon="calendar" title={term || dept !== "all" ? "No matches" : "Nothing here"} body={term || dept !== "all" ? "Try a different name, reason or department." : "Appointments in this group will appear here."}/></Card>
      ) : (
        <>
          <div className="mc-table-wrap">
            <table className="mc-table" style={{ minWidth: 880 }}>
              <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {rows.slice(0, limit).map(a => {
                  const overdue = a.status === "Scheduled" && isPastSlot(a.date, a.time);
                  return (
                    <tr key={a.id} className="mc-row-hover click" onClick={() => onOpenAppt(a.id)}>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDate(a.date, { day: "numeric", month: "short", year: "numeric" })}<span className="sub">{relativeDay(a.date)}</span></td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtTime(a.time)}</td>
                      <td style={{ fontWeight: 500 }}>{a.patientName}</td>
                      <td>{a.doctorName}<span className="sub">{a.deptName}</span></td>
                      <td className="clip">{a.reason}</td>
                      <td>{overdue ? <Badge bg="var(--pill-warning-bg)" fg="var(--pill-warning-fg)">Awaiting update</Badge> : <Badge status={a.status}/>}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                        {a.status === "Scheduled" && (
                          <div style={{ display: "inline-flex", gap: 4 }}>
                            <Button size="sm" variant="outline" icon="check" onClick={() => onUpdate(a.id, { status: "Completed" }, `${a.patientName}: visit marked completed`)} aria-label={`Mark ${a.patientName}'s visit completed`}>Done</Button>
                            <Button size="sm" variant="ghost" aria-label={`Cancel ${a.patientName}'s appointment`} title="Cancel appointment"
                              onClick={() => { if (confirm(`Cancel ${a.patientName}'s appointment with ${a.doctorName}? The slot becomes free again.`)) onUpdate(a.id, { status: "Cancelled" }, "Appointment cancelled"); }}><Icon name="x" size={15}/></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > limit && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button variant="outline" onClick={() => setLimit(l => l + PAGE)}>Show {Math.min(PAGE, rows.length - limit)} more</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
