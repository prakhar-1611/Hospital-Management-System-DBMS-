/* ============================================================
   ApptDetailModal.jsx (admin) — one appointment with its patient,
   doctor and notes; the admin can mark it completed or cancel it.
   ============================================================ */
import { Modal, Badge, Button, Avatar, InfoRow, Notice } from "../ui/kit";
import { fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";
import { money } from "../ui/records";

export default function ApptDetailModal({ appt, onClose, onUpdate, onOpenPatient }) {
  const scheduled = appt.status === "Scheduled";
  const overdue = scheduled && isPastSlot(appt.date, appt.time);
  const run = async (patch, msg) => { if (await onUpdate(appt.id, patch, msg)) onClose(); };

  return (
    <Modal width={600} onClose={onClose} title="Appointment" subtitle={`${fmtDate(appt.date)}, ${fmtTime(appt.time)}, ${relativeDay(appt.date).toLowerCase()}`}
      footer={<>
        {scheduled && <Button variant="danger" onClick={() => { if (confirm("Cancel this appointment? The slot becomes free again.")) run({ status: "Cancelled" }, "Appointment cancelled"); }}>Cancel appointment</Button>}
        <div style={{ flex: 1 }}/>
        <Button variant="outline" icon="user" onClick={onOpenPatient}>Patient record</Button>
        {scheduled && <Button variant="success" icon="check" onClick={() => run({ status: "Completed" }, "Marked completed")}>Mark completed</Button>}
      </>}>
      {overdue && <Notice tone="warning" style={{ marginBottom: 16 }}>This slot has passed and the doctor has not updated it yet.</Notice>}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Avatar name={appt.patientName} size={44}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{appt.patientName}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{[appt.patientAge != null ? `${appt.patientAge} years` : null, appt.patientGender, appt.patientContact].filter(Boolean).join(", ") || "No details on file"}</div>
        </div>
        <Badge status={appt.status}/>
      </div>
      <InfoRow icon="stethoscope" label="Doctor" value={appt.doctorName}/>
      <InfoRow icon="building" label="Department" value={appt.deptName}/>
      <InfoRow icon="clipboard" label="Reason" value={appt.reason}/>
      <InfoRow icon="card" label="Consultation fee" value={money(appt.fee)}/>
      <InfoRow icon="clock" label="Booked on" value={appt.createdAt ? new Date(appt.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : ""}/>
      {appt.notes && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Doctor's notes</div>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--raised)", fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{appt.notes}</div>
        </div>
      )}
    </Modal>
  );
}
