/* ============================================================
   SlotPicker.jsx — choose a date (next 21 days, only the doctor's
   working days) and a free one-hour slot. Free slots come from
   GET /api/doctors/:id/availability?date=  (the server checks leave,
   working hours and existing bookings).
   Selection is shown by a filled chip plus a check, never by colour alone.
   ============================================================ */
import { useEffect, useState } from "react";
import * as api from "../api";
import { Skeleton, Notice } from "../ui/kit";
import { DAY_NAMES, getTodayPlus } from "../constants";
import { weekday, fmtTime, fmtDate, isPastSlot } from "../ui/dates";

const chip = (on, ok) => ({
  border: `1px solid ${on ? "var(--accent)" : "var(--control)"}`, background: on ? "var(--accent)" : "var(--sheet)", color: on ? "#fff" : ok ? "var(--ink)" : "var(--muted)",
  opacity: ok ? 1 : .5, cursor: ok ? "pointer" : "not-allowed", borderRadius: 8, font: "inherit",
  transition: "background-color 120ms var(--ease-out), border-color 120ms var(--ease-out)",
});

export default function SlotPicker({ doctor, date, time, onChange, exclude }) {
  // the answer for one doctor + date; "loading" = no answer yet for the current pair
  const [result, setResult] = useState({ key: "", slots: [], msg: "" });
  const key = `${doctor._id}|${date}`;
  const loading = !!date && result.key !== key;
  const slots = result.key === key ? result.slots : [];
  const msg = result.key === key ? result.msg : "";
  const days = Array.from({ length: 21 }, (_, i) => getTodayPlus(i));
  const works = (d) => doctor.status !== "On Leave" && doctor.workingDays.includes(weekday(d));

  useEffect(() => {
    if (!date) return;
    let alive = true;
    const k = `${doctor._id}|${date}`;
    api.getAvailability(doctor._id, date)
      .then(r => {
        if (!alive) return;
        if (!r.working) setResult({ key: k, slots: [], msg: r.status === "On Leave" ? "The doctor is on leave." : "The doctor does not work on this day." });
        else setResult({ key: k, slots: r.slots, msg: "" });
      })
      .catch(e => alive && setResult({ key: k, slots: [], msg: e.message }));
    return () => { alive = false; };
  }, [doctor._id, date]);

  // a slot counts as free if nobody holds it, or if it is the appointment being moved
  const usable = slots.filter(s => (s.available || (exclude && exclude.date === date && exclude.time === s.time)) && !isPastSlot(date, s.time));

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Date</div>
      <div role="radiogroup" aria-label="Date" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "thin" }}>
        {days.map(d => {
          const ok = works(d), on = d === date;
          return (
            <button key={d} role="radio" aria-checked={on} disabled={!ok} onClick={() => onChange({ date: d, time: "" })}
              title={ok ? fmtDate(d) : "The doctor is not available this day"}
              style={{ ...chip(on, ok), flex: "0 0 60px", padding: "8px 0", textAlign: "center" }}>
              <span style={{ display: "block", fontSize: 12, opacity: .85 }}>{DAY_NAMES[weekday(d)]}</span>
              <span style={{ display: "block", fontSize: 18, fontWeight: 600, lineHeight: 1.25 }}>{Number(d.slice(8))}</span>
              <span style={{ display: "block", fontSize: 12, opacity: .85 }}>{fmtDate(d, { month: "short" })}</span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, margin: "16px 0 8px" }}>Time</div>
      {!date ? (
        <div style={{ fontSize: 13.5, color: "var(--muted)" }}>Pick a date to see open slots.</div>
      ) : loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }} aria-busy="true">{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={38} r={8}/>)}</div>
      ) : msg ? (
        <Notice tone="warning">{msg}</Notice>
      ) : (
        <>
          <div role="radiogroup" aria-label="Time" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
            {slots.map(s => {
              const free = usable.some(u => u.time === s.time), on = s.time === time;
              return (
                <button key={s.time} role="radio" aria-checked={on} disabled={!free} onClick={() => onChange({ date, time: s.time })}
                  title={free ? undefined : "Already booked"} style={{ ...chip(on, free), minHeight: 38, fontSize: 14, fontWeight: 500, textDecoration: free ? "none" : "line-through" }}>
                  {fmtTime(s.time)}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>
            {usable.length ? `${usable.length} slot${usable.length > 1 ? "s" : ""} open. Each visit is one hour.` : "No open slots on this day. Try another date."}
          </div>
        </>
      )}
    </div>
  );
}
