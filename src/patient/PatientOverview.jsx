/* ============================================================
   PatientOverview.jsx — the patient's home: the next visit first (with
   reschedule / cancel beside it), then what else is booked, the latest
   doctor notes and how to reach the hospital.
   ============================================================ */
import { Card, SectionTitle, Button, Avatar, Badge, EmptyState, Notice } from "../ui/kit";
import Icon from "../ui/Icon";
import { fmtDate, fmtTime, relativeDay } from "../ui/dates";
import { byDateDesc, money } from "../ui/records";

const HOSPITAL = [
  ["clock", "OPD hours", "Mon to Sat, 8:00 AM to 8:00 PM"],
  ["ambulance", "Emergency", "Open day and night, call 108"],
  ["phone", "Helpdesk", "+91 416 220 0000"],
  ["pill", "Pharmacy", "Ground floor, open day and night"],
  ["mapPin", "Address", "MedCare Hospital, Katpadi Road, Vellore"],
];

// a calendar-leaf date: weekday, day number, month
export function DateLeaf({ date, muted }) {
  return (
    <div aria-hidden="true" style={{ width: 64, flexShrink: 0, textAlign: "center", padding: "8px 0", borderRadius: 8, border: "1px solid var(--border)", background: "var(--raised)", color: muted ? "var(--muted)" : "var(--ink)" }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(date, { weekday: "short" })}</div>
      <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.15 }}>{Number(date.slice(8))}</div>
      <div style={{ fontSize: 12, color: muted ? "var(--muted)" : "var(--accent-ink)", fontWeight: 500 }}>{fmtDate(date, { month: "short" })}</div>
    </div>
  );
}

export default function PatientOverview({ profile, appts, upcoming, missing, onBook, onNavigate, onCancel, onReschedule }) {
  const [next, ...later] = upcoming;
  const completed = appts.filter(a => a.status === "Completed").sort(byDateDesc);
  const doctorsSeen = new Set(completed.map(a => a.doctorId)).size;
  const withNotes = completed.filter(a => a.notes).slice(0, 3);

  const record = [
    ["Upcoming visits", upcoming.length, () => onNavigate("appointments")],
    ["Completed visits", completed.length, () => onNavigate("appointments")],
    ["Doctors consulted", doctorsSeen, null],
    ["Blood group", profile?.bloodGroup || "Not added", () => onNavigate("profile")],
  ];

  return (
    <div className="mc-stack">
      {missing.length > 0 && (
        <Notice tone="info" action={<Button size="sm" variant="outline" onClick={() => onNavigate("profile")}>Complete profile</Button>}>
          <strong>Your profile is missing {missing.map(([, l]) => l.toLowerCase()).join(", ")}.</strong> Doctors use these details during your visit.
        </Notice>
      )}

      <div className="mc-split">
        <Card>
          <SectionTitle title="Next visit" right={next && <Badge status="Scheduled">{relativeDay(next.date)}</Badge>}/>
          {next ? (
            <>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <DateLeaf date={next.date}/>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>{fmtTime(next.time)}</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 2 }}>{fmtDate(next.date, { weekday: "long", day: "numeric", month: "long" })}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                    <Avatar name={next.doctorName} size={36}/>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{next.doctorName}</div>
                      <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{[next.deptName, next.specialization].filter(Boolean).join(", ")}</div>
                    </div>
                  </div>
                </div>
              </div>
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 14, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--rule)" }}>
                <dt style={{ color: "var(--muted)" }}>Reason</dt><dd style={{ overflowWrap: "anywhere" }}>{next.reason}</dd>
                <dt style={{ color: "var(--muted)" }}>Fee</dt><dd>{money(next.fee)}, paid at the reception desk</dd>
              </dl>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                <Button variant="outline" icon="calendar" onClick={() => onReschedule(next)}>Reschedule</Button>
                <Button variant="danger" icon="xCircle" onClick={() => onCancel(next)}>Cancel</Button>
              </div>
            </>
          ) : (
            <EmptyState icon="calendar" title="Nothing booked" body="Choose a department, a doctor and a time that suits you."
              action={<Button icon="calendarPlus" onClick={() => onBook()}>Book an appointment</Button>}/>
          )}
        </Card>

        <Card>
          <SectionTitle title="Your record"/>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px 16px" }}>
            {record.map(([k, v, go]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <dt style={{ fontSize: 13, color: "var(--muted)" }}>{k}</dt>
                <dd style={{ fontSize: typeof v === "number" ? 28 : 16, lineHeight: typeof v === "number" ? 1.2 : 1.9, color: typeof v === "number" || profile?.bloodGroup ? "var(--ink)" : "var(--muted)" }}>
                  {go ? <button onClick={go} style={{ all: "unset", cursor: "pointer" }} aria-label={`${k}: ${v}. Open`}>{v}</button> : v}
                </dd>
              </div>
            ))}
          </dl>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("profile")} style={{ marginTop: 16, paddingLeft: 0 }}>Edit my details <Icon name="chevronRight" size={14}/></Button>
        </Card>
      </div>

      <div className="mc-split">
        <div className="mc-stack">
          {later.length > 0 && (
            <Card>
              <SectionTitle title="Also coming up" right={<Button variant="ghost" size="sm" onClick={() => onNavigate("appointments")}>All appointments</Button>}/>
              <div style={{ borderTop: "1px solid var(--rule)" }}>
                {later.slice(0, 4).map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--rule)" }}>
                    <div style={{ width: 92, flexShrink: 0 }}>
                      <div style={{ fontWeight: 500 }}>{fmtDate(a.date, { day: "numeric", month: "short" })}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>{fmtTime(a.time)}</div>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 500, overflowWrap: "anywhere" }}>{a.doctorName}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.deptName}, {a.reason}</div>
                    </div>
                    <span className="mc-hide-sm" style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}>{relativeDay(a.date)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle title="Notes from your doctors" subtitle="Advice and prescriptions written after your visits"/>
            {withNotes.length === 0 ? <EmptyState icon="file" title="No notes yet" body="After a visit, your doctor's advice appears here."/> : (
              <div style={{ borderTop: "1px solid var(--rule)" }}>
                {withNotes.map(a => (
                  <article key={a.id} style={{ padding: "14px 0", borderBottom: "1px solid var(--rule)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontWeight: 600 }}>{a.doctorName}</strong>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{fmtDate(a.date)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{a.reason}</div>
                    <p style={{ fontSize: 14, marginTop: 8, whiteSpace: "pre-wrap", maxWidth: "70ch" }}>{a.notes}</p>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <SectionTitle title="Hospital information"/>
          <dl>
            {HOSPITAL.map(([icon, k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
                <Icon name={icon} size={16} color="var(--muted)" style={{ marginTop: 3 }}/>
                <div style={{ minWidth: 0 }}>
                  <dt style={{ fontSize: 13, color: "var(--muted)" }}>{k}</dt>
                  <dd style={{ fontWeight: 500 }}>{v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
