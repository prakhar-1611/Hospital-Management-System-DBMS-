/* ============================================================
   AdminDoctors.jsx — all doctors with contact details (email + phone
   from their login account), availability, workload and schedule.
   ============================================================ */
import { useState } from "react";
import { Card, Avatar, Badge, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { DAY_NAMES, getTodayPlus } from "../constants";
import { todayStr, fmtTime } from "../ui/dates";
import { money } from "../ui/records";

export default function AdminDoctors({ css, accent, doctors, departments, appts, onStatus, onSchedule }) {
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const today = todayStr(), in7 = getTodayPlus(6);
  const term = q.trim().toLowerCase();
  const rows = doctors.filter(d => (dept === "all" || d.dept === dept) && (status === "all" || d.status === status) &&
    (!term || d.name.toLowerCase().includes(term) || d.specialization.toLowerCase().includes(term)));

  return (
    <div className="mc-stack">
      <Card css={css} pad={16}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: css.textGray }}><Icon name="search" size={16}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or specialization" style={{ ...inputStyle(css), paddingLeft: 34 }}/>
          </div>
          <select value={dept} onChange={e => setDept(e.target.value)} style={{ ...inputStyle(css), flex: "0 1 200px" }} aria-label="Department">
            <option value="all">All departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle(css), flex: "0 1 160px" }} aria-label="Status">
            <option value="all">Any status</option><option>Available</option><option>Busy</option><option>On Leave</option>
          </select>
        </div>
      </Card>
      <div style={{ fontSize: 13, color: css.textGray }}>{rows.length} of {doctors.length} doctors</div>
      {rows.length === 0 ? <Card css={css}><EmptyState css={css} icon="stethoscope" title="No doctors match"/></Card> : (
        <div className="mc-grid-cards">
          {rows.map(d => {
            const mine = appts.filter(a => a.doctorId === d.id && a.status === "Scheduled");
            const todayN = mine.filter(a => a.date === today).length;
            const weekN = mine.filter(a => a.date >= today && a.date <= in7).length;
            return (
              <Card key={d.id} css={css} pad={18} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar name={d.name} size={48} color={accent}/>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: css.text }}>{d.name}</div>
                    <div style={{ fontSize: 12.5, color: accent, fontWeight: 600 }}>{d.dept}</div>
                    <div style={{ fontSize: 12, color: css.textGray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.specialization}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 6, fontSize: 12.5 }}>
                  <a href={d.email ? `mailto:${d.email}` : undefined} style={{ display: "flex", alignItems: "center", gap: 8, color: css.text, textDecoration: "none", minWidth: 0 }}>
                    <Icon name="mail" size={15} color={css.textGray}/><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.email || "—"}</span>
                  </a>
                  <a href={d.phone ? `tel:${d.phone}` : undefined} style={{ display: "flex", alignItems: "center", gap: 8, color: css.text, textDecoration: "none" }}>
                    <Icon name="phone" size={15} color={css.textGray}/>{d.phone || "—"}
                  </a>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: css.textGray }}>
                    <Icon name="clock" size={15}/>{[...d.workingDays].sort().map(x => DAY_NAMES[x]).join(", ")} · {fmtTime(d.workingHours.start)}–{fmtTime(d.workingHours.end)}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[["Today", todayN], ["7 days", weekN], ["Fee", money(d.fee)]].map(([k, v]) => (
                    <div key={k} style={{ padding: "8px 6px", borderRadius: 10, background: css.subtle, border: `1px solid ${css.border}`, textAlign: "center" }}>
                      <div style={{ fontSize: 10.5, color: css.textGray }}>{k}</div>
                      <div style={{ fontSize: 14, fontWeight: 750, color: css.text }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge status={d.status}/>
                  <select value={d.status} onChange={e => onStatus(d.id, e.target.value)} aria-label={`Status of ${d.name}`}
                    style={{ ...inputStyle(css), padding: "6px 8px", fontSize: 12.5, flex: 1 }}>
                    <option>Available</option><option>Busy</option><option>On Leave</option>
                  </select>
                  <Button size="sm" variant="soft" accent={accent} icon="calendar" onClick={() => onSchedule(d)}>Schedule</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
