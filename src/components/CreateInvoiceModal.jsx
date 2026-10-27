/* ============================================================
   CreateInvoiceModal.jsx — build an invoice from the service list.
   Billing is browser-only: invoices live in React state and are NOT
   stored in MongoDB. Patients come from the API.
   ============================================================ */
import { useState } from "react";
import { SERVICE_CATALOG, DEPT_FEES, getTodayPlus } from "../constants";
import { Modal, Button, Field } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";

export default function CreateInvoiceModal({ patient, patients, departments = [], css, onClose, onCreate }) {
  const [selectedPatient, setSelectedPatient] = useState(patient || null);
  const [lineItems, setLineItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState(getTodayPlus(14));
  const [newService, setNewService] = useState(SERVICE_CATALOG[0].id);
  const [newQty, setNewQty] = useState(1);
  const [customPrice, setCustomPrice] = useState("");

  const dept = selectedPatient?.dept && selectedPatient.dept !== "—" ? selectedPatient.dept : "General";
  // the consultation fee comes from the department document in MongoDB when available;
  // procedure and bed charges are price-list values (DEPT_FEES, General as the fallback)
  const apiFee = departments.find(d => d.name === dept)?.fee;
  const base = DEPT_FEES[dept] || DEPT_FEES.General;
  const fees = { ...base, consultation: apiFee ?? base.consultation };

  function getUnitPrice(serviceId) {
    const cat = SERVICE_CATALOG.find(s => s.id === serviceId);
    if (cat?.price !== undefined && cat.price !== 0) return cat.price;
    if (serviceId === "consultation") return fees.consultation;
    if (serviceId === "procedure") return fees.procedure;
    if (serviceId === "bed") return fees.bed;
    if (serviceId === "pharmacy") return parseFloat(customPrice) || 0;
    return cat?.price || 0;
  }

  function addLine() {
    const cat = SERVICE_CATALOG.find(s => s.id === newService);
    const unit = getUnitPrice(newService);
    if (unit <= 0) return;
    const qty = parseInt(newQty) || 1;
    setLineItems(prev => [...prev, { serviceId: newService, label: cat.label, qty, unitPrice: unit, total: unit * qty }]);
    setNewQty(1); setCustomPrice("");
  }
  const removeLine = (i) => setLineItems(prev => prev.filter((_, idx) => idx !== i));
  const updateQty = (i, qty) => setLineItems(prev => prev.map((l, idx) => idx === i ? { ...l, qty, total: l.unitPrice * qty } : l));

  const subtotal = lineItems.reduce((s, l) => s + l.total, 0);
  const disc = Math.min(parseFloat(discount) || 0, subtotal);
  const taxAmt = (subtotal - disc) * 0.09;
  const grandTotal = subtotal - disc + taxAmt;
  const canCreate = !!selectedPatient && lineItems.length > 0;

  function handleCreate() {
    if (!canCreate) return;
    onCreate({
      patientId: selectedPatient.id, patientName: selectedPatient.name, doctor: selectedPatient.doctor, dept,
      date: getTodayPlus(0), dueDate, lineItems, subtotal, discount: disc,
      tax: parseFloat(taxAmt.toFixed(2)), grandTotal: parseFloat(grandTotal.toFixed(2)),
    });
  }

  const small = { ...inputStyle(css), minHeight: 32 };
  return (
    <Modal onClose={onClose} width={680} title="New invoice" subtitle="Browser-only demo: invoices are not saved to the database"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button icon="file" disabled={!canCreate} onClick={handleCreate}>Create invoice, ${grandTotal.toFixed(2)}</Button>
      </>}>
      <div className="mc-form-grid" style={{ marginBottom: 20 }}>
        <Field label="Patient">
          <select value={selectedPatient?.id || ""} onChange={e => setSelectedPatient(patients.find(x => String(x.id) === e.target.value) || null)} style={inputStyle(css)}>
            <option value="">Choose a patient</option>
            {patients.map(p => <option key={p.id} value={String(p.id)}>{p.name} ({p.code})</option>)}
          </select>
        </Field>
        <Field label="Due date"><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle(css)}/></Field>
      </div>
      {selectedPatient && <p style={{ fontSize: 13, color: "var(--muted)", margin: "-8px 0 18px" }}>Billed to {dept}{selectedPatient.doctor !== "—" ? `, last seen by ${selectedPatient.doctor}` : ""}.</p>}

      <div style={{ padding: 14, borderRadius: 8, background: "var(--raised)", marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Add a service</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>Service</label>
            <select value={newService} onChange={e => setNewService(e.target.value)} style={small}>
              {SERVICE_CATALOG.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ width: 70 }}>
            <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>Qty</label>
            <input type="number" min="1" value={newQty} onChange={e => setNewQty(parseInt(e.target.value) || 1)} style={small}/>
          </div>
          <div style={{ width: 120 }}>
            <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>Unit price ($)</label>
            {newService === "pharmacy"
              ? <input type="number" min="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="Enter price" style={small}/>
              : <input readOnly value={getUnitPrice(newService).toFixed(2)} aria-label="Unit price" style={{ ...small, color: "var(--muted)" }}/>}
          </div>
          <Button variant="outline" icon="plus" onClick={addLine}>Add</Button>
        </div>
      </div>

      {lineItems.length > 0 && (
        <div className="mc-table-wrap" style={{ marginBottom: 16 }}>
          <table className="mc-table" style={{ minWidth: 420 }}>
            <thead><tr><th>Service</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Total</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {lineItems.map((l, i) => (
                <tr key={i}>
                  <td>{l.label}</td>
                  <td className="num"><input type="number" min="1" value={l.qty} onChange={e => updateQty(i, parseInt(e.target.value) || 1)} aria-label={`Quantity of ${l.label}`} style={{ ...small, width: 64, textAlign: "right" }}/></td>
                  <td className="num">${l.unitPrice.toFixed(2)}</td>
                  <td className="num" style={{ fontWeight: 500 }}>${l.total.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}><Button size="sm" variant="ghost" aria-label={`Remove ${l.label}`} onClick={() => removeLine(i)}><Icon name="x" size={15}/></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginLeft: "auto", maxWidth: 280, fontSize: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "var(--muted)" }}><span>Subtotal</span><span style={{ color: "var(--ink)" }}>${subtotal.toFixed(2)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", color: "var(--muted)" }}>
          <label htmlFor="inv-discount">Discount ($)</label>
          <input id="inv-discount" type="number" min="0" max={subtotal} value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ ...small, width: 96, textAlign: "right" }}/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "var(--muted)" }}><span>Tax (9%)</span><span style={{ color: "var(--ink)" }}>${taxAmt.toFixed(2)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", marginTop: 6, borderTop: "1px solid var(--border)", fontSize: 17, fontWeight: 600 }}><span>Total due</span><span>${grandTotal.toFixed(2)}</span></div>
      </div>
    </Modal>
  );
}
