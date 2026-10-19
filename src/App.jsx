/* ============================================================
   App.jsx — session + role router.
   Not logged in  -> AuthScreen (sign in / register / Google)
   role admin     -> AdminApp   ("MedCare Admin Console")
   role doctor    -> DoctorApp  ("MedCare Clinician Hub")
   role patient   -> PatientApp ("MyMedCare")
   The server enforces the same split: every API route checks the role
   in the JWT, so a portal can only load the data its role may see.
   ============================================================ */
import { useState, useEffect, useCallback } from "react";
import "./App.css";
import * as api from "./api";
import AuthScreen from "./components/AuthScreen";
import AdminApp from "./admin/AdminApp";
import DoctorApp from "./doctor/DoctorApp";
import PatientApp from "./patient/PatientApp";

const ROLES = ["admin", "doctor", "patient"];

export default function App() {
  const [user, setUser] = useState(() => {
    const u = api.getToken() ? api.getUser() : null;
    return u && ROLES.includes(u.role) ? u : null;
  });
  const [notice, setNotice] = useState("");

  const logout = useCallback((message = "") => {
    api.logout();
    setNotice(message);
    setUser(null);
  }, []);

  // a 401 anywhere (expired / invalid token) returns to the sign-in page
  useEffect(() => {
    api.setUnauthorizedHandler(() => logout("Your session has expired. Please sign in again."));
    return () => api.setUnauthorizedHandler(null);
  }, [logout]);

  // refresh the stored account (name / avatar may have changed on the server)
  useEffect(() => {
    if (!user) return;
    api.getMe().then(u => {
      if (u.role !== user.role) return logout();
      if (u.name !== user.name || u.avatar !== user.avatar) setUser(api.storeUser({ ...user, ...u }));
    }).catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateUser = useCallback((patch) => setUser(u => api.storeUser({ ...u, ...patch })), []);

  if (!user) return <AuthScreen notice={notice} onAuthed={(u) => { setNotice(""); setUser(u); }}/>;
  const props = { user, onLogout: () => logout(), onUserChange: updateUser };
  if (user.role === "admin") return <AdminApp {...props}/>;
  if (user.role === "doctor") return <DoctorApp {...props}/>;
  return <PatientApp {...props}/>;
}
