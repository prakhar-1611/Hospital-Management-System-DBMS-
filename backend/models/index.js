const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ---------- users ---------- */
const userSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true,
                  match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"] },          // index 1
  passwordHash: { type: String, required: true, select: false },
  role:         { type: String, enum: ["patient", "doctor", "admin"], required: true },
  phone:        { type: String, trim: true },
  createdAt:    { type: Date, default: Date.now },
});
// never send the hash back to the client
userSchema.set("toJSON", { transform: (_d, r) => { delete r.passwordHash; delete r.__v; return r; } });

/* ---------- departments ---------- */
const departmentSchema = new Schema({
  name:            { type: String, required: true, unique: true, trim: true },
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

/* ---------- patients ---------- */
const patientSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
  name:    { type: String, required: true, trim: true },
  age:     { type: Number, min: 0, max: 120 },
  gender:  { type: String, enum: ["Male", "Female", "Other"] },
  contact: { type: String, trim: true },
  address: { type: String, trim: true },
});

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
// index 2: no two ACTIVE bookings for the same doctor, date and slot.
// Partial, so a Cancelled appointment does not block the slot.
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: "Scheduled" }, name: "uniq_active_slot" }
);
appointmentSchema.index({ patientId: 1, date: -1 });                                 // index 4
appointmentSchema.index({ departmentId: 1, date: 1 });                               // index 5

module.exports = {
  User:        model("User", userSchema),
  Department:  model("Department", departmentSchema),
  Doctor:      model("Doctor", doctorSchema),
  Patient:     model("Patient", patientSchema),
  Appointment: model("Appointment", appointmentSchema),
};
