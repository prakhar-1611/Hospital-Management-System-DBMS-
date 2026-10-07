require("dotenv").config({ path: require("path").join(__dirname, ".env") });
require("./dns-override")();      // only if DNS_SERVERS is set in .env (see README, troubleshooting)
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/departments", require("./routes/departments"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/reports", require("./routes/reports"));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Central error handler
app.use((err, req, res, _next) => {
  if (err.code === 11000) {
    // duplicate key from a unique index
    const kp = err.keyPattern || {};
    const msg = kp.timeSlot ? "Slot already booked" : kp.email ? "Email already registered" : "Duplicate value";
    return res.status(409).json({ error: msg });
  }
  if (err.code === 121) {
    // rejected by the $jsonSchema validator inside MongoDB (models/validators.js)
    return res.status(400).json({ error: "Document failed database validation" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(", ") });
  }
  if (err.name === "CastError") return res.status(400).json({ error: `Invalid ${err.path}` });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 5000;
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("MONGO_URI and JWT_SECRET must be set in backend/.env (copy .env.example)");
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch(e => { console.error("MongoDB connection failed:", e.message); process.exit(1); });
