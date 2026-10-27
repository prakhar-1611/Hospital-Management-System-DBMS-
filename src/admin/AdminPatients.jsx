/* ============================================================
   AdminPatients.jsx — every registered patient: search, latest visit,
   full record, invoice (browser-only billing) and a downloadable slip.
   ============================================================ */
import { useState } from "react";
import { Card, Avatar, Badge, Button, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { fmtDate } from "../ui/dates";

const PAGE = 40;

export default function AdminPatients({ css, patients, invoices, onOpenPatient, onDownload, onCreateInvoice, onViewInvoice }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const [limit, setLimit] = useState(PAGE);
  const term = q.trim().toLowerCase();
  const rows = patients
    .filter(p => !term || p.name.toLowerCase().includes(term) || p.contact.includes(term) || p.code.toLowerCase().includes(term) || p.condition.toLowerCase().includes(term))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "visits" ? b.visits - a.visits : (b.lastVisit || "").localeCompare(a.lastVisit || ""));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 380 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16}/></span>
          <input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Name, phone, patient ID or reason" aria-label="Search patients" style={{ ...inputStyle(css), paddingLeft: 32 }}/>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputStyle(css), width: 170 }} aria-label="Sort patients">
          <option value="recent">Latest visit</option><option value="name">Name (A to Z)</option><option value="visits">Most visits</option>
        </select>
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>{rows.length} of {patients.length}</span>
      </div>
      {rows.length === 0 ? <Card><EmptyState icon="users" title="No patients match" body="Try a name, phone number or patient ID."/></Card> : (
        <>
          <div className="mc-table-wrap">
            <table className="mc-table" style={{ minWidth: 900 }}>
              <thead><tr><th>Patient</th><th>Contact</th><th className="num">Visits</th><th>Latest visit</th><th>Status</th><th>Invoice</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {rows.slice(0, limit).map(p => {
                  const inv = invoices.find(i => i.patientId === p.id || i.patientName === p.name);
                  return (
                    <tr key={p.id} className="mc-row-hover click" onClick={() => onOpenPatient(p.id)}>
                      <td style={{ height: 56 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={p.name} size={32}/>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                            <span className="sub"><span className="mono">{p.code}</span>, {p.age === "" ? "age unknown" : `${p.age} y`}{p.gender ? `, ${p.gender}` : ""}</span>
                          </div>
                        </div>
                      </td>
                      <td>{p.contact || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                      <td className="num">{p.visits}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{p.lastVisit ? fmtDate(p.lastVisit, { day: "numeric", month: "short", year: "numeric" }) : <span style={{ color: "var(--muted)" }}>—</span>}<span className="sub clip">{p.doctor !== "—" ? `${p.doctor}, ${p.condition}` : "No visits yet"}</span></td>
                      <td>{p.status === "No visits" ? <Badge status="No visits"/> : <Badge status={p.status}/>}</td>
                      <td onClick={e => e.stopPropagation()}>
                        {inv
                          ? <Button size="sm" variant="outline" onClick={() => onViewInvoice(inv)}>{inv.id}, {inv.status}</Button>
                          : <Button size="sm" variant="ghost" icon="plus" onClick={() => onCreateInvoice(p)}>Invoice</Button>}
                      </td>
                      <td style={{ textAlign: "right" }} onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" icon="download" aria-label={`Download slip for ${p.name}`} title="Download slip" onClick={() => onDownload(p)}/>
                      </td>
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
