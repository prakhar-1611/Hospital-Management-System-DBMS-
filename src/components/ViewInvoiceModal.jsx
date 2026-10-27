/* ============================================================
   ViewInvoiceModal.jsx — one invoice: parties, services, totals, and
   the actions that are valid for its status (browser-only demo data).
   ============================================================ */
import { Modal, Badge, Button } from "../ui/kit";

const KIND = { Paid: "positive", Unpaid: "warning", Voided: "neutral" };
const usd = (n) => "$" + n.toFixed(2);

export default function ViewInvoiceModal({ invoice: inv, onClose, onPay, onPrint, onVoid }) {
  const kind = KIND[inv.status] || "neutral";
  return (
    <Modal onClose={onClose} width={600} title={<span className="mono">{inv.id}</span>} subtitle={`Issued ${inv.date}, due ${inv.dueDate}`}
      footer={<>
        {inv.status === "Unpaid" && <Button variant="danger" onClick={() => { if (confirm(`Void invoice ${inv.id}? This cannot be undone.`)) onVoid(); }}>Void</Button>}
        <div style={{ flex: 1 }}/>
        <Button variant="outline" icon="printer" onClick={onPrint}>Print</Button>
        {inv.status === "Unpaid" ? <Button icon="card" onClick={onPay}>Take payment</Button> : <Button variant="soft" onClick={onClose}>Close</Button>}
      </>}>
      <div style={{ marginBottom: 16 }}><Badge bg={`var(--pill-${kind}-bg)`} fg={`var(--pill-${kind}-fg)`}>{inv.status}</Badge></div>
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[["Patient", inv.patientName], ["Doctor", inv.doctor], ["Department", inv.dept], ["Payment", inv.paidOn ? `${inv.paymentMethod}, ${inv.paidOn}` : "Not paid yet"]].map(([k, v]) => (
          <div key={k}><dt style={{ fontSize: 12.5, color: "var(--muted)" }}>{k}</dt><dd style={{ fontSize: 14, fontWeight: 500 }}>{v}</dd></div>
        ))}
      </dl>

      <div className="mc-table-wrap">
        <table className="mc-table" style={{ minWidth: 380 }}>
          <thead><tr><th>Service</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Total</th></tr></thead>
          <tbody>
            {inv.lineItems.map((l, i) => (
              <tr key={i}><td>{l.label}</td><td className="num">{l.qty}</td><td className="num">{usd(l.unitPrice)}</td><td className="num" style={{ fontWeight: 500 }}>{usd(l.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, marginLeft: "auto", maxWidth: 260, fontSize: 14 }}>
        {[["Subtotal", usd(inv.subtotal)], ["Discount", `-${usd(inv.discount)}`], ["Tax (9%)", usd(inv.tax)]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "var(--muted)" }}><span>{k}</span><span style={{ color: "var(--ink)" }}>{v}</span></div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", marginTop: 6, borderTop: "1px solid var(--border)", fontSize: 17, fontWeight: 600 }}>
          <span>Total</span><span>{usd(inv.grandTotal)}</span>
        </div>
      </div>
    </Modal>
  );
}
