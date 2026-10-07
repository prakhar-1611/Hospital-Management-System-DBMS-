const r = require("express").Router();
const mongoose = require("mongoose");
const { Doctor, Patient, Appointment } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { generateTimeSlots, parseDay, today } = require("../utils");

r.use(requireAuth);

// Same checks as the frontend slot picker: doctor exists, not on leave,
// works on that weekday, slot inside working hours, date not in the past.
async function validateSlot(doctorId, dateStr, timeSlot) {
  if (!mongoose.isValidObjectId(doctorId)) return { err: "Invalid doctorId" };
  const date = parseDay(dateStr);
  if (!date) return { err: "date must be YYYY-MM-DD" };
  if (date < today()) return { err: "Cannot book a date in the past" };
  const doc = await Doctor.findById(doctorId);
  if (!doc) return { err: "Doctor not found" };
  if (doc.status === "On Leave") return { err: "Doctor is on leave" };
  if (!doc.workingDays.includes(date.getUTCDay())) return { err: "Doctor does not work on this day" };
  if (!generateTimeSlots(doc.workingHours.start, doc.workingHours.end).includes(timeSlot))
    return { err: "Slot is outside the doctor's working hours" };
  return { doc, date };
}

// Ownership rules for PUT / DELETE (FR6):
//   patient -> only appointments where patientId is their own patient profile
//   doctor  -> only appointments where doctorId is their own doctor profile
//              (profile found through doctors.userId, index 4)
//   admin   -> any appointment
async function loadAppointment(q, res) {
  const appt = await Appointment.findById(q.params.id);
  if (!appt) { res.status(404).json({ error: "Appointment not found" }); return null; }
  if (q.user.role === "patient") {
    const p = await Patient.findOne({ userId: q.user.id });
    if (!p || !appt.patientId.equals(p._id)) { res.status(403).json({ error: "Forbidden" }); return null; }
  } else if (q.user.role === "doctor") {
    const d = await Doctor.findOne({ userId: q.user.id });
    if (!d || !appt.doctorId.equals(d._id)) {
      res.status(403).json({ error: "Doctors can only change their own appointments" }); return null;
    }
  }
  return appt;
}

// POST /api/appointments  (FR4, FR5)
//   patient -> books for themselves (patientId comes from the token)
//   admin   -> books for a patient and must send patientId in the body
r.post("/", requireRole("patient", "admin"), async (q, res, next) => {
  try {
    const { doctorId, date, timeSlot, reason, patientId } = q.body;
    let patient;
    if (q.user.role === "admin") {
      if (!mongoose.isValidObjectId(patientId)) return res.status(400).json({ error: "patientId is required and must be a valid id" });
      patient = await Patient.findById(patientId);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
    } else {
      patient = await Patient.findOne({ userId: q.user.id });
      if (!patient) return res.status(404).json({ error: "Patient profile not found" });
    }
    const { doc, date: d, err } = await validateSlot(doctorId, date, timeSlot);
    if (err) return res.status(400).json({ error: err });          // leave / weekday / hours / past date
    const appt = await Appointment.create({ patientId: patient._id, doctorId,
      departmentId: doc.departmentId, date: d, timeSlot, reason });
    res.status(201).json(appt);
  } catch (e) { next(e); }   // E11000 from the unique index -> 409 "Slot already booked"
});

// GET /api/appointments?doctorId&departmentId&status&from&to  (FR6, FR7)
// patient: own only. doctor and admin: all appointments (read-only for doctors outside their own).
// Index used per filter: patient -> {patientId,date}; doctorId -> {doctorId,date};
// departmentId -> {departmentId,date}; status (+from/to) -> {status,date}.
// A date range with no other filter has no index starting with date (collection scan).
r.get("/", async (q, res, next) => {
  try {
    const filter = {};
    if (q.user.role === "patient") {
      const p = await Patient.findOne({ userId: q.user.id });
      if (!p) return res.json([]);
      filter.patientId = p._id;                                     // own only
    }
    const { doctorId, departmentId, status, from, to } = q.query;
    if (doctorId) filter.doctorId = doctorId;
    if (departmentId) filter.departmentId = departmentId;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) { const f = parseDay(from); if (!f) return res.status(400).json({ error: "from must be YYYY-MM-DD" }); filter.date.$gte = f; }
      if (to)   { const t = parseDay(to);   if (!t) return res.status(400).json({ error: "to must be YYYY-MM-DD" });   filter.date.$lte = t; }
    }
    const list = await Appointment.find(filter)
      .populate("patientId", "name contact")
      .populate("doctorId", "name")
      .populate("departmentId", "name")
      .sort({ date: -1, timeSlot: 1 });
    res.json(list);
  } catch (e) { next(e); }
});

// PUT /api/appointments/:id  - reschedule or edit reason; status change by doctor (own) or admin
r.put("/:id", async (q, res, next) => {
  try {
    const appt = await loadAppointment(q, res);
    if (!appt) return;
    const { date, timeSlot, reason, status } = q.body;

    if (q.user.role === "patient") {
      if (status !== undefined) return res.status(403).json({ error: "Patients cannot change status" });
      if (appt.status !== "Scheduled") return res.status(400).json({ error: "Only scheduled appointments can be changed" });
    }

    if (date !== undefined || timeSlot !== undefined) {
      const newDate = date ?? appt.date.toISOString().slice(0, 10);
      const newSlot = timeSlot ?? appt.timeSlot;
      const { date: d, err } = await validateSlot(appt.doctorId, newDate, newSlot);
      if (err) return res.status(400).json({ error: err });
      appt.date = d;
      appt.timeSlot = newSlot;
    }
    if (reason !== undefined) appt.reason = reason;
    if (status !== undefined) appt.status = status;
    res.json(await appt.save());   // a clash on the new slot -> 409 via the partial unique index
  } catch (e) { next(e); }
});

// DELETE /api/appointments/:id  - cancel (soft delete): patient (own), doctor (own), admin (any).
// Admin can hard-delete with ?hard=true
r.delete("/:id", async (q, res, next) => {
  try {
    if (q.query.hard === "true") {
      if (q.user.role !== "admin") return res.status(403).json({ error: "Only admin can hard-delete" });
      const a = await Appointment.findByIdAndDelete(q.params.id);
      if (!a) return res.status(404).json({ error: "Appointment not found" });
      return res.json({ message: "Appointment deleted" });
    }
    const appt = await loadAppointment(q, res);
    if (!appt) return;
    if (appt.status !== "Scheduled") return res.status(400).json({ error: "Only scheduled appointments can be cancelled" });
    appt.status = "Cancelled";      // frees the slot (partial index) and keeps history for reports
    res.json(await appt.save());
  } catch (e) { next(e); }
});

module.exports = r;
