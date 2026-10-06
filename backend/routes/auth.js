const r = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User, Patient } = require("../models");
const { signToken } = require("../middleware/auth");

// POST /api/auth/register  - patient self-registration (FR1)
// User and Patient are created in ONE transaction: both are saved or neither.
r.post("/register", async (q, res, next) => {
  const { name, email, password, phone, age, gender, address } = q.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email and password are required" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const session = await mongoose.startSession();
  try {
    let user;
    await session.withTransaction(async () => {
      const passwordHash = await bcrypt.hash(password, 10);
      [user] = await User.create([{ name, email, passwordHash, role: "patient", phone }], { session });
      await Patient.create([{ userId: user._id, name, age, gender, contact: phone, address }], { session });
    });
    res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }   // duplicate email -> 409 from error handler
  finally { session.endSession(); }
});

// POST /api/auth/login  (FR2)
r.post("/login", async (q, res, next) => {
  try {
    const { email, password } = q.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: "Invalid email or password" });
    res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

module.exports = r;
