const r = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User, Patient, Doctor, Appointment } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { escapeRegex } = require("../utils");

r.use(requireAuth);

// The ids of the patients a doctor has (or had) an appointment with - a doctor may only
// see those patients. Uses index 7 {doctorId,date}.
async function doctorPatientIds(userId) {
  const d = await Doctor.findOne({ userId });
  if (!d) return { doctor: null, ids: [] };
  return { doctor: d, ids: await Appointment.distinct("patientId", { doctorId: d._id }) };
}

// GET /api/patients?search=name  (admin: all patients, doctor: own patients only)
r.get("/", requireRole("admin", "doctor"), async (q, res, next) => {
  try {
    const filter = q.query.search ? { name: new RegExp(escapeRegex(q.query.search), "i") } : {};
    if (q.user.role === "doctor") filter._id = { $in: (await doctorPatientIds(q.user.id)).ids };
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
    const fields = ["name", "age", "gender", "contact", "address", "bloodGroup", "allergies", "emergencyContact"];
    // an empty string clears an optional field (enums such as gender reject "")
    for (const k of fields) if (q.body[k] !== undefined) p[k] = q.body[k] === "" ? undefined : q.body[k];
    if (!p.name || !String(p.name).trim()) return res.status(400).json({ error: "name is required" });
    await p.save();
    // keep the login account's display name and phone in step with the profile
    await User.updateOne({ _id: q.user.id }, { name: p.name, phone: p.contact });
    res.json(p);
  } catch (e) { next(e); }
});

// GET /api/patients/:id  - one patient with their appointment history
//   admin  -> any patient, full history
//   doctor -> only a patient they have seen, and only the appointments with that doctor
r.get("/:id", requireRole("admin", "doctor"), async (q, res, next) => {
  try {
    if (!mongoose.isValidObjectId(q.params.id)) return res.status(400).json({ error: "Invalid id" });
    const histFilter = { patientId: q.params.id };
    if (q.user.role === "doctor") {
      const { doctor, ids } = await doctorPatientIds(q.user.id);
      if (!doctor || !ids.some(id => id.equals(q.params.id)))
        return res.status(403).json({ error: "You can only view your own patients" });
      histFilter.doctorId = doctor._id;
    }
    const p = await Patient.findById(q.params.id);
    if (!p) return res.status(404).json({ error: "Patient not found" });
    const history = await Appointment.find(histFilter)
      .populate("doctorId", "name").populate("departmentId", "name").sort({ date: -1, timeSlot: -1 });
    res.json({ patient: p, history });
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
