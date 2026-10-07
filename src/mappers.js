/* ============================================================
   mappers.js — converts API documents (MongoDB shapes) into the
   shapes the existing UI components were written for.
   ============================================================ */

const idOf = (ref) => (ref && typeof ref === "object" ? ref._id : ref) || null;
const nameOf = (ref, fallback = "—") => (ref && typeof ref === "object" && ref.name) || fallback;

// "2026-09-14T00:00:00.000Z" -> "2026-09-14" (dates are stored at 00:00 UTC)
export const ymd = (iso) => (iso ? String(iso).slice(0, 10) : "");

export function initials(name = "") {
  return name.replace(/^Dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join("") || "?";
}

// Scheduled -> "Pending" so the existing status badges keep working
const APPT_STATUS = { Scheduled: "Pending", Completed: "Completed", Cancelled: "Cancelled" };

export function mapAppointment(a) {
  return {
    id: a._id,
    patientId: idOf(a.patientId),
    patient: nameOf(a.patientId, "(deleted patient)"),
    doctorId: idOf(a.doctorId),
    doctor: nameOf(a.doctorId),
    dept: nameOf(a.departmentId),
    action: a.reason || "Consultation",
    time: a.timeSlot,
    date: ymd(a.date),
    status: APPT_STATUS[a.status] || a.status,
    rawStatus: a.status,
    createdAt: a.createdAt || "",
  };
}

export function mapDoctor(d, appointments) {
  const busySlots = appointments
    .filter(a => a.doctorId === d._id && a.rawStatus === "Scheduled")
    .map(a => ({ date: a.date, time: a.time }));
  return {
    id: d._id,
    name: d.name,
    dept: nameOf(d.departmentId, "General"),
    deptId: idOf(d.departmentId),
    img: initials(d.name),
    status: d.status,
    specialization: d.specialization || "",
    workingDays: d.workingDays || [],
    workingHours: d.workingHours || { start: "09:00", end: "17:00" },
    busySlots,
  };
}

// condition / doctor / dept / status come from the patient's latest appointment (by date)
export function mapPatient(p, appointments) {
  const mine = appointments.filter(a => a.patientId === p._id);
  const latest = mine.reduce((best, a) =>
    !best || a.date > best.date || (a.date === best.date && a.time > best.time) ? a : best, null);
  return {
    id: p._id,
    code: "P-" + String(p._id).slice(-6).toUpperCase(),
    name: p.name,
    age: p.age ?? "",
    gender: p.gender || "",
    contact: p.contact || "",
    address: p.address || "",
    condition: latest ? latest.action : "—",
    doctor: latest ? latest.doctor : "—",
    dept: latest ? latest.dept : "General",
    status: latest ? latest.rawStatus : "No visits",
    lastVisit: latest ? latest.date : "",
    visits: mine.length,
  };
}

export function mapAll({ departments, doctors, patients, appointments }) {
  const appts = appointments.map(mapAppointment)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));   // newest bookings first
  return {
    departments: departments.map(d => ({ id: d._id, name: d.name, fee: d.consultationFee })),
    doctors: doctors.map(d => mapDoctor(d, appts)),
    patients: patients.map(p => mapPatient(p, appts)),
    appointments: appts,
  };
}
