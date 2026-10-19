/* ============================================================
   PatientApp.jsx — "MyMedCare" (role: patient).
   Loads ONLY the logged-in patient's data plus the public directory:
     GET /api/patients/me       own profile
     GET /api/appointments      own appointments (server filters by patient)
     GET /api/doctors           doctor directory (no account ids)
     GET /api/departments       departments + consultation fees
   A patient can book, reschedule or cancel their own appointments and
   edit their own profile. Doctor notes are read-only.
   ============================================================ */
import { useState, useEffect, useCallback, useMemo } from "react";
import * as api from "../api";
import { Card, Button, Spinner } from "../ui/kit";
import { PORTALS, useTheme, useToasts } from "../ui/theme";
import PortalShell from "../ui/PortalShell";
import Icon from "../ui/Icon";
import { toAppt, PROFILE_FIELDS } from "../ui/records";
import { todayStr, fmtDate, isPastSlot } from "../ui/dates";
import PatientOverview from "./PatientOverview";
import BookAppointment from "./BookAppointment";
import PatientAppointments from "./PatientAppointments";
import FindDoctors from "./FindDoctors";
import PatientProfile from "./PatientProfile";
import RescheduleModal from "./RescheduleModal";

const portal = PORTALS.patient;


export default function PatientApp({ user, onLogout, onUserChange }) {
  const { isDark, setIsDark, css } = useTheme("patient");
  const { showToast, toastLayer } = useToasts();
  const [section, setSection] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [appts, setAppts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookPrefill, setBookPrefill] = useState(null);     // { doctorId } from "Book" buttons
  const [reschedule, setReschedule] = useState(null);       // appointment being moved

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, list, docs, deps] = await Promise.all([api.getMyProfile(), api.getAppointments(), api.getDoctors(), api.getDepartments()]);
      setProfile(me);
      setAppts(list.map(toAppt));
      setDoctors(docs);
      setDepartments(deps);
      setError("");
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const reloadAppts = useCallback(async () => {
    try { setAppts((await api.getAppointments()).map(toAppt)); } catch { /* keep the current list */ }
  }, []);

  const upcoming = useMemo(() => appts.filter(a => a.status === "Scheduled" && !isPastSlot(a.date, a.time)), [appts]);
  const missing = profile ? PROFILE_FIELDS.filter(([k]) => profile[k] === undefined || profile[k] === null || profile[k] === "") : [];

  async function cancelAppt(a) {
    if (!confirm(`Cancel your appointment with ${a.doctorName} on ${fmtDate(a.date)}?`)) return;
    try {
      await api.cancelAppointment(a.id);
      setAppts(list => list.map(x => x.id === a.id ? { ...x, status: "Cancelled" } : x));
      showToast("Appointment cancelled. The slot is free for others.", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function saveProfile(patch) {
    try {
      const p = await api.updateProfile(patch);
      setProfile(p);
      if (p.name !== user.name) onUserChange({ name: p.name });
      showToast("Profile saved", "success");
      return true;
    } catch (e) {
      showToast(e.message, "error");
      return false;
    }
  }

  const startBooking = (prefill = null) => { setBookPrefill(prefill); setSection("book"); };

  const nav = [
    { id: "overview",     label: "Home",            icon: "dashboard" },
    { id: "book",         label: "Book appointment", icon: "calendarPlus" },
    { id: "appointments", label: "My appointments", icon: "calendar", badge: upcoming.length || null },
    { id: "doctors",      label: "Find a doctor",   icon: "stethoscope" },
    { id: "profile",      label: "My profile",      icon: "user", badge: missing.length ? "!" : null },
  ];
  const titles = { overview: "Home", book: "Book an appointment", appointments: "My appointments", doctors: "Find a doctor", profile: "My profile" };
  const shared = { css, accent: portal.accent, tint: portal.tint, isDark };

  let body;
  if (loading && !profile) {
    body = <Card css={css} style={{ display: "flex", alignItems: "center", gap: 12, color: css.textGray }}><Spinner color={portal.accent}/> Loading your health record…</Card>;
  } else if (error && !profile) {
    body = (
      <Card css={css} style={{ borderColor: "#fecaca" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#991b1b", marginBottom: 12 }}><Icon name="alert"/> Could not load your data: {error}</div>
        <Button accent={portal.accent} icon="refresh" onClick={load}>Try again</Button>
      </Card>
    );
  } else if (section === "overview") {
    body = <PatientOverview {...shared} user={user} profile={profile} appts={appts} upcoming={upcoming} missing={missing}
      onBook={startBooking} onNavigate={setSection} onCancel={cancelAppt} onReschedule={setReschedule}/>;
  } else if (section === "book") {
    body = <BookAppointment {...shared} key={bookPrefill?.doctorId || "new"} departments={departments} doctors={doctors} appts={appts} prefill={bookPrefill}
      showToast={showToast} onBooked={reloadAppts} onNavigate={setSection}/>;
  } else if (section === "appointments") {
    body = <PatientAppointments {...shared} profile={profile} appts={appts} onCancel={cancelAppt} onReschedule={setReschedule} onBook={startBooking}/>;
  } else if (section === "doctors") {
    body = <FindDoctors {...shared} doctors={doctors} departments={departments} onBook={(doctorId) => startBooking({ doctorId })}/>;
  } else {
    body = <PatientProfile {...shared} user={user} profile={profile} missing={missing} onSave={saveProfile} showToast={showToast}/>;
  }

  return (
    <>
      {toastLayer}
      <PortalShell portal={portal} nav={nav} section={section} onNavigate={(s) => { if (s === "book") setBookPrefill(null); setSection(s); }} user={user} roleLabel="Patient"
        title={titles[section]} subtitle={fmtDate(todayStr(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        css={css} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout}
        headerRight={section !== "book" && (
          <span className="mc-hide-sm"><Button accent={portal.accent} icon="plus" onClick={() => startBooking()}>Book visit</Button></span>
        )}
        sidebarExtra={
          <div style={{ padding: 14, borderRadius: 12, background: "#fef2f2", color: "#991b1b", fontSize: 12.5, border: "1px solid #fecaca" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 4 }}><Icon name="ambulance" size={16}/> Emergency? Call 108</div>
            <div style={{ opacity: .9 }}>Do not wait for an appointment. Our emergency ward is open 24×7.</div>
          </div>
        }>
        {body}
      </PortalShell>
      {reschedule && (
        <RescheduleModal {...shared} appt={reschedule} doctor={doctors.find(d => d._id === reschedule.doctorId)}
          onClose={() => setReschedule(null)}
          onDone={(u) => { setAppts(list => list.map(x => x.id === u.id ? { ...x, date: u.date, time: u.time } : x)); setReschedule(null); showToast("Appointment moved", "success"); }}
          showToast={showToast}/>
      )}
    </>
  );
}
