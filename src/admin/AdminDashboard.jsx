/* ============================================================
   AdminDashboard.jsx — the question: "is today running on schedule?"
   Today's list leads, then who is available and where the load is,
   then the latest bookings. Billing figures are left out because they
   are not stored in the database.
   ============================================================ */
import { Card, SectionTitle, StatCard, Badge, Button, EmptyState } from "../ui/kit";
import { getTodayPlus } from "../constants";
import { todayStr, fmtTime, fmtDate, isPastSlot, relativeDay } from "../ui/dates";
import { byDateAsc } from "../ui/records";

export default function AdminDashboard({ doctors, patients, appts, departments, onNavigate, onOpenAppt }) {
  const today = todayStr();
  const in7 = getTodayPlus(6), in30 = getTodayPlus(29);
  const todays = appts.filter(a => a.date === today && a.status !== "Cancelled").sort(byDateAsc);
  const done = todays.filter(a => a.status === "Completed").length;
  const week = appts.filter(a => a.status === "Scheduled" && a.date >= today && a.date <= in7).length;
  const nextUp = appts.filter(a => a.status === "Scheduled" && !isPastSlot(a.date, a.time)).sort(byDateAsc)[0];
  const avail = { Available: 0, Busy: 0, "On Leave": 0 };
  doctors.forEach(d => { avail[d.status] = (avail[d.status] || 0) + 1; });
  const deptLoad = departments.map(d => ({ name: d.name, n: appts.filter(a => a.deptName === d.name && a.status === "Scheduled" && a.date >= today && a.date <= in30).length }))
    .sort((a, b) => b.n - a.n).slice(0, 6);
  const maxLoad = Math.max(1, ...deptLoad.map(d => d.n));
  const recent = [...appts].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 8);

  return (
    <div className="mc-stack">
      <div className="mc-grid-stats">
        <StatCard label="Today" value={todays.length} hint={`${done} done, ${todays.length - done} to go`} onClick={() => onNavigate("appointments", "today")}/>
        <StatCard label="Next 7 days" value={week} hint="Scheduled visits" onClick={() => onNavigate("appointments", "upcoming")}/>
        <StatCard label="Doctors available" value={avail.Available} hint={`of ${doctors.length}, ${avail["On Leave"]} on leave`} onClick={() => onNavigate("doctors")}/>
        <StatCard label="Patients" value={patients.length} hint="Registered accounts" onClick={() => onNavigate("patients")}/>
      </div>

      <div className="mc-split">
        <Card>
          <SectionTitle title="Today's appointments"
            right={<Button variant="ghost" size="sm" onClick={() => onNavigate("appointments", "today")}>View all</Button>}/>
          {todays.length === 0 ? (
            <EmptyState icon="calendar" title="No appointments today"
              body={nextUp ? `The next visit is ${relativeDay(nextUp.date).toLowerCase()}, ${fmtDate(nextUp.date, { weekday: "short", day: "numeric", month: "short" })} at ${fmtTime(nextUp.time)} with ${nextUp.doctorName}.` : "Nothing is booked yet."}/>
          ) : (
            <div className="mc-table-wrap">
              <table className="mc-table" style={{ minWidth: 560 }}>
                <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead>
                <tbody>
                  {todays.slice(0, 8).map(a => (
                    <tr key={a.id} className="mc-row-hover click" onClick={() => onOpenAppt(a.id)}>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmtTime(a.time)}</td>
                      <td>{a.patientName}<span className="sub">{a.reason}</span></td>
                      <td>{a.doctorName}<span className="sub">{a.deptName}</span></td>
                      <td><Badge status={a.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="mc-stack">
          <Card>
            <SectionTitle title="Doctor availability"/>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--active)", marginBottom: 12 }} role="img"
              aria-label={`${avail.Available} available, ${avail.Busy} busy, ${avail["On Leave"]} on leave`}>
              {[["Available", "var(--positive)"], ["Busy", "var(--warning)"], ["On Leave", "var(--negative)"]].map(([s, c]) => (
                <span key={s} style={{ width: `${(avail[s] / Math.max(doctors.length, 1)) * 100}%`, background: c }}/>
              ))}
            </div>
            {[["Available", "var(--positive)"], ["Busy", "var(--warning)"], ["On Leave", "var(--negative)"]].map(([s, c]) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c }}/>{s === "On Leave" ? "On leave" : s}<strong style={{ marginLeft: "auto", fontWeight: 600 }}>{avail[s]}</strong>
              </div>
            ))}
          </Card>
          <Card>
            <SectionTitle title="Busiest departments" subtitle="Scheduled in the next 30 days"/>
            <div className="mc-bars">
              {deptLoad.map(d => (
                <div key={d.name} className="mc-bar-row">
                  <span>{d.name}</span><strong style={{ fontWeight: 600 }}>{d.n}</strong>
                  <span className="mc-bar-track"><span className="mc-bar-fill" style={{ width: `${(d.n / maxLoad) * 100}%` }}/></span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Latest bookings" subtitle="Most recently created, including bookings patients made online"
          right={<Button variant="ghost" size="sm" onClick={() => onNavigate("appointments", "all")}>All appointments</Button>}/>
        <div className="mc-table-wrap">
          <table className="mc-table" style={{ minWidth: 720 }}>
            <thead><tr><th>Booked</th><th>Patient</th><th>Doctor</th><th>Visit</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map(a => (
                <tr key={a.id} className="mc-row-hover click" onClick={() => onOpenAppt(a.id)}>
                  <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</td>
                  <td>{a.patientName}<span className="sub">{a.reason}</span></td>
                  <td>{a.doctorName}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDate(a.date, { day: "numeric", month: "short" })}<span className="sub">{fmtTime(a.time)}</span></td>
                  <td><Badge status={a.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
