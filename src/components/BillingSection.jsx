/* ============================================================
   BillingSection.jsx — invoices, payments and totals. This screen is a
   browser-only demo: invoices are not stored in MongoDB.
   ============================================================ */
import { useState } from "react";
import { getTodayPlus } from "../constants";
import { StatCard, Tabs, Badge, Button, Card, EmptyState } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";

const money = (n) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const KIND = { Paid: "positive", Unpaid: "warning", Voided: "neutral" };

export default function BillingSection({ invoices, css, onCreateInvoice, onViewInvoice, onPay, onPrint }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const today = getTodayPlus(0);

  const filtered = invoices.filter(inv =>
    (filter === "All" || inv.status === filter) &&
    (!term || inv.patientName.toLowerCase().includes(term) || inv.id.toLowerCase().includes(term)));
  const sum = (s) => invoices.filter(i => i.status === s).reduce((a, i) => a + i.grandTotal, 0);
  const overdue = invoices.filter(i => i.status === "Unpaid" && i.dueDate < today).length;
  const tabs = ["All", "Paid", "Unpaid", "Voided"].map(f => ({ id: f, label: f, count: f === "All" ? invoices.length : invoices.filter(i => i.status === f).length }));

  return (
    <div className="mc-stack">
      <div className="mc-grid-stats">
        <StatCard label="Collected" value={money(sum("Paid"))} hint={`${invoices.filter(i => i.status === "Paid").length} paid invoices`}/>
        <StatCard label="Outstanding" value={money(sum("Unpaid"))} hint={overdue ? `${overdue} overdue` : "None overdue"}/>
        <StatCard label="Voided" value={money(sum("Voided"))} hint="Written off"/>
        <StatCard label="Invoices" value={invoices.length} hint="This session"/>
      </div>

      <div>
        <Tabs tabs={tabs} value={filter} onChange={setFilter}/>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "16px 0" }}>
          <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16}/></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or invoice number" aria-label="Search invoices" style={{ ...inputStyle(css), paddingLeft: 32 }}/>
          </div>
          <div style={{ marginLeft: "auto" }}><Button icon="plus" onClick={onCreateInvoice}>New invoice</Button></div>
        </div>

        {filtered.length === 0 ? <Card><EmptyState icon="file" title="No invoices match" body="Try another status or search term, or create a new invoice."/></Card> : (
          <div className="mc-table-wrap">
            <table className="mc-table" style={{ minWidth: 800 }}>
              <thead><tr><th>Invoice</th><th>Patient</th><th>Doctor</th><th>Issued</th><th>Due</th><th className="num">Total</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {filtered.map(inv => {
                  const late = inv.status === "Unpaid" && inv.dueDate < today;
                  return (
                    <tr key={inv.id} className="mc-row-hover click" onClick={() => onViewInvoice(inv)}>
                      <td className="mono" style={{ fontWeight: 500 }}>{inv.id}</td>
                      <td style={{ fontWeight: 500 }}>{inv.patientName}</td>
                      <td>{inv.doctor}<span className="sub">{inv.dept}</span></td>
                      <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{inv.date}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{inv.dueDate}{late && <span className="sub" style={{ color: "var(--negative)", fontWeight: 500 }}>Overdue</span>}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{money(inv.grandTotal)}</td>
                      <td><Badge bg={`var(--pill-${KIND[inv.status] || "neutral"}-bg)`} fg={`var(--pill-${KIND[inv.status] || "neutral"}-fg)`}>{inv.status}</Badge>
                        {inv.paidOn && <span className="sub">{inv.paymentMethod}, {inv.paidOn}</span>}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                        {inv.status === "Unpaid" && <Button size="sm" onClick={() => onPay(inv)}>Pay</Button>}{" "}
                        <Button size="sm" variant="ghost" icon="printer" aria-label={`Print ${inv.id}`} title="Print" onClick={() => onPrint(inv)}/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
