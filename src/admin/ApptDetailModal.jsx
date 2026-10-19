/* ============================================================
   ApptDetailModal.jsx (admin) — one appointment with its patient,
   doctor and notes; admin can mark it completed or cancel it.
   ============================================================ */
import { Modal, Badge, Button, Avatar, InfoRow } from "../ui/kit";
import Icon from "../ui/Icon";
import { fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";
import { money } from "../ui/records";

export default function ApptDetailModal({ css, accent, appt, onClose, onUpdate, onOpenPatient }) {
  const scheduled = appt.status === "Scheduled";
  const overdue = scheduled && isPastSlot(appt.date, appt.time);
  const run = async (patch, msg) => { if (await onUpdate(appt.id, patch, msg)) onClose(); };

  return (
    <Modal css={css} width={600} onClose={onClose} title="Appointment" subtitle={`${fmtDate(appt.date)} · ${fmtTime(appt.time)} · ${relativeDay(appt.date)}`}
      footer={<>
        {scheduled && <Button variant="danger" icon="xCircle" onClick={() => { if (confirm("Cancel this appointment? The slot becomes free again.")) run({ status: "Cancelled" }, "Appointment cancelled"); }}>Cancel appointment</Button>}
        <div style={{ flex: 1 }}/>
        <Button variant="outline" css={css} icon="user" onClick={onOpenPatient}>Patient record</Button>
        {scheduled && <Button variant="success" icon="checkCircle" onClick={() => run({ status: "Completed" }, "Marked completed")}>Mark completed</Button>}
      </>}>
      {overdue && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          <Icon name="alert" size={16}/> This slot has passed and the doctor has not updated it yet.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <Avatar name={appt.patientName} size={48} color={accent}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: css.text }}>{appt.patientName}</div>
          <div style={{ fontSize: 12.5, color: css.textGray }}>{[appt.patientAge != null ? `${appt.patientAge} yrs` : null, appt.patientGender, appt.patientContact].filter(Boolean).join(" · ") || "—"}</div>
        </div>
        <Badge status={appt.status}/>
      </div>
      <InfoRow css={css} icon="stethoscope" label="Doctor" value={appt.doctorName}/>
      <InfoRow css={css} icon="building" label="Department" value={appt.deptName}/>
      <InfoRow css={css} icon="clipboard" label="Reason" value={appt.reason}/>
      <InfoRow css={css} icon="card" label="Consultation fee" value={money(appt.fee)}/>
      <InfoRow css={css} icon="clock" label="Booked on" value={appt.createdAt ? new Date(appt.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : ""}/>
      {appt.notes && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: css.textGray, marginBottom: 6 }}>Doctor's notes</div>
          <div style={{ padding: "10px 12px", borderRadius: 10, background: css.subtle, border: `1px solid ${css.border}`, fontSize: 13, color: css.text, whiteSpace: "pre-wrap" }}>{appt.notes}</div>
        </div>
      )}
    </Modal>
  );
}
