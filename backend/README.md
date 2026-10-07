# MedCare Backend – Hospital Appointment Booking System

BCSE302P Database Systems Lab, Review 2. Node.js 18+ / Express 4 / Mongoose 8 / MongoDB Atlas.
The full project description (data model, index usage, roles, frontend integration,
responsive UI, rubric mapping) is in the main `README.md` one folder up.

## Setup (Windows)

```bat
cd backend
copy .env.example .env
notepad .env          & rem fill in MONGO_URI and JWT_SECRET
npm install
npm run seed          & rem wipe + load 793 documents, apply validators, create indexes
npm start             & rem API on http://localhost:5000/api
```

`backend/.env` (never commit it; use placeholders in examples):

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/medcare?appName=Cluster0
JWT_SECRET=change-me
PORT=5000
# DNS_SERVERS=8.8.8.8,1.1.1.1   (optional, only for "querySrv ECONNREFUSED")
```

Transactions need a replica set. MongoDB Atlas (including the free M0 tier) is a replica set.

| Script | What it does |
|---|---|
| `npm start` | starts the API (exits with a message if MONGO_URI / JWT_SECRET are missing) |
| `npm run seed` | applies `$jsonSchema` validators, wipes the 5 collections, syncs the 10 indexes, inserts 793 documents, prints logins |
| `npm run seed:check` | no database needed: builds the same data, runs Mongoose `validateSync()` and an offline `$jsonSchema` pre-check on every document, checks for slot conflicts |
| `npm run db:validators` | applies the validators only (data untouched) |

Seed logins: `admin@medcare.com / admin123`; every doctor `/ doctor123`; every patient `/ patient123`
(the seeder prints one doctor and one patient email).

## Structure

```
backend/
  server.js               Express app, routes, error handler, Mongo connection
  dns-override.js         uses DNS_SERVERS from .env if set (otherwise system DNS)
  utils.js                generateTimeSlots (same logic as the frontend), date helpers
  middleware/auth.js      JWT sign/verify, requireAuth, requireRole()
  models/index.js         5 Mongoose schemas, validation, 10 secondary indexes
  models/validators.js    $jsonSchema validators + applyValidators() + offline checker
  routes/                 auth, departments, doctors, patients, appointments, reports
  scripts/seed.js         deterministic seeder (793 documents)
  scripts/apply-validators.js
```

## Collections and sample data

| Collection | Docs |
|---|---|
| users | 191 (1 admin, 40 doctors, 150 patients) |
| departments | 12 |
| doctors | 40 |
| patients | 150 |
| appointments | 400 (about 52% Completed, 26% Scheduled, 22% Cancelled) |
| **Total** | **793** |

## API (27 endpoints; all except register/login need `Authorization: Bearer <token>`)

| Method | Path | Role |
|---|---|---|
| POST | /api/auth/register | public (patient self-registration, transaction) |
| POST | /api/auth/login | public |
| GET | /api/departments | any |
| POST, PUT /:id, DELETE /:id | /api/departments | admin |
| GET | /api/doctors?departmentId= | any |
| GET | /api/doctors/:id/availability?date=YYYY-MM-DD | any |
| POST | /api/doctors | admin |
| PUT | /api/doctors/:id | admin (all fields), doctor (own: status, workingDays, workingHours) |
| DELETE | /api/doctors/:id | admin |
| GET | /api/patients?search= | admin, doctor |
| POST | /api/patients | admin (user + patient in one transaction; password defaults to `patient123`, email generated if blank; 409 on duplicate email) |
| GET, PUT | /api/patients/me | patient |
| DELETE | /api/patients/:id | admin (transaction) |
| POST | /api/appointments | patient (books for self); admin (must send `patientId`) |
| GET | /api/appointments?doctorId&departmentId&status&from&to | patient (own), doctor and admin (all) |
| PUT | /api/appointments/:id | patient (own, Scheduled only, no status change), doctor (own appointments), admin |
| DELETE | /api/appointments/:id | cancel: patient (own), doctor (own appointments), admin; `?hard=true` admin only |
| GET | /api/reports/{by-department, top-doctors, monthly-trend, peak-slots, cancellation-rate, demographics, upcoming-load} | admin |

Booking checks (POST and reschedule): valid doctor, not On Leave, works on that weekday, slot inside
working hours, date not in the past. Two bookings racing for the same slot: the partial unique
index rejects the second one, and the error handler turns E11000 into **409 "Slot already booked"**.

Error codes: 400 validation (Mongoose or database `$jsonSchema`, code 121), 401 token, 403 role/ownership,
404 not found, 409 duplicate.

## Indexes

| # | Collection | Index | Used by |
|---|---|---|---|
| 1 | users | `{email:1}` unique | login lookup, duplicate email → 409 |
| 2 | departments | `{name:1}` unique | unique names, sort by name |
| 3 | doctors | `{departmentId:1,status:1}` | `GET /doctors?departmentId=`, department delete check |
| 4 | doctors | `{userId:1}` unique `uniq_doctor_user` | doctor ownership check (`Doctor.findOne({userId})`) |
| 5 | patients | `{userId:1}` unique `uniq_patient_user` | `Patient.findOne({userId})` on patient requests |
| 6 | appointments | `{doctorId,date,timeSlot}` unique partial `uniq_active_slot` | double-booking guard; availability `{doctorId,date,status:"Scheduled"}` |
| 7 | appointments | `{doctorId:1,date:1}` `doctor_date` | `GET /appointments?doctorId=` (index 6 cannot be used without `status:"Scheduled"`) |
| 8 | appointments | `{patientId:1,date:-1}` | patient's own appointments, patient-delete transaction |
| 9 | appointments | `{departmentId:1,date:1}` | `GET /appointments?departmentId=` |
| 10 | appointments | `{status:1,date:1}` `status_date` | `GET /appointments?status=`, report A2 and A7 `$match` |

```js
// mongosh
use medcare
const d = db.doctors.findOne({ name: "Dr. Sarah Smith" })
db.appointments.find({ doctorId: d._id }).explain("executionStats").queryPlanner.winningPlan
// IXSCAN on doctor_date (compare: find({ reason: "Headache" }) gives COLLSCAN)
```

## Database-level validation

`models/validators.js` defines a `$jsonSchema` validator per collection (required fields, BSON
types, enums for role/status/gender, age 0–120, fee ≥ 0, workingDays 0–6, "HH:MM" slots, email
pattern). They are applied with `validationLevel: "strict"`, `validationAction: "error"`, so writes
from Compass or mongosh are rejected too. Example (mongosh):

```js
db.appointments.insertOne({ patientId: ObjectId(), doctorId: ObjectId(), departmentId: ObjectId(),
  date: new Date(), timeSlot: "9am", status: "Done" })
// MongoServerError: Document failed validation
```

## Troubleshooting

| Error | Fix |
|---|---|
| `bad auth : authentication failed` | wrong user/password in MONGO_URI; URL-encode special characters; reset the password in Atlas |
| `querySrv ECONNREFUSED` | set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env` |
| `Transaction numbers are only allowed on a replica set member` | use Atlas, or run local MongoDB as a replica set |
| `EADDRINUSE :::5000` | `netstat -ano \| findstr :5000`, `taskkill /PID <pid> /F`, or change PORT |
| IP not whitelisted | Atlas → Network Access → add current IP |

**Security:** a real Atlas password was shared in an earlier zip of this project. Reset that
database user's password in Atlas and keep the new one only in your local `backend/.env`.
