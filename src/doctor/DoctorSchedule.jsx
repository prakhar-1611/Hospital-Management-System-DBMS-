/* ============================================================
   DoctorSchedule.jsx — availability, working days and hours
   (PUT /api/doctors/:id, own profile only) and a 14-day slot view.
   ============================================================ */
import { useState } from "react";
import { Card, SectionTitle, Button, Field, Segmented, Notice } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import { DAY_NAMES, getTodayPlus, generateTimeSlots } from "../constants";
import { fmtDate, fmtTime, weekday, todayStr } from "../ui/dates";

const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);   // 06:00 .. 22:00
const STATUS_OPTIONS = [
  { value: "Available", label: "Available", dot: "var(--positive)" },
  { value: "Busy", label: "Busy", dot: "var(--warning)" },
  { value: "On Leave", label: "On leave", dot: "var(--negative)" },
];

export default function DoctorSchedule({ css, doctor, appts, onUpdateDoctor }) {
  const [days, setDays] = useState(doctor.workingDays);
  const [start, setStart] = useState(doctor.workingHours.start);
  const [end, setEnd] = useState(doctor.workingHours.end);
  const [saving, setSaving] = useState(false);
  const dirty = start !== doctor.workingHours.start || end !== doctor.workingHours.end
    || [...days].sort().join() !== [...doctor.workingDays].sort().join();
  const valid = days.length > 0 && start < end;
  const toggle = (d) => setDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d].sort());

  // booked slots that would fall outside a new schedule (they are kept, but worth knowing)
  const today = todayStr();
  const affected = appts.filter(a => a.status === "Scheduled" && a.date >= today &&
    (!days.includes(weekday(a.date)) || a.time < start || a.time >= end)).length;

  async function save() {
    setSaving(true);
    await onUpdateDoctor({ workingDays: days, workingHours: { start, end } }, "Schedule saved");
    setSaving(false);
  }

  const preview = Array.from({ length: 14 }, (_, i) => getTodayPlus(i));
  const slots = generateTimeSlots(doctor.workingHours.start, doctor.workingHours.end);

  return (
    <div className="mc-stack">
      <div className="mc-grid-2">
        <Card>
          <SectionTitle title="Availability" subtitle="Shown to patients when they choose a doctor"/>
          <Segmented label="Availability" value={doctor.status} options={STATUS_OPTIONS}
            onChange={(s) => onUpdateDoctor({ status: s }, `You are now ${s === "On Leave" ? "on leave" : s.toLowerCase()}`)}/>
          <dl style={{ marginTop: 16, display: "grid", gap: 8, fontSize: 14, color: "var(--muted)" }}>
            <div><dt style={{ display: "inline", color: "var(--ink)", fontWeight: 500 }}>Available </dt><dd style={{ display: "inline" }}>patients can book any free slot.</dd></div>
            <div><dt style={{ display: "inline", color: "var(--ink)", fontWeight: 500 }}>Busy </dt><dd style={{ display: "inline" }}>still bookable, flagged as busy.</dd></div>
            <div><dt style={{ display: "inline", color: "var(--ink)", fontWeight: 500 }}>On leave </dt><dd style={{ display: "inline" }}>no new bookings; existing ones stay.</dd></div>
          </dl>
        </Card>

        <Card>
          <SectionTitle title="Working days and hours" subtitle="One-hour slots are generated from these hours"/>
          <div role="group" aria-label="Working days" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {DAY_NAMES.map((n, d) => {
              const on = days.includes(d);
              return (
                <button key={n} onClick={() => toggle(d)} aria-pressed={on}
                  style={{ minWidth: 50, minHeight: 36, borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 14, font: "inherit",
                    border: `1px solid ${on ? "var(--accent)" : "var(--control)"}`, background: on ? "var(--accent)" : "var(--sheet)", color: on ? "#fff" : "var(--ink)" }}>
                  {n}
                </button>
              );
            })}
          </div>
          <div className="mc-form-grid" style={{ marginBottom: 14 }}>
            <Field label="Start">
              <select value={start} onChange={e => setStart(e.target.value)} style={inputStyle(css)}>{HOURS.slice(0, -1).map(h => <option key={h} value={h}>{fmtTime(h)}</option>)}</select>
            </Field>
            <Field label="End">
              <select value={end} onChange={e => setEnd(e.target.value)} style={inputStyle(css)}>{HOURS.slice(1).map(h => <option key={h} value={h}>{fmtTime(h)}</option>)}</select>
            </Field>
          </div>
          {!valid && <Notice tone="negative" style={{ marginBottom: 12 }}>Pick at least one day, and an end time after the start time.</Notice>}
          {valid && dirty && affected > 0 && (
            <Notice tone="warning" style={{ marginBottom: 12 }}>{affected} upcoming booking{affected > 1 ? "s fall" : " falls"} outside the new hours. They stay booked; cancel them from Appointments if needed.</Notice>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Button icon="check" disabled={!dirty || !valid || saving} onClick={save}>{saving ? "Saving" : "Save schedule"}</Button>
            {dirty && <Button variant="ghost" onClick={() => { setDays(doctor.workingDays); setStart(doctor.workingHours.start); setEnd(doctor.workingHours.end); }}>Reset</Button>}
            {valid && <span style={{ fontSize: 13, color: "var(--muted)" }}>{generateTimeSlots(start, end).length} slots per day</span>}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Next 14 days" subtitle="Booked slots show the patient's first name"
          right={<div style={{ display: "flex", gap: 14, fontSize: 13, color: "var(--muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent)" }}/>Booked</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: "1px solid var(--control)" }}/>Free</span>
          </div>}/>
        <div>
          {preview.map(date => {
            const works = doctor.workingDays.includes(weekday(date)) && doctor.status !== "On Leave";
            const booked = Object.fromEntries(appts.filter(a => a.date === date && a.status === "Scheduled").map(a => [a.time, a.patientName]));
            return (
              <div key={date} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--rule)", flexWrap: "wrap" }}>
                <div style={{ width: 112, flexShrink: 0 }}>
                  <div style={{ fontWeight: date === today ? 600 : 500, fontSize: 14 }}>{fmtDate(date, { weekday: "short", day: "numeric", month: "short" })}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{works ? `${Object.keys(booked).length} of ${slots.length} booked` : doctor.status === "On Leave" ? "On leave" : "Day off"}</div>
                </div>
                {works && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                    {slots.map(s => booked[s] ? (
                      <span key={s} title={booked[s]} style={{ padding: "2px 9px", borderRadius: 6, fontSize: 12.5, fontWeight: 500, background: "var(--accent)", color: "#fff", maxWidth: 170, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s} {booked[s].split(" ")[0]}
                      </span>
                    ) : (
                      <span key={s} style={{ padding: "1px 9px", borderRadius: 6, fontSize: 12.5, border: "1px solid var(--control)", color: "var(--muted)" }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
