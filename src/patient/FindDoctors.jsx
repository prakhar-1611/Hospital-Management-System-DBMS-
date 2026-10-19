/* ============================================================
   FindDoctors.jsx — public doctor directory for patients:
   filter by department, search by name / specialization, book.
   ============================================================ */
import { useState } from "react";
import { Card, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { DoctorCard } from "./BookAppointment";

export default function FindDoctors({ css, accent, doctors, departments, onBook }) {
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const term = q.trim().toLowerCase();
  const rows = doctors.filter(d =>
    (dept === "all" || d.departmentId?._id === dept) &&
    (!availableOnly || d.status !== "On Leave") &&
    (!term || d.name.toLowerCase().includes(term) || (d.specialization || "").toLowerCase().includes(term) || (d.departmentId?.name || "").toLowerCase().includes(term)));

  return (
    <div className="mc-stack">
      <Card css={css} pad={16}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: css.textGray }}><Icon name="search" size={16}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by doctor, specialty or department" style={{ ...inputStyle(css), paddingLeft: 34 }}/>
          </div>
          <select value={dept} onChange={e => setDept(e.target.value)} style={{ ...inputStyle(css), flex: "0 1 220px" }} aria-label="Department">
            <option value="all">All departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: css.text, cursor: "pointer" }}>
            <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} style={{ accentColor: accent, width: 16, height: 16 }}/>
            Hide doctors on leave
          </label>
        </div>
      </Card>
      <div style={{ fontSize: 13, color: css.textGray }}>{rows.length} doctor{rows.length === 1 ? "" : "s"}</div>
      {rows.length === 0 ? <Card css={css}><EmptyState css={css} icon="stethoscope" title="No doctors match" body="Try another department or search term."/></Card> : (
        <div className="mc-grid-cards">
          {rows.map(d => (
            <DoctorCard key={d._id} css={css} accent={accent} doc={d}
              action={<Button accent={accent} icon="calendarPlus" disabled={d.status === "On Leave"} onClick={() => onBook(d._id)} style={{ width: "100%" }}>
                {d.status === "On Leave" ? "On leave" : "Book appointment"}
              </Button>}/>
          ))}
        </div>
      )}
    </div>
  );
}
