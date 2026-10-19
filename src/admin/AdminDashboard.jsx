/* ============================================================
   AdminDashboard.jsx — hospital at a glance: key numbers, today's
   appointments, doctor availability, busiest departments, recent bookings.
   ============================================================ */
import { Card, SectionTitle, StatCard, Badge, Button, EmptyState } from "../ui/kit";
import Icon from "../ui/Icon";
import { getTodayPlus } from "../constants";
import { todayStr, fmtTime, fmtDate, greeting, isPastSlot } from "../ui/dates";
import { byDateAsc } from "../ui/records";

export default function AdminDashboard({ css, accent, tint, isDark, user, doctors, patients, appts, departments, revenue, unpaid, onNavigate, onOpenAppt }) {
  const today = todayStr();
  const in7 = getTodayPlus(6), in30 = getTodayPlus(29);
  const todays = appts.filter(a => a.date === today && a.status !== "Cancelled").sort(byDateAsc);
  const week = appts.filter(a => a.status === "Scheduled" && a.date >= today && a.date <= in7).length;
  const overdue = appts.filter(a => a.status === "Scheduled" && isPastSlot(a.date, a.time)).length;
  const avail = { Available: 0, Busy: 0, "On Leave": 0 };
  doctors.forEach(d => { avail[d.status] = (avail[d.status] || 0) + 1; });
  const deptLoad = departments.map(d => ({ name: d.name, n: appts.filter(a => a.deptName === d.name && a.status === "Scheduled" && a.date >= today && a.date <= in30).length }))
    .sort((a, b) => b.n - a.n).slice(0, 6);
  const maxLoad = Math.max(1, ...deptLoad.map(d => d.n));
  const recent = [...appts].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 8);
  const t = (c) => isDark ? `${c}30` : `${c}18`;

  return (
    <div className="mc-stack">
      <div style={{ borderRadius: 18, padding: "22px 24px", color: "white", background: `linear-gradient(120deg, ${accent} 0%, #3046c5 55%, #1e2a78 100%)`,
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap", boxShadow: "0 10px 30px rgba(67,97,238,.25)" }}>
        <div>
          <div style={{ fontSize: 13, opacity: .85 }}>{greeting()},</div>
          <div style={{ fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 800 }}>{user.name}</div>
          <div style={{ fontSize: 13, opacity: .85, marginTop: 6 }}>{todays.length} appointments today · {avail.Available} doctors available · {overdue} awaiting doctor update</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[["calendarPlus", "Walk-in registration", "walkin"], ["calendar", "All appointments", "appointments"]].map(([icon, label, s]) => (
            <button key={s} onClick={() => onNavigate(s, s === "appointments" ? "today" : undefined)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.3)",
                background: s === "walkin" ? "white" : "rgba(255,255,255,.1)", color: s === "walkin" ? accent : "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Icon name={icon} size={16}/>{label}
            </button>
          ))}
        </div>
      </div>

      <div className="mc-grid-stats">
        <StatCard css={css} icon="users" label="Patients" value={patients.length} hint="Registered accounts" color={accent} tint={isDark ? `${accent}30` : tint} onClick={() => onNavigate("patients")}/>
        <StatCard css={css} icon="stethoscope" label="Doctors" value={doctors.length} hint={`${avail.Available} available now`} color="#0f766e" tint={t("#0f766e")} onClick={() => onNavigate("doctors")}/>
        <StatCard css={css} icon="calendar" label="Today" value={todays.length} hint={`${week} more in the next 7 days`} color="#7c3aed" tint={t("#7c3aed")} onClick={() => onNavigate("appointments", "today")}/>
        <StatCard css={css} icon="card" label="Revenue collected" value={revenue} hint={`${unpaid} unpaid invoice${unpaid === 1 ? "" : "s"}`} color="#16a34a" tint={t("#16a34a")} onClick={() => onNavigate("billing")}/>
      </div>

      <div className="mc-split">
        <Card css={css}>
          <SectionTitle css={css} title="Today's appointments" subtitle={fmtDate(today, { weekday: "long", day: "numeric", month: "long" })}
            right={<Button variant="ghost" size="sm" css={css} onClick={() => onNavigate("appointments", "today")}>View all <Icon name="chevronRight" size={14}/></Button>}/>
          {todays.length === 0 ? <EmptyState css={css} icon="calendar" title="No appointments today"/> : (
            <div className="mc-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead><tr>{["Time", "Patient", "Doctor", "Department", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: css.textGray, fontWeight: 600, borderBottom: `1px solid ${css.border}` }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {todays.slice(0, 10).map(a => (
                    <tr key={a.id} className="mc-row-hover" style={{ cursor: "pointer" }} onClick={() => onOpenAppt(a.id)}>
                      <td style={{ padding: "10px", fontSize: 13, fontWeight: 650, color: accent, whiteSpace: "nowrap" }}>{fmtTime(a.time)}</td>
                      <td style={{ padding: "10px", fontSize: 13, fontWeight: 600, color: css.text }}>{a.patientName}</td>
                      <td style={{ padding: "10px", fontSize: 13, color: css.text }}>{a.doctorName}</td>
                      <td style={{ padding: "10px", fontSize: 12.5, color: css.textGray }}>{a.deptName}</td>
                      <td style={{ padding: "10px" }}><Badge status={a.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="mc-stack">
          <Card css={css}>
            <SectionTitle css={css} title="Doctor availability" right={<Button variant="ghost" size="sm" css={css} onClick={() => onNavigate("doctors")}>Manage</Button>}/>
            <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", background: css.subtle, marginBottom: 14 }}>
              {[["Available", "#22c55e"], ["Busy", "#f59e0b"], ["On Leave", "#ef4444"]].map(([s, c]) => (
                <div key={s} style={{ width: `${(avail[s] / Math.max(doctors.length, 1)) * 100}%`, background: c }}/>
              ))}
            </div>
            {[["Available", "#22c55e"], ["Busy", "#f59e0b"], ["On Leave", "#ef4444"]].map(([s, c]) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13, color: css.text }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c }}/>{s}<strong style={{ marginLeft: "auto" }}>{avail[s]}</strong>
              </div>
            ))}
          </Card>
          <Card css={css}>
            <SectionTitle css={css} title="Busiest departments" subtitle="Scheduled in the next 30 days"/>
            <div style={{ display: "grid", gap: 10 }}>
              {deptLoad.map(d => (
                <div key={d.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: css.text, marginBottom: 4 }}><span>{d.name}</span><strong>{d.n}</strong></div>
                  <div style={{ height: 8, borderRadius: 999, background: css.subtle, overflow: "hidden" }}>
                    <div style={{ width: `${(d.n / maxLoad) * 100}%`, height: "100%", background: accent, borderRadius: 999 }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card css={css}>
        <SectionTitle css={css} title="Latest bookings" subtitle="Most recently created appointments, including online bookings by patients"/>
        <div className="mc-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead><tr>{["Booked", "Patient", "Doctor", "Visit", "Reason", "Status"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: css.textGray, fontWeight: 600, borderBottom: `1px solid ${css.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {recent.map(a => (
                <tr key={a.id} className="mc-row-hover" style={{ cursor: "pointer" }} onClick={() => onOpenAppt(a.id)}>
                  <td style={{ padding: "10px", fontSize: 12, color: css.textGray, whiteSpace: "nowrap" }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</td>
                  <td style={{ padding: "10px", fontSize: 13, fontWeight: 600, color: css.text }}>{a.patientName}</td>
                  <td style={{ padding: "10px", fontSize: 13, color: css.text }}>{a.doctorName}</td>
                  <td style={{ padding: "10px", fontSize: 12.5, color: css.textGray, whiteSpace: "nowrap" }}>{fmtDate(a.date, { day: "numeric", month: "short" })} · {fmtTime(a.time)}</td>
                  <td style={{ padding: "10px", fontSize: 13, color: css.text }}>{a.reason}</td>
                  <td style={{ padding: "10px" }}><Badge status={a.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
