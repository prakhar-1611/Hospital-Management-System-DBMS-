/* ============================================================
   FindDoctors.jsx — public doctor directory for patients:
   filter by department, search by name / specialization, book.
   ============================================================ */
import { useState } from "react";
import { Card, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { DoctorCard } from "./BookAppointment";

export default function FindDoctors({ css, doctors, departments, onBook }) {
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const term = q.trim().toLowerCase();
  const rows = doctors.filter(d =>
    (dept === "all" || d.departmentId?._id === dept) &&
    (!availableOnly || d.status !== "On Leave") &&
    (!term || d.name.toLowerCase().includes(term) || (d.specialization || "").toLowerCase().includes(term) || (d.departmentId?.name || "").toLowerCase().includes(term)));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 380 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16}/></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Doctor, specialty or department" aria-label="Search doctors" style={{ ...inputStyle(css), paddingLeft: 32 }}/>
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)} style={{ ...inputStyle(css), width: 200 }} aria-label="Department">
          <option value="all">All departments</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", minHeight: 34 }}>
          <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} style={{ accentColor: "var(--accent)", width: 16, height: 16 }}/>
          Hide doctors on leave
        </label>
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>{rows.length} of {doctors.length}</span>
      </div>
      {rows.length === 0 ? <Card><EmptyState icon="stethoscope" title="No doctors match" body="Try another department or search term."/></Card> : (
        <div className="mc-grid-cards">
          {rows.map(d => (
            <DoctorCard key={d._id} doc={d}
              action={<Button variant="outline" icon={d.status === "On Leave" ? undefined : "calendarPlus"} disabled={d.status === "On Leave"} onClick={() => onBook(d._id)} style={{ width: "100%" }}>
                {d.status === "On Leave" ? "On leave" : "Book appointment"}
              </Button>}/>
          ))}
        </div>
      )}
    </div>
  );
}
