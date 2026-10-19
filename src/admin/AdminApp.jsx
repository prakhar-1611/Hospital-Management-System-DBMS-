/* ============================================================
   AdminApp.jsx — "MedCare Admin Console" (role: admin).
   Same layout and design as the doctor and patient portals (PortalShell).
   Loads everything from MongoDB through the API: departments, doctors,
   patients, appointments. Billing / invoices stay front-end only.
   ============================================================ */
import { useState, useEffect, useCallback, useRef } from "react";
import { INITIAL_INVOICES, getTodayPlus, nextInvoiceId } from "../constants";
import * as api from "../api";
import { mapAll } from "../mappers";
import { PORTALS, useTheme, useToasts } from "../ui/theme";
import { Card, Button, Spinner } from "../ui/kit";
import PortalShell from "../ui/PortalShell";
import Icon from "../ui/Icon";
import { toAppt } from "../ui/records";
import { todayStr, fmtDate, isPastSlot } from "../ui/dates";

import NotifPanel         from "../components/NotifPanel";
import AnalyticsSection   from "../components/AnalyticsSection";
import { ScheduleModal }  from "../components/DoctorsSection";
import BillingSection     from "../components/BillingSection";
import CreateInvoiceModal from "../components/CreateInvoiceModal";
import ViewInvoiceModal   from "../components/ViewInvoiceModal";
import PaymentModal       from "../components/PaymentModal";
import PatientModal       from "../doctor/PatientModal";
import AdminDashboard     from "./AdminDashboard";
import AdminAppointments  from "./AdminAppointments";
import AdminDoctors       from "./AdminDoctors";
import AdminPatients      from "./AdminPatients";
import WalkInRegistration from "./WalkInRegistration";
import AdminSettings      from "./AdminSettings";
import ApptDetailModal    from "./ApptDetailModal";

const portal = PORTALS.admin;

export default function AdminApp({ user, onLogout }) {
  const { isDark, setIsDark, css } = useTheme("admin");
  const { showToast, toastLayer } = useToasts();
  const [section, setSection] = useState("dashboard");
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);                  // flat rows (toAppt) for every screen
  const [dbStatus, setDbStatus] = useState("loading");     // loading | online | offline
  const [loadError, setLoadError] = useState("");
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);   // front-end only
  const [notifications, setNotifications] = useState([
    { id: 1, type: "info",    title: "Patients book online", body: "Most bookings now come from MyMedCare. Walk-ins are registered at the desk.", time: "Just now", read: false, nav: "appointments" },
    { id: 2, type: "info",    title: "Live analytics",       body: "Analytics charts are computed by aggregation pipelines A1–A7 in MongoDB.", time: "Just now", read: false, nav: "analytics" },
    { id: 3, type: "warning", title: "Billing is local",     body: "Invoices are kept in the browser only and are not stored in MongoDB.", time: "Just now", read: false, nav: "billing" },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [apptTab, setApptTab] = useState("today");
  const [openApptId, setOpenApptId] = useState(null);
  const [openPatientId, setOpenPatientId] = useState(null);
  const [scheduleDoc, setScheduleDoc] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const notifRef = useRef(null);

  const loadAll = useCallback(() =>
    Promise.all([api.getDepartments(), api.getDoctors(), api.getPatients(), api.getAppointments()]).then(([deps, docs, pts, list]) => {
      const m = mapAll({ departments: deps, doctors: docs, patients: pts, appointments: list });
      setDepartments(m.departments);
      setDoctors(m.doctors);
      setPatients(m.patients);
      setAppts(list.map(toAppt));
      setDbStatus("online");
      setLoadError("");
    }, (e) => {
      if (e.status === 401) return;
      setDbStatus("offline");
      setLoadError(e.message);
    }), []);
  useEffect(() => { loadAll(); }, [loadAll]);           // initial state is already "loading"
  const reload = () => { setDbStatus("loading"); loadAll(); };

  const addNotification = useCallback((n) => setNotifications(list => [{ id: Date.now(), ...n, read: false, time: "Just now" }, ...list]), []);

  /* ── appointments ── */
  async function updateAppt(id, patch, message) {
    try {
      const u = patch.status === "Cancelled" ? await api.cancelAppointment(id) : await api.updateAppointment(id, patch);
      setAppts(list => list.map(a => a.id === id ? { ...a, status: u.status, notes: u.notes || "" } : a));
      showToast(message, "success");
      return true;
    } catch (e) {
      if (e.network) setDbStatus("offline");
      showToast(e.message, "error");
      return false;
    }
  }

  /* ── doctors ── */
  async function setDoctorStatus(id, status) {
    const doc = doctors.find(d => d.id === id);
    try {
      const u = await api.updateDoctor(id, { status });
      setDoctors(list => list.map(d => d.id === id ? { ...d, status: u.status } : d));
      showToast(`${doc?.name} is now ${u.status}`, "success");
    } catch (e) {
      showToast(`Could not update ${doc?.name}: ${e.message}`, "error");
    }
  }

  /* ── billing (front-end only) ── */
  function createInvoice(data) {
    const inv = { ...data, id: nextInvoiceId(), status: "Unpaid", paidOn: null };
    setInvoices(prev => [inv, ...prev]);
    showToast(`Invoice ${inv.id} created for ${inv.patientName}`, "success");
    addNotification({ type: "info", title: "Invoice Created", body: `${inv.id} · ${inv.patientName} · $${inv.grandTotal.toFixed(2)}`, nav: "billing" });
  }
  function processPayment(invoiceId, method) {
    const inv = invoices.find(i => i.id === invoiceId);
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: "Paid", paidOn: getTodayPlus(0), paymentMethod: method } : i));
    showToast(`Payment of $${inv?.grandTotal.toFixed(2)} received via ${method}`, "success");
    addNotification({ type: "success", title: "Payment Received", body: `${invoiceId} · $${inv?.grandTotal.toFixed(2)} via ${method}`, nav: "billing" });
    setPaymentModal(null);
  }
  function voidInvoice(invoiceId) {
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: "Voided" } : i));
    showToast(`Invoice ${invoiceId} voided`, "warning");
    setViewInvoice(null);
  }
  function printInvoice(inv) {
    const lines = inv.lineItems.map(l => `  ${l.label.padEnd(30)} x${l.qty}   $${l.total.toFixed(2)}`).join("\n");
    const txt = `MedCare Hospital — INVOICE\n\nInvoice #  : ${inv.id}\nDate       : ${inv.date}\nDue Date   : ${inv.dueDate}\nPatient    : ${inv.patientName}\nDoctor     : ${inv.doctor}\nDepartment : ${inv.dept}\n\nSERVICES\n${lines}\n\nSubtotal   : $${inv.subtotal.toFixed(2)}\nDiscount   : -$${inv.discount.toFixed(2)}\nTax (9%)   : $${inv.tax.toFixed(2)}\nTOTAL DUE  : $${inv.grandTotal.toFixed(2)}\n\nStatus     : ${inv.status}${inv.paidOn ? " (" + inv.paidOn + ")" : ""}\nPayment    : ${inv.paymentMethod || "—"}`;
    const win = window.open("", "_blank");
    if (!win) return;
    const pre = win.document.createElement("pre");
    pre.style.cssText = "font-family:monospace;padding:32px;font-size:14px";
    pre.textContent = txt;
    win.document.body.appendChild(pre);
    win.print();
  }

  function exportDB() {
    const data = JSON.stringify({ departments, doctors, patients, appointments: appts, invoices }, null, 2);
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(data);
    a.download = "medcare_backup.json";
    a.click();
    showToast("Data exported", "success");
  }

  function downloadSlip(p) {
    const blob = new Blob([`MEDCARE HOSPITAL — PATIENT SLIP\nID: ${p.code}\nPatient: ${p.name}\nAge / Gender: ${p.age || "—"} / ${p.gender || "—"}\nContact: ${p.contact || "—"}\nLatest visit: ${p.lastVisit || "—"}\nReason: ${p.condition}\nDoctor: ${p.doctor}\nStatus: ${p.status}`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Record_${p.name}.txt`;
    a.click();
  }

  /* ── layout ── */
  const today = todayStr();
  const needsUpdate = appts.filter(a => a.status === "Scheduled" && isPastSlot(a.date, a.time)).length;
  const unpaid = invoices.filter(i => i.status === "Unpaid").length;
  const unread = notifications.filter(n => !n.read).length;
  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.grandTotal, 0);

  const nav = [
    { id: "dashboard",    label: "Dashboard",            icon: "dashboard" },
    { id: "appointments", label: "All appointments",     icon: "calendar", badge: needsUpdate || null },
    { id: "walkin",       label: "Walk-in registration", icon: "calendarPlus" },
    { id: "doctors",      label: "Doctors",              icon: "stethoscope" },
    { id: "patients",     label: "Patients",             icon: "users" },
    { id: "analytics",    label: "Analytics",            icon: "chart" },
    { id: "billing",      label: "Billing",              icon: "card", badge: unpaid || null },
    { id: "settings",     label: "Settings",             icon: "settings" },
  ];
  const titles = { dashboard: "Dashboard", appointments: "All appointments", walkin: "Walk-in registration", doctors: "Doctors",
    patients: "Patients", analytics: "Analytics", billing: "Billing & payments", settings: "Settings" };
  const badge = {
    online:  { dot: "#22c55e", bg: "#dcfce7", fg: "#166534", text: "Database connected" },
    offline: { dot: "#ef4444", bg: "#fee2e2", fg: "#991b1b", text: "Database offline" },
    loading: { dot: "#f59e0b", bg: "#fef9c3", fg: "#854d0e", text: "Loading" },
  }[dbStatus];
  const shared = { css, accent: portal.accent, tint: portal.tint, isDark };
  const go = (s, tab) => { if (tab) setApptTab(tab); setSection(s); };

  const headerRight = (
    <>
      <span className="mc-db-badge mc-hide-sm" title={loadError || badge.text} style={{ background: badge.bg, color: badge.fg }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: badge.dot }}/>{badge.text}
      </span>
      <button onClick={reload} title="Reload data" aria-label="Reload data"
        style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${css.border}`, background: "transparent", color: css.textGray, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {dbStatus === "loading" ? <Spinner size={15} color={portal.accent}/> : <Icon name="refresh" size={17}/>}
      </button>
      <div style={{ position: "relative" }} ref={notifRef}>
        <button onClick={() => setNotifOpen(o => !o)} aria-label="Notifications"
          style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${css.border}`, background: "transparent", color: css.textGray, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <Icon name="bell" size={17}/>
          {unread > 0 && <span style={{ position: "absolute", top: -5, right: -5, background: "#ef4444", color: "white", fontSize: 9.5, fontWeight: 700, minWidth: 17, height: 17, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{unread > 9 ? "9+" : unread}</span>}
        </button>
        {notifOpen && (
          <NotifPanel notifications={notifications} css={css}
            onMarkAll={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}
            onDismiss={(id) => setNotifications(n => n.filter(x => x.id !== id))}
            onClearAll={() => setNotifications([])}
            onNav={(s) => { if (s) setSection(s); setNotifOpen(false); }}/>
        )}
      </div>
    </>
  );

  let body;
  if (dbStatus === "offline" && doctors.length === 0) {
    body = (
      <Card css={css} style={{ borderColor: "#fecaca" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#991b1b", marginBottom: 12 }}><Icon name="alert"/> Could not load data from the API: {loadError}</div>
        <Button accent={portal.accent} icon="refresh" onClick={reload}>Try again</Button>
      </Card>
    );
  } else if (dbStatus === "loading" && doctors.length === 0) {
    body = <Card css={css} style={{ display: "flex", alignItems: "center", gap: 12, color: css.textGray }}><Spinner color={portal.accent}/> Loading hospital data from MongoDB…</Card>;
  } else if (section === "dashboard") {
    body = <AdminDashboard {...shared} user={user} doctors={doctors} patients={patients} appts={appts} departments={departments}
      revenue={"$" + totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} unpaid={unpaid} onNavigate={go} onOpenAppt={setOpenApptId}/>;
  } else if (section === "appointments") {
    body = <AdminAppointments {...shared} appts={appts} departments={departments} tab={apptTab} setTab={setApptTab} onOpenAppt={setOpenApptId} onUpdate={updateAppt}/>;
  } else if (section === "walkin") {
    body = <WalkInRegistration {...shared} departments={departments} doctors={doctors} patients={patients} showToast={showToast}
      onDone={(name, docName, date) => { loadAll(); addNotification({ type: "success", title: "Walk-in registered", body: `${name} → ${docName} on ${date}`, nav: "appointments" }); }}
      onNavigate={go}/>;
  } else if (section === "doctors") {
    body = <AdminDoctors {...shared} doctors={doctors} departments={departments} appts={appts} onStatus={setDoctorStatus} onSchedule={setScheduleDoc}/>;
  } else if (section === "patients") {
    body = <AdminPatients {...shared} patients={patients} invoices={invoices} onOpenPatient={setOpenPatientId} onDownload={downloadSlip}
      onCreateInvoice={(p) => setInvoiceModal({ patient: p })} onViewInvoice={(inv) => setViewInvoice(inv)}/>;
  } else if (section === "analytics") {
    body = <AnalyticsSection css={css} showToast={showToast}/>;
  } else if (section === "billing") {
    body = <BillingSection invoices={invoices} patients={patients} css={css}
      onCreateInvoice={() => setInvoiceModal({ patient: null })} onViewInvoice={setViewInvoice}
      onPay={(inv) => setPaymentModal({ invoice: inv })} onPrint={printInvoice}/>;
  } else {
    body = <AdminSettings {...shared} setIsDark={setIsDark} user={user} counts={{ departments: departments.length, doctors: doctors.length, patients: patients.length, appointments: appts.length }}
      dbStatus={badge.text} onExport={exportDB} showToast={showToast}/>;
  }

  const openAppt = appts.find(a => a.id === openApptId);
  return (
    <>
      {toastLayer}
      <PortalShell portal={portal} nav={nav} section={section} onNavigate={(s) => { setSection(s); setNotifOpen(false); }} user={user} roleLabel="Administrator"
        title={titles[section]} subtitle={fmtDate(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        css={css} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout} headerRight={headerRight} profileSection="settings"
        sidebarExtra={
          <div style={{ padding: 14, borderRadius: 12, background: isDark ? "#4361ee22" : portal.tint, color: isDark ? "#a5b4fc" : portal.accent, fontSize: 12.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 4 }}><Icon name="info" size={15}/> Today</div>
            <div style={{ opacity: .9 }}>{appts.filter(a => a.date === today && a.status !== "Cancelled").length} appointments · {doctors.filter(d => d.status === "Available").length} doctors available</div>
          </div>
        }>
        {dbStatus === "offline" && doctors.length > 0 && (
          <div className="mc-banner" style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b" }}>
            <span>Could not reach the API: {loadError}</span>
            <Button size="sm" accent={portal.accent} onClick={reload}>Retry</Button>
          </div>
        )}
        {body}
      </PortalShell>

      {openAppt && <ApptDetailModal {...shared} appt={openAppt} onClose={() => setOpenApptId(null)} onUpdate={updateAppt}
        onOpenPatient={() => { setOpenPatientId(openAppt.patientId); setOpenApptId(null); }}/>}
      {openPatientId && <PatientModal {...shared} patientId={openPatientId} subtitle="Full record and every appointment at MedCare" showDoctor
        onClose={() => setOpenPatientId(null)} onOpenAppt={(id) => { setOpenPatientId(null); setOpenApptId(id); }}/>}
      {scheduleDoc && <ScheduleModal doctor={scheduleDoc} css={css} onClose={() => setScheduleDoc(null)}/>}
      {invoiceModal && <CreateInvoiceModal patient={invoiceModal.patient} patients={patients} departments={departments} css={css}
        onClose={() => setInvoiceModal(null)} onCreate={(data) => { createInvoice(data); setInvoiceModal(null); setSection("billing"); }}/>}
      {viewInvoice && <ViewInvoiceModal invoice={viewInvoice} css={css} onClose={() => setViewInvoice(null)}
        onPay={() => { setPaymentModal({ invoice: viewInvoice }); setViewInvoice(null); }} onPrint={() => printInvoice(viewInvoice)} onVoid={() => voidInvoice(viewInvoice.id)}/>}
      {paymentModal && <PaymentModal invoice={paymentModal.invoice} css={css} onClose={() => setPaymentModal(null)} onPay={(m) => processPayment(paymentModal.invoice.id, m)}/>}
    </>
  );
}
