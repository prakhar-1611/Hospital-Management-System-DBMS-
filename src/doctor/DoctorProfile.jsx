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
    ["Cancellation rate", closed ? `${Math.round(cancelled / closed * 100)}%` : "—"],
    ["Notes written", done ? `${withNotes} of ${done}` : "—"],
    ["Busiest slot", busiest ? `${fmtTime(busiest[0])} (${busiest[1]})` : "—"],
  ];

  return (
    <div className="mc-grid-2" style={{ alignItems: "start" }}>
      <div className="mc-stack">
        <Card css={css}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <Avatar name={user.name} size={64} color={accent}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 750, color: css.text }}>{doctor.name}</div>
              <div style={{ fontSize: 13, color: css.textGray }}>{doctor.specialization || "Doctor"} · {dept.name}</div>
              <div style={{ marginTop: 6 }}><Badge status={doctor.status}/></div>
            </div>
          </div>
          <InfoRow css={css} icon="mail" label="Email" value={doctor.email || user.email}/>
          <InfoRow css={css} icon="phone" label="Phone" value={doctor.phone}/>
          <InfoRow css={css} icon="building" label="Department" value={dept.name}/>
          <InfoRow css={css} icon="card" label="Consultation fee" value={money(dept.consultationFee)}/>
          <InfoRow css={css} icon="calendar" label="Working days" value={[...doctor.workingDays].sort().map(d => DAY_NAMES[d]).join(", ")}/>
          <InfoRow css={css} icon="clock" label="Hours" value={`${fmtTime(doctor.workingHours.start)} – ${fmtTime(doctor.workingHours.end)}`}/>
          <p style={{ fontSize: 12, color: css.textGray, marginTop: 12 }}>Name, department and fee are managed by the hospital administrator. You can change your schedule and availability yourself.</p>
        </Card>
      </div>
      <div className="mc-stack">
        <Card css={css}>
          <SectionTitle css={css} title="Practice summary" subtitle="From all of your appointments"/>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {summary.map(([k, v]) => (
              <div key={k} style={{ padding: 14, borderRadius: 12, background: css.subtle, border: `1px solid ${css.border}` }}>
                <div style={{ fontSize: 11.5, color: css.textGray }}>{k}</div>
                <div style={{ fontSize: 18, fontWeight: 750, color: css.text, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
        <ChangePasswordCard css={css} accent={accent} showToast={showToast} isGoogle={user.authProvider === "google"}/>
      </div>
    </div>
  );
}
