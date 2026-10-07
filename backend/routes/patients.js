const r = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
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

// POST /api/patients  (admin) - used by the admission form of the admin portal.
// Creates the login account (users) and the profile (patients) in ONE transaction:
// both are saved or neither is.
// - password defaults to "patient123" when not supplied
// - email is generated when left blank (the patient can be given a real one later)
// - a duplicate email -> 409 from the error handler (unique index on users.email)
r.post("/", requireRole("admin"), async (q, res, next) => {
  const { name, email, password, phone, age, gender, address } = q.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: "name is required" });
  const pw = password ? String(password) : "patient123";
  if (pw.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const cleanName = String(name).trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "patient";
  const finalEmail = email && String(email).trim()
    ? String(email).trim().toLowerCase()
    : `${slug}.${crypto.randomBytes(3).toString("hex")}@patients.medcare.com`;
  const ageNum = age === undefined || age === null || age === "" ? undefined : Number(age);
  const opt = v => (v === undefined || v === null || String(v).trim() === "" ? undefined : String(v).trim());

  const session = await mongoose.startSession();
  try {
    let patient;
    await session.withTransaction(async () => {
      const passwordHash = await bcrypt.hash(pw, 10);
      const [user] = await User.create([{ name: cleanName, email: finalEmail, passwordHash,
        role: "patient", phone: opt(phone) }], { session });
      [patient] = await Patient.create([{ userId: user._id, name: cleanName, age: ageNum,
        gender: opt(gender), contact: opt(phone), address: opt(address) }], { session });
    });
    res.status(201).json({ ...patient.toJSON(), email: finalEmail });
  } catch (e) { next(e); }
  finally { session.endSession(); }
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
