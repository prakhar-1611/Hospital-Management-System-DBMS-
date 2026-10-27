/* ============================================================
   AdminDoctors.jsx — the doctor directory as a table: contact details
   (email and phone from the login account), working hours, workload
   and a status control on each row.
   ============================================================ */
import { useState } from "react";
import { Card, Avatar, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { DAY_NAMES, getTodayPlus } from "../constants";
import { todayStr, fmtTime } from "../ui/dates";
import { money } from "../ui/records";

export default function AdminDoctors({ css, doctors, departments, appts, onStatus, onSchedule }) {
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const today = todayStr(), in7 = getTodayPlus(6);
  const term = q.trim().toLowerCase();
  const rows = doctors.filter(d => (dept === "all" || d.dept === dept) && (status === "all" || d.status === status) &&
    (!term || d.name.toLowerCase().includes(term) || d.specialization.toLowerCase().includes(term)));
  const load = Object.fromEntries(doctors.map(d => {
    const mine = appts.filter(a => a.doctorId === d.id && a.status === "Scheduled");
    return [d.id, { today: mine.filter(a => a.date === today).length, week: mine.filter(a => a.date >= today && a.date <= in7).length }];
  }));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16}/></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or specialization" aria-label="Search doctors" style={{ ...inputStyle(css), paddingLeft: 32 }}/>
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)} style={{ ...inputStyle(css), width: 190 }} aria-label="Department">
          <option value="all">All departments</option>
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle(css), width: 150 }} aria-label="Status">
          <option value="all">Any status</option><option>Available</option><option>Busy</option><option>On Leave</option>
        </select>
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>{rows.length} of {doctors.length}</span>
      </div>

      {rows.length === 0 ? <Card><EmptyState icon="stethoscope" title="No doctors match" body="Try a different name, department or status."/></Card> : (
        <div className="mc-table-wrap">
          <table className="mc-table" style={{ minWidth: 960 }}>
            <thead><tr><th>Doctor</th><th>Contact</th><th>Works</th><th className="num">Today</th><th className="num">7 days</th><th className="num">Fee</th><th>Status</th><th><span className="sr-only">Schedule</span></th></tr></thead>
            <tbody>
              {rows.map(d => (
                <tr key={d.id} className="mc-row-hover">
                  <td style={{ height: 56 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={d.name} size={32}/>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>{d.name}</div>
                        <span className="sub">{d.dept}{d.specialization ? `, ${d.specialization}` : ""}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {d.email ? <a href={`mailto:${d.email}`} style={{ color: "var(--ink)", textDecoration: "none" }}>{d.email}</a> : "—"}
                    <span className="sub">{d.phone || "No phone on file"}</span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{[...d.workingDays].sort().map(x => DAY_NAMES[x]).join(", ")}<span className="sub">{fmtTime(d.workingHours.start)} to {fmtTime(d.workingHours.end)}</span></td>
                  <td className="num">{load[d.id].today}</td>
                  <td className="num">{load[d.id].week}</td>
                  <td className="num">{money(d.fee)}</td>
                  <td>
                    <select value={d.status} onChange={e => onStatus(d.id, e.target.value)} aria-label={`Status of ${d.name}`} style={{ ...inputStyle(css), minHeight: 30, padding: "3px 8px", width: 120, fontSize: 13 }}>
                      <option>Available</option><option>Busy</option><option>On Leave</option>
                    </select>
                  </td>
                  <td style={{ textAlign: "right" }}><Button variant="outline" size="sm" icon="calendar" onClick={() => onSchedule(d)}>Schedule</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
