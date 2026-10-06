require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();
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
    const slot = err.keyPattern && err.keyPattern.timeSlot;
    return res.status(409).json({ error: slot ? "Slot already booked" : "Duplicate value" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(", ") });
  }
  if (err.name === "CastError") return res.status(400).json({ error: `Invalid ${err.path}` });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch(e => { console.error("MongoDB connection failed:", e.message); process.exit(1); });
