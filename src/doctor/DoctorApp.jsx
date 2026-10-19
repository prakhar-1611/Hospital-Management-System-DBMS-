/* ============================================================
   DoctorApp.jsx — "MedCare Clinician Hub" (role: doctor).
   Loads ONLY the logged-in doctor's data:
     GET /api/doctors/me        own profile
     GET /api/appointments      own appointments (server filters by doctor)
     GET /api/patients          own patients (patients with an appointment here)
   A doctor can update appointment status + notes and their own schedule.
   ============================================================ */
import { useState, useEffect, useCallback, useMemo } from "react";
import * as api from "../api";
import { Card, Button, Spinner } from "../ui/kit";
import { PORTALS, useTheme, useToasts } from "../ui/theme";
import PortalShell from "../ui/PortalShell";
import Icon from "../ui/Icon";
import { toAppt, byDateAsc } from "../ui/records";
import { todayStr, isPastSlot, fmtDate } from "../ui/dates";
import DoctorOverview from "./DoctorOverview";
import DoctorAppointments from "./DoctorAppointments";
import DoctorPatients from "./DoctorPatients";
import DoctorSchedule from "./DoctorSchedule";
import DoctorProfile from "./DoctorProfile";
import AppointmentModal from "./AppointmentModal";
import PatientModal from "./PatientModal";

const portal = PORTALS.doctor;

export default function DoctorApp({ user, onLogout }) {
  const { isDark, setIsDark, css } = useTheme("doctor");
  const { showToast, toastLayer } = useToasts();
  const [section, setSection] = useState("overview");
  const [doctor, setDoctor] = useState(null);
  const [appts, setAppts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openApptId, setOpenApptId] = useState(null);
  const [openPatientId, setOpenPatientId] = useState(null);
  const [apptTab, setApptTab] = useState("today");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [doc, list, pts] = await Promise.all([api.getMyDoctor(), api.getAppointments(), api.getPatients()]);
      setDoctor(doc);
      setAppts(list.map(toAppt));
      setPatients(pts);
      setError("");
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const today = todayStr();
  const needsUpdate = useMemo(() => appts.filter(a => a.status === "Scheduled" && isPastSlot(a.date, a.time)), [appts]);

  // patient records + visit stats with this doctor
  const patientRows = useMemo(() => patients.map(p => {
    const mine = appts.filter(a => a.patientId === p._id);
    const done = mine.filter(a => a.status === "Completed").sort(byDateAsc);
    const next = mine.filter(a => a.status === "Scheduled" && a.date >= today).sort(byDateAsc)[0];
    return { ...p, visits: done.length, total: mine.length, lastVisit: done.at(-1)?.date || "", nextVisit: next ? next.date : "", nextTime: next?.time };
  }), [patients, appts, today]);

  async function updateAppt(id, patch, message) {
    try {
      const u = await api.updateAppointment(id, patch);
      setAppts(list => list.map(a => a.id === id ? { ...a, status: u.status, notes: u.notes || "" } : a));
      showToast(message, "success");
      return true;
    } catch (e) {
      showToast(e.message, "error");
      return false;
    }
  }

  async function updateDoctor(patch, message) {
    try {
      const u = await api.updateDoctor(doctor._id, patch);
      setDoctor(d => ({ ...d, status: u.status, workingDays: u.workingDays, workingHours: u.workingHours }));
      showToast(message, "success");
      return true;
    } catch (e) {
      showToast(e.message, "error");
      return false;
    }
  }

  const openAppt = appts.find(a => a.id === openApptId);
  const nav = [
    { id: "overview",     label: "Overview",        icon: "dashboard" },
    { id: "appointments", label: "Appointments",    icon: "calendar", badge: needsUpdate.length || null },
    { id: "patients",     label: "My Patients",     icon: "users" },
    { id: "schedule",     label: "Schedule",        icon: "clock" },
    { id: "profile",      label: "Profile",         icon: "user" },
  ];
  const titles = { overview: "Overview", appointments: "Appointments", patients: "My Patients", schedule: "Schedule & Availability", profile: "My Profile" };

  const shared = { css, accent: portal.accent, tint: portal.tint, isDark };
  let body;
  if (loading && !doctor) {
    body = <Card css={css} style={{ display: "flex", alignItems: "center", gap: 12, color: css.textGray }}><Spinner color={portal.accent}/> Loading your clinic data…</Card>;
  } else if (error && !doctor) {
    body = (
      <Card css={css} style={{ borderColor: "#fecaca" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#991b1b", marginBottom: 12 }}><Icon name="alert"/> Could not load your data: {error}</div>
        <Button accent={portal.accent} icon="refresh" onClick={load}>Try again</Button>
      </Card>
    );
  } else if (section === "overview") {
    body = <DoctorOverview {...shared} user={user} doctor={doctor} appts={appts} patients={patientRows} needsUpdate={needsUpdate}
      onOpenAppt={setOpenApptId} onUpdateAppt={updateAppt} onUpdateDoctor={updateDoctor}
      onNavigate={(s, tab) => { if (tab) setApptTab(tab); setSection(s); }}/>;
  } else if (section === "appointments") {
    body = <DoctorAppointments {...shared} appts={appts} tab={apptTab} setTab={setApptTab} needsUpdate={needsUpdate} onOpenAppt={setOpenApptId}/>;
  } else if (section === "patients") {
    body = <DoctorPatients {...shared} patients={patientRows} onOpenPatient={setOpenPatientId}/>;
  } else if (section === "schedule") {
    body = <DoctorSchedule {...shared} doctor={doctor} appts={appts} onUpdateDoctor={updateDoctor}/>;
  } else {
    body = <DoctorProfile {...shared} user={user} doctor={doctor} appts={appts} patients={patientRows} showToast={showToast}/>;
  }

  return (
    <>
      {toastLayer}
      <PortalShell portal={portal} nav={nav} section={section} onNavigate={setSection} user={user}
        roleLabel={doctor ? `${doctor.departmentId?.name || "Doctor"}` : "Doctor"}
        title={titles[section]} subtitle={fmtDate(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        css={css} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout}
        headerRight={
          <button onClick={load} title="Refresh" aria-label="Refresh"
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${css.border}`, background: "transparent", color: css.textGray, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loading ? <Spinner size={15} color={portal.accent}/> : <Icon name="refresh" size={17}/>}
          </button>
        }
        sidebarExtra={
          <div style={{ padding: 14, borderRadius: 12, background: isDark ? "#0f766e22" : portal.tint, color: isDark ? "#5eead4" : portal.accent, fontSize: 12.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 4 }}><Icon name="phone" size={15}/> Clinical support</div>
            <div style={{ opacity: .9 }}>On-call desk: ext. 2200<br/>Pharmacy: ext. 2310</div>
          </div>
        }>
        {body}
      </PortalShell>

      {openAppt && (
        <AppointmentModal {...shared} appt={openAppt} patient={patients.find(p => p._id === openAppt.patientId)}
          onClose={() => setOpenApptId(null)} onUpdate={updateAppt}
          onOpenPatient={() => { setOpenPatientId(openAppt.patientId); setOpenApptId(null); }}/>
      )}
      {openPatientId && (
        <PatientModal {...shared} patientId={openPatientId} onClose={() => setOpenPatientId(null)}
          onOpenAppt={(id) => { setOpenPatientId(null); setOpenApptId(id); }}/>
      )}
    </>
  );
}
