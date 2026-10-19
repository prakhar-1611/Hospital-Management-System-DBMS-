/* ============================================================
   records.js — converts API appointment documents into the flat
   shape the doctor and patient portals render.
   ============================================================ */
import { ymd } from "../mappers";

const idOf = (ref) => (ref && typeof ref === "object" ? ref._id : ref) || null;
const field = (ref, k) => (ref && typeof ref === "object" ? ref[k] : undefined);

export function toAppt(a) {
  return {
    id: a._id,
    date: ymd(a.date),
    time: a.timeSlot,
    status: a.status,                         // Scheduled | Completed | Cancelled
    reason: a.reason || "Consultation",
    notes: a.notes || "",
    createdAt: a.createdAt || "",
    patientId: idOf(a.patientId),
    patientName: field(a.patientId, "name") || "(deleted patient)",
    patientAge: field(a.patientId, "age"),
    patientGender: field(a.patientId, "gender"),
    patientContact: field(a.patientId, "contact"),
    doctorId: idOf(a.doctorId),
    doctorName: field(a.doctorId, "name") || "—",
    specialization: field(a.doctorId, "specialization") || "",
    deptId: idOf(a.departmentId),
    deptName: field(a.departmentId, "name") || "—",
    fee: field(a.departmentId, "consultationFee"),
  };
}

export const byDateAsc  = (a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
export const byDateDesc = (a, b) => byDateAsc(b, a);

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// "₹ 500"
export const money = (n) => (n === undefined || n === null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`);

// fields that make a patient profile "complete" (Google sign-ups start with only a name)
export const PROFILE_FIELDS = [["age", "Age"], ["gender", "Gender"], ["contact", "Phone"], ["address", "Address"], ["bloodGroup", "Blood group"], ["emergencyContact", "Emergency contact"]];
