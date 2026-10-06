const r = require("express").Router();
const { Department, Doctor } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");

r.use(requireAuth);

// GET /api/departments  (FR3)
r.get("/", async (q, res, next) => {
  try { res.json(await Department.find().sort({ name: 1 })); } catch (e) { next(e); }
});

// POST /api/departments  (admin)
r.post("/", requireRole("admin"), async (q, res, next) => {
  try {
    const { name, description, consultationFee } = q.body;
    res.status(201).json(await Department.create({ name, description, consultationFee }));
  } catch (e) { next(e); }
});

// PUT /api/departments/:id  (admin)
r.put("/:id", requireRole("admin"), async (q, res, next) => {
  try {
    const update = {};
    for (const k of ["name", "description", "consultationFee"]) if (q.body[k] !== undefined) update[k] = q.body[k];
    const d = await Department.findByIdAndUpdate(q.params.id, update, { new: true, runValidators: true });
    if (!d) return res.status(404).json({ error: "Department not found" });
    res.json(d);
  } catch (e) { next(e); }
});

// DELETE /api/departments/:id  (admin) - only if no doctor belongs to it
r.delete("/:id", requireRole("admin"), async (q, res, next) => {
  try {
    if (await Doctor.exists({ departmentId: q.params.id }))
      return res.status(400).json({ error: "Department still has doctors" });
    const d = await Department.findByIdAndDelete(q.params.id);
    if (!d) return res.status(404).json({ error: "Department not found" });
    res.json({ message: "Department deleted" });
  } catch (e) { next(e); }
});

module.exports = r;
