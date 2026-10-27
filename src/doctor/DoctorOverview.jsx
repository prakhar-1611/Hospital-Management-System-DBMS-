/* ============================================================
   DoctorOverview.jsx — the doctor's "Today": who is next and what is
   left. The queue leads; the next patient and the week's load sit beside
   it; recent consultations show where notes are still missing.
   ============================================================ */
import { Card, SectionTitle, StatCard, Badge, Button, Avatar, EmptyState } from "../ui/kit";
import { DAY_NAMES, getTodayPlus, generateTimeSlots } from "../constants";
import { todayStr, fmtTime, fmtDate, relativeDay, weekday, isPastSlot } from "../ui/dates";
import { byDateAsc, byDateDesc } from "../ui/records";

export default function DoctorOverview({ doctor, appts, patients, needsUpdate, onOpenAppt, onUpdateAppt, onNavigate }) {
  const today = todayStr();
  const todays = appts.filter(a => a.date === today && a.status !== "Cancelled").sort(byDateAsc);
  const remaining = todays.filter(a => a.status === "Scheduled");
  const in7 = getTodayPlus(6);
  const week = appts.filter(a => a.status === "Scheduled" && a.date >= today && a.date <= in7);
  const next = appts.filter(a => a.status === "Scheduled" && !isPastSlot(a.date, a.time)).sort(byDateAsc)[0];
  const recent = appts.filter(a => a.status === "Completed").sort(byDateDesc).slice(0, 5);
  const slotsPerDay = generateTimeSlots(doctor.workingHours.start, doctor.workingHours.end).length;

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = getTodayPlus(i);
    const works = doctor.workingDays.includes(weekday(date)) && doctor.status !== "On Leave";
    return { date, works, n: appts.filter(a => a.date === date && a.status === "Scheduled").length };
  });

  return (
    <div className="mc-stack">
      <div className="mc-grid-stats">
        <StatCard label="Today" value={todays.length} hint={`${todays.length - remaining.length} done, ${remaining.length} to go`} onClick={() => onNavigate("appointments", "today")}/>
        <StatCard label="Next 7 days" value={week.length} hint="Scheduled visits" onClick={() => onNavigate("appointments", "upcoming")}/>
        <StatCard label="My patients" value={patients.length} hint="Booked with you" onClick={() => onNavigate("patients")}/>
        <StatCard label="Waiting for you" value={needsUpdate.length} hint={needsUpdate.length ? "Past visits to complete or cancel" : "Nothing to update"} onClick={() => onNavigate("appointments", "attention")}/>
      </div>

      <div className="mc-split">
        <Card>
          <SectionTitle title="Today's queue" right={<Button variant="ghost" size="sm" onClick={() => onNavigate("appointments", "today")}>All appointments</Button>}/>
          {todays.length === 0 ? (
            <EmptyState icon="calendar" title="No consultations today"
              body={doctor.workingDays.includes(weekday(today)) ? "Your slots for today are open for booking." : "Today is not one of your working days."}/>
          ) : (
            <div className="mc-table-wrap">
              <table className="mc-table" style={{ minWidth: 520 }}>
                <thead><tr><th>Time</th><th>Patient</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {todays.map(a => (
                    <tr key={a.id} className="mc-row-hover click" onClick={() => onOpenAppt(a.id)} style={{ opacity: a.status === "Completed" ? .65 : 1 }}>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmtTime(a.time)}</td>
                      <td style={{ height: 56 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={a.patientName} size={30}/>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 500 }}>{a.patientName}</div>
                            <span className="sub clip">{[a.patientAge != null ? `${a.patientAge} y` : null, a.patientGender, a.reason].filter(Boolean).join(", ")}</span>
                          </div>
                        </div>
                      </td>
                      <td>{a.status === "Scheduled" && isPastSlot(a.date, a.time) ? <Badge bg="var(--pill-warning-bg)" fg="var(--pill-warning-fg)">Awaiting update</Badge> : <Badge status={a.status}/>}</td>
                      <td style={{ textAlign: "right" }} onClick={e => e.stopPropagation()}>
                        {a.status === "Scheduled" && <Button size="sm" variant="outline" icon="check" onClick={() => onUpdateAppt(a.id, { status: "Completed" }, `${a.patientName} marked completed`)}>Done</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="mc-stack">
          <Card>
            <SectionTitle title="Next patient"/>
            {next ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={next.patientName} size={44}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{next.patientName}</div>
                    <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{relativeDay(next.date)}, {fmtTime(next.time)}</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, margin: "14px 0" }}><span style={{ color: "var(--muted)" }}>Reason </span>{next.reason}</p>
                <Button icon="clipboard" onClick={() => onOpenAppt(next.id)} style={{ width: "100%" }}>Open consultation</Button>
              </div>
            ) : <EmptyState icon="checkCircle" title="Nothing scheduled" body="New bookings will show up here."/>}
          </Card>

          <Card>
            <SectionTitle title="Next 7 days" subtitle={`Booked visits out of ${slotsPerDay} slots per working day`}/>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }} role="img" aria-label={days.map(d => `${fmtDate(d.date, { weekday: "long" })}: ${d.works ? `${d.n} booked` : "day off"}`).join(". ")}>
              {days.map(d => (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: d.works ? "var(--ink)" : "var(--muted)" }}>{d.works ? d.n : "off"}</span>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", background: d.works ? "var(--raised)" : "transparent", borderRadius: 6 }}>
                    {d.works && <div style={{ width: "100%", height: `${Math.max((d.n / Math.max(slotsPerDay, 1)) * 100, d.n ? 8 : 0)}%`, background: "var(--accent)", borderRadius: 5 }}/>}
                  </div>
                  <span style={{ fontSize: 12, color: d.date === today ? "var(--ink)" : "var(--muted)", fontWeight: d.date === today ? 600 : 400 }}>{DAY_NAMES[weekday(d.date)]}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Recent consultations" subtitle="Your last completed visits and the notes you left"/>
        {recent.length === 0 ? <EmptyState icon="file" title="No completed consultations yet"/> : (
          <div className="mc-table-wrap">
            <table className="mc-table" style={{ minWidth: 620 }}>
              <thead><tr><th>Date</th><th>Patient</th><th>Reason</th><th>Notes</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {recent.map(a => (
                  <tr key={a.id} className="mc-row-hover click" onClick={() => onOpenAppt(a.id)}>
                    <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{fmtDate(a.date, { day: "numeric", month: "short" })}</td>
                    <td style={{ fontWeight: 500 }}>{a.patientName}</td>
                    <td>{a.reason}</td>
                    <td className="clip" style={{ color: a.notes ? "var(--ink)" : "var(--muted)" }}>{a.notes || "No notes yet"}</td>
                    <td style={{ textAlign: "right" }}><Button size="sm" variant="outline">{a.notes ? "Open" : "Add notes"}</Button></td>
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
