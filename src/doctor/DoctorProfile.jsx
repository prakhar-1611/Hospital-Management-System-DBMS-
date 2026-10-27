/* ============================================================
   DoctorProfile.jsx — the doctor's own details (set by the admin),
   a practice summary computed from their appointments, and password.
   ============================================================ */
import { Card, SectionTitle, Avatar, InfoRow, Badge } from "../ui/kit";
import ChangePasswordCard from "../ui/ChangePasswordCard";
import { DAY_NAMES } from "../constants";
import { fmtTime } from "../ui/dates";
import { money } from "../ui/records";

export default function DoctorProfile({ css, accent, user, doctor, appts, patients, showToast }) {
  const done = appts.filter(a => a.status === "Completed").length;
  const cancelled = appts.filter(a => a.status === "Cancelled").length;
  const closed = done + cancelled;
  const withNotes = appts.filter(a => a.status === "Completed" && a.notes).length;
  const slotCount = {};
  appts.filter(a => a.status !== "Cancelled").forEach(a => { slotCount[a.time] = (slotCount[a.time] || 0) + 1; });
  const busiest = Object.entries(slotCount).sort((a, b) => b[1] - a[1])[0];
  const dept = doctor.departmentId || {};

  const summary = [
    ["Completed consultations", done],
    ["Unique patients", patients.length],
    ["Cancellation rate", closed ? `${Math.round(cancelled / closed * 100)}%` : "—", closed ? `${cancelled} of ${closed} closed visits` : "No closed visits yet"],
    ["Notes written", done ? `${withNotes} of ${done}` : "—", done ? `${Math.round(withNotes / done * 100)}% of completed visits` : null],
    ["Busiest slot", busiest ? fmtTime(busiest[0]) : "—", busiest ? `${busiest[1]} bookings` : null],
  ];

  return (
    <div className="mc-grid-2" style={{ alignItems: "start" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <Avatar name={doctor.name} src={user.avatar} size={56}/>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, overflowWrap: "anywhere" }}>{doctor.name}</div>
            <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{[doctor.specialization, dept.name].filter(Boolean).join(", ") || "Doctor"}</div>
            <div style={{ marginTop: 6 }}><Badge status={doctor.status}/></div>
          </div>
        </div>
        <InfoRow icon="mail" label="Email" value={doctor.email || user.email}/>
        <InfoRow icon="phone" label="Phone" value={doctor.phone}/>
        <InfoRow icon="building" label="Department" value={dept.name}/>
        <InfoRow icon="card" label="Consultation fee" value={money(dept.consultationFee)}/>
        <InfoRow icon="calendar" label="Working days" value={[...doctor.workingDays].sort().map(d => DAY_NAMES[d]).join(", ")}/>
        <InfoRow icon="clock" label="Hours" value={`${fmtTime(doctor.workingHours.start)} to ${fmtTime(doctor.workingHours.end)}`}/>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14 }}>Your name, department and fee are managed by the hospital administrator. You can change your schedule and availability yourself.</p>
      </Card>

      <div className="mc-stack">
        <Card>
          <SectionTitle title="Practice summary" subtitle="Worked out from all of your appointments"/>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: "18px 24px" }}>
            {summary.map(([k, v, hint]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <dt style={{ fontSize: 13, color: "var(--muted)" }}>{k}</dt>
                <dd style={{ fontSize: 22, lineHeight: 1.3, marginTop: 2 }}>{v}</dd>
                {hint && <dd style={{ fontSize: 12.5, color: "var(--muted)" }}>{hint}</dd>}
              </div>
            ))}
          </dl>
        </Card>
        <ChangePasswordCard css={css} accent={accent} showToast={showToast} isGoogle={user.authProvider === "google"}/>
      </div>
    </div>
  );
}
