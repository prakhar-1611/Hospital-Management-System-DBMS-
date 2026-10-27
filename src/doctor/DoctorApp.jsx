/* ============================================================
   DoctorApp.jsx — "MedCare Clinician Hub" (role: doctor).
   Loads ONLY the signed-in doctor's data:
     GET /api/doctors/me        own profile
     GET /api/appointments      own appointments (server filters by doctor)
     GET /api/patients          own patients (patients with an appointment here)
   A doctor can update appointment status + notes and their own schedule.
   ============================================================ */
import { useState, useEffect, useCallback, useMemo } from "react";
import * as api from "../api";
import { Button, Spinner, Skeleton, SkeletonRows, Notice, Segmented } from "../ui/kit";
import { PORTALS, useTheme, useToasts } from "../ui/theme";
import PortalShell from "../ui/PortalShell";
import Icon from "../ui/Icon";
import { toAppt, byDateAsc } from "../ui/records";
import { todayStr, isPastSlot, fmtTime } from "../ui/dates";
import DoctorOverview from "./DoctorOverview";
import DoctorAppointments from "./DoctorAppointments";
import DoctorPatients from "./DoctorPatients";
import DoctorSchedule from "./DoctorSchedule";
import DoctorProfile from "./DoctorProfile";
import AppointmentModal from "./AppointmentModal";
import PatientModal from "./PatientModal";

const portal = PORTALS.doctor;
const STATUS_OPTIONS = [
  { value: "Available", label: "Available", dot: "var(--positive)" },
  { value: "Busy", label: "Busy", dot: "var(--warning)" },
  { value: "On Leave", label: "On leave", dot: "var(--negative)" },
];

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
    { id: "overview",     label: "Today",        icon: "dashboard" },
    { id: "appointments", label: "Appointments", icon: "calendar", badge: needsUpdate.length || null },
    { id: "patients",     label: "My patients",  icon: "users" },
    { id: "schedule",     label: "Schedule",     icon: "clock" },
    { id: "profile",      label: "Profile",      icon: "user" },
  ];

  const todaysLeft = appts.filter(a => a.date === today && a.status === "Scheduled");
  const nextUp = appts.filter(a => a.status === "Scheduled" && !isPastSlot(a.date, a.time)).sort(byDateAsc)[0];
  const ready = !!doctor;
  const meta = {
    overview: { title: "Today",
      finding: ready && (todaysLeft.length
        ? <><strong>{todaysLeft.length} consultation{todaysLeft.length === 1 ? "" : "s"} left today.</strong> Next: {nextUp.patientName} at {fmtTime(nextUp.time)}.</>
        : nextUp ? <>Nothing left today. Next visit is {nextUp.patientName} on {new Date(nextUp.date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}.</> : "No consultations booked."),
      actions: ready && <Segmented label="My availability" value={doctor.status} options={STATUS_OPTIONS} onChange={(s) => updateDoctor({ status: s }, `You are now ${s === "On Leave" ? "on leave" : s.toLowerCase()}`)}/> },
    appointments: { title: "Appointments", finding: ready && <>{appts.filter(a => a.status === "Scheduled" && !isPastSlot(a.date, a.time)).length} upcoming{needsUpdate.length ? <>, <strong>{needsUpdate.length} past visit{needsUpdate.length === 1 ? "" : "s"} still need completing or cancelling</strong></> : ", none waiting for your update"}.</> },
    patients: { title: "My patients", finding: ready && <>{patients.length} patients have booked with you. Other doctors' patients are not shown.</> },
    schedule: { title: "Schedule", finding: "Your availability, working days and the next 14 days of slots." },
    profile: { title: "Profile", finding: "Your details, practice summary and password." },
  }[section];

  const shared = { css, accent: portal.accent, tint: portal.tint, isDark };
  let body;
  if (loading && !doctor) {
    body = (
      <div className="mc-stack" aria-busy="true" aria-label="Loading your clinic">
        <div className="mc-grid-stats">{[0, 1, 2, 3].map(i => <Skeleton key={i} h={84} r={8}/>)}</div>
        <SkeletonRows rows={5} h={52}/>
      </div>
    );
  } else if (error && !doctor) {
    body = (
      <Notice tone="negative" style={{ maxWidth: 560 }} action={<Button size="sm" variant="outline" icon="refresh" onClick={load}>Try again</Button>}>
        <strong>Could not load your clinic.</strong> {error}
      </Notice>
    );
  } else if (section === "overview") {
    body = <DoctorOverview {...shared} doctor={doctor} appts={appts} patients={patientRows} needsUpdate={needsUpdate}
      onOpenAppt={setOpenApptId} onUpdateAppt={updateAppt}
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
        roleLabel={doctor ? (doctor.departmentId?.name || "Doctor") : "Doctor"}
        title={meta.title} subtitle={meta.finding || undefined} titleActions={meta.actions}
        css={css} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout}
        headerRight={
          <button onClick={load} title="Refresh" aria-label="Refresh data" className="mc-iconbtn">
            {loading ? <Spinner size={15}/> : <Icon name="refresh" size={17}/>}
          </button>
        }
        sidebarExtra={<div className="mc-sidebar-note">On-call desk ext. 2200<br/>Pharmacy ext. 2310</div>}>
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
