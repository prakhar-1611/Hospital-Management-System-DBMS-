# MedCare Backend – Hospital Appointment Booking System

BCSE302P Database Systems Lab, Review 2. Node.js / Express / Mongoose / MongoDB.

## Setup

```bash
cd backend
npm install
```

Create a file `backend/.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/medcare
JWT_SECRET=any-long-random-string
PORT=5000
```

Transactions (register, delete patient) need a replica set. MongoDB Atlas has one by default.

```bash
npm run seed        # wipes and loads 793 documents, creates the indexes
npm start           # API on http://localhost:5000/api
npm run seed:check  # optional: validates the seed data without a database
```

Seed logins: `admin@medcare.com / admin123`, every doctor `/ doctor123`, every patient `/ patient123`
(the seed script prints one doctor and one patient email).

## Structure

```
backend/
  server.js           Express app, routes, error handler (E11000 -> 409), Mongo connection
  models/index.js     5 Mongoose schemas, validation, 5 indexes
  middleware/auth.js  JWT sign/verify, requireAuth, requireRole()
  routes/             auth, departments, doctors, patients, appointments, reports
  scripts/seed.js     deterministic seeder (793 documents)
  utils.js            generateTimeSlots (same logic as the frontend), date helpers
```

## Collections and sample data

| Collection   | Docs |
|--------------|------|
| users        | 191 (1 admin, 40 doctors, 150 patients) |
| departments  | 12  |
| doctors      | 40  |
| patients     | 150 |
| appointments | 400 |
| **Total**    | **793** |

## API (all routes except register and login need `Authorization: Bearer <token>`)

| Method | Path | Role |
|---|---|---|
| POST | /api/auth/register | public (patient, transaction) |
| POST | /api/auth/login | public |
| GET | /api/departments | any |
| POST, PUT /:id, DELETE /:id | /api/departments | admin |
| GET | /api/doctors?departmentId= | any |
| GET | /api/doctors/:id/availability?date=YYYY-MM-DD | any |
| POST | /api/doctors | admin |
| PUT | /api/doctors/:id | admin, doctor (own) |
| DELETE | /api/doctors/:id | admin |
| GET | /api/patients?search= | admin, doctor |
| GET, PUT | /api/patients/me | patient |
| DELETE | /api/patients/:id | admin (transaction) |
| POST | /api/appointments | patient |
| GET | /api/appointments?doctorId&departmentId&status&from&to | patient (own), doctor, admin |
| PUT | /api/appointments/:id | patient (own), doctor, admin |
| DELETE | /api/appointments/:id | cancel; admin can add `?hard=true` |
| GET | /api/reports/{by-department, top-doctors, monthly-trend, peak-slots, cancellation-rate, demographics, upcoming-load} | admin |

## Indexes

1. users `{ email: 1 }` unique
2. appointments `{ doctorId: 1, date: 1, timeSlot: 1 }` unique, partial (`status: "Scheduled"`)
3. doctors `{ departmentId: 1, status: 1 }`
4. appointments `{ patientId: 1, date: -1 }`
5. appointments `{ departmentId: 1, date: 1 }`

Check index use in mongosh:

```js
db.appointments.find({ doctorId: ObjectId("..."), date: ISODate("2026-09-14"), status: "Scheduled" })
  .explain("executionStats")   // winningPlan should show IXSCAN
```
