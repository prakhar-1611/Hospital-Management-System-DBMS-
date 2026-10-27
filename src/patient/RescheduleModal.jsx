/* ============================================================
   RescheduleModal.jsx — move one of the patient's own appointments to
   another free slot with the same doctor. PUT /api/appointments/:id
   ============================================================ */
import { useState } from "react";
import * as api from "../api";
import { Modal, Button, Notice } from "../ui/kit";
import SlotPicker from "./SlotPicker";
import { fmtDate, fmtTime } from "../ui/dates";

export default function RescheduleModal({ appt, doctor, onClose, onDone, showToast }) {
  const [slot, setSlot] = useState({ date: "", time: "" });
  const [busy, setBusy] = useState(false);
  const same = slot.date === appt.date && slot.time === appt.time;

  async function save() {
    setBusy(true);
    try {
      const u = await api.updateAppointment(appt.id, { date: slot.date, timeSlot: slot.time });
      onDone({ id: appt.id, date: u.date.slice(0, 10), time: u.timeSlot });
    } catch (e) {
      showToast(e.message, e.status === 409 ? "warning" : "error");
      if (e.status === 409) setSlot(s => ({ ...s, time: "" }));
      setBusy(false);
    }
  }

  return (
    <Modal width={640} onClose={onClose} title="Reschedule appointment"
      subtitle={`${appt.doctorName}, now ${fmtDate(appt.date)} at ${fmtTime(appt.time)}`}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Keep current time</Button>
        <Button icon="check" disabled={!slot.date || !slot.time || same || busy} onClick={save}>
          {busy ? "Saving" : slot.time && !same ? `Move to ${fmtDate(slot.date, { day: "numeric", month: "short" })}, ${fmtTime(slot.time)}` : "Confirm new time"}
        </Button>
      </>}>
      {doctor
        ? <SlotPicker doctor={doctor} date={slot.date} time={slot.time} onChange={setSlot} exclude={{ date: appt.date, time: appt.time }}/>
        : <Notice tone="warning">This doctor is no longer listed. Cancel this visit and book with another doctor.</Notice>}
    </Modal>
  );
}
