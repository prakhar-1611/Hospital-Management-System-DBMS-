/* ============================================================
   dates.js — date helpers for the portals. Appointment dates are
   "YYYY-MM-DD" strings (stored at 00:00 UTC), slots are "HH:MM".
   ============================================================ */
import { getTodayPlus } from "../constants";

export const todayStr = () => getTodayPlus(0);

const asUTC = (ymd) => new Date(`${ymd}T00:00:00Z`);

// "2026-10-17" -> "Sat, 17 Oct 2026"
export function fmtDate(ymd, opts = { weekday: "short", day: "numeric", month: "short", year: "numeric" }) {
  if (!ymd) return "—";
  return asUTC(ymd).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}

// "14:00" -> "2:00 PM"
export function fmtTime(hhmm) {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// whole days from today to ymd (negative = past)
export function daysFromToday(ymd) {
  return Math.round((asUTC(ymd) - asUTC(todayStr())) / 86400000);
}

export function relativeDay(ymd) {
  const n = daysFromToday(ymd);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  return n > 0 ? `In ${n} days` : `${-n} days ago`;
}

export const weekday = (ymd) => asUTC(ymd).getUTCDay();

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// sort key so appointments order by date then slot
export const apptKey = (a) => `${a.date} ${a.time}`;

// true once the slot's start time has passed (local clock)
export function isPastSlot(ymd, hhmm) {
  const n = daysFromToday(ymd);
  if (n !== 0) return n < 0;
  const now = new Date();
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
}
