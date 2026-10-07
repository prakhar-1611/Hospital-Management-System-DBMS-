const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
// Index numbering below matches the README and the Review 2 report (Section 5.1).
// The same rules are also enforced inside MongoDB by $jsonSchema validators
// (models/validators.js), so inserts from Compass / mongosh are checked too.

/* ---------- users ---------- */
const userSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true,
                  match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"] },          // index 1 (unique)
  passwordHash: { type: String, required: true, select: false },
  role:         { type: String, enum: ["patient", "doctor", "admin"], required: true },
  phone:        { type: String, trim: true },
  createdAt:    { type: Date, default: Date.now },
});
// never send the hash back to the client
userSchema.set("toJSON", { transform: (_d, r) => { delete r.passwordHash; delete r.__v; return r; } });

/* ---------- departments ---------- */
const departmentSchema = new Schema({
  name:            { type: String, required: true, unique: true, trim: true },       // index 2 (unique)
  description:     { type: String, trim: true },
  consultationFee: { type: Number, required: true, min: 0 },
});

/* ---------- doctors ---------- */
const doctorSchema = new Schema({
  userId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
  name:           { type: String, required: true, trim: true },
  departmentId:   { type: Schema.Types.ObjectId, ref: "Department", required: true },
  specialization: { type: String, trim: true },
  // embedded: small, bounded, always read with the doctor (Review 1, Section 4.2)
  workingDays:    { type: [{ type: Number, min: 0, max: 6 }],
                    validate: [v => v.length > 0, "At least one working day is required"] },
  workingHours:   {
    start: { type: String, required: true, match: [HHMM, "Use HH:MM"] },
    end:   { type: String, required: true, match: [HHMM, "Use HH:MM"] },
  },
  status:         { type: String, enum: ["Available", "Busy", "On Leave"], default: "Available" },
});
doctorSchema.index({ departmentId: 1, status: 1 });                                  // index 3
// index 4: every request by a doctor resolves "my doctor profile" with findOne({ userId })
doctorSchema.index({ userId: 1 }, { unique: true, name: "uniq_doctor_user" });

/* ---------- patients ---------- */
const patientSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
  name:    { type: String, required: true, trim: true },
  age:     { type: Number, min: 0, max: 120 },
  gender:  { type: String, enum: ["Male", "Female", "Other"] },
  contact: { type: String, trim: true },
  address: { type: String, trim: true },
});
// index 5: every request by a patient resolves "my patient profile" with findOne({ userId });
// unique also guarantees one profile per login account
patientSchema.index({ userId: 1 }, { unique: true, name: "uniq_patient_user" });

/* ---------- appointments ---------- */
const appointmentSchema = new Schema({
  patientId:    { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId:     { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  date:         { type: Date, required: true },
  timeSlot:     { type: String, required: true, match: [HHMM, "timeSlot must be HH:MM"] },
  status:       { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },
  reason:       { type: String, trim: true, maxlength: 300 },
  createdAt:    { type: Date, default: Date.now },
});
// index 6: no two ACTIVE bookings for the same doctor, date and slot.
// Partial, so a Cancelled appointment does not block the slot.
// NOTE: because it is partial, the query planner can only use it when the query
// itself contains status: "Scheduled" (e.g. the availability lookup).
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: "Scheduled" }, name: "uniq_active_slot" }
);
// index 7: plain (non-partial) doctor + date index, so filters on doctorId alone
// (GET /appointments?doctorId=, DELETE /doctors/:id check) do not need a COLLSCAN
appointmentSchema.index({ doctorId: 1, date: 1 }, { name: "doctor_date" });
appointmentSchema.index({ patientId: 1, date: -1 });                                 // index 8
appointmentSchema.index({ departmentId: 1, date: 1 });                               // index 9
// index 10: status + date, used by GET /appointments?status=&from=&to= and by the
// $match stages of reports A2 (status: "Completed") and A7 (status: "Scheduled" + date range)
appointmentSchema.index({ status: 1, date: 1 }, { name: "status_date" });

module.exports = {
  User:        model("User", userSchema),
  Department:  model("Department", departmentSchema),
  Doctor:      model("Doctor", doctorSchema),
  Patient:     model("Patient", patientSchema),
  Appointment: model("Appointment", appointmentSchema),
};
