# MedCare OS – Hospital Appointment Booking System

BCSE302P Database Systems Lab · Review 2 · Database: **MongoDB (document store)**

| Layer | Technology |
|---|---|
| Frontend (admin portal) | React 19, Vite |
| API | Node.js 18+, Express 4, JWT, bcrypt |
| ODM / Database | Mongoose 8, MongoDB Atlas (replica set, needed for transactions) |

## Team

| Name | Reg. No. | Review 2 work |
|---|---|---|
| Prakhar Tandon | 24BCI0222 | Express REST API, authentication and role-based access, aggregation queries, transactions, repository |
| Ishitwo Khanra | 24BCE2975 | Mongoose models, `$jsonSchema` validators, index design, seed data, Atlas setup |
| Amrita Bhatia | 24BCI0215 | React UI, API layer, connecting the admin screens to the backend, responsive layout |

Repository: https://github.com/prakhar-1611/Hospital-Management-System-DBMS-

## What it does

- Admin logs in to the portal (JWT) and manages doctors, patients and appointments stored in MongoDB.
- Patients book online; a "Help me choose" body map (front / back + categories) routes symptoms to all 12 departments. The admin's Walk-in registration books for walk-ins and phone patients (new or existing). Taken slots are hidden, and a double booking is rejected with HTTP 409.
- Analytics screen shows seven MongoDB aggregation pipelines.
- One sign-in page opens a different portal for each role (see below). Patients can register with email or with Google.
- **Billing, invoices and payments are front-end only** (React state, no invoices collection, lost on refresh).

## Portals

| Role | Portal | What it shows | Code |
|---|---|---|---|
| admin | **MedCare Admin Console** | Everything: dashboard, all appointments, walk-in registration, doctors (with contact details), patients, analytics, billing, settings | `src/admin/` |
| doctor | **MedCare Clinician Hub** | Today's queue, own appointments (complete / cancel / consultation notes), own patients and their history *with that doctor*, schedule and availability, practice summary | `src/doctor/` |
| patient | **MyMedCare** | Book (department → doctor → slot → reason), reschedule, cancel, print slips, read doctor's notes, doctor directory, own profile with medical details | `src/patient/` |

Access is enforced by the API, not just the screens:

- `GET /api/appointments` returns a doctor's or patient's **own** appointments only (`?doctorId` is ignored for doctors).
- `GET /api/patients` and `GET /api/patients/:id` give a doctor only the patients who booked with them; patients get 403.
- Doctors may change an appointment's status and notes only; patients may reschedule or cancel their own and never write notes.
- `GET /api/doctors` hides the doctor's login account id from non-admins. Reports stay admin-only.

New endpoints: `GET /api/auth/config`, `POST /api/auth/google`, `GET /api/auth/me`, `PUT /api/auth/password`, `GET /api/doctors/me`, `GET /api/patients/:id`. New optional fields: `appointments.notes`, `patients.bloodGroup / allergies / emergencyContact`, `users.authProvider / avatar` (run `npm run db:validators` to add them to the `$jsonSchema` validators).

### Google sign-in (patients)

The "Continue with Google" button works once the backend has a Google OAuth client ID:

1. Open https://console.cloud.google.com → create a project → **APIs & Services → OAuth consent screen** (External, add your email as a test user).
2. **Credentials → Create credentials → OAuth client ID → Web application**. Under *Authorized JavaScript origins* add `http://localhost:5173` and `http://localhost`.
3. Copy the client ID (`…apps.googleusercontent.com`) into `backend/.env` as `GOOGLE_CLIENT_ID=…` and restart the backend.

The first Google sign-in creates a patient account; later ones log the same patient in. The server verifies every Google token. Staff accounts cannot use Google.

## Database design

Five collections linked by ObjectId references. A doctor's working days and hours are embedded.

| Collection | Docs | Key fields |
|---|---|---|
| users | 191 | name, email, passwordHash, role, phone |
| departments | 12 | name, description, consultationFee |
| doctors | 40 | userId, departmentId, workingDays[], workingHours{start,end}, status |
| patients | 150 | userId, name, age, gender, contact, address |
| appointments | 400 | patientId, doctorId, departmentId, date, timeSlot, status, reason |
| **Total** | **793** | |

**Advanced MongoDB features**

- **10 secondary indexes**, including a partial unique index `uniq_active_slot` on `{doctorId, date, timeSlot}` where `status = "Scheduled"`. It blocks double booking, and cancelling a booking frees the slot.
- **7 aggregation pipelines** (`/api/reports/*`, admin only): appointments per department, top doctors, monthly trend, peak slots, cancellation rate, demographics (`$facet` + `$bucket`), upcoming load.
- **3 multi-document transactions**: patient self-registration, admin creates a patient, admin deletes a patient.
- **`$jsonSchema` validators** on all 5 collections (`strict` / `error`), so Compass and mongosh writes are checked too.
- **Authentication:** bcrypt password hashes, 8-hour JWT, three roles (patient, doctor, admin) with ownership checks.

Full index table, API list (27 endpoints), error codes and troubleshooting are in [`backend/README.md`](backend/README.md).

## Run it

**1. Backend**

```bat
cd backend
copy .env.example .env
notepad .env
npm install
npm run seed
npm start
```

Fill in `MONGO_URI` and `JWT_SECRET` in `.env`. **Never commit `.env`.** The API runs at http://localhost:5000/api.

`npm run seed` wipes the 5 collections, applies the validators, creates the indexes and loads the 793 documents. `npm run seed:check` validates the same data without a database.

**2. Frontend** (in a second terminal, from the project root)

```bat
npm install
npm run dev
```

Open the URL Vite prints. Set `VITE_API_URL` if the API is not on `http://localhost:5000/api`.

**3. Log in** (each role opens its own portal)

```
admin@medcare.com / admin123
```

Seeded doctors use password `doctor123` and seeded patients use `patient123` (the seeder prints one example email of each). Doctors open the Clinician Hub (e.g. `dr.sarah.smith@medcare.com`) and patients open MyMedCare (e.g. `thomas.iyer1@mail.com`). The sign-in page has one-click demo buttons for all three.

## Project structure

```
Hospital-Management-System-DBMS-/
├── index.html, vite.config.js, eslint.config.js, package.json
├── public/
├── src/
│   ├── App.jsx           sign-in + role router (admin / doctor / patient)
│   ├── App.css, index.css, main.jsx
│   ├── api.js            fetch + JWT, one function per endpoint
│   ├── mappers.js        converts API documents to the shapes the admin screens use
│   ├── constants.js
│   ├── admin/            MedCare Admin Console
│   ├── doctor/           MedCare Clinician Hub
│   ├── patient/          MyMedCare (booking wizard, symptom body map)
│   ├── ui/               shared design system: shell, kit, theme, icons, helpers
│   └── components/       AuthScreen, Analytics, Billing (front-end only), invoice and payment modals
└── backend/
    ├── server.js         Express app, error handler (11000 → 409, 121 → 400)
    ├── dns-override.js   optional DNS_SERVERS from .env
    ├── utils.js          slot generation, date helpers
    ├── middleware/auth.js
    ├── models/           index.js (schemas + indexes), validators.js ($jsonSchema)
    ├── routes/           auth, departments, doctors, patients, appointments, reports
    └── scripts/          seed.js, apply-validators.js
```

## Review 2 rubric mapping

| Criterion | Marks | Where |
|---|---|---|
| Database implementation (collections, relationships, sample data) | 2 | 5 collections, ObjectId references, 793 documents (`backend/scripts/seed.js`) |
| CRUD operations | 3 | 27 endpoints in `backend/routes/`, used by the admin portal |
| Advanced NoSQL features | 5 | 10 indexes, 7 aggregations, 3 transactions, `$jsonSchema` validation |

## Security note

`backend/.env` holds the Atlas connection string and JWT secret. It is listed in `.gitignore` and must stay out of the repository. If a password was ever shared in a zip or chat, reset that database user's password in Atlas.
