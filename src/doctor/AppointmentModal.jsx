/* ============================================================
   AppointmentModal.jsx (doctor) — one appointment: patient summary,
   reason, consultation notes, complete / cancel.
   PUT /api/appointments/:id with { notes } and/or { status }.
   ============================================================ */
import { useState } from "react";
import { Modal, Badge, Button, Avatar, InfoRow } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";

export default function AppointmentModal({ css, accent, appt, patient, onClose, onUpdate, onOpenPatient }) {
  const [notes, setNotes] = useState(appt.notes);
  const [busy, setBusy] = useState(false);
  const scheduled = appt.status === "Scheduled";
  const overdue = scheduled && isPastSlot(appt.date, appt.time);

  async function run(patch, msg) {
    setBusy(true);
    const ok = await onUpdate(appt.id, patch, msg);
    setBusy(false);
    if (ok && patch.status) onClose();
  }

  const footer = (
    <>
      {scheduled && (
        <Button variant="danger" icon="xCircle" disabled={busy}
          onClick={() => { if (confirm(`Cancel ${appt.patientName}'s appointment on ${fmtDate(appt.date)} at ${fmtTime(appt.time)}?`)) run({ status: "Cancelled" }, "Appointment cancelled"); }}>
          Cancel visit
        </Button>
      )}
      <div style={{ flex: 1 }}/>
      <Button variant="outline" css={css} icon="check" disabled={busy || notes === appt.notes}
        onClick={() => run({ notes }, "Notes saved")}>Save notes</Button>
      {scheduled && (
        <Button variant="success" icon="checkCircle" disabled={busy}
          onClick={() => run({ status: "Completed", notes }, `Consultation with ${appt.patientName} marked completed`)}>
          Mark completed
        </Button>
      )}
    </>
  );

  return (
    <Modal css={css} width={640} onClose={onClose} footer={footer}
      title="Consultation" subtitle={`${fmtDate(appt.date)} · ${fmtTime(appt.time)} · ${relativeDay(appt.date)}`}>
      {overdue && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
          <Icon name="alert" size={16}/> This slot has passed. Mark it completed or cancelled so the patient's record stays accurate.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <Avatar name={appt.patientName} size={50} color={accent}/>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: css.text }}>{appt.patientName}</div>
          <div style={{ fontSize: 12.5, color: css.textGray }}>
            {[appt.patientAge !== undefined && appt.patientAge !== null ? `${appt.patientAge} yrs` : null, appt.patientGender, appt.patientContact].filter(Boolean).join(" · ") || "No details on file"}
          </div>
        </div>
        <Badge status={appt.status}/>
      </div>

      {patient?.allergies && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          <Icon name="alert" size={16}/> <span><strong>Allergies:</strong> {patient.allergies}</span>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <InfoRow css={css} icon="clipboard" label="Reason for visit" value={appt.reason}/>
        <InfoRow css={css} icon="droplet" label="Blood group" value={patient?.bloodGroup}/>
        <InfoRow css={css} icon="phone" label="Emergency contact" value={patient?.emergencyContact}/>
      </div>

      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: css.textGray, marginBottom: 6 }}>
        Consultation notes <span style={{ fontWeight: 400 }}>(visible to the patient in their portal)</span>
      </label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} maxLength={1000}
        placeholder="Findings, diagnosis, prescription, follow-up advice…"
        style={{ ...inputStyle(css), resize: "vertical", lineHeight: 1.5, fontFamily: "inherit" }}/>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: css.textGray, marginTop: 6 }}>
        <button onClick={onOpenPatient} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
          View patient history <Icon name="chevronRight" size={14}/>
        </button>
        <span>{notes.length}/1000</span>
      </div>
    </Modal>
  );
}
