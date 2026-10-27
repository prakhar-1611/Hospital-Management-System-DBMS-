/* ============================================================
   AuthScreen.jsx — one sign-in page for all three portals.
   - Sign in (email + password) works for admin, doctor and patient;
     the server's answer (user.role) decides which portal opens.
   - "Create account" registers a PATIENT (POST /api/auth/register).
   - "Continue with Google" (patients) uses Google Identity Services.
     It is enabled when the backend has GOOGLE_CLIENT_ID set
     (GET /api/auth/config); the ID token is verified by the server.
   Layout: the same framed sheet as the portals. The frame carries the
   brand and the three portals; the sheet carries the form. Colours are
   the :root tokens in App.css (light and dark follow the system).
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import * as api from "../api";
import Icon, { GoogleLogo } from "../ui/Icon";
import { Spinner, Tabs, Notice } from "../ui/kit";
import { PORTALS } from "../ui/theme";

const DEMO = [
  { role: "Admin",   email: "admin@medcare.com",          password: "admin123",   color: PORTALS.admin.accent },
  { role: "Doctor",  email: "dr.sarah.smith@medcare.com", password: "doctor123",  color: PORTALS.doctor.accent },
  { role: "Patient", email: "thomas.iyer1@mail.com",      password: "patient123", color: PORTALS.patient.accent },
];

const PORTAL_INFO = [
  [PORTALS.admin, "Hospital staff and reception", "Every appointment, walk-in registration, doctors, patients, billing and analytics."],
  [PORTALS.doctor, "Doctors", "Today's queue, your own patients, consultation notes and your schedule."],
  [PORTALS.patient, "Patients", "Book, reschedule or cancel visits and read what your doctor wrote."],
];

let gsiPromise = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true; s.defer = true;
      s.onload = resolve;
      s.onerror = () => { gsiPromise = null; reject(new Error("Could not load Google sign-in")); };
      document.head.appendChild(s);
    });
  }
  return gsiPromise;
}

function GoogleButton({ clientId, onCredential, onError, text }) {
  const box = useRef(null);
  const [ready, setReady] = useState(false);
  const cb = useRef(onCredential);
  useEffect(() => { cb.current = onCredential; }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;
    let alive = true;
    loadGoogleScript().then(() => {
      if (!alive || !box.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential) });
      const width = Math.min(box.current.offsetWidth || 360, 400);
      window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", shape: "rectangular", text, width });
      setReady(true);
    }).catch(e => onError(e.message));
    return () => { alive = false; };
  }, [clientId, text, onError]);

  if (!clientId) {
    return (
      <button type="button" className="mc-btn mc-btn--outline mc-btn--lg" style={{ width: "100%" }}
        onClick={() => onError("Google sign-in is not switched on yet. The administrator needs to add GOOGLE_CLIENT_ID to backend/.env (see README).")}>
        <GoogleLogo/> Continue with Google
      </button>
    );
  }
  return (
    <div style={{ minHeight: 44, display: "flex", justifyContent: "center" }}>
      <div ref={box} style={{ width: "100%", display: "flex", justifyContent: "center" }}/>
      {!ready && <div className="mc-btn mc-btn--outline mc-btn--lg" style={{ width: "100%", color: "var(--muted)" }}><Spinner size={14}/> Loading Google</div>}
    </div>
  );
}

export default function AuthScreen({ onAuthed, notice }) {
  const [mode, setMode] = useState("signin");               // signin | register
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", age: "", gender: "" });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(notice || "");
  const [clientId, setClientId] = useState(null);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    api.getAuthConfig().then(c => setClientId(c.googleClientId)).catch(() => {});
  }, []);
  useEffect(() => { document.title = "Sign in · MedCare"; }, []);

  async function finish(promise) {
    setBusy(true); setError(""); setInfo("");
    try {
      const u = await promise;
      onAuthed(u);
    } catch (e) {
      setError(e.status === 401 && mode === "signin" ? "That email and password do not match. Check both and try again." : e.message);
      setBusy(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (mode === "signin") {
      if (!form.email || !form.password) return setError("Enter your email and password.");
      return finish(api.login(form.email.trim(), form.password));
    }
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError("Name, email and password are required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    const age = form.age === "" ? undefined : Number(form.age);
    if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 120)) return setError("Age must be a whole number from 0 to 120.");
    finish(api.register({ name: form.name.trim(), email: form.email.trim(), password: form.password,
      phone: form.phone.trim() || undefined, age, gender: form.gender || undefined }));
  }

  const onGoogle = (credential) => finish(api.googleLogin(credential));
  const switchMode = (m) => { setMode(m); setError(""); setInfo(""); };

  return (
    <div className="mc-auth">
      <section className="mc-auth-frame" aria-label="About MedCare">
        <div className="mc-brand" style={{ padding: 0 }}>
          <span className="mc-mark" aria-hidden="true"><Icon name="hospital" size={17}/></span>
          <div>
            <div className="mc-brand-name">MedCare Hospital</div>
            <div className="mc-brand-sub">Outpatient appointments and care</div>
          </div>
        </div>

        <div className="mc-auth-intro">
          <h1 style={{ fontSize: "clamp(24px, 2.6vw, 32px)", lineHeight: 1.2, fontWeight: 600, letterSpacing: "-0.02em", maxWidth: "18ch", textWrap: "balance" }}>
            One sign-in for patients, doctors and hospital staff.
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, color: "var(--muted)", maxWidth: "48ch" }}>
            You land in the portal for your role, and each portal shows only the records that role is allowed to see.
          </p>
          <ul style={{ listStyle: "none", marginTop: 28, maxWidth: 480, borderTop: "1px solid var(--border)" }}>
            {PORTAL_INFO.map(([p, who, text]) => (
              <li key={p.name} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: p.accent, marginTop: 6, flexShrink: 0 }}/>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name} <span style={{ fontWeight: 400, color: "var(--muted)" }}>for {who.toLowerCase()}</span></div>
                  <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 2 }}>{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: "flex", gap: "8px 22px", fontSize: 13.5, color: "var(--muted)", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--negative)", fontWeight: 500 }}><Icon name="ambulance" size={16}/> Emergency: <a href="tel:108" style={{ color: "inherit" }}>108</a></span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={15}/> Helpdesk +91 416 220 0000</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={15}/> OPD 8 AM to 8 PM, Mon to Sat</span>
        </div>
      </section>

      <main className="mc-auth-sheet">
        <form onSubmit={submit} noValidate style={{ width: "min(400px, 100%)" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.012em" }}>{mode === "signin" ? "Sign in" : "Create your patient account"}</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4, marginBottom: 18 }}>
            {mode === "signin" ? "Use the email your hospital account was made with." : "Book appointments and see your visit history online."}
          </p>

          <div style={{ marginBottom: 22 }}>
            <Tabs value={mode} onChange={switchMode} tabs={[{ id: "signin", label: "Sign in" }, { id: "register", label: "New patient" }]}/>
          </div>

          {info && !error && <Notice tone="info" style={{ marginBottom: 16 }}>{info}</Notice>}

          <GoogleButton clientId={clientId} onCredential={onGoogle} onError={setError} text={mode === "signin" ? "signin_with" : "signup_with"}/>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", color: "var(--muted)", fontSize: 13 }}>
            <span style={{ flex: 1, height: 1, background: "var(--border)" }}/>or with email<span style={{ flex: 1, height: 1, background: "var(--border)" }}/>
          </div>

          {mode === "register" && (
            <div className="mc-auth-field">
              <label htmlFor="r-name">Full name</label>
              <input id="r-name" className="mc-input" value={form.name} onChange={set("name")} autoComplete="name" placeholder="Ananya Sharma"/>
            </div>
          )}
          <div className="mc-auth-field">
            <label htmlFor="a-email">Email</label>
            <input id="a-email" type="email" className="mc-input" value={form.email} onChange={set("email")} autoComplete="username" inputMode="email" placeholder="you@example.com" spellCheck={false}/>
          </div>
          <div className="mc-auth-field">
            <label htmlFor="a-pass">Password</label>
            <div style={{ position: "relative" }}>
              <input id="a-pass" type={showPw ? "text" : "password"} className="mc-input" style={{ paddingRight: 46 }} value={form.password} onChange={set("password")}
                autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Your password" : "At least 6 characters"}/>
              <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? "Hide password" : "Show password"} aria-pressed={showPw}
                className="mc-iconbtn" style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name={showPw ? "eyeOff" : "eye"} size={17}/>
              </button>
            </div>
          </div>
          {mode === "register" && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 84px 118px", gap: 10 }}>
              <div className="mc-auth-field">
                <label htmlFor="r-phone">Phone <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
                <input id="r-phone" type="tel" className="mc-input" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="+91"/>
              </div>
              <div className="mc-auth-field">
                <label htmlFor="r-age">Age</label>
                <input id="r-age" type="number" inputMode="numeric" min="0" max="120" className="mc-input" value={form.age} onChange={set("age")}/>
              </div>
              <div className="mc-auth-field">
                <label htmlFor="r-gender">Gender</label>
                <select id="r-gender" className="mc-input" value={form.gender} onChange={set("gender")}>
                  <option value="">Not given</option><option>Female</option><option>Male</option><option>Other</option>
                </select>
              </div>
            </div>
          )}

          {error && <Notice tone="negative" style={{ marginBottom: 14 }}>{error}</Notice>}

          <button type="submit" disabled={busy} className="mc-btn mc-btn--primary mc-btn--lg" style={{ width: "100%", minHeight: 44 }}>
            {busy && <Spinner size={15}/>}{mode === "signin" ? (busy ? "Signing in" : "Sign in") : (busy ? "Creating account" : "Create account")}
          </button>

          {mode === "signin" && (
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--rule)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Try a demo account</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DEMO.map(d => (
                  <button key={d.role} type="button" className="mc-btn mc-btn--outline" style={{ flex: "1 1 96px" }}
                    onClick={() => { setForm(f => ({ ...f, email: d.email, password: d.password })); setError(""); }}>
                    <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: d.color }}/>{d.role}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>Fills in a sample account. Every sample doctor uses doctor123 and every patient patient123.</p>
            </div>
          )}
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 18 }}>
            Staff accounts are created by the hospital administrator. Google sign-in is for patients.
          </p>
        </form>
      </main>
    </div>
  );
}
