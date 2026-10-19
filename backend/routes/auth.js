const r = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User, Patient } = require("../models");
const { signToken, requireAuth } = require("../middleware/auth");

// what the frontend is allowed to know about the logged-in account
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role,
  avatar: u.avatar || null, authProvider: u.authProvider || "local" });

// GET /api/auth/config  - public. Tells the login screen whether Google sign-in is set up.
// The client ID is not a secret (Google shows it in every sign-in popup).
r.get("/config", (q, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

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
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }   // duplicate email -> 409 from error handler
  finally { session.endSession(); }
});

// POST /api/auth/login  (FR2) - every role; the frontend opens the matching portal
r.post("/login", async (q, res, next) => {
  try {
    const { email, password } = q.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: "Invalid email or password" });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

// Verifies a Google ID token with Google's tokeninfo endpoint and returns its claims,
// or null when the token is invalid, expired or issued for another app.
async function verifyGoogleToken(credential, clientId) {
  try {
    const resp = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
    if (!resp.ok) return null;
    const t = await resp.json();
    const issuerOk = t.iss === "accounts.google.com" || t.iss === "https://accounts.google.com";
    const fresh = Number(t.exp) * 1000 > Date.now();
    if (t.aud !== clientId || !issuerOk || !fresh || String(t.email_verified) !== "true" || !t.email) return null;
    return t;
  } catch {
    return null;
  }
}

// POST /api/auth/google { credential }  - "Continue with Google" for PATIENTS.
// First visit: creates the patient account + profile (one transaction).
// Later visits: logs the same patient in. Staff accounts must use email + password.
r.post("/google", async (q, res, next) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: "Google sign-in is not configured on the server (GOOGLE_CLIENT_ID)" });
  const { credential } = q.body;
  if (!credential) return res.status(400).json({ error: "credential is required" });

  const g = await verifyGoogleToken(String(credential), clientId);
  if (!g) return res.status(401).json({ error: "Google sign-in could not be verified. Please try again." });

  const email = String(g.email).toLowerCase();
  const session = await mongoose.startSession();
  try {
    let user = await User.findOne({ email });
    let created = false;
    if (user && user.role !== "patient")
      return res.status(403).json({ error: "Staff accounts sign in with email and password." });
    if (!user) {
      await session.withTransaction(async () => {
        // random password: the account can only be opened through Google
        const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
        const name = String(g.name || email.split("@")[0]).trim();
        [user] = await User.create([{ name, email, passwordHash, role: "patient",
          authProvider: "google", avatar: g.picture }], { session });
        await Patient.create([{ userId: user._id, name }], { session });
      });
      created = true;
    } else if (g.picture && user.avatar !== g.picture) {
      user.avatar = g.picture;
      await user.save();
    }
    res.status(created ? 201 : 200).json({ token: signToken(user), user: publicUser(user), created });
  } catch (e) { next(e); }
  finally { session.endSession(); }
});

// GET /api/auth/me  - the logged-in account (used to refresh the stored user)
r.get("/me", requireAuth, async (q, res, next) => {
  try {
    const user = await User.findById(q.user.id);
    if (!user) return res.status(401).json({ error: "Account no longer exists" });
    res.json(publicUser(user));
  } catch (e) { next(e); }
});

// PUT /api/auth/password { currentPassword, newPassword }  - any role, own account only
r.put("/password", requireAuth, async (q, res, next) => {
  try {
    const { currentPassword, newPassword } = q.body;
    if (!newPassword || String(newPassword).length < 6)
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    const user = await User.findById(q.user.id).select("+passwordHash");
    if (!user) return res.status(401).json({ error: "Account no longer exists" });
    if (user.authProvider === "google")
      return res.status(400).json({ error: "This account signs in with Google and has no password to change." });
    if (!currentPassword || !(await bcrypt.compare(String(currentPassword), user.passwordHash)))
      return res.status(400).json({ error: "Current password is incorrect" });
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (e) { next(e); }
});


module.exports = r;
