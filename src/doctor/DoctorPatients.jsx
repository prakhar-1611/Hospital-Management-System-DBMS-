/* ============================================================
   DoctorPatients.jsx — the patients who have (or had) an appointment
   with this doctor. Other hospital patients are never sent here.
   ============================================================ */
import { useState } from "react";
import { Card, SectionTitle, Avatar, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { fmtDate } from "../ui/dates";

export default function DoctorPatients({ css, accent, patients, onOpenPatient }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const term = q.trim().toLowerCase();
  const rows = patients
    .filter(p => !term || p.name.toLowerCase().includes(term) || (p.contact || "").includes(term))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name)
      : sort === "next" ? (a.nextVisit || "9999").localeCompare(b.nextVisit || "9999")
      : (b.lastVisit || "").localeCompare(a.lastVisit || ""));

  return (
    <Card css={css}>
      <SectionTitle css={css} title={`${patients.length} patient${patients.length === 1 ? "" : "s"}`}
        subtitle="Patients who have booked with you. Their full history with other doctors stays private."
        right={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 230 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: css.textGray }}><Icon name="search" size={16}/></span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or phone" style={{ ...inputStyle(css), paddingLeft: 34 }}/>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputStyle(css), width: 170 }} aria-label="Sort patients">
              <option value="recent">Last visit (newest)</option>
              <option value="next">Next visit (soonest)</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        }/>
      {rows.length === 0 ? <EmptyState css={css} icon="users" title={term ? "No matches" : "No patients yet"}/> : (
        <div className="mc-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead><tr>{["Patient", "Age / Gender", "Contact", "Blood", "Visits", "Last visit", "Next visit", ""].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontSize: 12, color: css.textGray, fontWeight: 600, borderBottom: `1px solid ${css.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {rows.map(p => (
                <tr key={p._id} className="mc-row-hover" style={{ cursor: "pointer" }} onClick={() => onOpenPatient(p._id)}>
                  <td style={{ padding: "11px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={p.name} size={34} color={accent}/>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 650, color: css.text }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: css.textGray }}>P-{String(p._id).slice(-6).toUpperCase()}</div>
                      </div>
                      {p.allergies && <span title={`Allergies: ${p.allergies}`} style={{ color: "#dc2626" }}><Icon name="alert" size={15}/></span>}
                    </div>
                  </td>
                  <td style={{ padding: "11px 12px", fontSize: 12.5, color: css.text }}>{p.age ?? "—"} / {p.gender || "—"}</td>
                  <td style={{ padding: "11px 12px", fontSize: 12.5, color: css.textGray }}>{p.contact || "—"}</td>
                  <td style={{ padding: "11px 12px", fontSize: 12.5, color: css.text }}>{p.bloodGroup || "—"}</td>
                  <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 600, color: css.text }}>{p.visits}</td>
                  <td style={{ padding: "11px 12px", fontSize: 12.5, color: css.textGray, whiteSpace: "nowrap" }}>{p.lastVisit ? fmtDate(p.lastVisit, { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                  <td style={{ padding: "11px 12px", fontSize: 12.5, color: p.nextVisit ? accent : css.textGray, fontWeight: p.nextVisit ? 600 : 400, whiteSpace: "nowrap" }}>
                    {p.nextVisit ? fmtDate(p.nextVisit, { day: "numeric", month: "short" }) : "—"}
                  </td>
                  <td style={{ padding: "11px 12px", textAlign: "right" }}><Button size="sm" variant="outline" css={css}>View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
