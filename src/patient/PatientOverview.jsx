/* ============================================================
   PatientOverview.jsx — the patient's home screen: next visit,
   key numbers, upcoming list, latest doctor notes, hospital info.
   ============================================================ */
import { Card, SectionTitle, StatCard, Button, Avatar, Badge, EmptyState } from "../ui/kit";
import Icon from "../ui/Icon";
import { fmtDate, fmtTime, relativeDay, greeting } from "../ui/dates";
import { byDateAsc, byDateDesc } from "../ui/records";

const TIPS = [
  ["droplet", "Stay hydrated", "Aim for 8 glasses of water a day, more in hot weather or when you have a fever."],
  ["activity", "Move every day", "30 minutes of brisk walking five days a week lowers blood pressure and stress."],
  ["pill", "Take medicines as prescribed", "Finish antibiotic courses even if you feel better, and never share prescriptions."],
];

export default function PatientOverview({ css, accent, isDark, user, profile, appts, upcoming, missing, onBook, onNavigate, onCancel, onReschedule }) {
  const next = [...upcoming].sort(byDateAsc)[0];
  const completed = appts.filter(a => a.status === "Completed").sort(byDateDesc);
  const doctorsSeen = new Set(completed.map(a => a.doctorId)).size;
  const withNotes = completed.filter(a => a.notes).slice(0, 3);
  const first = (profile?.name || user.name).split(" ")[0];
  const t = isDark ? (c) => `${c}30` : (c) => `${c}18`;

  return (
    <div className="mc-stack">
      {missing.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, background: isDark ? "#7c3aed22" : "#f5f3ff", border: `1px solid ${isDark ? "#7c3aed55" : "#ddd6fe"}`, flexWrap: "wrap" }}>
          <Icon name="user" size={18} color={accent}/>
          <div style={{ flex: 1, minWidth: 200, fontSize: 13.5, color: css.text }}>
            <strong>Complete your profile</strong> so doctors have what they need: {missing.map(([, l]) => l.toLowerCase()).join(", ")}.
          </div>
          <Button size="sm" accent={accent} onClick={() => onNavigate("profile")}>Update profile</Button>
        </div>
      )}

      {/* hero */}
      <div style={{ borderRadius: 18, padding: "24px 26px", color: "white", background: `linear-gradient(120deg, ${accent} 0%, #5b21b6 60%, #4c1d95 100%)`,
        display: "flex", gap: 22, flexWrap: "wrap", alignItems: "stretch", justifyContent: "space-between", boxShadow: "0 10px 30px rgba(124,58,237,.25)" }}>
        <div style={{ minWidth: 220, flex: "1 1 260px" }}>
          <div style={{ fontSize: 13, opacity: .85 }}>{greeting()},</div>
          <div style={{ fontSize: "clamp(22px, 2.8vw, 28px)", fontWeight: 800, marginTop: 2 }}>{first}</div>
          <p style={{ fontSize: 13.5, opacity: .85, marginTop: 8, maxWidth: 360, lineHeight: 1.5 }}>
            {next ? "Your next visit is coming up. You can reschedule or cancel it any time before then." : "You have no upcoming visits. Book with one of our specialists in under a minute."}
          </p>
          <button onClick={() => onBook()} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "none", background: "white", color: accent, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            <Icon name="calendarPlus" size={17}/> Book an appointment
          </button>
        </div>
        {next && (
          <div style={{ flex: "1 1 280px", maxWidth: 420, padding: 18, borderRadius: 14, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)" }}>
            <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: .6, opacity: .8, fontWeight: 600 }}>Next appointment · {relativeDay(next.date)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <Avatar name={next.doctorName} size={44} color="rgba(255,255,255,.22)"/>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{next.doctorName}</div>
                <div style={{ fontSize: 12.5, opacity: .85 }}>{next.deptName}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 13, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="calendar" size={15}/>{fmtDate(next.date, { weekday: "short", day: "numeric", month: "short" })}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={15}/>{fmtTime(next.time)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => onReschedule(next)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "white", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Reschedule</button>
              <button onClick={() => onCancel(next)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "white", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="mc-grid-stats">
        <StatCard css={css} icon="calendar" label="Upcoming visits" value={upcoming.length} color={accent} tint={t(accent)} onClick={() => onNavigate("appointments")}/>
        <StatCard css={css} icon="checkCircle" label="Completed visits" value={completed.length} color="#16a34a" tint={t("#16a34a")} onClick={() => onNavigate("appointments")}/>
        <StatCard css={css} icon="stethoscope" label="Doctors consulted" value={doctorsSeen} color="#0891b2" tint={t("#0891b2")} onClick={() => onNavigate("doctors")}/>
        <StatCard css={css} icon="droplet" label="Blood group" value={profile?.bloodGroup || "—"} hint={profile?.bloodGroup ? undefined : "Add it in your profile"} color="#dc2626" tint={t("#dc2626")} onClick={() => onNavigate("profile")}/>
      </div>

      <div className="mc-split">
        <div className="mc-stack">
          <Card css={css}>
            <SectionTitle css={css} title="Upcoming appointments"
              right={upcoming.length > 0 && <Button variant="ghost" size="sm" css={css} onClick={() => onNavigate("appointments")}>See all <Icon name="chevronRight" size={14}/></Button>}/>
            {upcoming.length === 0 ? (
              <EmptyState css={css} icon="calendar" title="Nothing booked" body="Choose a department, a doctor and a time that suits you."
                action={<Button accent={accent} icon="calendarPlus" onClick={() => onBook()}>Book now</Button>}/>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {[...upcoming].sort(byDateAsc).slice(0, 4).map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, border: `1px solid ${css.border}`, flexWrap: "wrap" }}>
                    <div style={{ width: 58, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase" }}>{fmtDate(a.date, { month: "short" })}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: css.text, lineHeight: 1.1 }}>{Number(a.date.slice(8))}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 650, fontSize: 14, color: css.text }}>{a.doctorName}</div>
                      <div style={{ fontSize: 12.5, color: css.textGray }}>{fmtTime(a.time)} · {a.deptName} · {a.reason}</div>
                    </div>
                    <Badge status="Scheduled">{relativeDay(a.date)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card css={css}>
            <SectionTitle css={css} title="Latest notes from your doctors" subtitle="Written after your consultations"/>
            {withNotes.length === 0 ? <EmptyState css={css} icon="file" title="No notes yet" body="After a visit, your doctor's advice and prescriptions appear here."/> : (
              <div style={{ display: "grid", gap: 10 }}>
                {withNotes.map(a => (
                  <div key={a.id} style={{ padding: 14, borderRadius: 12, background: css.subtle, border: `1px solid ${css.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 12.5 }}>
                      <strong style={{ color: css.text }}>{a.doctorName}</strong>
                      <span style={{ color: css.textGray }}>{fmtDate(a.date)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: css.textGray, marginTop: 2 }}>{a.reason}</div>
                    <div style={{ fontSize: 13, color: css.text, marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.notes}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="mc-stack">
          <Card css={css}>
            <SectionTitle css={css} title="Hospital information"/>
            {[
              ["clock", "OPD hours", "Mon – Sat, 8:00 AM – 8:00 PM"],
              ["ambulance", "Emergency", "24×7 · call 108"],
              ["phone", "Helpdesk", "+91 416 220 0000"],
              ["pill", "Pharmacy", "Ground floor, open 24×7"],
              ["mapPin", "Address", "MedCare Hospital, Katpadi Road, Vellore"],
            ].map(([icon, k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${css.border}` }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: t(accent), color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={icon} size={16}/></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: css.textGray }}>{k}</div>
                  <div style={{ fontSize: 13, color: css.text, fontWeight: 600 }}>{v}</div>
                </div>
              </div>
            ))}
          </Card>
          <Card css={css}>
            <SectionTitle css={css} title="Health tips"/>
            <div style={{ display: "grid", gap: 12 }}>
              {TIPS.map(([icon, title, text]) => (
                <div key={title} style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: accent, marginTop: 2 }}><Icon name={icon} size={18}/></span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 650, color: css.text }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: css.textGray, lineHeight: 1.5 }}>{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
