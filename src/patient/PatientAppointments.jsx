/* ============================================================
   PatientAppointments.jsx — the patient's own appointments:
   upcoming (reschedule / cancel / print slip), past visits with the
   doctor's notes, and cancelled ones.
   ============================================================ */
import { useState } from "react";
import { Card, Tabs, Badge, Button, EmptyState } from "../ui/kit";
import Icon from "../ui/Icon";
import { fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";
import { byDateAsc, byDateDesc, money } from "../ui/records";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// printable appointment slip in a new window
function printSlip(a, profile) {
  const w = window.open("", "_blank");
  if (!w) return;
  const row = (k, v) => `<tr><td style="color:#64748b;padding:8px 0;width:160px">${k}</td><td style="padding:8px 0;font-weight:600">${esc(v) || "—"}</td></tr>`;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Appointment slip</title></head>
  <body style="font-family:Segoe UI,system-ui,sans-serif;color:#0f172a;max-width:640px;margin:32px auto;padding:0 20px">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #7c3aed;padding-bottom:14px">
      <div><div style="font-size:22px;font-weight:800">MedCare Hospital</div><div style="color:#64748b;font-size:13px">Appointment slip · MyMedCare</div></div>
      <div style="text-align:right;font-size:12px;color:#64748b">Ref ${esc(String(a.id).slice(-8).toUpperCase())}<br/>Printed ${new Date().toLocaleDateString("en-GB")}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:14px">
      ${row("Patient", profile?.name)}${row("Patient ID", "P-" + String(profile?._id || "").slice(-6).toUpperCase())}
      ${row("Doctor", a.doctorName)}${row("Department", a.deptName)}
      ${row("Date", fmtDate(a.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}${row("Time", fmtTime(a.time))}
      ${row("Reason", a.reason)}${row("Status", a.status)}${row("Consultation fee", money(a.fee))}
    </table>
    ${a.notes ? `<div style="margin-top:18px;padding:14px;border:1px solid #e2e8f0;border-radius:10px"><div style="font-weight:700;margin-bottom:6px">Doctor's notes</div><div style="white-space:pre-wrap;font-size:14px">${esc(a.notes)}</div></div>` : ""}
    <p style="font-size:12px;color:#64748b;margin-top:24px">Please arrive 15 minutes early with a photo ID. Emergency: 108 · Helpdesk: +91 416 220 0000</p>
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

function ApptCard({ css, accent, isDark, a, profile, onCancel, onReschedule, onBook }) {
  const [open, setOpen] = useState(false);
  const upcoming = a.status === "Scheduled" && !isPastSlot(a.date, a.time);
  const awaiting = a.status === "Scheduled" && !upcoming;
  return (
    <div style={{ display: "flex", gap: 16, padding: 16, borderRadius: 14, border: `1px solid ${css.border}`, background: css.card, flexWrap: "wrap" }}>
      <div style={{ width: 72, textAlign: "center", padding: "10px 0", borderRadius: 12, background: upcoming ? (isDark ? `${accent}30` : `${accent}12`) : css.subtle,
        color: upcoming ? accent : css.textGray, flexShrink: 0, alignSelf: "flex-start" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase" }}>{fmtDate(a.date, { month: "short" })}</div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{Number(a.date.slice(8))}</div>
        <div style={{ fontSize: 11 }}>{fmtDate(a.date, { weekday: "short" })}</div>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: css.text }}>{a.doctorName}</div>
          {awaiting ? <Badge bg="#fef3c7" fg="#92400e">Awaiting doctor</Badge> : <Badge status={a.status}/>}
        </div>
        <div style={{ fontSize: 12.5, color: css.textGray, marginTop: 2 }}>{[a.deptName, a.specialization].filter(Boolean).join(" · ")}</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: css.text, marginTop: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={15} color={css.textGray}/>{fmtTime(a.time)}{upcoming && <span style={{ color: accent, fontWeight: 600 }}> · {relativeDay(a.date)}</span>}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="clipboard" size={15} color={css.textGray}/>{a.reason}</span>
          {a.fee !== undefined && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="card" size={15} color={css.textGray}/>{money(a.fee)}</span>}
        </div>
        {a.notes && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: accent, fontWeight: 650, fontSize: 13, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="file" size={15}/>{open ? "Hide" : "Read"} doctor's notes
            </button>
            {open && <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: css.subtle, border: `1px solid ${css.border}`, fontSize: 13, color: css.text, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.notes}</div>}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {upcoming && <Button size="sm" variant="soft" accent={accent} icon="calendar" onClick={() => onReschedule(a)}>Reschedule</Button>}
          {upcoming && <Button size="sm" variant="danger" icon="xCircle" onClick={() => onCancel(a)}>Cancel</Button>}
          {a.status === "Completed" && <Button size="sm" variant="soft" accent={accent} icon="plus" onClick={() => onBook({ doctorId: a.doctorId })}>Book follow-up</Button>}
          {a.status !== "Cancelled" && <Button size="sm" variant="ghost" css={css} icon="printer" onClick={() => printSlip(a, profile)}>Print slip</Button>}
        </div>
      </div>
    </div>
  );
}

export default function PatientAppointments({ css, accent, isDark, profile, appts, onCancel, onReschedule, onBook }) {
  const [tab, setTab] = useState("upcoming");
  const groups = {
    upcoming:  appts.filter(a => a.status === "Scheduled").sort(byDateAsc),
    past:      appts.filter(a => a.status === "Completed").sort(byDateDesc),
    cancelled: appts.filter(a => a.status === "Cancelled").sort(byDateDesc),
  };
  const tabs = [{ id: "upcoming", label: "Upcoming" }, { id: "past", label: "Past visits" }, { id: "cancelled", label: "Cancelled" }]
    .map(t => ({ ...t, count: groups[t.id].length }));
  const rows = groups[tab];

  return (
    <Card css={css}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <Tabs css={css} tabs={tabs} value={tab} onChange={setTab} accent={accent}/>
        <Button accent={accent} icon="plus" onClick={() => onBook()}>New appointment</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState css={css} icon="calendar"
          title={tab === "upcoming" ? "No upcoming appointments" : tab === "past" ? "No past visits yet" : "No cancelled appointments"}
          body={tab === "upcoming" ? "Book a visit with any of our specialists in under a minute." : undefined}
          action={tab === "upcoming" && <Button accent={accent} icon="calendarPlus" onClick={() => onBook()}>Book an appointment</Button>}/>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map(a => <ApptCard key={a.id} css={css} accent={accent} isDark={isDark} a={a} profile={profile} onCancel={onCancel} onReschedule={onReschedule} onBook={onBook}/>)}
        </div>
      )}
    </Card>
  );
}
