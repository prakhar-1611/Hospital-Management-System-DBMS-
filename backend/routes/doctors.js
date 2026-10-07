const r = require("express").Router();
const bcrypt = require("bcryptjs");
const { User, Doctor, Appointment } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { generateTimeSlots, parseDay } = require("../utils");

r.use(requireAuth);

const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj[k] !== undefined).map(k => [k, obj[k]]));

// GET /api/doctors?departmentId=  (FR3) - department name and fee populated
// with departmentId -> index 3 {departmentId,status}; without -> all 40 doctors
r.get("/", async (q, res, next) => {
  try {
    const filter = q.query.departmentId ? { departmentId: q.query.departmentId } : {};
    res.json(await Doctor.find(filter).populate("departmentId", "name consultationFee").sort({ name: 1 }));
  } catch (e) { next(e); }
});

// GET /api/doctors/:id/availability?date=YYYY-MM-DD
// Free slots are worked out from the appointments collection (no embedded busySlots).
r.get("/:id/availability", async (q, res, next) => {
  try {
    const date = parseDay(q.query.date);
    if (!date) return res.status(400).json({ error: "date must be YYYY-MM-DD" });
    const doc = await Doctor.findById(q.params.id);
    if (!doc) return res.status(404).json({ error: "Doctor not found" });

    if (doc.status === "On Leave" || !doc.workingDays.includes(date.getUTCDay()))
      return res.json({ date: q.query.date, working: false, status: doc.status, slots: [] });

    // query contains status "Scheduled", so the partial index 6 (doctorId+date+timeSlot)
    // or the plain index 7 (doctorId+date) can serve it; the planner picks one
    const taken = await Appointment.find({ doctorId: doc._id, date, status: "Scheduled" }).distinct("timeSlot");
    const slots = generateTimeSlots(doc.workingHours.start, doc.workingHours.end)
      .map(t => ({ time: t, available: !taken.includes(t) }));
    res.json({ date: q.query.date, working: true, status: doc.status, slots });
  } catch (e) { next(e); }
});

// POST /api/doctors  (admin) - creates the doctor's login account and profile
r.post("/", requireRole("admin"), async (q, res, next) => {
  let user;
  try {
    const { name, email, password, phone } = q.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email and password are required" });
    user = await User.create({ name, email, phone, role: "doctor", passwordHash: await bcrypt.hash(password, 10) });
    const doc = await Doctor.create({ userId: user._id, name,
      ...pick(q.body, ["departmentId", "specialization", "workingDays", "workingHours", "status"]) });
    res.status(201).json(doc);
  } catch (e) {
    if (user) await User.findByIdAndDelete(user._id).catch(() => {}); // undo the account if profile failed
    next(e);
  }
});

// PUT /api/doctors/:id  (admin: all fields, doctor: own status / days / hours)
r.put("/:id", requireRole("admin", "doctor"), async (q, res, next) => {
  try {
    const doc = await Doctor.findById(q.params.id);
    if (!doc) return res.status(404).json({ error: "Doctor not found" });
    let fields = ["status", "workingDays", "workingHours"];
    if (q.user.role === "doctor") {
      if (String(doc.userId) !== q.user.id) return res.status(403).json({ error: "Forbidden" });
    } else {
      fields = fields.concat(["name", "departmentId", "specialization"]);
    }
    doc.set(pick(q.body, fields));
    res.json(await doc.save());
  } catch (e) { next(e); }
});

// DELETE /api/doctors/:id  (admin) - not allowed while the doctor has Scheduled appointments
// (the exists() check uses index 6 or 7)
r.delete("/:id", requireRole("admin"), async (q, res, next) => {
  try {
    if (await Appointment.exists({ doctorId: q.params.id, status: "Scheduled" }))
      return res.status(400).json({ error: "Doctor has scheduled appointments" });
    const doc = await Doctor.findByIdAndDelete(q.params.id);
    if (!doc) return res.status(404).json({ error: "Doctor not found" });
    await User.findByIdAndDelete(doc.userId);
    res.json({ message: "Doctor deleted" });
  } catch (e) { next(e); }
});

module.exports = r;
