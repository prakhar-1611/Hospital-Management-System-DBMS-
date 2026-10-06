// Shared slot logic. generateTimeSlots is the same function as in src/constants.js
// so the frontend and backend produce the same 1-hour slots.

function generateTimeSlots(start, end) {
  const slots = [];
  let [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  while (sh * 60 + sm < eh * 60 + em) {
    slots.push(`${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`);
    sm += 60; if (sm >= 60) { sh++; sm -= 60; }
  }
  return slots;
}

// "2026-09-14" -> Date at 00:00 UTC. Returns null if the string is not a valid date.
function parseDay(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(str || ""))) return null;
  const d = new Date(`${str}T00:00:00Z`);
  return isNaN(d) ? null : d;
}

// Today at 00:00 UTC
function today() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

// Escape user input before putting it in a RegExp (prevents regex injection)
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { generateTimeSlots, parseDay, today, escapeRegex };
