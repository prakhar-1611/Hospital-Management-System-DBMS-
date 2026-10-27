/* ============================================================
   AppointmentModal.jsx (doctor) — one appointment: patient summary,
   reason, consultation notes, complete / cancel.
   PUT /api/appointments/:id with { notes } and/or { status }.
   ============================================================ */
import { useState } from "react";
import { Modal, Badge, Button, Avatar, InfoRow, Notice } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { fmtDate, fmtTime, relativeDay, isPastSlot, todayStr } from "../ui/dates";

export default function AppointmentModal({ css, appt, patient, onClose, onUpdate, onOpenPatient }) {
  const [notes, setNotes] = useState(appt.notes);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const scheduled = appt.status === "Scheduled";
  const overdue = scheduled && isPastSlot(appt.date, appt.time);
  const due = appt.date <= todayStr();      // a visit can be completed from its day on, never in advance

  async function run(patch, msg) {
    setBusy(true);
    const ok = await onUpdate(appt.id, patch, msg);
    setBusy(false);
    if (ok && patch.status) onClose();
  }

  const footer = confirmCancel ? (
    <>
      <span style={{ fontSize: 13.5, marginRight: "auto", alignSelf: "center" }}>Cancel this visit? The slot opens for booking again.</span>
      <Button variant="ghost" disabled={busy} onClick={() => setConfirmCancel(false)}>Keep it</Button>
      <Button variant="danger" icon="xCircle" disabled={busy} onClick={() => run({ status: "Cancelled" }, "Appointment cancelled")}>Cancel visit</Button>
    </>
  ) : (
    <>
      {scheduled && <Button variant="danger" icon="xCircle" disabled={busy} onClick={() => setConfirmCancel(true)} style={{ marginRight: "auto" }}>Cancel visit</Button>}
      <Button variant="outline" icon="check" disabled={busy || notes === appt.notes} onClick={() => run({ notes }, "Notes saved")}>Save notes</Button>
      {scheduled && due && (
        <Button variant="success" icon="checkCircle" disabled={busy}
          onClick={() => run({ status: "Completed", notes }, `Consultation with ${appt.patientName} marked completed`)}>
          Mark completed
        </Button>
      )}
    </>
  );

  return (
    <Modal width={640} onClose={onClose} footer={footer}
      title="Consultation" subtitle={`${fmtDate(appt.date)}, ${fmtTime(appt.time)} (${relativeDay(appt.date).toLowerCase()})`}>
      {overdue && <Notice tone="warning" style={{ marginBottom: 16 }}>This slot has passed. Mark it completed or cancelled so the patient's record stays accurate.</Notice>}

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <Avatar name={appt.patientName} size={48}/>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, overflowWrap: "anywhere" }}>{appt.patientName}</div>
          <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
            {[appt.patientAge != null ? `${appt.patientAge} years` : null, appt.patientGender, appt.patientContact].filter(Boolean).join(", ") || "No details on file"}
          </div>
        </div>
        <Badge status={appt.status}/>
      </div>

      {patient?.allergies && <Notice tone="negative" style={{ marginBottom: 14 }}><strong>Allergies:</strong> {patient.allergies}</Notice>}

      <div style={{ marginBottom: 18 }}>
        <InfoRow icon="clipboard" label="Reason for visit" value={appt.reason}/>
        <InfoRow icon="droplet" label="Blood group" value={patient?.bloodGroup}/>
        <InfoRow icon="phone" label="Emergency contact" value={patient?.emergencyContact}/>
      </div>

      <label htmlFor="consult-notes" style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 5 }}>
        Consultation notes <span style={{ fontWeight: 400, color: "var(--muted)" }}>(the patient can read these)</span>
      </label>
      <textarea id="consult-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={5} maxLength={1000}
        placeholder="Findings, diagnosis, prescription, follow-up advice"
        style={{ ...inputStyle(css), resize: "vertical", lineHeight: 1.5 }}/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
        <Button variant="ghost" size="sm" onClick={onOpenPatient} style={{ paddingLeft: 0, color: "var(--accent-ink)" }}>
          View patient history <Icon name="chevronRight" size={14}/>
        </Button>
        <span>{notes.length} / 1000</span>
      </div>
    </Modal>
  );
}
