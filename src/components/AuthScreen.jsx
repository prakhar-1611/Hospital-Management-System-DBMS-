/* ============================================================
   AuthScreen.jsx — one sign-in page for all three portals.
   - Sign in (email + password) works for admin, doctor and patient;
     the server's answer (user.role) decides which portal opens.
   - "Create account" registers a PATIENT (POST /api/auth/register).
   - "Continue with Google" (patients) uses Google Identity Services.
     It is enabled when the backend has GOOGLE_CLIENT_ID set
     (GET /api/auth/config); the ID token is verified by the server.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import * as api from "../api";
import Icon, { GoogleLogo } from "../ui/Icon";
import { Spinner } from "../ui/kit";
import { PORTALS } from "../ui/theme";

const DEMO = [
  { role: "Admin",   email: "admin@medcare.com",          password: "admin123",   color: PORTALS.admin.accent },
  { role: "Doctor",  email: "dr.sarah.smith@medcare.com", password: "doctor123",  color: PORTALS.doctor.accent },
  { role: "Patient", email: "thomas.iyer1@mail.com",      password: "patient123", color: PORTALS.patient.accent },
];

const C = { text: "#0f172a", gray: "#64748b", border: "#e2e8f0", bg: "#f8fafc", accent: "#4361ee" };
const input = { width: "100%", padding: "11px 13px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: "none", color: C.text, background: "white" };
const label = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 6 };

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
      <button type="button" onClick={() => onError("Google sign-in is not switched on yet. The administrator needs to add GOOGLE_CLIENT_ID to backend/.env (see README).")}
        style={{ ...input, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", fontWeight: 600, color: "#334155" }}>
        <GoogleLogo/> Continue with Google
      </button>
    );
  }
  return (
    <div style={{ minHeight: 44, display: "flex", justifyContent: "center" }}>
      <div ref={box} style={{ width: "100%", display: "flex", justifyContent: "center" }}/>
      {!ready && <div style={{ ...input, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: C.gray }}><Spinner size={14}/> Loading Google…</div>}
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

  async function finish(promise) {
    setBusy(true); setError(""); setInfo("");
    try {
      const u = await promise;
      onAuthed(u);
    } catch (e) {
      setError(e.status === 401 && mode === "signin" ? "Invalid email or password" : e.message);
      setBusy(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (mode === "signin") {
      if (!form.email || !form.password) return setError("Enter your email and password");
      return finish(api.login(form.email.trim(), form.password));
    }
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError("Name, email and password are required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    const age = form.age === "" ? undefined : Number(form.age);
    if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 120)) return setError("Age must be a whole number from 0 to 120");
    finish(api.register({ name: form.name.trim(), email: form.email.trim(), password: form.password,
      phone: form.phone.trim() || undefined, age, gender: form.gender || undefined }));
  }

  const onGoogle = (credential) => finish(api.googleLogin(credential));
  const switchMode = (m) => { setMode(m); setError(""); setInfo(""); };

  return (
    <div className="mc-auth" style={{ background: C.bg, zIndex: 50000 }}>
      {/* brand panel */}
      <section className="mc-auth-brand" style={{ background: "linear-gradient(145deg,#0b1437 0%,#1e2a78 55%,#4361ee 100%)" }}>
        <div aria-hidden="true" style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.12),transparent 70%)", top: -120, right: -120 }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.2)" }}>
            <Icon name="hospital" size={24}/>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>MedCare Hospital</div>
            <div style={{ fontSize: 12, opacity: .75 }}>Appointment &amp; care management</div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <h1 style={{ fontSize: "clamp(26px, 3.4vw, 40px)", lineHeight: 1.15, fontWeight: 800, maxWidth: 520 }}>
            One hospital.<br/>Three connected portals.
          </h1>
          <p style={{ marginTop: 14, fontSize: 15, opacity: .8, maxWidth: 480, lineHeight: 1.55 }}>
            Sign in once and you land in the workspace made for your role. Each portal only shows the records that role is allowed to see.
          </p>
          <div className="mc-auth-portals" style={{ display: "grid", gap: 12, marginTop: 28, maxWidth: 520 }}>
            {[
              ["shield", PORTALS.admin, "Hospital operations, doctors, admissions, billing and analytics."],
              ["stethoscope", PORTALS.doctor, "Today's queue, your own patients, consultation notes and schedule."],
              ["heart", PORTALS.patient, "Book visits, track appointments, read visit notes, manage your profile."],
            ].map(([icon, p, text]) => (
              <div key={p.name} style={{ display: "flex", gap: 14, padding: 14, borderRadius: 14, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: p.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={icon} size={19}/>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, opacity: .78, marginTop: 2 }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mc-auth-portals" style={{ display: "flex", gap: 22, fontSize: 12.5, opacity: .8, flexWrap: "wrap", position: "relative" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="ambulance" size={15}/> Emergency: 108</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={15}/> Helpdesk: +91 416 220 0000</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={15}/> OPD 8 AM – 8 PM</span>
        </div>
      </section>

      {/* form */}
      <section className="mc-auth-form">
        <form onSubmit={submit} style={{ width: "min(420px, 100%)" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text }}>{mode === "signin" ? "Welcome back" : "Create your patient account"}</h2>
          <p style={{ color: C.gray, fontSize: 14, marginTop: 6, marginBottom: 22 }}>
            {mode === "signin" ? "Sign in to continue to your portal." : "Book appointments and see your visit history online."}
          </p>

          <div style={{ display: "flex", padding: 4, background: "#eef2f7", borderRadius: 12, marginBottom: 22 }}>
            {[["signin", "Sign in"], ["register", "New patient"]].map(([id, text]) => (
              <button key={id} type="button" onClick={() => switchMode(id)}
                style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 650, fontSize: 13.5,
                  background: mode === id ? "white" : "transparent", color: mode === id ? C.text : C.gray, boxShadow: mode === id ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>
                {text}
              </button>
            ))}
          </div>

          <GoogleButton clientId={clientId} onCredential={onGoogle} onError={setError} text={mode === "signin" ? "signin_with" : "signup_with"}/>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", color: C.gray, fontSize: 12 }}>
            <span style={{ flex: 1, height: 1, background: C.border }}/>{mode === "signin" ? "or sign in with email" : "or register with email"}<span style={{ flex: 1, height: 1, background: C.border }}/>
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <label style={label} htmlFor="r-name">Full name</label>
              <input id="r-name" style={input} value={form.name} onChange={set("name")} autoComplete="name" placeholder="e.g. Ananya Sharma"/>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={label} htmlFor="a-email">Email</label>
            <input id="a-email" type="email" style={input} value={form.email} onChange={set("email")} autoComplete="username" placeholder="you@example.com"/>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label} htmlFor="a-pass">Password</label>
            <div style={{ position: "relative" }}>
              <input id="a-pass" type={showPw ? "text" : "password"} style={{ ...input, paddingRight: 42 }} value={form.password} onChange={set("password")}
                autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Your password" : "At least 6 characters"}/>
              <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.gray, padding: 4 }}>
                <Icon name="eye" size={17}/>
              </button>
            </div>
          </div>
          {mode === "register" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px", gap: 10, marginBottom: 14 }}>
              <div>
                <label style={label} htmlFor="r-phone">Phone</label>
                <input id="r-phone" style={input} value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="+91…"/>
              </div>
              <div>
                <label style={label} htmlFor="r-age">Age</label>
                <input id="r-age" type="number" min="0" max="120" style={input} value={form.age} onChange={set("age")}/>
              </div>
              <div>
                <label style={label} htmlFor="r-gender">Gender</label>
                <select id="r-gender" style={input} value={form.gender} onChange={set("gender")}>
                  <option value="">—</option><option>Female</option><option>Male</option><option>Other</option>
                </select>
              </div>
            </div>
          )}

          {error && <div role="alert" style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, marginBottom: 14 }}><Icon name="alert" size={16}/>{error}</div>}
          {info && !error && <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", borderRadius: 10, fontSize: 13, marginBottom: 14 }}><Icon name="info" size={16}/>{info}</div>}

          <button type="submit" disabled={busy}
            style={{ width: "100%", padding: 13, border: "none", borderRadius: 10, background: C.accent, color: "white", fontWeight: 700, fontSize: 15,
              cursor: busy ? "wait" : "pointer", opacity: busy ? .75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {busy && <Spinner size={15}/>}{mode === "signin" ? "Sign in" : "Create account"}
          </button>

          {mode === "signin" && (
            <div style={{ marginTop: 22, padding: 14, borderRadius: 12, background: "white", border: `1px dashed ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 10, textTransform: "uppercase", letterSpacing: .6 }}>Demo accounts</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DEMO.map(d => (
                  <button key={d.role} type="button" onClick={() => { setForm(f => ({ ...f, email: d.email, password: d.password })); setError(""); }}
                    style={{ flex: "1 1 100px", padding: "8px 10px", borderRadius: 9, border: `1px solid ${d.color}40`, background: `${d.color}10`, color: d.color, fontWeight: 650, fontSize: 12.5, cursor: "pointer" }}>
                    {d.role}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: C.gray, marginTop: 8 }}>Fills in a seeded account. Every seeded doctor uses doctor123 and every patient patient123.</div>
            </div>
          )}
          <p style={{ fontSize: 11.5, color: C.gray, marginTop: 18, textAlign: "center" }}>
            Staff accounts are created by the hospital administrator. Google sign-in is for patients.
          </p>
        </form>
      </section>
    </div>
  );
}
