/* ============================================================
   AdminAppointments.jsx — every appointment in the hospital (online
   bookings by patients + walk-ins), with tabs, department filter,
   search, and quick complete / cancel.
   ============================================================ */
import { useState } from "react";
import { Card, Tabs, Badge, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { todayStr, fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";
import { byDateAsc, byDateDesc } from "../ui/records";

const PAGE = 50;

export default function AdminAppointments({ css, accent, appts, departments, tab, setTab, onOpenAppt, onUpdate }) {
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
    <Card css={css}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <Tabs css={css} tabs={tabs} value={tab} onChange={(t) => { setTab(t); setLimit(PAGE); }} accent={accent}/>
        <div style={{ flex: 1 }}/>
        <select value={dept} onChange={e => { setDept(e.target.value); setLimit(PAGE); }} style={{ ...inputStyle(css), width: 180 }} aria-label="Department">
          <option value="all">All departments</option>
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <div style={{ position: "relative", width: 240 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: css.textGray }}><Icon name="search" size={16}/></span>
          <input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Patient, doctor or reason" style={{ ...inputStyle(css), paddingLeft: 34 }}/>
        </div>
      </div>
      {rows.length === 0 ? <EmptyState css={css} icon="calendar" title={term || dept !== "all" ? "No matches" : "Nothing here"}/> : (
        <>
          <div style={{ fontSize: 12, color: css.textGray, marginBottom: 8 }}>{rows.length} appointment{rows.length === 1 ? "" : "s"}</div>
          <div className="mc-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead><tr>{["Date", "Time", "Patient", "Doctor", "Department", "Reason", "Status", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 10px", fontSize: 12, color: css.textGray, fontWeight: 600, borderBottom: `1px solid ${css.border}` }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {rows.slice(0, limit).map(a => {
                  const overdue = a.status === "Scheduled" && isPastSlot(a.date, a.time);
                  return (
                    <tr key={a.id} className="mc-row-hover" style={{ cursor: "pointer" }} onClick={() => onOpenAppt(a.id)}>
                      <td style={{ padding: "11px 10px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{fmtDate(a.date, { day: "numeric", month: "short", year: "numeric" })}</div>
                        <div style={{ fontSize: 11.5, color: css.textGray }}>{relativeDay(a.date)}</div>
                      </td>
                      <td style={{ padding: "11px 10px", fontSize: 13, color: css.text, whiteSpace: "nowrap" }}>{fmtTime(a.time)}</td>
                      <td style={{ padding: "11px 10px", fontSize: 13, fontWeight: 600, color: css.text }}>{a.patientName}</td>
                      <td style={{ padding: "11px 10px", fontSize: 13, color: css.text }}>{a.doctorName}</td>
                      <td style={{ padding: "11px 10px", fontSize: 12.5, color: css.textGray }}>{a.deptName}</td>
                      <td style={{ padding: "11px 10px", fontSize: 13, color: css.text, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.reason}</td>
                      <td style={{ padding: "11px 10px" }}>{overdue ? <Badge bg="#fef3c7" fg="#92400e">Awaiting update</Badge> : <Badge status={a.status}/>}</td>
                      <td style={{ padding: "11px 10px", textAlign: "right", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                        {a.status === "Scheduled" && (
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <Button size="sm" variant="soft" accent="#16a34a" title="Mark completed" onClick={() => onUpdate(a.id, { status: "Completed" }, `${a.patientName}'s visit marked completed`)}><Icon name="check" size={14}/></Button>
                            <Button size="sm" variant="danger" title="Cancel" onClick={() => { if (confirm(`Cancel ${a.patientName}'s appointment with ${a.doctorName}?`)) onUpdate(a.id, { status: "Cancelled" }, "Appointment cancelled"); }}><Icon name="x" size={14}/></Button>
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
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Button variant="outline" css={css} onClick={() => setLimit(l => l + PAGE)}>Show {Math.min(PAGE, rows.length - limit)} more</Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
