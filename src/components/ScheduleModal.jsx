/* ============================================================
   ScheduleModal.jsx — a doctor's next 14 days: working or day off, and
   which one-hour slots are booked. Busy slots are the doctor's Scheduled
   appointments from GET /api/appointments; the weekday is computed in UTC
   the same way the backend does.
   ============================================================ */
import { Modal, Badge } from "../ui/kit";
import { DAY_NAMES, generateTimeSlots, getTodayPlus } from "../constants";
import { fmtTime } from "../ui/dates";

export default function ScheduleModal({ doctor: doc, onClose }) {
  const days = Array.from({ length: 14 }, (_, i) => getTodayPlus(i));
  return (
    <Modal onClose={onClose} width={640} title={`${doc.name}'s schedule`}
      subtitle={`${doc.dept}. Works ${[...doc.workingDays].sort().map(x => DAY_NAMES[x]).join(", ")}, ${fmtTime(doc.workingHours.start)} to ${fmtTime(doc.workingHours.end)}`}>
      <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent)" }}/>Booked</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: "1px solid var(--control)" }}/>Free</span>
      </div>
      <div style={{ display: "grid", gap: 0 }}>
        {days.map(date => {
          const dow = new Date(date + "T00:00:00Z").getUTCDay();
          const isWorking = doc.workingDays.includes(dow) && doc.status !== "On Leave";
          const slots = isWorking ? generateTimeSlots(doc.workingHours.start, doc.workingHours.end) : [];
          const busy = new Set(doc.busySlots.filter(s => s.date === date).map(s => s.time));
          const label = new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
          return (
            <div key={date} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--rule)", flexWrap: "wrap" }}>
              <div style={{ width: 96, flexShrink: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5 }}>{label}</div>
                {!isWorking && <Badge bg="var(--pill-neutral-bg)" fg="var(--pill-neutral-fg)">{doc.status === "On Leave" ? "On leave" : "Day off"}</Badge>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                {slots.map(s => busy.has(s)
                  ? <span key={s} style={{ padding: "2px 8px", borderRadius: 5, fontSize: 12.5, background: "var(--accent)", color: "#fff" }}>{s}</span>
                  : <span key={s} style={{ padding: "1px 8px", borderRadius: 5, fontSize: 12.5, border: "1px solid var(--control)", color: "var(--muted)" }}>{s}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
