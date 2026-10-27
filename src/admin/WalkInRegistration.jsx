/* ============================================================
   WalkInRegistration.jsx — reception desk booking for walk-ins, phone
   bookings and patients without a phone or email. Patients normally book
   themselves in MyMedCare.
   New patient:      POST /api/patients (login + profile in one transaction),
                     then POST /api/appointments; the patient is deleted
                     again if the booking fails.
   Existing patient: POST /api/appointments with patientId.
   ============================================================ */
import { useState } from "react";
import * as api from "../api";
import { Card, SectionTitle, Field, Button, Tabs, Avatar, Notice } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import SlotPicker from "../patient/SlotPicker";
import { fmtDate, fmtTime } from "../ui/dates";
import { money } from "../ui/records";

const EMPTY = { name: "", phone: "", age: "", gender: "", email: "", address: "" };
const QUICK = ["Fever", "Follow-up visit", "Pain", "Injury", "General check-up", "Referred by another doctor"];

export default function WalkInRegistration({ css, departments, doctors, patients, showToast, onDone, onNavigate }) {
  const [mode, setMode] = useState("new");                 // new | existing
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [deptName, setDeptName] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [slot, setSlot] = useState({ date: "", time: "" });
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const dept = departments.find(d => d.name === deptName);
  const deptDoctors = doctors.filter(d => d.dept === deptName);
  const doctor = doctors.find(d => d.id === doctorId);
  const slotDoctor = doctor ? { ...doctor, _id: doctor.id } : null;      // SlotPicker expects the API shape
  const existing = patients.find(p => p.id === patientId);
  const term = search.trim().toLowerCase();
  const matches = term.length < 2 ? [] : patients.filter(p => p.name.toLowerCase().includes(term) || p.contact.includes(term) || p.code.toLowerCase().includes(term)).slice(0, 6);

  const who = mode === "new" ? form.name.trim() : existing?.name;
  const ready = !!who && !!doctorId && !!slot.date && !!slot.time;

  function reset() {
    setForm(EMPTY); setSearch(""); setPatientId(""); setDeptName(""); setDoctorId(""); setSlot({ date: "", time: "" }); setReason(""); setDone(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!ready || busy) return;
    const age = form.age === "" ? undefined : Number(form.age);
    if (mode === "new" && age !== undefined && (!Number.isInteger(age) || age < 0 || age > 120)) return showToast("Age must be a whole number from 0 to 120", "warning");
    setBusy(true);
    let created = null;
    try {
      let pid = patientId, email = null;
      if (mode === "new") {
        created = await api.createPatient({ name: form.name.trim(), age, gender: form.gender || undefined, phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined, address: form.address.trim() || undefined });
        pid = created._id; email = created.email;
      }
      await api.bookAppointment({ patientId: pid, doctorId, date: slot.date, timeSlot: slot.time, reason: reason.trim() || "Walk-in consultation" });
      setDone({ name: who, email, doctor: doctor.name, dept: deptName, date: slot.date, time: slot.time, fee: dept?.fee, isNew: mode === "new" });
      showToast(`${who} booked with ${doctor.name}`, "success");
      onDone(who, doctor.name, slot.date);
    } catch (err) {
      if (created) await api.deletePatient(created._id).catch(() => {});   // undo the half-finished registration
      showToast(err.status === 409 ? `${err.message}. Pick another slot.` : err.message, err.status === 409 ? "warning" : "error");
      if (err.status === 409) setSlot(s => ({ ...s, time: "" }));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card style={{ maxWidth: 560, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, color: "var(--positive)" }}>
          <Icon name="checkCircle" size={20}/><span style={{ fontWeight: 600, fontSize: 16 }}>{done.name} is booked</span>
        </div>
        <p style={{ color: "var(--muted)", marginBottom: 18 }}>{done.doctor}, {fmtDate(done.date)} at {fmtTime(done.time)}</p>
        <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 14, display: "grid", gap: 6, fontSize: 14 }}>
          <div><span style={{ color: "var(--muted)" }}>Department </span>{done.dept}</div>
          <div><span style={{ color: "var(--muted)" }}>Fee to collect </span><strong>{money(done.fee)}</strong></div>
        </div>
        {done.isNew && (
          <Notice tone="info" style={{ marginTop: 16 }}>
            <strong>MyMedCare login for the patient</strong><br/>
            Email: <span className="mono">{done.email}</span><br/>
            Temporary password: <span className="mono">patient123</span><br/>
            <span style={{ opacity: .85 }}>Give these to the patient so they can see this visit and book online next time. Ask them to change the password after signing in.</span>
          </Notice>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <Button icon="plus" onClick={reset}>Register another</Button>
          <Button variant="outline" onClick={() => onNavigate("appointments", "upcoming")}>View appointments</Button>
        </div>
      </Card>
    );
  }

  const label = (t) => <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t}</label>;
  return (
    <form onSubmit={submit} className="mc-split">
      <div className="mc-stack">
        <Card>
          <SectionTitle title="Patient"/>
          <Tabs value={mode} onChange={(m) => { setMode(m); setPatientId(""); }} tabs={[{ id: "new", label: "New patient" }, { id: "existing", label: "Existing patient" }]}/>
          <div style={{ marginTop: 16 }}>
            {mode === "new" ? (
              <div className="mc-form-grid">
                <Field label="Full name (required)"><input value={form.name} onChange={set("name")} style={inputStyle(css)} autoComplete="off"/></Field>
                <Field label="Phone"><input value={form.phone} onChange={set("phone")} style={inputStyle(css)} placeholder="+91" autoComplete="off" inputMode="tel"/></Field>
                <Field label="Age"><input type="number" min="0" max="120" value={form.age} onChange={set("age")} style={inputStyle(css)} inputMode="numeric"/></Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={set("gender")} style={inputStyle(css)}><option value="">Not given</option><option>Female</option><option>Male</option><option>Other</option></select>
                </Field>
                <Field label="Email" hint="Leave blank and a login email is generated"><input type="email" value={form.email} onChange={set("email")} style={inputStyle(css)} autoComplete="off"/></Field>
                <Field label="Address"><input value={form.address} onChange={set("address")} style={inputStyle(css)} autoComplete="off"/></Field>
              </div>
            ) : existing ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 8, border: "1px solid var(--accent)", background: "var(--accent-soft)" }}>
                <Avatar name={existing.name} size={36}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{existing.name}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}><span className="mono">{existing.code}</span>, {existing.contact || "no phone"}, {existing.visits} visit{existing.visits === 1 ? "" : "s"}</div>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => setPatientId("")}>Change</Button>
              </div>
            ) : (
              <div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16}/></span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or patient ID" aria-label="Find an existing patient" style={{ ...inputStyle(css), paddingLeft: 32 }} autoFocus/>
                </div>
                <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
                  {matches.map(p => (
                    <button type="button" key={p.id} onClick={() => setPatientId(p.id)} className="mc-row-hover"
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, border: 0, background: "transparent", color: "var(--ink)", cursor: "pointer", textAlign: "left", fontSize: 14 }}>
                      <Avatar name={p.name} size={28}/>
                      <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{p.contact || p.code}</span>
                    </button>
                  ))}
                  {term.length >= 2 && matches.length === 0 && <div style={{ fontSize: 13.5, color: "var(--muted)", padding: "6px 2px" }}>No patient found. Switch to New patient to register them.</div>}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Doctor and time"/>
          <div className="mc-form-grid" style={{ marginBottom: 18 }}>
            <Field label="Department">
              <select value={deptName} onChange={e => { setDeptName(e.target.value); setDoctorId(""); setSlot({ date: "", time: "" }); }} style={inputStyle(css)}>
                <option value="">Choose a department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name} ({money(d.fee)})</option>)}
              </select>
            </Field>
            <Field label="Doctor">
              <select value={doctorId} onChange={e => { setDoctorId(e.target.value); setSlot({ date: "", time: "" }); }} style={inputStyle(css)} disabled={!deptName}>
                <option value="">{deptName ? "Choose a doctor" : "Pick a department first"}</option>
                {deptDoctors.map(d => <option key={d.id} value={d.id} disabled={d.status === "On Leave"}>{d.name}{d.status !== "Available" ? ` (${d.status === "On Leave" ? "on leave" : d.status.toLowerCase()})` : ""}</option>)}
              </select>
            </Field>
          </div>
          {slotDoctor
            ? <SlotPicker css={css} doctor={slotDoctor} date={slot.date} time={slot.time} onChange={setSlot}/>
            : <p style={{ fontSize: 13.5, color: "var(--muted)" }}>Choose a doctor to see their free slots.</p>}
        </Card>

        <Card>
          <SectionTitle title="Reason for the visit" subtitle="In the patient's own words"/>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {QUICK.map(r => (
              <button type="button" key={r} onClick={() => setReason(r)} aria-pressed={reason === r}
                style={{ minHeight: 30, padding: "0 12px", borderRadius: 999, fontSize: 13, cursor: "pointer", fontWeight: 500,
                  border: `1px solid ${reason === r ? "var(--accent)" : "var(--control)"}`, background: reason === r ? "var(--accent-soft)" : "transparent", color: "var(--ink)" }}>{r}</button>
            ))}
          </div>
          {label("Reason")}
          <input value={reason} onChange={e => setReason(e.target.value)} maxLength={300} aria-label="Reason for the visit" style={inputStyle(css)}/>
        </Card>
      </div>

      <Card style={{ position: "sticky", top: 0 }}>
        <SectionTitle title="Summary"/>
        {[["Patient", who], ["Department", deptName], ["Doctor", doctor?.name], ["Date", slot.date ? fmtDate(slot.date) : ""], ["Time", slot.time ? fmtTime(slot.time) : ""], ["Reason", reason]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--rule)", fontSize: 14 }}>
            <span style={{ color: "var(--muted)", width: 84 }}>{k}</span>
            <span style={{ flex: 1, textAlign: "right", color: v ? "var(--ink)" : "var(--muted)", fontWeight: v ? 500 : 400, wordBreak: "break-word" }}>{v || "—"}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "14px 0" }}>
          <span style={{ color: "var(--muted)" }}>Fee to collect</span>
          <span style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em" }}>{money(dept?.fee)}</span>
        </div>
        <Button type="submit" size="lg" icon="check" disabled={!ready || busy} style={{ width: "100%" }}>{busy ? "Booking" : "Register and book"}</Button>
      </Card>
    </form>
  );
}
