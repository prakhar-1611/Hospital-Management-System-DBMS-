// Aggregation pipelines A1 - A7 (admin only). Used for the analytics dashboard.
const r = require("express").Router();
const { Appointment, Patient } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { today } = require("../utils");

r.use(requireAuth, requireRole("admin"));

const run = (fn) => async (q, res, next) => { try { res.json(await fn(q)); } catch (e) { next(e); } };

// A1 - appointments per department, split by status
r.get("/by-department", run(() => Appointment.aggregate([
  { $group: { _id: { dept: "$departmentId", status: "$status" }, n: { $sum: 1 } } },
  { $group: { _id: "$_id.dept", total: { $sum: "$n" },
              byStatus: { $push: { status: "$_id.status", n: "$n" } } } },
  { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
  { $unwind: "$dept" },
  { $project: { _id: 0, department: "$dept.name", total: 1, byStatus: 1 } },
  { $sort: { total: -1 } },
])));

// A2 - top 5 doctors by completed consultations, with estimated consultation value
r.get("/top-doctors", run(() => Appointment.aggregate([
  { $match: { status: "Completed" } },
  { $group: { _id: "$doctorId", completed: { $sum: 1 } } },
  { $sort: { completed: -1 } },
  { $limit: 5 },
  { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "d" } },
  { $unwind: "$d" },
  { $lookup: { from: "departments", localField: "d.departmentId", foreignField: "_id", as: "dep" } },
  { $unwind: "$dep" },
  { $project: { _id: 0, doctor: "$d.name", department: "$dep.name", completed: 1,
                consultationValue: { $multiply: ["$completed", "$dep.consultationFee"] } } },
])));

// A3 - monthly bookings and cancellations
r.get("/monthly-trend", run(() => Appointment.aggregate([
  { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
              total: { $sum: 1 },
              cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } } } },
  { $project: { _id: 0, month: "$_id", total: 1, cancelled: 1 } },
  { $sort: { month: 1 } },
])));

// A4 - busiest time slots (cancelled ones not counted)
r.get("/peak-slots", run(() => Appointment.aggregate([
  { $match: { status: { $ne: "Cancelled" } } },
  { $group: { _id: "$timeSlot", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 },
  { $project: { _id: 0, timeSlot: "$_id", count: 1 } },
])));

// A5 - cancellation rate per doctor (at least 5 bookings)
r.get("/cancellation-rate", run(() => Appointment.aggregate([
  { $group: { _id: "$doctorId", total: { $sum: 1 },
      cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } } } },
  { $match: { total: { $gte: 5 } } },
  { $addFields: { ratePct: { $round: [{ $multiply: [{ $divide: ["$cancelled", "$total"] }, 100] }, 1] } } },
  { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "d" } },
  { $unwind: "$d" },
  { $project: { _id: 0, doctor: "$d.name", total: 1, cancelled: 1, ratePct: 1 } },
  { $sort: { ratePct: -1 } },
  { $limit: 10 },
])));

// A6 - patient demographics using $facet
r.get("/demographics", run(() => Patient.aggregate([{ $facet: {
  ageBands: [{ $bucket: { groupBy: "$age", boundaries: [0, 18, 36, 51, 66, 121],
               default: "unknown", output: { count: { $sum: 1 } } } }],
  gender:   [{ $group: { _id: "$gender", count: { $sum: 1 } } }],
} }])));

// A7 - scheduled load per doctor for the next 7 days
r.get("/upcoming-load", run(() => {
  const from = today();
  const to = new Date(from.getTime() + 7 * 24 * 3600 * 1000);
  return Appointment.aggregate([
    { $match: { status: "Scheduled", date: { $gte: from, $lt: to } } },
    { $group: { _id: "$doctorId", scheduled: { $sum: 1 } } },
    { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "d" } },
    { $unwind: "$d" },
    { $project: { _id: 0, doctor: "$d.name", scheduled: 1 } },
    { $sort: { scheduled: -1 } },
  ]);
}));

module.exports = r;
