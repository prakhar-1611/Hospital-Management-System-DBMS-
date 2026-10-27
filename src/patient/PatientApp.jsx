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
import { Button, Spinner, Skeleton, SkeletonRows, Notice, Modal } from "../ui/kit";
import { PORTALS, useTheme, useToasts } from "../ui/theme";
import PortalShell from "../ui/PortalShell";
import Icon from "../ui/Icon";
import { toAppt, byDateAsc, PROFILE_FIELDS } from "../ui/records";
import { fmtDate, fmtTime, relativeDay, isPastSlot, greeting } from "../ui/dates";
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
  const [cancelling, setCancelling] = useState(null);       // appointment waiting for confirmation
  const [cancelBusy, setCancelBusy] = useState(false);

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

  const upcoming = useMemo(() => appts.filter(a => a.status === "Scheduled" && !isPastSlot(a.date, a.time)).sort(byDateAsc), [appts]);
  const missing = profile ? PROFILE_FIELDS.filter(([k]) => profile[k] === undefined || profile[k] === null || profile[k] === "") : [];

  async function cancelAppt() {
    const a = cancelling;
    setCancelBusy(true);
    try {
      await api.cancelAppointment(a.id);
      setAppts(list => list.map(x => x.id === a.id ? { ...x, status: "Cancelled" } : x));
      showToast("Appointment cancelled. The slot is free for others.", "success");
      setCancelling(null);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setCancelBusy(false);
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
    { id: "overview",     label: "Home",             icon: "dashboard" },
    { id: "book",         label: "Book appointment", icon: "calendarPlus" },
    { id: "appointments", label: "My appointments",  icon: "calendar", badge: upcoming.length || null },
    { id: "doctors",      label: "Find a doctor",    icon: "stethoscope" },
    { id: "profile",      label: "My profile",       icon: "user", badge: missing.length ? `${missing.length} missing` : null },
  ];

  const next = upcoming[0];
  const first = (profile?.name || user.name).split(" ")[0];
  const bookBtn = <Button icon="calendarPlus" onClick={() => startBooking()}>Book a visit</Button>;
  const meta = {
    overview: { title: `${greeting()}, ${first}`, actions: bookBtn,
      finding: profile && (next
        ? <>Your next visit is <strong>{relativeDay(next.date).toLowerCase()} at {fmtTime(next.time)}</strong> with {next.doctorName}.</>
        : "You have no upcoming visits.") },
    book: { title: "Book an appointment", finding: "Choose a department, a doctor and a time. You can reschedule or cancel later at no charge." },
    appointments: { title: "My appointments", actions: bookBtn,
      finding: profile && <>{upcoming.length ? <strong>{upcoming.length} upcoming.</strong> : "Nothing upcoming."} Reschedule or cancel any visit before it starts.</> },
    doctors: { title: "Find a doctor", finding: `${doctors.length} doctors across ${departments.length} departments.` },
    profile: { title: "My profile", finding: missing.length ? <><strong>{missing.length} detail{missing.length === 1 ? "" : "s"} missing.</strong> Doctors you book with see this record.</> : "Doctors you book with see this record. Nobody else can." },
  }[section];

  const shared = { css, accent: portal.accent, tint: portal.tint, isDark };

  let body;
  if (loading && !profile) {
    body = (
      <div className="mc-stack" aria-busy="true" aria-label="Loading your appointments">
        <Skeleton h={150} r={8}/>
        <div className="mc-grid-stats">{[0, 1, 2, 3].map(i => <Skeleton key={i} h={84} r={8}/>)}</div>
        <SkeletonRows rows={3} h={56}/>
      </div>
    );
  } else if (error && !profile) {
    body = (
      <Notice tone="negative" style={{ maxWidth: 560 }} action={<Button size="sm" variant="outline" icon="refresh" onClick={load}>Try again</Button>}>
        <strong>Could not load your record.</strong> {error}
      </Notice>
    );
  } else if (section === "overview") {
    body = <PatientOverview {...shared} profile={profile} appts={appts} upcoming={upcoming} missing={missing}
      onBook={startBooking} onNavigate={setSection} onCancel={setCancelling} onReschedule={setReschedule}/>;
  } else if (section === "book") {
    body = <BookAppointment {...shared} key={bookPrefill?.doctorId || "new"} departments={departments} doctors={doctors} prefill={bookPrefill}
      showToast={showToast} onBooked={reloadAppts} onNavigate={setSection}/>;
  } else if (section === "appointments") {
    body = <PatientAppointments {...shared} profile={profile} appts={appts} onCancel={setCancelling} onReschedule={setReschedule} onBook={startBooking}/>;
  } else if (section === "doctors") {
    body = <FindDoctors {...shared} doctors={doctors} departments={departments} onBook={(doctorId) => startBooking({ doctorId })}/>;
  } else {
    body = <PatientProfile {...shared} user={user} profile={profile} missing={missing} onSave={saveProfile} showToast={showToast}/>;
  }

  return (
    <>
      {toastLayer}
      <PortalShell portal={portal} nav={nav} section={section} onNavigate={(s) => { if (s === "book") setBookPrefill(null); setSection(s); }} user={user} roleLabel="Patient"
        title={meta.title} subtitle={meta.finding || undefined} titleActions={meta.actions}
        css={css} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout}
        headerRight={
          <button onClick={load} title="Refresh" aria-label="Refresh data" className="mc-iconbtn">
            {loading ? <Spinner size={15}/> : <Icon name="refresh" size={17}/>}
          </button>
        }
        sidebarExtra={
          <div className="mc-emergency" role="note">
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, marginBottom: 2 }}><Icon name="ambulance" size={16}/> Emergency? Call <a href="tel:108">108</a></div>
            Do not wait for an appointment. The emergency ward is open day and night.
          </div>
        }>
        {body}
      </PortalShell>

      {reschedule && (
        <RescheduleModal appt={reschedule} doctor={doctors.find(d => d._id === reschedule.doctorId)}
          onClose={() => setReschedule(null)}
          onDone={(u) => { setAppts(list => list.map(x => x.id === u.id ? { ...x, date: u.date, time: u.time } : x)); setReschedule(null); showToast("Appointment moved", "success"); }}
          showToast={showToast}/>
      )}
      {cancelling && (
        <Modal width={460} title="Cancel this appointment?" onClose={() => !cancelBusy && setCancelling(null)}
          footer={<>
            <Button variant="ghost" disabled={cancelBusy} onClick={() => setCancelling(null)}>Keep appointment</Button>
            <Button variant="danger" icon="xCircle" disabled={cancelBusy} onClick={cancelAppt}>{cancelBusy ? "Cancelling" : "Cancel appointment"}</Button>
          </>}>
          <p style={{ fontSize: 14 }}>
            <strong>{cancelling.doctorName}</strong>, {cancelling.deptName}<br/>
            {fmtDate(cancelling.date, { weekday: "long", day: "numeric", month: "long" })} at {fmtTime(cancelling.time)}
          </p>
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 10 }}>The slot is released for other patients. You can book again at any time.</p>
        </Modal>
      )}
    </>
  );
}
