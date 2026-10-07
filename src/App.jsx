import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

import {
  light, dark,
  btnStyle, btnOutlineStyle,
  INITIAL_INVOICES,
  getTodayPlus, nextInvoiceId,
  DAY_NAMES, DAY_FULL,
} from "./constants";
import * as api from "./api";
import { mapAll } from "./mappers";

import LoginScreen        from "./components/LoginScreen";
import Toast              from "./components/Toast";
import NotifPanel         from "./components/NotifPanel";
import DashboardSection, { ActivityDetail, RevenueDetail } from "./components/DashboardSection";
import AnalyticsSection   from "./components/AnalyticsSection";
import DoctorsSection, { ScheduleModal } from "./components/DoctorsSection";
import PatientsSection    from "./components/PatientsSection";
import AdmissionsSection  from "./components/AdmissionsSection";
import BillingSection     from "./components/BillingSection";
import CreateInvoiceModal from "./components/CreateInvoiceModal";
import ViewInvoiceModal   from "./components/ViewInvoiceModal";
import PaymentModal       from "./components/PaymentModal";
import SettingsSection    from "./components/SettingsSection";

export default function App() {
  const [section, setSection]           = useState("dashboard");
  // session restored from the stored JWT; only role "admin" may use this portal
  const [user, setUser]                 = useState(() => {
    const u = api.getToken() ? api.getUser() : null;
    if (u && u.role !== "admin") { api.logout(); return null; }
    return u;
  });
  const loggedIn = !!user;
  const [darkMode, setDarkMode]         = useState(false);
  // data loaded from MongoDB through the API
  const [departments, setDepartments]   = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [patients, setPatients]         = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dbStatus, setDbStatus]         = useState("loading");   // loading | online | offline
  const [loadError, setLoadError]       = useState("");
  // billing / invoices are front-end only (React state, not stored in MongoDB)
  const [invoices, setInvoices]         = useState(INITIAL_INVOICES);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [notifications, setNotifications] = useState([
    { id:1, type:"info",    title:"Live analytics",     body:"Analytics charts are computed by aggregation pipelines A1–A7 in MongoDB.", time:"Just now", read:false, nav:"analytics" },
    { id:2, type:"info",    title:"Doctor status",      body:"Click a doctor card to change status; it is saved to MongoDB.",             time:"Just now", read:false, nav:"doctors"   },
    { id:3, type:"warning", title:"Billing is local",   body:"Invoices are kept in the browser only and are not stored in MongoDB.",    time:"Just now", read:false, nav:"billing"   },
    { id:4, type:"warning", title:"Invoice Pending",    body:"Sample invoice INV-0003 is unpaid (front-end demo data).",                 time:"Just now", read:false, nav:"billing"   },
  ]);
  const [toasts, setToasts]               = useState([]);
  const [docFilter, setDocFilter]         = useState("All");
  const [searchQuery, setSearchQuery]     = useState("");
  const [modal, setModal]                 = useState(null);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [selectedPart, setSelectedPart]   = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [paymentModal, setPaymentModal]   = useState(null);
  const [invoiceModal, setInvoiceModal]   = useState(null);
  const [viewInvoiceModal, setViewInvoiceModal] = useState(null);
  const toastId = useRef(0);

  /* ── TOAST & NOTIFICATION HELPERS ── */
  const showToast = useCallback((msg, type = "info") => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications(n => [{ id:Date.now(), ...notif, read:false, time:"Just now" }, ...n]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const navigate = (sec) => { setSection(sec); setNotifOpen(false); setUserMenuOpen(false); setSidebarOpen(false); };

  /* ── LOAD DATA FROM THE API (departments, doctors, patients, appointments) ── */
  const loadAll = useCallback(async () => {
    setDbStatus("loading");
    try {
      const [deps, docs, pts, appts] = await Promise.all([
        api.getDepartments(), api.getDoctors(), api.getPatients(), api.getAppointments(),
      ]);
      const m = mapAll({ departments:deps, doctors:docs, patients:pts, appointments:appts });
      setDepartments(m.departments);
      setDoctors(m.doctors);
      setPatients(m.patients);
      setAppointments(m.appointments);
      setDbStatus("online");
      setLoadError("");
    } catch (e) {
      if (e.status === 401) return;              // handled by the unauthorized handler
      setDbStatus("offline");
      setLoadError(e.message);
    }
  }, []);

  // a 401 anywhere (expired / invalid token) logs the user out
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setUser(null);
      showToast("Session expired. Please log in again.","warning");
    });
    return () => api.setUnauthorizedHandler(null);
  }, [showToast]);

  useEffect(() => { if (loggedIn) loadAll(); }, [loggedIn, loadAll]);

  /* ── BOOKING STATE ── */
  const EMPTY_FORM = { name:"", age:"", gender:"", phone:"", email:"", address:"", condition:"", dept:"General", doctorId:"", date:"", time:"" };
  const [bookForm, setBookForm]       = useState(EMPTY_FORM);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotError, setSlotError]     = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotReload, setSlotReload]   = useState(0);
  const [saving, setSaving]           = useState(false);

  // time slots come from GET /api/doctors/:id/availability?date=  (server checks leave,
  // working day, working hours and the Scheduled appointments of that day)
  useEffect(() => {
    if (!bookForm.doctorId || !bookForm.date) { setAvailableSlots([]); setSlotError(""); return; }
    let cancelled = false;
    setSlotsLoading(true);
    api.getAvailability(bookForm.doctorId, bookForm.date)
      .then(r => {
        if (cancelled) return;
        const doc = doctors.find(d => d.id === bookForm.doctorId);
        const name = doc ? doc.name : "This doctor";
        if (!r.working) {
          const dow = new Date(bookForm.date + "T00:00:00Z").getUTCDay();
          setAvailableSlots([]);
          setSlotError(r.status === "On Leave"
            ? `${name} is on leave.`
            : `${name} does not work on ${DAY_FULL[dow]}s. Working days: ${(doc?.workingDays || []).map(d => DAY_NAMES[d]).join(", ")}`);
          return;
        }
        const free = r.slots.filter(x => x.available).map(x => x.time);
        setAvailableSlots(free);
        setSlotError(free.length === 0 ? "No available slots on this date for this doctor." : "");
      })
      .catch(e => { if (!cancelled) { setAvailableSlots([]); setSlotError(e.message); } })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [bookForm.doctorId, bookForm.date, slotReload, doctors]);

  const availableDoctors = bookForm.dept === "General"
    ? doctors
    : doctors.filter(d => d.dept === bookForm.dept || d.dept === "General");

  const totalRevenue     = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.grandTotal, 0);
  const filteredDocs     = docFilter === "All" ? doctors : doctors.filter(d => d.dept === docFilter);
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── HANDLERS ── */
  // returns an error message for the login screen, or null on success
  async function handleLogin(email, pass) {
    try {
      const u = await api.login(email, pass);
      if (u.role !== "admin") {
        api.logout();
        return `This portal is for administrators only. ${u.email} is a ${u.role} account.`;
      }
      setUser(u);
      setSection("dashboard");
      showToast(`Welcome, ${u.name}`,"success");
      return null;
    } catch (e) {
      return e.status === 401 ? "Invalid email or password" : e.message;
    }
  }

  function handleLogout() {
    api.logout();
    setUser(null);
    setUserMenuOpen(false);
    setDoctors([]); setPatients([]); setAppointments([]); setDepartments([]);
  }

  // Admission = POST /api/patients (user + patient, one transaction) then POST /api/appointments.
  // If the booking fails, the patient that was just created is deleted again.
  async function handleBooking(e) {
    e.preventDefault();
    if (saving) return;
    if (!bookForm.name.trim())  { showToast("Please enter the patient name","warning"); return; }
    if (!bookForm.doctorId)     { showToast("Please select a doctor","warning"); return; }
    if (!bookForm.date)         { showToast("Please select a date","warning"); return; }
    if (!bookForm.time)         { showToast("Please select a time slot","warning"); return; }
    const age = bookForm.age === "" ? undefined : Number(bookForm.age);
    if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 120)) {
      showToast("Age must be a whole number from 0 to 120","warning"); return;
    }
    const form = bookForm;
    const docName = doctors.find(d => d.id === form.doctorId)?.name || "doctor";
    setSaving(true);
    let created = null;
    try {
      created = await api.createPatient({
        name: form.name.trim(), age, gender: form.gender || undefined,
        phone: form.phone.trim() || undefined, email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      await api.bookAppointment({
        patientId: created._id, doctorId: form.doctorId, date: form.date,
        timeSlot: form.time, reason: form.condition || "Checkup",
      });
      setBookForm(EMPTY_FORM);
      setSelectedPart(null);
      await loadAll();
      navigate("patients");
      showToast(`${form.name} admitted: ${form.date} at ${form.time} (saved to MongoDB)`,"success");
      addNotification({ type:"success", title:"New Admission", body:`${form.name} → ${docName} on ${form.date}`, nav:"patients" });
    } catch (err) {
      if (created) await api.deletePatient(created._id).catch(() => {});   // undo the half-finished admission
      if (err.network) setDbStatus("offline");
      if (created && err.status === 409) {
        showToast("That slot was just booked. Please pick another slot.","warning");
        setBookForm(f => ({ ...f, time:"" }));
        setSlotReload(n => n + 1);
        loadAll();
      } else {
        showToast(err.message, err.status === 409 ? "warning" : "error");
      }
    } finally {
      setSaving(false);
    }
  }

  // status change is saved with PUT /api/doctors/:id
  async function toggleDocStatus(id) {
    const doc  = doctors.find(d => d.id === id);
    if (!doc) return;
    const next = doc.status === "Available" ? "Busy" : doc.status === "Busy" ? "On Leave" : "Available";
    try {
      const updated = await api.updateDoctor(id, { status: next });
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, status: updated.status } : d));
      showToast(`${doc.name} is now ${updated.status} (saved)`,"info");
    } catch (e) {
      if (e.network) setDbStatus("offline");
      showToast(`Could not update ${doc.name}: ${e.message}`,"error");
    }
  }

  function createInvoice(data) {
    const inv = { ...data, id:nextInvoiceId(), status:"Unpaid", paidOn:null };
    setInvoices(prev => [inv, ...prev]);
    showToast(`Invoice ${inv.id} created for ${inv.patientName}`,"success");
    addNotification({ type:"info", title:"Invoice Created", body:`${inv.id} · ${inv.patientName} · $${inv.grandTotal.toFixed(2)}`, nav:"billing" });
    return inv;
  }

  function processPayment(invoiceId, method) {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId
      ? { ...inv, status:"Paid", paidOn:getTodayPlus(0), paymentMethod:method }
      : inv
    ));
    const inv = invoices.find(i => i.id === invoiceId);
    showToast(`Payment of $${inv?.grandTotal.toFixed(2)} received via ${method}`,"success");
    addNotification({ type:"success", title:"Payment Received", body:`${invoiceId} · $${inv?.grandTotal.toFixed(2)} via ${method}`, nav:"billing" });
    setPaymentModal(null);
  }

  function voidInvoice(invoiceId) {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status:"Voided" } : inv));
    showToast(`Invoice ${invoiceId} voided`,"warning");
    setViewInvoiceModal(null);
  }

  function markAllRead()    { setNotifications(n => n.map(x => ({ ...x, read:true }))); }
  function dismissNotif(id) { setNotifications(n => n.filter(x => x.id !== id)); }
  function clearAllNotif()  { setNotifications([]); }

  function downloadRecord(p) {
    const blob = new Blob(
      [`HOSPITAL SLIP\nID: ${p.code}\nPatient: ${p.name}\nAge / Gender: ${p.age || "—"} / ${p.gender || "—"}\nLatest visit: ${p.lastVisit || "—"}\nReason: ${p.condition}\nDoctor: ${p.doctor}\nStatus: ${p.status}`],
      { type:"text/plain" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Record_${p.name}.txt`;
    a.click();
  }

  function exportDB() {
    // exports what is currently loaded in the browser (MongoDB data + front-end invoices)
    const data = JSON.stringify({ departments, doctors, patients, appointments, invoices }, null, 2);
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(data);
    a.download = "medcare_backup.json";
    a.click();
    showToast("System Database Exported","success");
  }

  function printInvoice(inv) {
    const lines = inv.lineItems.map(l => `  ${l.label.padEnd(30)} x${l.qty}   $${l.total.toFixed(2)}`).join("\n");
    const txt = `
═══════════════════════════════════════
          MedCare Nexus — INVOICE
═══════════════════════════════════════
Invoice #  : ${inv.id}
Date       : ${inv.date}
Due Date   : ${inv.dueDate}
Patient    : ${inv.patientName}
Doctor     : ${inv.doctor}
Department : ${inv.dept}
───────────────────────────────────────
SERVICES
${lines}
───────────────────────────────────────
Subtotal   : $${inv.subtotal.toFixed(2)}
Discount   : -$${inv.discount.toFixed(2)}
Tax (9%)   : $${inv.tax.toFixed(2)}
─────────────────────────────
TOTAL DUE  : $${inv.grandTotal.toFixed(2)}
═══════════════════════════════════════
Status     : ${inv.status}${inv.paidOn ? " ("+inv.paidOn+")" : ""}
Payment    : ${inv.paymentMethod || "—"}
═══════════════════════════════════════
    `.trim();
    const win = window.open("", "_blank");
    win.document.write(`<pre style="font-family:monospace;padding:32px;font-size:14px;">${txt}</pre>`);
    win.print();
  }

  /* ── RENDER ── */
  const css = darkMode ? dark : light;
  const toastLayer = (
    <div className="mc-toasts">
      {toasts.map(t => <Toast key={t.id} toast={t}/>)}
    </div>
  );
  if (!loggedIn) return <>{toastLayer}<LoginScreen onLogin={handleLogin} /></>;

  const navItems = [
    ["dashboard",    "📊", "Dashboard"],
    ["analytics",    "📈", "Analytics"],
    ["doctors",      "👨‍⚕️", "Doctors"],
    ["patients",     "🤕", "Patients"],
    ["appointments", "📅", "Admissions"],
    ["billing",      "💳", "Billing"],
    ["settings",     "⚙️", "Settings"],
  ];
  const badge = {
    online:  { dot:"#22c55e", bg:"#dcfce7", fg:"#166534", text:"MongoDB connected" },
    offline: { dot:"#ef4444", bg:"#fee2e2", fg:"#991b1b", text:"DB offline" },
    loading: { dot:"#f59e0b", bg:"#fef9c3", fg:"#854d0e", text:"Loading" },
  }[dbStatus];
  const noData = doctors.length === 0 && patients.length === 0;

  return (
    <div className="mc-shell" style={{background:css.bg,color:css.text}}>

      {/* TOASTS */}
      {toastLayer}

      {/* GENERIC MODAL (Activity / Revenue detail) */}
      {modal && (
        <>
          <div onClick={() => setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:19999,backdropFilter:"blur(4px)"}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:css.card,width:"min(580px, 92vw)",maxHeight:"85vh",overflowY:"auto",padding:"clamp(18px, 4vw, 30px)",borderRadius:16,zIndex:20000,boxShadow:"0 25px 50px rgba(0,0,0,.25)",animation:"slideUp .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#4361ee"}}>{modal.title}</h3>
              <button onClick={() => setModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:css.textGray}}>✕</button>
            </div>
            <div>{modal.content}</div>
            <div style={{marginTop:25,display:"flex",justifyContent:"flex-end",gap:10,flexWrap:"wrap"}}>
              <button onClick={() => setModal(null)} style={btnOutlineStyle(css)}>Close</button>
              <button onClick={() => window.print()} style={btnStyle}>🖨 Print</button>
            </div>
          </div>
        </>
      )}

      {/* SCHEDULE MODAL */}
      {scheduleModal && (
        <ScheduleModal doctor={scheduleModal} css={css} onClose={() => setScheduleModal(null)}/>
      )}

      {/* CREATE INVOICE MODAL */}
      {invoiceModal && (
        <CreateInvoiceModal
          patient={invoiceModal.patient}
          patients={patients}
          departments={departments}
          css={css}
          onClose={() => setInvoiceModal(null)}
          onCreate={(data) => { createInvoice(data); setInvoiceModal(null); navigate("billing"); }}
        />
      )}

      {/* VIEW INVOICE MODAL */}
      {viewInvoiceModal && (
        <ViewInvoiceModal
          invoice={viewInvoiceModal.invoice}
          css={css}
          onClose={() => setViewInvoiceModal(null)}
          onPay={() => { setPaymentModal({ invoice:viewInvoiceModal.invoice }); setViewInvoiceModal(null); }}
          onPrint={() => printInvoice(viewInvoiceModal.invoice)}
          onVoid={() => voidInvoice(viewInvoiceModal.invoice.id)}
        />
      )}

      {/* PAYMENT MODAL */}
      {paymentModal && (
        <PaymentModal
          invoice={paymentModal.invoice}
          css={css}
          onClose={() => setPaymentModal(null)}
          onPay={(method) => processPayment(paymentModal.invoice.id, method)}
        />
      )}

      {/* SIDEBAR: fixed column on desktop, off-canvas drawer under 900px */}
      {sidebarOpen && <div className="mc-backdrop" onClick={() => setSidebarOpen(false)}/>}
      <aside className={`mc-sidebar${sidebarOpen ? " open" : ""}`} style={{background:css.card,borderRight:`1px solid ${css.border}`}}>
        <div style={{fontSize:22,fontWeight:800,color:"#4361ee",marginBottom:36,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:26}}>🏥</span> MedCare
          <button className="mc-drawer-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)} style={{color:css.textGray}}>✕</button>
        </div>
        <nav>
          {navItems.map(([id, icon, label]) => (
            <div key={id} onClick={() => navigate(id)} role="button" tabIndex={0}
              onKeyDown={e => e.key === "Enter" && navigate(id)}
              style={{padding:"11px 14px",marginBottom:4,borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontSize:14,transition:"all .2s",
                background: section===id ? (darkMode ? "rgba(67,97,238,.18)" : "#eef2ff") : "transparent",
                color:      section===id ? "#4361ee" : css.textGray,
                fontWeight: section===id ? 600 : 400,
              }}>
              <span>{icon}</span>{label}
              {id === "billing" && invoices.filter(i => i.status === "Unpaid").length > 0 && (
                <span style={{marginLeft:"auto",background:"#ef4444",color:"white",fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20}}>
                  {invoices.filter(i => i.status === "Unpaid").length}
                </span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="mc-main">

        {/* HEADER */}
        <header className="mc-header" style={{background:css.card,borderBottom:`1px solid ${css.border}`}}>
          <button className="mc-hamburger" aria-label="Open menu" onClick={() => setSidebarOpen(true)}
            style={{color:css.text,border:`1px solid ${css.border}`}}>☰</button>
          <h2 className="mc-title" style={{margin:0,fontSize:20,fontWeight:700,textTransform:"capitalize"}}>
            {section === "billing" ? "Billing & Payments" : section === "appointments" ? "Admissions" : section}
          </h2>
          <div className="mc-search">
            <div style={{background:css.bg,padding:"9px 18px",borderRadius:50,display:"flex",alignItems:"center",gap:10,border:`1px solid ${css.border}`}}>
              <span style={{color:css.textGray}}>🔍</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search patients..."
                style={{border:"none",background:"transparent",outline:"none",width:"100%",color:css.text,fontSize:13}}/>
            </div>
          </div>
          <div className="mc-header-actions">

            {/* DB STATUS BADGE */}
            <span className="mc-db-badge" title={loadError || badge.text}
              style={{background:badge.bg,color:badge.fg}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:badge.dot,flexShrink:0}}/>
              <span className="mc-db-badge-text">{badge.text}</span>
            </span>

            {/* BELL */}
            <div style={{position:"relative"}}>
              <button onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }} aria-label="Notifications"
                style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:css.textGray,position:"relative",padding:4}}>
                🔔
                {unreadCount > 0 && (
                  <span style={{position:"absolute",top:-4,right:-4,background:"#ef233c",color:"white",fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotifPanel
                  notifications={notifications}
                  css={css}
                  onMarkAll={markAllRead}
                  onDismiss={dismissNotif}
                  onClearAll={clearAllNotif}
                  onNav={(nav) => { if (nav) navigate(nav); setNotifOpen(false); }}
                />
              )}
            </div>

            {/* USER MENU */}
            <div style={{position:"relative"}}>
              <div onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
                style={{width:38,height:38,background:"#4361ee",borderRadius:"50%",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,cursor:"pointer",fontSize:14,boxShadow:"0 4px 12px rgba(67,97,238,.35)"}}>
                {(user.name || "A")[0].toUpperCase()}
              </div>
              {userMenuOpen && (
                <div style={{position:"absolute",top:50,right:0,width:230,background:css.card,borderRadius:12,boxShadow:"0 12px 32px rgba(0,0,0,.15)",border:`1px solid ${css.border}`,zIndex:1000,overflow:"hidden",animation:"menuSlide .2s ease"}}>
                  <div style={{padding:14,background:css.bg,borderBottom:`1px solid ${css.border}`}}>
                    <strong style={{display:"block",fontSize:13,color:css.text}}>{user.name}</strong>
                    <span style={{fontSize:11,color:"#4361ee",wordBreak:"break-all"}}>{user.email} · {user.role}</span>
                  </div>
                  {[["⚙️ Profile Settings","settings"],["🔄 Reload data from MongoDB",null]].map(([label, nav], i) => (
                    <div key={i} onClick={() => { if (nav) navigate(nav); else loadAll(); setUserMenuOpen(false); }}
                      style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:10,fontSize:13,cursor:"pointer",color:css.text}}>
                      {label}
                    </div>
                  ))}
                  <div style={{height:1,background:css.border}}/>
                  <div onClick={() => { if (confirm("Log out?")) handleLogout(); }}
                    style={{padding:"11px 14px",fontSize:13,cursor:"pointer",color:"#ef4444"}}>
                    🚪 Logout System
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="mc-content">

          {dbStatus === "loading" && noData && (
            <div className="mc-banner" style={{background:css.card,border:`1px solid ${css.border}`,color:css.textGray}}>
              ⏳ Loading departments, doctors, patients and appointments from MongoDB...
            </div>
          )}
          {dbStatus === "offline" && (
            <div className="mc-banner" style={{background:"#fee2e2",border:"1px solid #fecaca",color:"#991b1b"}}>
              <span>⛔ Could not load data from the API: {loadError}</span>
              <button onClick={loadAll} style={{...btnStyle,padding:"6px 14px",fontSize:12}}>Retry</button>
            </div>
          )}

          {section === "dashboard" && (
            <DashboardSection
              patients={patients} doctors={doctors} appointments={appointments} invoices={invoices}
              totalRevenue={totalRevenue} css={css}
              onViewActivity={a  => setModal({ title:"Activity Details",  content:<ActivityDetail a={a} css={css}/> })}
              onRevenue={()      => setModal({ title:"Financial Report",   content:<RevenueDetail invoices={invoices} css={css}/> })}
              onNavigate={navigate}
            />
          )}

          {section === "analytics" && (
            <AnalyticsSection css={css} showToast={showToast}/>
          )}

          {section === "doctors" && (
            <DoctorsSection
              doctors={filteredDocs} departments={departments}
              filter={docFilter} setFilter={setDocFilter}
              css={css} showToast={showToast}
              onToggle={toggleDocStatus}
              onSchedule={d => setScheduleModal(d)}
            />
          )}

          {section === "patients" && (
            <PatientsSection
              patients={filteredPatients} invoices={invoices} css={css}
              onNavigate={navigate}
              onDownload={downloadRecord}
              onCreateInvoice={p   => setInvoiceModal({ patient:p })}
              onViewInvoice={inv   => setViewInvoiceModal({ invoice:inv })}
            />
          )}

          {section === "appointments" && (
            <AdmissionsSection
              departments={departments} bookForm={bookForm} setBookForm={setBookForm}
              availableSlots={availableSlots} slotError={slotError} slotsLoading={slotsLoading}
              availableDoctors={availableDoctors} saving={saving}
              selectedPart={selectedPart} setSelectedPart={setSelectedPart}
              onSubmit={handleBooking} css={css}
            />
          )}

          {section === "billing" && (
            <BillingSection
              invoices={invoices} patients={patients} css={css}
              onCreateInvoice={() => setInvoiceModal({ patient:null })}
              onViewInvoice={inv  => setViewInvoiceModal({ invoice:inv })}
              onPay={inv          => setPaymentModal({ invoice:inv })}
              onPrint={printInvoice}
            />
          )}

          {section === "settings" && (
            <SettingsSection
              darkMode={darkMode} setDarkMode={setDarkMode}
              css={css} showToast={showToast} onExport={exportDB}
            />
          )}

        </div>
      </main>
    </div>
  );
}
