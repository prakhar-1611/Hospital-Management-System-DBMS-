const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
}

// Checks "Authorization: Bearer <token>" and puts { id, role } on req.user
function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required" });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: p.id, role: p.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// requireRole("admin", "doctor")
function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user.role) ? next() : res.status(403).json({ error: "Forbidden" });
}

module.exports = { signToken, requireAuth, requireRole };
