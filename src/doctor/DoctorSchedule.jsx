/* ============================================================
   DoctorSchedule.jsx — availability status, working days / hours
   (PUT /api/doctors/:id, own profile only) and a 14-day slot preview.
   ============================================================ */
import { useState } from "react";
import { Card, SectionTitle, Button, Field } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import { StatusSwitch } from "./DoctorOverview";
import { DAY_NAMES, getTodayPlus, generateTimeSlots } from "../constants";
import { fmtDate, fmtTime, weekday, todayStr } from "../ui/dates";

const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);   // 06:00 .. 22:00

export default function DoctorSchedule({ css, accent, tint, isDark, doctor, appts, onUpdateDoctor }) {
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
        <Card css={css}>
          <SectionTitle css={css} title="Availability" subtitle="Shown to patients when they choose a doctor"/>
          <StatusSwitch value={doctor.status} onChange={(s) => onUpdateDoctor({ status: s }, `You are now ${s}`)}/>
          <ul style={{ marginTop: 16, paddingLeft: 18, fontSize: 13, color: css.textGray, lineHeight: 1.8 }}>
            <li><strong style={{ color: css.text }}>Available</strong> – patients can book any free slot.</li>
            <li><strong style={{ color: css.text }}>Busy</strong> – still bookable, flagged as busy.</li>
            <li><strong style={{ color: css.text }}>On Leave</strong> – no new bookings; existing ones stay.</li>
          </ul>
        </Card>

        <Card css={css}>
          <SectionTitle css={css} title="Working days & hours" subtitle="One-hour consultation slots are generated from these hours"/>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {DAY_NAMES.map((n, d) => {
              const on = days.includes(d);
              return (
                <button key={n} onClick={() => toggle(d)} aria-pressed={on}
                  style={{ width: 52, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontWeight: 650, fontSize: 13,
                    border: `1px solid ${on ? accent : css.border}`, background: on ? accent : "transparent", color: on ? "white" : css.textGray }}>
                  {n}
                </button>
              );
            })}
          </div>
          <div className="mc-form-grid" style={{ marginBottom: 14 }}>
            <Field css={css} label="Start">
              <select value={start} onChange={e => setStart(e.target.value)} style={inputStyle(css)}>
                {HOURS.slice(0, -1).map(h => <option key={h} value={h}>{fmtTime(h)}</option>)}
              </select>
            </Field>
            <Field css={css} label="End">
              <select value={end} onChange={e => setEnd(e.target.value)} style={inputStyle(css)}>
                {HOURS.slice(1).map(h => <option key={h} value={h}>{fmtTime(h)}</option>)}
              </select>
            </Field>
          </div>
          {!valid && <div style={{ fontSize: 12.5, color: "#dc2626", marginBottom: 10 }}>Pick at least one day, and an end time after the start time.</div>}
          {valid && dirty && affected > 0 && (
            <div style={{ display: "flex", gap: 8, fontSize: 12.5, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", padding: "8px 10px", borderRadius: 9, marginBottom: 10 }}>
              <Icon name="info" size={15}/> {affected} upcoming booking{affected > 1 ? "s fall" : " falls"} outside the new hours. They stay booked; cancel them from Appointments if needed.
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Button accent={accent} icon="check" disabled={!dirty || !valid || saving} onClick={save}>{saving ? "Saving…" : "Save schedule"}</Button>
            {dirty && <Button variant="ghost" css={css} onClick={() => { setDays(doctor.workingDays); setStart(doctor.workingHours.start); setEnd(doctor.workingHours.end); }}>Reset</Button>}
            <span style={{ fontSize: 12, color: css.textGray }}>{valid ? `${generateTimeSlots(start, end).length} slots per day` : ""}</span>
          </div>
        </Card>
      </div>

      <Card css={css}>
        <SectionTitle css={css} title="Next 14 days" subtitle="Booked slots show the patient's name"
          right={<div style={{ display: "flex", gap: 14, fontSize: 12, color: css.textGray }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: accent }}/> Booked</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: `1px solid ${css.border}`, background: css.subtle }}/> Free</span>
          </div>}/>
        <div style={{ display: "grid", gap: 8 }}>
          {preview.map(date => {
            const works = doctor.workingDays.includes(weekday(date)) && doctor.status !== "On Leave";
            const booked = Object.fromEntries(appts.filter(a => a.date === date && a.status === "Scheduled").map(a => [a.time, a.patientName]));
            return (
              <div key={date} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 12px", borderRadius: 12, border: `1px solid ${css.border}`, background: works ? css.card : css.subtle, flexWrap: "wrap" }}>
                <div style={{ width: 110, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 650, color: date === today ? accent : css.text }}>{fmtDate(date, { weekday: "short", day: "numeric", month: "short" })}</div>
                  <div style={{ fontSize: 11.5, color: css.textGray }}>{works ? `${Object.keys(booked).length}/${slots.length} booked` : doctor.status === "On Leave" ? "On leave" : "Day off"}</div>
                </div>
                {works && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                    {slots.map(s => booked[s] ? (
                      <span key={s} title={booked[s]} style={{ padding: "4px 9px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, background: accent, color: "white", maxWidth: 170, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s} · {booked[s].split(" ")[0]}
                      </span>
                    ) : (
                      <span key={s} style={{ padding: "4px 9px", borderRadius: 7, fontSize: 11.5, background: isDark ? "transparent" : tint + "55", color: css.textGray, border: `1px solid ${css.border}` }}>{s}</span>
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
