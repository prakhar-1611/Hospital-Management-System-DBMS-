/* ============================================================
   API LAYER — src/api.js
   Every screen of the admin portal gets its data through these
   functions (Express backend -> MongoDB Atlas).
   The JWT from login is kept in localStorage and sent with every request.
   Base URL: VITE_API_URL (see .env.example), default http://localhost:5000/api
   ============================================================ */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getToken = () => localStorage.getItem("token");
export const getUser  = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
};
export function logout() { localStorage.removeItem("token"); localStorage.removeItem("user"); }

// App.jsx registers a callback here so that an expired / invalid token (HTTP 401)
// logs the user out wherever it happens.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    const err = new Error("Cannot reach the API server. Is the backend running?");
    err.status = 0;
    err.network = true;               // used for the "DB offline" badge
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;          // 409 = slot already booked, 403 = not allowed
    // only the first 401 for this token logs out (parallel requests would otherwise repeat it)
    if (res.status === 401 && token && getToken() === token) { logout(); if (onUnauthorized) onUnauthorized(); }
    throw err;
  }
  return data;
}

const qs = (params = {}) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")).toString();
  return s ? `?${s}` : "";
};

function saveSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

/* ---- auth ---- */
export const login    = (email, password) => request("/auth/login", { method: "POST", body: { email, password } }).then(saveSession);
export const register = (form) => request("/auth/register", { method: "POST", body: form }).then(saveSession);

/* ---- departments ---- */
export const getDepartments   = ()         => request("/departments");
export const createDepartment = (d)        => request("/departments", { method: "POST", body: d });
export const updateDepartment = (id, d)    => request(`/departments/${id}`, { method: "PUT", body: d });
export const deleteDepartment = (id)       => request(`/departments/${id}`, { method: "DELETE" });

/* ---- doctors ---- */
export const getDoctors      = (departmentId) => request(`/doctors${qs({ departmentId })}`);
export const getAvailability = (id, date)     => request(`/doctors/${id}/availability${qs({ date })}`);
export const createDoctor    = (d)            => request("/doctors", { method: "POST", body: d });
export const updateDoctor    = (id, d)        => request(`/doctors/${id}`, { method: "PUT", body: d });
export const deleteDoctor    = (id)           => request(`/doctors/${id}`, { method: "DELETE" });

/* ---- patients ---- */
export const getPatients   = (search) => request(`/patients${qs({ search })}`);
export const createPatient = (p)      => request("/patients", { method: "POST", body: p });        // admin
export const getMyProfile  = ()       => request("/patients/me");
export const updateProfile = (p)      => request("/patients/me", { method: "PUT", body: p });
export const deletePatient = (id)     => request(`/patients/${id}`, { method: "DELETE" });          // admin

/* ---- appointments ---- */
// filters: { doctorId, departmentId, status, from, to }
export const getAppointments   = (filters) => request(`/appointments${qs(filters)}`);
// patient: { doctorId, date, timeSlot, reason }   admin: same + patientId
export const bookAppointment   = (a)       => request("/appointments", { method: "POST", body: a });
export const updateAppointment = (id, a)   => request(`/appointments/${id}`, { method: "PUT", body: a });
export const cancelAppointment = (id)      => request(`/appointments/${id}`, { method: "DELETE" });

/* ---- reports (admin) — aggregation pipelines A1 to A7 ---- */
export const getReport            = (name) => request(`/reports/${name}`);
export const getByDepartment      = () => getReport("by-department");      // A1
export const getTopDoctors        = () => getReport("top-doctors");        // A2
export const getMonthlyTrend      = () => getReport("monthly-trend");      // A3
export const getPeakSlots         = () => getReport("peak-slots");         // A4
export const getCancellationRate  = () => getReport("cancellation-rate");  // A5
export const getDemographics      = () => getReport("demographics");       // A6
export const getUpcomingLoad      = () => getReport("upcoming-load");      // A7
