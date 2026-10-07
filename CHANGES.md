# MedCare OS – Review 1 to Review 2 Changes

BCSE302P – Database Systems Lab  
Project: Hospital Appointment Booking System

## Purpose

This document records the intentional changes made while implementing the Review 1 design as the working Review 2 system.

---

## 1. Appointment Slot Index

### Review 1 design

A unique index was planned on:

```javascript
{ doctorId: 1, date: 1, timeSlot: 1 }
```

### Review 2 implementation

The index is now a **partial unique index** that applies only when:

```text
status = "Scheduled"
```

### Reason

A plain unique index would cause a cancelled appointment to permanently block that doctor/date/time slot.

The partial unique index allows a cancelled booking to free the slot while retaining the cancelled appointment as history for reporting.

---

## 2. Doctor Busy Slots

### Review 1 design

Busy slots were kept embedded inside the Doctor document.

### Review 2 implementation

The embedded `busySlots` data was removed.

Doctor availability is calculated from the `Appointments` collection.

### Reason

The appointment collection is the single source of truth. Keeping both embedded busy slots and appointments could cause the two representations to become inconsistent.

---

## 3. Index Design

### Review 1 design

Two indexes were originally planned.

### Review 2 implementation

The database now has **10 secondary indexes** in addition to MongoDB's default `_id` index.

Important indexes include:

```text
users:
  { email: 1 } unique

departments:
  { name: 1 } unique

doctors:
  { departmentId: 1, status: 1 }
  { userId: 1 } unique

patients:
  { userId: 1 } unique

appointments:
  { doctorId: 1, date: 1, timeSlot: 1 } unique + partial
  { doctorId: 1, date: 1 }
  { patientId: 1, date: -1 }
  { departmentId: 1, date: 1 }
  { status: 1, date: 1 }
```

### Reason

Additional indexes support:

- Patient appointment lookup
- Doctor appointment lookup
- Department filtering
- Status/date filtering
- Doctor ownership checks
- Admin filters
- Report queries
- Duplicate email and department prevention
- Double-booking protection

The partial unique index cannot serve queries that omit the `Scheduled` condition, so the separate `doctorId + date` index is also required.

---

## 4. Appointment Cancellation and Deletion

### Review 1 design

Cancel and delete behavior was not fully specified.

### Review 2 implementation

Cancellation is implemented as a **soft delete**:

```text
status = "Cancelled"
```

Only an administrator can perform a hard delete.

### Reason

Keeping cancelled appointments preserves historical information required for:

- Cancellation-rate reports
- Monthly trends
- Appointment history
- Analytics

---

## 5. Patient Registration

### Review 1 design

Patient registration was described as a single operation.

### Review 2 implementation

Registration creates:

1. A User document
2. A Patient document

inside one MongoDB transaction.

### Reason

If the second operation fails, the first operation is rolled back. This prevents a User account from existing without its corresponding Patient profile.

---

## 6. Admin Patient Creation

Admin patient creation also uses a multi-document transaction.

The transaction creates the User and Patient records together.

The default patient password is:

```text
patient123
```

when a password is not otherwise supplied.

### Reason

The User login account and Patient profile must remain consistent.

---

## 7. Admin Patient Deletion

Deleting a patient is implemented as a transaction.

The transaction:

1. Deletes the Patient document.
2. Deletes the associated User document.
3. Cancels the patient's scheduled appointments.

### Reason

This prevents the deleted patient's future appointments from continuing to block doctor slots and keeps the related User and Patient records consistent.

---

## 8. Sample Data

### Review 1 requirement

The project required a meaningful amount of sample data for database demonstration.

### Review 2 implementation

The deterministic seed script creates:

| Collection | Documents |
|---|---:|
| Users | 191 |
| Departments | 12 |
| Doctors | 40 |
| Patients | 150 |
| Appointments | 400 |
| **Total** | **793** |

The Departments collection intentionally contains 12 documents because a hospital has a relatively small number of departments, while the larger collections contain substantially more sample records.

The seed script also creates appointments across historical and upcoming dates and avoids duplicate active doctor/date/time-slot combinations.

---

## 9. Database-Level Validation

Review 2 adds `$jsonSchema` validation to all five collections.

Validation is configured with:

```text
validationLevel: "strict"
validationAction: "error"
```

The validators enforce rules such as:

- Required fields
- BSON types
- Valid roles
- Valid appointment statuses
- Valid gender values
- Age range
- Consultation fee range
- Working-day values
- `HH:MM` time slots
- Email format

This means invalid documents are rejected not only through the API/Mongoose layer, but also when data is inserted directly through MongoDB tools such as Compass or `mongosh`.

---

## 10. Review 2 Backend and Frontend Integration

The Review 2 implementation connects the React admin portal to the Express/MongoDB backend.

The frontend now uses:

```text
src/api.js
```

for API requests and:

```text
src/mappers.js
```

to convert API documents into the shapes expected by the existing React components.

The connected admin features include:

- JWT login
- Doctor data
- Department data
- Patient data
- Appointment data
- Admission and appointment booking
- Doctor status updates
- Analytics reports
- Loading/error states
- MongoDB connection status

Billing, invoices and payments remain frontend-only and are not represented by an invoices MongoDB collection.

---

## Summary

The main Review 2 changes were:

1. Partial unique index for active appointment slots
2. Removal of embedded doctor busy slots
3. Expansion from 2 planned indexes to 10 secondary indexes
4. Soft cancellation with admin-only hard deletion
5. Multi-document patient registration transaction
6. Transactional admin patient creation
7. Transactional patient deletion and appointment cancellation
8. 793 deterministic sample documents
9. `$jsonSchema` validation on all five collections
10. React admin portal connected to the MongoDB-backed API

These changes implement the Review 1 design as a working MongoDB-backed Review 2 system while preserving the intended hospital appointment workflow.
