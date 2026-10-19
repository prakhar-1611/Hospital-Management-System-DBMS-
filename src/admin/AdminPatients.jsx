/* ============================================================
   AdminPatients.jsx — every registered patient: search, latest visit,
   full record, invoice (front-end billing) and a downloadable slip.
   ============================================================ */
import { useState } from "react";
import { Card, SectionTitle, Avatar, Badge, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { fmtDate } from "../ui/dates";

const PAGE = 40;

export default function AdminPatients({ css, accent, patients, invoices, onOpenPatient, onDownload, onCreateInvoice, onViewInvoice }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const [limit, setLimit] = useState(PAGE);
  const term = q.trim().toLowerCase();
  const rows = patients
    .filter(p => !term || p.name.toLowerCase().includes(term) || p.contact.includes(term) || p.code.toLowerCase().includes(term) || p.condition.toLowerCase().includes(term))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "visits" ? b.visits - a.visits : (b.lastVisit || "").localeCompare(a.lastVisit || ""));

  return (
    <Card css={css}>
      <SectionTitle css={css} title={`${patients.length} patients`} subtitle="Patients register themselves online or at the walk-in desk"
        right={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 250 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: css.textGray }}><Icon name="search" size={16}/></span>
              <input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Name, phone, ID or reason" style={{ ...inputStyle(css), paddingLeft: 34 }}/>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputStyle(css), width: 160 }} aria-label="Sort">
              <option value="recent">Latest visit</option><option value="name">Name (A–Z)</option><option value="visits">Most visits</option>
            </select>
          </div>
        }/>
      {rows.length === 0 ? <EmptyState css={css} icon="users" title="No patients match"/> : (
        <>
          <div className="mc-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead><tr>{["Patient", "Age / Gender", "Contact", "Visits", "Latest visit", "Doctor", "Status", "Invoice", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 10px", fontSize: 12, color: css.textGray, fontWeight: 600, borderBottom: `1px solid ${css.border}` }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {rows.slice(0, limit).map(p => {
                  const inv = invoices.find(i => i.patientId === p.id || i.patientName === p.name);
                  return (
                    <tr key={p.id} className="mc-row-hover" style={{ cursor: "pointer" }} onClick={() => onOpenPatient(p.id)}>
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={p.name} size={34} color={accent}/>
                          <div><div style={{ fontSize: 13, fontWeight: 650, color: css.text }}>{p.name}</div><div style={{ fontSize: 11.5, color: css.textGray }}>{p.code}</div></div>
                        </div>
                      </td>
                      <td style={{ padding: "10px", fontSize: 12.5, color: css.text }}>{p.age === "" ? "—" : p.age} / {p.gender || "—"}</td>
                      <td style={{ padding: "10px", fontSize: 12.5, color: css.textGray }}>{p.contact || "—"}</td>
                      <td style={{ padding: "10px", fontSize: 13, fontWeight: 600, color: css.text }}>{p.visits}</td>
                      <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 12.5, color: css.text }}>{p.lastVisit ? fmtDate(p.lastVisit, { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
                        <div style={{ fontSize: 11.5, color: css.textGray, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{p.condition}</div>
                      </td>
                      <td style={{ padding: "10px", fontSize: 12.5, color: css.text }}>{p.doctor}</td>
                      <td style={{ padding: "10px" }}>{p.status === "No visits" ? <Badge bg="#e5e7eb" fg="#374151">No visits</Badge> : <Badge status={p.status}/>}</td>
                      <td style={{ padding: "10px" }} onClick={e => e.stopPropagation()}>
                        {inv
                          ? <Button size="sm" variant="outline" css={css} onClick={() => onViewInvoice(inv)}>{inv.id} · {inv.status}</Button>
                          : <Button size="sm" variant="soft" accent={accent} icon="plus" onClick={() => onCreateInvoice(p)}>Invoice</Button>}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" css={css} icon="download" title="Download slip" onClick={() => onDownload(p)}/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > limit && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Button variant="outline" css={css} onClick={() => setLimit(l => l + PAGE)}>Show more ({rows.length - limit} left)</Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
