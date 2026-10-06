const r = require("express").Router();
const mongoose = require("mongoose");
const { User, Patient, Appointment } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { escapeRegex } = require("../utils");

r.use(requireAuth);

// GET /api/patients?search=name  (admin, doctor)
r.get("/", requireRole("admin", "doctor"), async (q, res, next) => {
  try {
    const filter = q.query.search ? { name: new RegExp(escapeRegex(q.query.search), "i") } : {};
    res.json(await Patient.find(filter).sort({ name: 1 }));
  } catch (e) { next(e); }
});

// GET /api/patients/me  (patient)
r.get("/me", requireRole("patient"), async (q, res, next) => {
  try {
    const p = await Patient.findOne({ userId: q.user.id });
    if (!p) return res.status(404).json({ error: "Patient profile not found" });
    res.json(p);
  } catch (e) { next(e); }
});

// PUT /api/patients/me  (patient updates own profile)
r.put("/me", requireRole("patient"), async (q, res, next) => {
  try {
    const p = await Patient.findOne({ userId: q.user.id });
    if (!p) return res.status(404).json({ error: "Patient profile not found" });
    for (const k of ["name", "age", "gender", "contact", "address"]) if (q.body[k] !== undefined) p[k] = q.body[k];
    res.json(await p.save());
  } catch (e) { next(e); }
});

// DELETE /api/patients/:id  (admin) - transaction:
// delete patient + login account and cancel the patient's Scheduled appointments
r.delete("/:id", requireRole("admin"), async (q, res, next) => {
  const session = await mongoose.startSession();
  try {
    let found = true;
    await session.withTransaction(async () => {
      const p = await Patient.findByIdAndDelete(q.params.id, { session });
      if (!p) { found = false; return; }
      await User.findByIdAndDelete(p.userId, { session });
      await Appointment.updateMany({ patientId: p._id, status: "Scheduled" },
                                   { status: "Cancelled" }, { session });
    });
    if (!found) return res.status(404).json({ error: "Patient not found" });
    res.json({ message: "Patient deleted" });
  } catch (e) { next(e); }
  finally { session.endSession(); }
});

module.exports = r;
