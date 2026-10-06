// Deterministic seeder: 1 admin, 12 departments, 40 doctors, 150 patients, 400 appointments
// (191 users, 793 documents in total).
//   npm run seed         -> wipes and loads the database in MONGO_URI
//   npm run seed:check   -> builds the same data without a database, runs validateSync()
//                           on every document and checks for slot conflicts
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User, Department, Doctor, Patient, Appointment } = require("../models");
const { generateTimeSlots, today } = require("../utils");

const DRY = process.argv.includes("--dry-run");
const oid = () => new mongoose.Types.ObjectId();
const DAY = 24 * 3600 * 1000;

// seeded pseudo-random generator (mulberry32) so every run gives the same data
let seed = 302;
function rand() {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));

/* ---------- departments: 7 from the frontend fee table + 5 more ---------- */
const DEPTS = [
  ["Cardiology", "Heart and cardiovascular care", 300, ["Interventional Cardiology", "Electrophysiology", "Heart Failure"]],
  ["Neurology", "Brain, spine and nerve disorders", 280, ["Stroke Medicine", "Epilepsy", "Neuromuscular Disorders"]],
  ["Orthopedics", "Bones, joints and muscles", 260, ["Joint Replacement", "Sports Medicine", "Spine Surgery"]],
  ["General", "General medicine and first consultation", 150, ["Internal Medicine", "Family Medicine"]],
  ["Gastroenterology", "Digestive system and liver", 240, ["Hepatology", "Endoscopy"]],
  ["Surgery", "General and laparoscopic surgery", 320, ["Laparoscopic Surgery", "Trauma Surgery"]],
  ["Pediatrics", "Care for infants and children", 180, ["Neonatology", "Child Development"]],
  ["Dermatology", "Skin, hair and nail conditions", 200, ["Cosmetic Dermatology", "Clinical Dermatology"]],
  ["ENT", "Ear, nose and throat", 210, ["Otology", "Rhinology"]],
  ["Ophthalmology", "Eye care and vision", 220, ["Cataract Surgery", "Retina"]],
  ["Psychiatry", "Mental health and counselling", 250, ["Adult Psychiatry", "Child Psychiatry"]],
  ["Oncology", "Cancer diagnosis and treatment", 350, ["Medical Oncology", "Radiation Oncology"]],
];

/* ---------- doctors: the 8 from the frontend first, then 32 generated ---------- */
const FRONTEND_DOCTORS = [
  ["Dr. Sarah Smith", "Cardiology", "Available", [1, 2, 3, 4, 5], ["09:00", "17:00"]],
  ["Dr. James Wilson", "Neurology", "Busy", [1, 3, 5], ["10:00", "16:00"]],
  ["Dr. Emily Davis", "Orthopedics", "Available", [1, 2, 3, 4, 5], ["08:00", "15:00"]],
  ["Dr. Michael Brown", "General", "On Leave", [2, 4], ["11:00", "18:00"]],
  ["Dr. Lisa Wong", "Gastroenterology", "Available", [1, 2, 3, 4, 5], ["09:00", "17:00"]],
  ["Dr. Robert Stark", "Surgery", "Busy", [1, 2, 3, 4], ["07:00", "14:00"]],
  ["Dr. Maria Garcia", "Pediatrics", "Available", [1, 2, 3, 4, 5], ["09:00", "17:00"]],
  ["Dr. Alan Grant", "General", "Available", [2, 3, 4, 5, 6], ["10:00", "18:00"]],
];
const DAY_SETS = [[1, 2, 3, 4, 5], [1, 3, 5], [2, 4], [1, 2, 3, 4], [2, 3, 4, 5, 6]];
const HOURS = [["09:00", "17:00"], ["10:00", "16:00"], ["08:00", "15:00"], ["11:00", "18:00"], ["07:00", "14:00"], ["10:00", "18:00"]];

const FIRST = ["Aarav", "Vivaan", "Aditya", "Arjun", "Rohan", "Karan", "Rahul", "Vikram", "Sanjay", "Nikhil",
  "Ananya", "Diya", "Priya", "Sneha", "Kavya", "Meera", "Isha", "Pooja", "Riya", "Neha",
  "John", "David", "Daniel", "Thomas", "Grace", "Sophia", "Emma", "Olivia", "Lakshmi", "Suresh"];
const LAST = ["Sharma", "Verma", "Iyer", "Reddy", "Nair", "Menon", "Gupta", "Patel", "Rao", "Khan",
  "Das", "Singh", "Joshi", "Pillai", "Mehta", "Kumar", "Bose", "Fernandes", "Thomas", "Chatterjee"];
const FEMALE = new Set(["Ananya", "Diya", "Priya", "Sneha", "Kavya", "Meera", "Isha", "Pooja", "Riya", "Neha",
  "Grace", "Sophia", "Emma", "Olivia", "Lakshmi"]);
const STREETS = ["Katpadi Road", "Gandhi Road", "Officers Line", "Sathuvachari", "Gandhi Nagar",
  "Bagayam", "Arcot Road", "Thottapalayam", "Kosapet", "Sainathapuram"];
const REASONS = ["Routine check-up", "Follow-up visit", "Fever and cough", "Chest pain", "Headache",
  "Back pain", "Skin rash", "Stomach ache", "Blood pressure review", "Joint pain",
  "Vision problem", "Ear pain", "Vaccination", "Report review", "Breathing difficulty"];

async function build() {
  const PW = { admin: "admin123", doctor: "doctor123", patient: "patient123" };
  const hash = {};
  for (const [role, pw] of Object.entries(PW)) hash[role] = await bcrypt.hash(pw, 10);
  const now = new Date();
  const users = [], departments = [], doctors = [], patients = [], appointments = [];
  const emails = new Set();
  const uniqueEmail = (base, domain) => {
    let e = `${base}@${domain}`, i = 2;
    while (emails.has(e)) e = `${base}${i++}@${domain}`;
    emails.add(e); return e;
  };

  // admin
  users.push({ _id: oid(), name: "Hospital Admin", email: uniqueEmail("admin", "medcare.com"),
    passwordHash: hash.admin, role: "admin", phone: "+91-9000000000", createdAt: now });

  // departments
  const deptByName = {};
  for (const [name, description, consultationFee, specs] of DEPTS) {
    const d = { _id: oid(), name, description, consultationFee };
    departments.push(d); deptByName[name] = { ...d, specs };
  }

  // doctors
  const addDoctor = (name, deptName, status, workingDays, [start, end]) => {
    const u = { _id: oid(), name, role: "doctor", passwordHash: hash.doctor, createdAt: now,
      email: uniqueEmail(name.replace("Dr. ", "dr.").toLowerCase().replace(/\s+/g, "."), "medcare.com"),
      phone: `+91-9${int(100000000, 999999999)}` };
    users.push(u);
    const dep = deptByName[deptName];
    doctors.push({ _id: oid(), userId: u._id, name, departmentId: dep._id,
      specialization: pickOne(dep.specs), workingDays, workingHours: { start, end }, status });
  };
  for (const d of FRONTEND_DOCTORS) addDoctor(...d);
  for (let i = 0; i < 32; i++) {
    const r = rand();
    const status = r < 0.7 ? "Available" : r < 0.9 ? "Busy" : "On Leave";
    addDoctor(`Dr. ${pickOne(FIRST)} ${pickOne(LAST)}`, DEPTS[i % DEPTS.length][0],
      status, pickOne(DAY_SETS), pickOne(HOURS));
  }

  // patients (each with a login account)
  for (let i = 1; i <= 150; i++) {
    const first = pickOne(FIRST), last = pickOne(LAST), name = `${first} ${last}`;
    const phone = `+91-${int(6, 9)}${int(100000000, 999999999)}`;
    const u = { _id: oid(), name, role: "patient", passwordHash: hash.patient, phone,
      email: uniqueEmail(`${first}.${last}${i}`.toLowerCase(), "mail.com"),
      createdAt: new Date(now.getTime() - int(80, 400) * DAY) };
    users.push(u);
    const gr = rand();
    patients.push({ _id: oid(), userId: u._id, name, age: int(1, 90),
      gender: gr < 0.03 ? "Other" : FEMALE.has(first) ? "Female" : "Male",
      contact: phone, address: `${int(1, 200)} ${pickOne(STREETS)}, Vellore` });
  }

  // appointments: 75 days in the past to 30 days ahead, no repeated (doctor, date, slot)
  const t0 = today();
  const used = new Set();
  while (appointments.length < 400) {
    const doc = pickOne(doctors);
    const offset = int(-75, 30);
    const date = new Date(t0.getTime() + offset * DAY);
    if (!doc.workingDays.includes(date.getUTCDay())) continue;
    if (offset >= 0 && doc.status === "On Leave") continue;   // no future bookings for doctors on leave
    const timeSlot = pickOne(generateTimeSlots(doc.workingHours.start, doc.workingHours.end));
    const key = `${doc._id}|${date.toISOString()}|${timeSlot}`;
    if (used.has(key)) continue;
    used.add(key);
    const status = offset < 0 ? (rand() < 0.3 ? "Cancelled" : "Completed")
                              : (rand() < 0.1 ? "Cancelled" : "Scheduled");
    const createdAt = new Date(Math.min(date.getTime() - int(1, 10) * DAY, now.getTime()));
    appointments.push({ _id: oid(), patientId: pickOne(patients)._id, doctorId: doc._id,
      departmentId: doc.departmentId, date, timeSlot, status, reason: pickOne(REASONS), createdAt });
  }
  return { users, departments, doctors, patients, appointments };
}

function check(data) {
  const pairs = [[User, data.users], [Department, data.departments], [Doctor, data.doctors],
                 [Patient, data.patients], [Appointment, data.appointments]];
  let errors = 0, total = 0;
  for (const [M, docs] of pairs) {
    for (const d of docs) {
      const err = new M(d).validateSync();
      if (err) { errors++; console.log(M.modelName, err.message); }
    }
    total += docs.length;
    console.log(`${M.modelName.padEnd(12)} ${docs.length}`);
  }
  const seen = new Set(); let conflicts = 0;
  for (const a of data.appointments.filter(a => a.status === "Scheduled")) {
    const k = `${a.doctorId}|${a.date.toISOString()}|${a.timeSlot}`;
    if (seen.has(k)) conflicts++; seen.add(k);
  }
  const by = {};
  for (const a of data.appointments) by[a.status] = (by[a.status] || 0) + 1;
  console.log(`Total        ${total}`);
  console.log("Status split", Object.entries(by).map(([k, v]) => `${k} ${v} (${Math.round(v / 4)}%)`).join(", "));
  console.log(`Validation errors: ${errors}, slot conflicts: ${conflicts}`);
  return errors === 0 && conflicts === 0;
}

(async () => {
  const data = await build();
  if (DRY) { process.exit(check(data) ? 0 : 1); }

  if (!process.env.MONGO_URI) { console.error("MONGO_URI missing in backend/.env"); process.exit(1); }
  await mongoose.connect(process.env.MONGO_URI);
  const models = [User, Department, Doctor, Patient, Appointment];
  for (const M of models) await M.deleteMany({});
  for (const M of models) await M.syncIndexes();          // creates the 5 indexes
  await Department.insertMany(data.departments);
  await User.insertMany(data.users);
  await Doctor.insertMany(data.doctors);
  await Patient.insertMany(data.patients);
  await Appointment.insertMany(data.appointments);
  for (const M of models) console.log(`${M.modelName.padEnd(12)} ${await M.countDocuments()}`);
  console.log("\nLogins: admin@medcare.com / admin123");
  console.log(`        ${data.users.find(u => u.role === "doctor").email} / doctor123 (all doctors)`);
  console.log(`        ${data.users.find(u => u.role === "patient").email} / patient123 (all patients)`);
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
