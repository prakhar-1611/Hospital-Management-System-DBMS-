/* ============================================================
   DoctorPatients.jsx — the patients who have (or had) an appointment
   with this doctor. Other hospital patients are never sent here.
   ============================================================ */
import { useState } from "react";
import { Card, Avatar, Button, EmptyState, Badge } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { fmtDate } from "../ui/dates";

const PAGE = 40;
const dash = <span style={{ color: "var(--muted)" }}>—</span>;

export default function DoctorPatients({ css, patients, onOpenPatient }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const [limit, setLimit] = useState(PAGE);
  const term = q.trim().toLowerCase();
  const rows = patients
    .filter(p => !term || p.name.toLowerCase().includes(term) || (p.contact || "").includes(term))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name)
      : sort === "next" ? (a.nextVisit || "9999").localeCompare(b.nextVisit || "9999")
      : (b.lastVisit || "").localeCompare(a.lastVisit || ""));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 380 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16}/></span>
          <input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Name or phone" aria-label="Search patients" style={{ ...inputStyle(css), paddingLeft: 32 }}/>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputStyle(css), width: 180 }} aria-label="Sort patients">
          <option value="recent">Last visit (newest)</option>
          <option value="next">Next visit (soonest)</option>
          <option value="name">Name (A to Z)</option>
        </select>
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>{rows.length} of {patients.length}</span>
      </div>

      {rows.length === 0 ? (
        <Card><EmptyState icon="users" title={term ? "No patients match" : "No patients yet"} body={term ? "Try a different name or phone number." : "Patients appear here once they book a visit with you."}/></Card>
      ) : (
        <>
          <div className="mc-table-wrap">
            <table className="mc-table" style={{ minWidth: 820 }}>
              <thead><tr><th>Patient</th><th>Contact</th><th>Blood</th><th className="num">Visits</th><th>Last visit</th><th>Next visit</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {rows.slice(0, limit).map(p => (
                  <tr key={p._id} className="mc-row-hover click" onClick={() => onOpenPatient(p._id)}>
                    <td style={{ height: 56 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={p.name} size={32}/>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {p.name}
                            {p.allergies && <Badge bg="var(--pill-negative-bg)" fg="var(--pill-negative-fg)"><span title={p.allergies}>Allergies</span></Badge>}
                          </div>
                          <span className="sub"><span className="mono">P-{String(p._id).slice(-6).toUpperCase()}</span>{p.age != null ? `, ${p.age} y` : ""}{p.gender ? `, ${p.gender}` : ""}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.contact || dash}</td>
                    <td>{p.bloodGroup || dash}</td>
                    <td className="num">{p.visits}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{p.lastVisit ? fmtDate(p.lastVisit, { day: "numeric", month: "short", year: "numeric" }) : dash}</td>
                    <td style={{ whiteSpace: "nowrap", fontWeight: p.nextVisit ? 500 : 400 }}>{p.nextVisit ? fmtDate(p.nextVisit, { weekday: "short", day: "numeric", month: "short" }) : dash}</td>
                    <td style={{ textAlign: "right" }}><Button size="sm" variant="outline">View</Button></td>
                  </tr>
                ))}
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
