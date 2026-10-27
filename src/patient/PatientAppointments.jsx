/* ============================================================
   PatientAppointments.jsx — the patient's own appointments:
   upcoming (reschedule / cancel / print slip), past visits with the
   doctor's notes, and cancelled ones.
   ============================================================ */
import { useState } from "react";
import { Card, Tabs, Badge, Button, EmptyState } from "../ui/kit";
import { fmtDate, fmtTime, relativeDay, isPastSlot } from "../ui/dates";
import { byDateAsc, byDateDesc, money } from "../ui/records";
import { DateLeaf } from "./PatientOverview";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// printable appointment slip in a new window (a paper document, so it carries its own print colours)
function printSlip(a, profile) {
  const w = window.open("", "_blank");
  if (!w) return;
  const row = (k, v) => `<tr><td style="color:#5d5f60;padding:8px 0;width:160px">${k}</td><td style="padding:8px 0;font-weight:600">${esc(v) || "—"}</td></tr>`;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Appointment slip</title></head>
  <body style="font-family:'IBM Plex Sans',Segoe UI,system-ui,sans-serif;color:#131416;max-width:640px;margin:32px auto;padding:0 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #131416;padding-bottom:14px">
      <div><div style="font-size:22px;font-weight:700">MedCare Hospital</div><div style="color:#5d5f60;font-size:13px">Appointment slip, MyMedCare</div></div>
      <div style="text-align:right;font-size:12px;color:#5d5f60">Ref ${esc(String(a.id).slice(-8).toUpperCase())}<br/>Printed ${new Date().toLocaleDateString("en-GB")}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:14px">
      ${row("Patient", profile?.name)}${row("Patient ID", "P-" + String(profile?._id || "").slice(-6).toUpperCase())}
      ${row("Doctor", a.doctorName)}${row("Department", a.deptName)}
      ${row("Date", fmtDate(a.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}${row("Time", fmtTime(a.time))}
      ${row("Reason", a.reason)}${row("Status", a.status)}${row("Consultation fee", money(a.fee))}
    </table>
    ${a.notes ? `<div style="margin-top:18px;padding:14px;border:1px solid #c9ccd2;border-radius:8px"><div style="font-weight:700;margin-bottom:6px">Doctor's notes</div><div style="white-space:pre-wrap;font-size:14px">${esc(a.notes)}</div></div>` : ""}
    <p style="font-size:12px;color:#5d5f60;margin-top:24px">Please arrive 15 minutes early with a photo ID. Emergency: 108. Helpdesk: +91 416 220 0000</p>
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

function ApptRow({ a, profile, onCancel, onReschedule, onBook }) {
  const [open, setOpen] = useState(false);
  const upcoming = a.status === "Scheduled" && !isPastSlot(a.date, a.time);
  const awaiting = a.status === "Scheduled" && !upcoming;
  return (
    <li style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid var(--rule)" }}>
      <DateLeaf date={a.date} muted={!upcoming}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 15, overflowWrap: "anywhere" }}>{a.doctorName}</div>
          {awaiting ? <Badge bg="var(--pill-warning-bg)" fg="var(--pill-warning-fg)">Awaiting doctor</Badge> : <Badge status={a.status}/>}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{[a.deptName, a.specialization].filter(Boolean).join(", ")}</div>
        <div style={{ fontSize: 14, marginTop: 8 }}>
          <strong style={{ fontWeight: 500 }}>{fmtTime(a.time)}</strong>
          <span style={{ color: "var(--muted)" }}>{upcoming ? `, ${relativeDay(a.date).toLowerCase()}` : ""}</span>
          <span style={{ color: "var(--muted)" }}> · {a.reason}{a.fee != null ? ` · ${money(a.fee)}` : ""}</span>
        </div>
        {a.notes && open && <p style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "var(--raised)", fontSize: 14, whiteSpace: "pre-wrap", maxWidth: "70ch" }}>{a.notes}</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {upcoming && <Button size="sm" variant="outline" icon="calendar" onClick={() => onReschedule(a)}>Reschedule</Button>}
          {upcoming && <Button size="sm" variant="danger" icon="xCircle" onClick={() => onCancel(a)}>Cancel</Button>}
          {a.notes && <Button size="sm" variant="outline" icon="file" aria-expanded={open} onClick={() => setOpen(o => !o)}>{open ? "Hide notes" : "Doctor's notes"}</Button>}
          {a.status === "Completed" && <Button size="sm" variant="ghost" icon="plus" onClick={() => onBook({ doctorId: a.doctorId })}>Book follow-up</Button>}
          {a.status !== "Cancelled" && <Button size="sm" variant="ghost" icon="printer" onClick={() => printSlip(a, profile)}>Print slip</Button>}
        </div>
      </div>
    </li>
  );
}

export default function PatientAppointments({ profile, appts, onCancel, onReschedule, onBook }) {
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
    <div>
      <Tabs tabs={tabs} value={tab} onChange={setTab}/>
      {rows.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <EmptyState icon="calendar"
            title={tab === "upcoming" ? "No upcoming appointments" : tab === "past" ? "No past visits yet" : "No cancelled appointments"}
            body={tab === "upcoming" ? "Book a visit with any of our specialists." : tab === "past" ? "Completed visits and your doctor's notes will be listed here." : undefined}
            action={tab === "upcoming" && <Button icon="calendarPlus" onClick={() => onBook()}>Book an appointment</Button>}/>
        </Card>
      ) : (
        <ul style={{ listStyle: "none", maxWidth: 820 }}>
          {rows.map(a => <ApptRow key={a.id} a={a} profile={profile} onCancel={onCancel} onReschedule={onReschedule} onBook={onBook}/>)}
        </ul>
      )}
    </div>
  );
}
