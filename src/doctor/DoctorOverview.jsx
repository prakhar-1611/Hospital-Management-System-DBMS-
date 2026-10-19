/* ============================================================
   DoctorOverview.jsx — the doctor's home screen: availability switch,
   key numbers, today's queue, next patient, 7-day load, recent notes.
   ============================================================ */
import { Card, SectionTitle, StatCard, Badge, Button, Avatar, EmptyState } from "../ui/kit";
import Icon from "../ui/Icon";
import { DAY_NAMES, getTodayPlus, generateTimeSlots } from "../constants";
import { todayStr, fmtTime, fmtDate, relativeDay, greeting, weekday, isPastSlot } from "../ui/dates";
import { byDateAsc, byDateDesc } from "../ui/records";

const STATUSES = ["Available", "Busy", "On Leave"];

export function StatusSwitch({ value, onChange, light }) {
  return (
    <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: light ? "rgba(255,255,255,.16)" : "rgba(127,127,127,.12)", gap: 4, flexWrap: "wrap" }}>
      {STATUSES.map(s => {
        const on = s === value;
        const dot = { Available: "#22c55e", Busy: "#f59e0b", "On Leave": "#ef4444" }[s];
        return (
          <button key={s} onClick={() => !on && onChange(s)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 9, border: "none", cursor: on ? "default" : "pointer",
              fontSize: 12.5, fontWeight: 650, background: on ? "white" : "transparent", color: on ? "#0f172a" : light ? "rgba(255,255,255,.9)" : "inherit" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }}/>{s}
          </button>
        );
      })}
    </div>
  );
}

export default function DoctorOverview({ css, accent, tint, isDark, user, doctor, appts, patients, needsUpdate, onOpenAppt, onUpdateAppt, onUpdateDoctor, onNavigate }) {
  const today = todayStr();
  const todays = appts.filter(a => a.date === today && a.status !== "Cancelled").sort(byDateAsc);
  const remaining = todays.filter(a => a.status === "Scheduled");
  const in7 = getTodayPlus(6);
  const week = appts.filter(a => a.status === "Scheduled" && a.date >= today && a.date <= in7);
  const next = appts.filter(a => a.status === "Scheduled" && !isPastSlot(a.date, a.time)).sort(byDateAsc)[0];
  const recent = appts.filter(a => a.status === "Completed").sort(byDateDesc).slice(0, 5);
  const dept = doctor.departmentId?.name || "";
  const slotsPerDay = generateTimeSlots(doctor.workingHours.start, doctor.workingHours.end).length;

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = getTodayPlus(i);
    const works = doctor.workingDays.includes(weekday(date)) && doctor.status !== "On Leave";
    const n = appts.filter(a => a.date === date && a.status === "Scheduled").length;
    return { date, works, n };
  });
  const maxN = Math.max(slotsPerDay, 1);

  return (
    <div className="mc-stack">
      {/* hero */}
      <div style={{ borderRadius: 18, padding: "22px 24px", color: "white", background: `linear-gradient(120deg, ${accent} 0%, #115e59 60%, #134e4a 100%)`,
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap", boxShadow: "0 10px 30px rgba(15,118,110,.25)" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, opacity: .85 }}>{greeting()},</div>
          <div style={{ fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 800, marginTop: 2 }}>{user.name}</div>
          <div style={{ fontSize: 13, opacity: .85, marginTop: 4 }}>{[dept, doctor.specialization].filter(Boolean).join(" · ")}</div>
          <div style={{ fontSize: 13, marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={15}/>
            {remaining.length === 0
              ? (todays.length ? "All of today's consultations are done." : "No consultations booked for today.")
              : `${remaining.length} consultation${remaining.length > 1 ? "s" : ""} left today`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, opacity: .8, marginBottom: 6, textTransform: "uppercase", letterSpacing: .6, fontWeight: 600 }}>My availability</div>
          <StatusSwitch light value={doctor.status} onChange={(s) => onUpdateDoctor({ status: s }, `You are now ${s}`)}/>
          {doctor.status === "On Leave" && <div style={{ fontSize: 12, opacity: .85, marginTop: 6 }}>Patients cannot book new visits while you are on leave.</div>}
        </div>
      </div>

      {/* numbers */}
      <div className="mc-grid-stats">
        <StatCard css={css} icon="calendar" label="Today" value={todays.length} hint={`${todays.length - remaining.length} done · ${remaining.length} remaining`}
          color={accent} tint={isDark ? `${accent}30` : tint} onClick={() => onNavigate("appointments", "today")}/>
        <StatCard css={css} icon="activity" label="Next 7 days" value={week.length} hint="Scheduled consultations"
          color="#2563eb" tint={isDark ? "#2563eb30" : "#dbeafe"} onClick={() => onNavigate("appointments", "upcoming")}/>
        <StatCard css={css} icon="users" label="My patients" value={patients.length} hint="Seen or booked with you"
          color="#7c3aed" tint={isDark ? "#7c3aed30" : "#ede9fe"} onClick={() => onNavigate("patients")}/>
        <StatCard css={css} icon="alert" label="Awaiting update" value={needsUpdate.length} hint="Past slots still marked scheduled"
          color="#d97706" tint={isDark ? "#d9770630" : "#fef3c7"} onClick={() => onNavigate("appointments", "attention")}/>
      </div>

      <div className="mc-split">
        {/* today's queue */}
        <Card css={css}>
          <SectionTitle css={css} title="Today's queue" subtitle={fmtDate(today, { weekday: "long", day: "numeric", month: "long" })}
            right={<Button variant="ghost" css={css} size="sm" onClick={() => onNavigate("appointments", "today")}>View all <Icon name="chevronRight" size={14}/></Button>}/>
          {todays.length === 0 ? (
            <EmptyState css={css} icon="calendar" title="No consultations today"
              body={doctor.workingDays.includes(weekday(today)) ? "Your slots for today are open for booking." : "Today is not one of your working days."}/>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {todays.map(a => {
                const past = isPastSlot(a.date, a.time);
                return (
                  <div key={a.id} className="mc-row-hover" onClick={() => onOpenAppt(a.id)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && onOpenAppt(a.id)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, border: `1px solid ${css.border}`, cursor: "pointer",
                      opacity: a.status === "Completed" ? .7 : 1 }}>
                    <div style={{ width: 70, textAlign: "center", padding: "6px 0", borderRadius: 10, background: isDark ? `${accent}30` : tint, color: isDark ? "#5eead4" : accent, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {fmtTime(a.time)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 650, fontSize: 14, color: css.text }}>{a.patientName}</div>
                      <div style={{ fontSize: 12.5, color: css.textGray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {[a.patientAge != null ? `${a.patientAge} y` : null, a.patientGender, a.reason].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {a.status === "Scheduled" && past ? <Badge bg="#fef3c7" fg="#92400e">Awaiting update</Badge> : <Badge status={a.status}/>}
                    {a.status === "Scheduled" && (
                      <Button size="sm" variant="soft" accent={accent} icon="check"
                        onClick={(e) => { e.stopPropagation(); onUpdateAppt(a.id, { status: "Completed" }, `${a.patientName} marked completed`); }}>
                        Done
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="mc-stack">
          {/* next patient */}
          <Card css={css}>
            <SectionTitle css={css} title="Next patient"/>
            {next ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={next.patientName} size={46} color={accent}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: css.text }}>{next.patientName}</div>
                    <div style={{ fontSize: 12.5, color: css.textGray }}>{relativeDay(next.date)} at {fmtTime(next.time)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: css.text, marginTop: 12, padding: "10px 12px", borderRadius: 10, background: css.subtle, border: `1px solid ${css.border}` }}>
                  <span style={{ color: css.textGray }}>Reason: </span>{next.reason}
                </div>
                <Button accent={accent} style={{ width: "100%", marginTop: 12 }} icon="clipboard" onClick={() => onOpenAppt(next.id)}>Open consultation</Button>
              </div>
            ) : <EmptyState css={css} icon="checkCircle" title="Nothing scheduled" body="New bookings will show up here."/>}
          </Card>

          {/* 7-day load */}
          <Card css={css}>
            <SectionTitle css={css} title="Next 7 days" subtitle={`Booked slots out of ${slotsPerDay} per working day`}/>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130, paddingTop: 8 }}>
              {days.map(d => (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }} title={`${fmtDate(d.date)}: ${d.works ? `${d.n} booked` : "day off"}`}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: d.works ? css.text : css.textGray }}>{d.works ? d.n : "–"}</div>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", background: d.works ? css.subtle : "transparent", borderRadius: 8, border: d.works ? `1px solid ${css.border}` : `1px dashed ${css.border}` }}>
                    {d.works && <div style={{ width: "100%", height: `${Math.max(d.n / maxN * 100, d.n ? 8 : 0)}%`, background: accent, borderRadius: 7, transition: "height .4s" }}/>}
                  </div>
                  <div style={{ fontSize: 11, color: d.date === today ? accent : css.textGray, fontWeight: d.date === today ? 700 : 500 }}>{DAY_NAMES[weekday(d.date)]}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 12.5, color: css.textGray, gap: 8, flexWrap: "wrap" }}>
              <span>Hours: {fmtTime(doctor.workingHours.start)} – {fmtTime(doctor.workingHours.end)}</span>
              <Button variant="ghost" size="sm" css={css} onClick={() => onNavigate("schedule")}>Edit schedule</Button>
            </div>
          </Card>
        </div>
      </div>

      {/* recent consultations */}
      <Card css={css}>
        <SectionTitle css={css} title="Recent consultations" subtitle="Your last completed visits and the notes you left"/>
        {recent.length === 0 ? <EmptyState css={css} icon="file" title="No completed consultations yet"/> : (
          <div className="mc-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead><tr>{["Date", "Patient", "Reason", "Notes", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: css.textGray, fontWeight: 600, borderBottom: `1px solid ${css.border}` }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {recent.map(a => (
                  <tr key={a.id} className="mc-row-hover">
                    <td style={{ padding: "11px 12px", fontSize: 12.5, color: css.textGray, whiteSpace: "nowrap" }}>{fmtDate(a.date, { day: "numeric", month: "short" })}</td>
                    <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 600, color: css.text }}>{a.patientName}</td>
                    <td style={{ padding: "11px 12px", fontSize: 13, color: css.text }}>{a.reason}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12.5, color: a.notes ? css.text : css.textGray, maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {a.notes || "No notes yet"}
                    </td>
                    <td style={{ padding: "11px 12px", textAlign: "right" }}>
                      <Button size="sm" variant="outline" css={css} onClick={() => onOpenAppt(a.id)}>{a.notes ? "Open" : "Add notes"}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
