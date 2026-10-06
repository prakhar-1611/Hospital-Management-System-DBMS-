/* ============================================================
   API LAYER — src/api.js
   Calls the Express backend. The JWT from login/register is kept
   in localStorage and sent with every request.
   Screens are not wired to these functions yet (planned for Review 3).
   ============================================================ */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getToken = () => localStorage.getItem("token");
export const getUser  = () => JSON.parse(localStorage.getItem("user") || "null");
export function logout() { localStorage.removeItem("token"); localStorage.removeItem("user"); }

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;          // 409 = slot already booked, 403 = not allowed
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
export const getMyProfile  = ()       => request("/patients/me");
export const updateProfile = (p)      => request("/patients/me", { method: "PUT", body: p });
export const deletePatient = (id)     => request(`/patients/${id}`, { method: "DELETE" });

/* ---- appointments ---- */
// filters: { doctorId, departmentId, status, from, to }
export const getAppointments   = (filters) => request(`/appointments${qs(filters)}`);
export const bookAppointment   = (a)       => request("/appointments", { method: "POST", body: a });
export const updateAppointment = (id, a)   => request(`/appointments/${id}`, { method: "PUT", body: a });
export const cancelAppointment = (id)      => request(`/appointments/${id}`, { method: "DELETE" });

/* ---- reports (admin) ---- */
// name: by-department | top-doctors | monthly-trend | peak-slots | cancellation-rate | demographics | upcoming-load
export const getReport = (name) => request(`/reports/${name}`);
