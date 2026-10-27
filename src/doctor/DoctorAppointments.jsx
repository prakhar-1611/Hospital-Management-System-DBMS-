/* ============================================================
   DoctorAppointments.jsx — every appointment booked with this doctor,
   split into tabs, searchable by patient or reason.
   ============================================================ */
import { useState } from "react";
import { Card, Tabs, Badge, Button, EmptyState, Notice } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { todayStr, fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";
import { byDateAsc, byDateDesc } from "../ui/records";

const PAGE = 40;
const EMPTY = {
  today: "No consultations today.",
  upcoming: "No future bookings yet. Patients book open slots from their portal.",
  attention: "Every past visit has been completed or cancelled.",
  past: "Completed consultations will be listed here.",
  cancelled: "No cancelled appointments.",
  all: "No appointments have been booked with you yet.",
};

export default function DoctorAppointments({ css, appts, tab, setTab, needsUpdate, onOpenAppt }) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const today = todayStr();
  const groups = {
    today:     appts.filter(a => a.date === today).sort(byDateAsc),
    upcoming:  appts.filter(a => a.status === "Scheduled" && a.date > today).sort(byDateAsc),
    attention: [...needsUpdate].sort(byDateDesc),
    past:      appts.filter(a => a.status === "Completed").sort(byDateDesc),
    cancelled: appts.filter(a => a.status === "Cancelled").sort(byDateDesc),
    all:       [...appts].sort(byDateDesc),
  };
  const tabs = [
    { id: "today", label: "Today" }, { id: "upcoming", label: "Upcoming" }, { id: "attention", label: "Needs update" },
    { id: "past", label: "Completed" }, { id: "cancelled", label: "Cancelled" }, { id: "all", label: "All" },
  ].map(t => ({ ...t, count: groups[t.id].length }));

  const term = q.trim().toLowerCase();
  const rows = groups[tab].filter(a => !term || a.patientName.toLowerCase().includes(term) || a.reason.toLowerCase().includes(term));

  return (
    <div>
      <Tabs tabs={tabs} value={tab} onChange={(t) => { setTab(t); setLimit(PAGE); }}/>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "16px 0" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 380 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16}/></span>
          <input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Patient name or reason" aria-label="Search appointments" style={{ ...inputStyle(css), paddingLeft: 32 }}/>
        </div>
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>{rows.length} of {groups[tab].length}</span>
      </div>

      {tab === "attention" && rows.length > 0 && (
        <Notice tone="warning" style={{ marginBottom: 16 }}>These slots have passed but are still marked scheduled. Open each one to mark it completed or cancelled, so the patient's record stays accurate.</Notice>
      )}

      {rows.length === 0 ? (
        <Card><EmptyState icon="calendar" title={term ? "No matches" : "Nothing here"} body={term ? "Try a different name or reason." : EMPTY[tab]}/></Card>
      ) : (
        <>
          <div className="mc-table-wrap">
            <table className="mc-table" style={{ minWidth: 760 }}>
              <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th>Notes</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {rows.slice(0, limit).map(a => {
                  const overdue = a.status === "Scheduled" && isPastSlot(a.date, a.time);
                  return (
                    <tr key={a.id} className="mc-row-hover click" onClick={() => onOpenAppt(a.id)}>
                      <td style={{ height: 56, whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500 }}>{fmtDate(a.date, { weekday: "short", day: "numeric", month: "short" })}</div>
                        <span className="sub">{relativeDay(a.date)}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtTime(a.time)}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.patientName}</div>
                        <span className="sub">{[a.patientAge != null ? `${a.patientAge} y` : null, a.patientGender].filter(Boolean).join(", ") || "No details on file"}</span>
                      </td>
                      <td className="clip">{a.reason}</td>
                      <td>{overdue ? <Badge bg="var(--pill-warning-bg)" fg="var(--pill-warning-fg)">Awaiting update</Badge> : <Badge status={a.status}/>}</td>
                      <td className="clip" style={{ maxWidth: 200, color: a.notes ? "var(--ink)" : "var(--muted)" }} title={a.notes || undefined}>{a.notes || "None"}</td>
                      <td style={{ textAlign: "right" }}><Button size="sm" variant="outline">Open</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > limit && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button variant="outline" onClick={() => setLimit(l => l + PAGE)}>Show more ({rows.length - limit} left)</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
