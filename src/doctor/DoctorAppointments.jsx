/* ============================================================
   DoctorAppointments.jsx — every appointment booked with this doctor,
   split into tabs, searchable by patient or reason.
   ============================================================ */
import { useState } from "react";
import { Card, Tabs, Badge, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { todayStr, fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";
import { byDateAsc, byDateDesc } from "../ui/records";

export default function DoctorAppointments({ css, accent, appts, tab, setTab, needsUpdate, onOpenAppt }) {
  const [q, setQ] = useState("");
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
    <Card css={css}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Tabs css={css} tabs={tabs} value={tab} onChange={setTab} accent={accent}/>
        <div style={{ position: "relative", flex: "0 1 260px", minWidth: 180 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: css.textGray }}><Icon name="search" size={16}/></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search patient or reason" style={{ ...inputStyle(css), paddingLeft: 34 }}/>
        </div>
      </div>
      {tab === "attention" && rows.length > 0 && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          <Icon name="info" size={16}/> These slots are in the past but still marked scheduled. Open each one to mark it completed or cancelled.
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState css={css} icon="calendar" title={term ? "No matches" : "Nothing here"} body={term ? "Try a different name or reason." : "Appointments in this group will appear here."}/>
      ) : (
        <div className="mc-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead><tr>{["Date", "Time", "Patient", "Reason", "Status", "Notes", ""].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontSize: 12, color: css.textGray, fontWeight: 600, borderBottom: `1px solid ${css.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {rows.map(a => {
                const overdue = a.status === "Scheduled" && isPastSlot(a.date, a.time);
                return (
                  <tr key={a.id} className="mc-row-hover" style={{ cursor: "pointer" }} onClick={() => onOpenAppt(a.id)}>
                    <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{fmtDate(a.date, { weekday: "short", day: "numeric", month: "short" })}</div>
                      <div style={{ fontSize: 11.5, color: css.textGray }}>{relativeDay(a.date)}</div>
                    </td>
                    <td style={{ padding: "12px", fontSize: 13, color: css.text, whiteSpace: "nowrap" }}>{fmtTime(a.time)}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{a.patientName}</div>
                      <div style={{ fontSize: 11.5, color: css.textGray }}>{[a.patientAge != null ? `${a.patientAge} y` : null, a.patientGender].filter(Boolean).join(" · ") || "—"}</div>
                    </td>
                    <td style={{ padding: "12px", fontSize: 13, color: css.text }}>{a.reason}</td>
                    <td style={{ padding: "12px" }}>{overdue ? <Badge bg="#fef3c7" fg="#92400e">Awaiting update</Badge> : <Badge status={a.status}/>}</td>
                    <td style={{ padding: "12px", color: a.notes ? accent : css.textGray }} title={a.notes || "No notes"}><Icon name="file" size={16}/></td>
                    <td style={{ padding: "12px", textAlign: "right" }}><Button size="sm" variant="outline" css={css}>Open</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
