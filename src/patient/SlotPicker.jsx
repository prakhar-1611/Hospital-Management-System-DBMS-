/* ============================================================
   SlotPicker.jsx — choose a date (next 21 days, only the doctor's
   working days) and a free one-hour slot. Free slots come from
   GET /api/doctors/:id/availability?date=  (the server checks leave,
   working hours and existing bookings).
   ============================================================ */
import { useEffect, useState } from "react";
import * as api from "../api";
import { Spinner } from "../ui/kit";
import Icon from "../ui/Icon";
import { DAY_NAMES, getTodayPlus } from "../constants";
import { weekday, fmtTime, fmtDate, isPastSlot } from "../ui/dates";

export default function SlotPicker({ css, accent, doctor, date, time, onChange, exclude }) {
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
      <div style={{ fontSize: 12, fontWeight: 600, color: css.textGray, marginBottom: 8 }}>Date</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {days.map(d => {
          const ok = works(d);
          const on = d === date;
          return (
            <button key={d} disabled={!ok} onClick={() => onChange({ date: d, time: "" })}
              title={ok ? fmtDate(d) : "Doctor not available"}
              style={{ flex: "0 0 62px", padding: "9px 0", borderRadius: 12, textAlign: "center", cursor: ok ? "pointer" : "not-allowed",
                border: `1px solid ${on ? accent : css.border}`, background: on ? accent : ok ? css.card : css.subtle,
                color: on ? "white" : ok ? css.text : css.textGray, opacity: ok ? 1 : .55 }}>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: .85 }}>{DAY_NAMES[weekday(d)]}</div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{Number(d.slice(8))}</div>
              <div style={{ fontSize: 10.5, opacity: .8 }}>{fmtDate(d, { month: "short" })}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: css.textGray, margin: "16px 0 8px" }}>Time</div>
      {!date ? (
        <div style={{ fontSize: 13, color: css.textGray }}>Pick a date to see open slots.</div>
      ) : loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: css.textGray }}><Spinner size={14} color={accent}/> Checking availability…</div>
      ) : msg ? (
        <div style={{ fontSize: 13, color: "#b45309", display: "flex", gap: 6, alignItems: "center" }}><Icon name="info" size={15}/>{msg}</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
            {slots.map(s => {
              const free = usable.some(u => u.time === s.time);
              const on = s.time === time;
              return (
                <button key={s.time} disabled={!free} onClick={() => onChange({ date, time: s.time })}
                  style={{ padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 650, cursor: free ? "pointer" : "not-allowed",
                    border: `1px solid ${on ? accent : css.border}`, background: on ? accent : free ? css.card : css.subtle,
                    color: on ? "white" : free ? css.text : css.textGray, textDecoration: free ? "none" : "line-through", opacity: free ? 1 : .6 }}>
                  {fmtTime(s.time)}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: css.textGray, marginTop: 10 }}>
            {usable.length ? `${usable.length} slot${usable.length > 1 ? "s" : ""} open · each visit is 1 hour` : "No open slots on this day. Try another date."}
          </div>
        </>
      )}
    </div>
  );
}
