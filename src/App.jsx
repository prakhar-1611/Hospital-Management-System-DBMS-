import { useState, useEffect, useRef, useCallback } from "react";

import {
  light, dark,
  btnStyle, btnOutlineStyle,
  INITIAL_DOCTORS, INITIAL_PATIENTS, INITIAL_INVOICES, INITIAL_APPOINTMENTS,
  getTodayPlus, nextInvoiceId,
  DAY_NAMES, DAY_FULL,
  generateTimeSlots,
} from "./constants";

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
  const [loggedIn, setLoggedIn]         = useState(false);
  const [darkMode, setDarkMode]         = useState(false);
  const [doctors, setDoctors]           = useState(INITIAL_DOCTORS);
  const [patients, setPatients]         = useState(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [invoices, setInvoices]         = useState(INITIAL_INVOICES);
  const [notifications, setNotifications] = useState([
    { id:1, type:"alert",   title:"High ICU Load",   body:"Capacity reached 84%. Check Analytics.",       time:"10 mins ago", read:false, nav:"analytics" },
    { id:2, type:"success", title:"System Backup",   body:"Daily database backup completed.",              time:"2 hours ago", read:false, nav:"settings"  },
    { id:3, type:"info",    title:"Staff Update",    body:"Dr. James Wilson requested schedule change.",   time:"5 hours ago", read:false, nav:"doctors"   },
    { id:4, type:"warning", title:"Invoice Pending", body:"INV-0003 for Robert Stark is due in 7 days.",  time:"1 hour ago",  read:false, nav:"billing"   },
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
  const navigate = (sec) => { setSection(sec); setNotifOpen(false); setUserMenuOpen(false); };

  /* ── BOOKING STATE ── */
  const [bookForm, setBookForm]       = useState({ name:"", condition:"", dept:"General", doctor:"", date:"", time:"" });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotError, setSlotError]     = useState("");

  useEffect(() => {
    if (!bookForm.doctor || !bookForm.date) { setAvailableSlots([]); setSlotError(""); return; }
    const doc = doctors.find(d => d.name === bookForm.doctor);
    if (!doc) return;
    const dow = new Date(bookForm.date).getDay();
    if (!doc.workingDays.includes(dow)) {
      setAvailableSlots([]);
      setSlotError(`${doc.name} does not work on ${DAY_FULL[dow]}s. Working days: ${doc.workingDays.map(d => DAY_NAMES[d]).join(", ")}`);
      return;
    }
    const allSlots = generateTimeSlots(doc.workingHours.start, doc.workingHours.end);
    const busy     = doc.busySlots.filter(s => s.date === bookForm.date).map(s => s.time);
    const booked   = appointments.filter(a => a.doctor === doc.name && a.date === bookForm.date).map(a => a.time);
    const blocked  = new Set([...busy, ...booked]);
    const free     = allSlots.filter(s => !blocked.has(s));
    setAvailableSlots(free);
    setSlotError(free.length === 0 ? "No available slots on this date for this doctor." : "");
  }, [bookForm.doctor, bookForm.date, doctors, appointments]);

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
  function handleLogin(user, pass) {
    if (user === "admin" && pass === "123") { setLoggedIn(true); showToast("Welcome Administrator","success"); }
    else showToast("Invalid Credentials","warning");
  }

  function handleBooking(e) {
    e.preventDefault();
    if (!bookForm.time) { showToast("Please select a time slot","warning"); return; }
    const newPt  = { id:200+patients.length, name:bookForm.name, condition:bookForm.condition||"Checkup", doctor:bookForm.doctor, dept:bookForm.dept, status:"Admitted", admitDate:bookForm.date };
    const newApt = { id:Date.now(), patient:bookForm.name, action:"Admission", time:bookForm.time, date:bookForm.date, doctor:bookForm.doctor, status:"Pending" };
    setPatients(p => [...p, newPt]);
    setAppointments(a => [newApt, ...a]);
    setDoctors(prev => prev.map(d => d.name === bookForm.doctor ? { ...d, busySlots:[...d.busySlots,{date:bookForm.date,time:bookForm.time}] } : d));
    setBookForm({ name:"", condition:"", dept:"General", doctor:"", date:"", time:"" });
    setSelectedPart(null);
    navigate("patients");
    showToast(`${bookForm.name} admitted — ${bookForm.date} at ${bookForm.time}`,"success");
    addNotification({ type:"success", title:"New Admission", body:`${bookForm.name} → ${bookForm.doctor} on ${bookForm.date}`, nav:"patients" });
  }

  function toggleDocStatus(id) {
    const doc  = doctors.find(d => d.id === id);
    if (!doc) return;
    const next = doc.status === "Available" ? "Busy" : doc.status === "Busy" ? "On Leave" : "Available";
    showToast(`${doc.name} is now ${next}`,"info");
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, status:next } : d));
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
      [`HOSPITAL SLIP\nID: #${p.id}\nPatient: ${p.name}\nCondition: ${p.condition}\nDoctor: ${p.doctor}\nStatus: ${p.status}`],
      { type:"text/plain" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Record_${p.name}.txt`;
    a.click();
  }

  function exportDB() {
    const data = JSON.stringify({ doctors, patients, appointments, invoices }, null, 2);
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
  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  const navItems = [
    ["dashboard",    "📊", "Dashboard"],
    ["analytics",    "📈", "Analytics"],
    ["doctors",      "👨‍⚕️", "Doctors"],
    ["patients",     "🤕", "Patients"],
    ["appointments", "📅", "Admissions"],
    ["billing",      "💳", "Billing"],
    ["settings",     "⚙️", "Settings"],
  ];

  return (
    <div style={{display:"flex",height:"100vh",width:"100%",overflow:"hidden",background:css.bg,color:css.text,fontFamily:"'Inter','Segoe UI',sans-serif",transition:"all .3s"}}>

      {/* TOASTS */}
      <div style={{position:"fixed",top:20,right:20,zIndex:99999,pointerEvents:"none"}}>
        {toasts.map(t => <Toast key={t.id} toast={t}/>)}
      </div>

      {/* GENERIC MODAL (Activity / Revenue detail) */}
      {modal && (
        <>
          <div onClick={() => setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:19999,backdropFilter:"blur(4px)"}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:css.card,width:520,maxHeight:"85vh",overflowY:"auto",padding:30,borderRadius:16,zIndex:20000,boxShadow:"0 25px 50px rgba(0,0,0,.25)",animation:"slideUp .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#4361ee"}}>{modal.title}</h3>
              <button onClick={() => setModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:css.textGray}}>✕</button>
            </div>
            <div>{modal.content}</div>
            <div style={{marginTop:25,display:"flex",justifyContent:"flex-end",gap:10}}>
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

      {/* SIDEBAR */}
      <aside style={{width:260,flexShrink:0,background:css.card,borderRight:`1px solid ${css.border}`,display:"flex",flexDirection:"column",padding:20,height:"100%",transition:"all .3s"}}>
        <div style={{fontSize:22,fontWeight:800,color:"#4361ee",marginBottom:36,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:26}}>🏥</span> MedCare
        </div>
        {navItems.map(([id, icon, label]) => (
          <div key={id} onClick={() => navigate(id)}
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
        
      </aside>

      {/* MAIN */}
      <main style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>

        {/* HEADER */}
        <header style={{height:72,background:css.card,borderBottom:`1px solid ${css.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",flexShrink:0}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,textTransform:"capitalize"}}>
            {section === "billing" ? "Billing & Payments" : section}
          </h2>
          <div style={{flex:1,maxWidth:360,margin:"0 24px"}}>
            <div style={{background:css.bg,padding:"9px 18px",borderRadius:50,display:"flex",alignItems:"center",gap:10,border:`1px solid ${css.border}`}}>
              <span style={{color:css.textGray}}>🔍</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search records..."
                style={{border:"none",background:"transparent",outline:"none",width:"100%",color:css.text,fontSize:13}}/>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>

            {/* BELL */}
            <div style={{position:"relative"}}>
              <button onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }}
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
                A
              </div>
              {userMenuOpen && (
                <div style={{position:"absolute",top:50,right:0,width:210,background:css.card,borderRadius:12,boxShadow:"0 12px 32px rgba(0,0,0,.15)",border:`1px solid ${css.border}`,zIndex:1000,overflow:"hidden",animation:"menuSlide .2s ease"}}>
                  <div style={{padding:14,background:css.bg,borderBottom:`1px solid ${css.border}`}}>
                    <strong style={{display:"block",fontSize:13,color:css.text}}>Admin User</strong>
                    <span style={{fontSize:11,color:"#4361ee"}}>System Administrator</span>
                  </div>
                  {[["⚙️ Profile Settings","settings"],["🛡 Security Log",null]].map(([label, nav], i) => (
                    <div key={i} onClick={() => { if (nav) navigate(nav); else showToast("Last Login: Just Now","info"); setUserMenuOpen(false); }}
                      style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:10,fontSize:13,cursor:"pointer",color:css.text}}>
                      {label}
                    </div>
                  ))}
                  <div style={{height:1,background:css.border}}/>
                  <div onClick={() => { if (confirm("Log out?")) setLoggedIn(false); }}
                    style={{padding:"11px 14px",fontSize:13,cursor:"pointer",color:"#ef4444"}}>
                    🚪 Logout System
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:28}}>

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
              doctors={filteredDocs} filter={docFilter} setFilter={setDocFilter}
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
              doctors={doctors} bookForm={bookForm} setBookForm={setBookForm}
              availableSlots={availableSlots} slotError={slotError}
              availableDoctors={availableDoctors}
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

      <style>{`
        @keyframes slideUp   { from{transform:translate(-50%,-44%) scale(.97);opacity:0} to{transform:translate(-50%,-50%) scale(1);opacity:1} }
        @keyframes menuSlide { from{opacity:0;transform:translateY(-6px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(110%) scale(.96)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes fadeIn    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }
        html,body { width:100%; height:100%; margin:0; padding:0; overflow:hidden }
        #root { width:100%; height:100% }
        button:active { transform:scale(.97) }
        ::-webkit-scrollbar { width:6px }
        ::-webkit-scrollbar-thumb { background:#c1c8d4; border-radius:3px }
        input,select { font-family:inherit }
        * { -webkit-font-smoothing:antialiased }
      `}</style>
    </div>
  );
}
