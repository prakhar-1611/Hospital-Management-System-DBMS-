# MedCare OS – Review 2 Demonstration Guide

BCSE302P – Database Systems Lab  
Project: Hospital Appointment Booking System  
Database: MongoDB

## Purpose

This document is the live demonstration script for Review 2. It follows the demonstration plan in the Review 2 report and covers database implementation, CRUD, authentication, validation, indexing, aggregation, transactions, appointment conflict protection, and frontend integration.

---

## Prerequisites

- MongoDB Atlas cluster available
- Node.js installed
- Project cloned/downloaded
- `backend/.env` created from `.env.example`
- `MONGO_URI` and `JWT_SECRET` configured in `backend/.env`
- Never commit `backend/.env`

---

## 1. Seed the Database

Open a terminal in `backend/`:

```bat
cd backend
npm install
npm run seed
```

### Expected result

The seed script should create:

- Users: 191
- Departments: 12
- Doctors: 40
- Patients: 150
- Appointments: 400
- Total documents: 793

The seed process also applies the `$jsonSchema` validators and creates/synchronizes the indexes.

**Screenshot: Fig. A**

Capture the terminal showing the document counts, validator application, and printed example logins.

---

## 2. Verify Collections, Indexes and Validation in MongoDB Atlas / Compass

Open the `medcare` database and verify the five collections:

```text
users
departments
doctors
patients
appointments
```

Open the `appointments` collection.

Verify the indexes, including:

- `uniq_active_slot`
- `doctor_date`
- `patientId_1_date_-1`
- `departmentId_1_date_1`
- `status_date`

The `uniq_active_slot` index should be unique and partial, applying to appointments whose status is `Scheduled`.

Open the Validation tab and verify that `$jsonSchema` validation is applied.

### Invalid document test

Attempt an invalid appointment such as:

```javascript
db.appointments.insertOne({
  patientId: ObjectId(),
  doctorId: ObjectId(),
  departmentId: ObjectId(),
  date: new Date(),
  timeSlot: "9am",
  status: "Done"
})
```

### Expected result

MongoDB rejects the document with:

```text
Document failed validation
```

**Screenshot: Fig. B**

Capture the collections, appointment indexes, validation rules, and rejected invalid insert.

---

## 3. Patient Registration and Login

Use Thunder Client, Postman, or another API client.

Register a patient through:

```http
POST /api/auth/register
```

### Expected result

- HTTP `201`
- A JWT token is returned
- A User document and Patient document are created together

Then test login:

```http
POST /api/auth/login
```

Test once with the correct password and once with an incorrect password.

### Expected result

Correct credentials:

```text
200
```

Incorrect password:

```text
401
```

**Screenshot: Fig. C**

Capture the successful registration/login and the failed login response.

---

## 4. Book an Appointment

Using a patient JWT, call:

```http
POST /api/appointments
```

Provide a valid:

- `doctorId`
- future `date`
- available `timeSlot`
- `reason`

### Expected result

```text
201 Created
```

Then call:

```http
GET /api/appointments
```

### Expected result

The patient can see their own appointment.

**Screenshot: Fig. D**

Capture the successful booking and the patient's appointment list.

---

## 5. Demonstrate Double-Booking Protection

Use another patient account and attempt to book the **same doctor, date and time slot**.

```http
POST /api/appointments
```

### Expected result

```text
409 Conflict
```

with an error indicating that the slot is already booked.

This demonstrates the partial unique index:

```text
{ doctorId: 1, date: 1, timeSlot: 1 }
```

for scheduled appointments.

**Screenshot: Fig. E**

Capture the rejected second booking.

---

## 6. Cancel and Rebook the Slot

Cancel the existing appointment:

```http
DELETE /api/appointments/:id
```

### Expected result

The appointment becomes:

```text
Cancelled
```

The slot is now available again because the unique index only applies to scheduled appointments.

Book the same doctor/date/time slot with the second patient.

### Expected result

```text
201 Created
```

**Screenshot: Fig. F**

Capture the cancellation and successful reuse of the slot.

---

## 7. Demonstrate Role-Based Access

Call an admin-only report using a patient JWT:

```http
GET /api/reports/by-department
```

### Expected result

```text
403 Forbidden
```

Repeat with an admin JWT.

### Expected result

```text
200 OK
```

with aggregation results.

**Screenshot: Fig. G**

Capture both responses.

---

## 8. Demonstrate Aggregation Pipelines and Index Usage

The API provides seven report pipelines:

```text
/api/reports/by-department
/api/reports/top-doctors
/api/reports/monthly-trend
/api/reports/peak-slots
/api/reports/cancellation-rate
/api/reports/demographics
/api/reports/upcoming-load
```

These correspond to aggregation pipelines A1–A7.

### Index demonstration

In `mongosh`:

```javascript
use medcare

const d = db.doctors.findOne({ name: "Dr. Sarah Smith" })

db.appointments
  .find({ doctorId: d._id })
  .explain("executionStats")
  .queryPlanner.winningPlan
```

### Expected result

The winning plan should show:

```text
IXSCAN
```

with the expected doctor/date index.

For contrast:

```javascript
db.appointments
  .find({ reason: "Headache" })
  .explain("executionStats")
  .queryPlanner.winningPlan
```

This query has no supporting `reason` index and is expected to show:

```text
COLLSCAN
```

**Screenshot: Fig. H**

Capture the aggregation results and the `IXSCAN` / `COLLSCAN` comparison.

---

## 9. Demonstrate the Admin Portal

Start the backend:

```bat
cd backend
npm start
```

In a second terminal from the project root:

```bat
npm install
npm run dev
```

Open the Vite URL.

### Admin login

```text
Email: admin@medcare.com
Password: admin123
```

Verify:

- MongoDB connection status badge
- Dashboard data
- Doctor list and status updates
- Patient data
- Admission and appointment booking
- Analytics A1–A7
- Loading/error states

Resize the browser to approximately `360px` width.

Verify:

- Sidebar becomes a drawer
- Header wraps
- Tables scroll horizontally
- Responsive layout remains usable

**Screenshot: Fig. I (optional)**

Capture the admin portal at desktop width and the responsive mobile layout.

---

## Expected Review 2 Evidence

The demonstration should show:

| Area | Evidence |
|---|---|
| Database | 5 collections, 793 documents |
| CRUD | REST API operations |
| Authentication | bcrypt + JWT |
| Authorization | Patient/Doctor/Admin roles |
| Validation | `$jsonSchema` rejection |
| Indexing | 10 secondary indexes |
| Double booking | HTTP 409 |
| Aggregation | A1–A7 |
| Transactions | Registration / patient creation / patient deletion |
| Frontend | React admin portal connected to API |
| Responsive UI | Drawer and responsive tables |

---

## Demo Credentials

Admin:

```text
admin@medcare.com
admin123
```

Seeded doctor accounts use:

```text
doctor123
```

Seeded patient accounts use:

```text
patient123
```

The seeder prints example doctor and patient emails.

---

## Important Security Note

Never commit `backend/.env`.

If a database password has ever been exposed in a zip file, chat, screenshot, or repository, reset that database user's password in MongoDB Atlas and update the local `.env`.
