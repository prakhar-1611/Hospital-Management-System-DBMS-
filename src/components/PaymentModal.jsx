/* ============================================================
   PaymentModal.jsx — record a payment taken at the reception desk.
   MedCare never handles card numbers: cards are taken on the hospital's
   card machine, and the desk only records the method and the receipt
   number. (Browser-only demo: nothing is stored in MongoDB.)
   ============================================================ */
import { useState } from "react";
import { Modal, Button, Segmented, Field } from "../ui/kit";
import { inputStyle } from "../ui/theme";

const METHODS = ["Cash", "Card", "UPI", "Bank Transfer", "Insurance"];
const HELP = {
  Cash: "Collect the exact amount, then record it.",
  Card: "Take the payment on the card machine, then enter its receipt number.",
  UPI: "Ask the patient to pay to the hospital UPI ID, then enter the transaction reference.",
  "Bank Transfer": "Record once the transfer shows in the hospital account; enter the transfer reference.",
  Insurance: "Enter the insurer and the claim or policy number. The invoice stays recorded as paid by insurance.",
};
const REF_LABEL = { Cash: null, Card: "Card machine receipt number", UPI: "UPI transaction reference", "Bank Transfer": "Transfer reference", Insurance: "Insurer and claim number" };

export default function PaymentModal({ invoice: inv, css, onClose, onPay }) {
  const [method, setMethod] = useState(inv.paymentMethod && METHODS.includes(inv.paymentMethod) ? inv.paymentMethod : "Cash");
  const [ref, setRef] = useState("");
  const needsRef = REF_LABEL[method];

  return (
    <Modal onClose={onClose} width={480} title="Take payment" subtitle={`${inv.id}, ${inv.patientName}`}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="success" icon="check" disabled={!!needsRef && !ref.trim()} onClick={() => onPay(method)}>Record ${inv.grandTotal.toFixed(2)} as paid</Button>
      </>}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, paddingBottom: 14, marginBottom: 16, borderBottom: "1px solid var(--rule)" }}>
        <span style={{ color: "var(--muted)", fontSize: 13.5 }}>{inv.doctor}, {inv.dept}</span>
        <span style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.01em" }}>${inv.grandTotal.toFixed(2)}</span>
      </div>
      <div style={{ overflowX: "auto", marginBottom: 14 }}>
        <Segmented label="Payment method" options={METHODS.map(m => ({ value: m, label: m }))} value={method} onChange={(m) => { setMethod(m); setRef(""); }}/>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>{HELP[method]}</p>
      {needsRef && (
        <Field label={needsRef}>
          <input value={ref} onChange={e => setRef(e.target.value)} style={inputStyle(css)} autoComplete="off" autoFocus/>
        </Field>
      )}
    </Modal>
  );
}
