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
import { Card, SectionTitle, Field, Button, Tabs, Avatar } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import SlotPicker from "../patient/SlotPicker";
import { fmtDate, fmtTime } from "../ui/dates";
import { money } from "../ui/records";

const EMPTY = { name: "", phone: "", age: "", gender: "", email: "", address: "" };
const QUICK = ["Fever", "Follow-up visit", "Pain", "Injury", "General check-up", "Referred by another doctor"];

export default function WalkInRegistration({ css, accent, isDark, departments, doctors, patients, showToast, onDone, onNavigate }) {
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
  // SlotPicker expects the API shape (_id)
  const slotDoctor = doctor ? { ...doctor, _id: doctor.id } : null;
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
      <Card css={css} style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: 30 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Icon name="check" size={30} stroke={2.5}/>
        </div>
        <h3 style={{ fontSize: 20, color: css.text }}>{done.name} is booked</h3>
        <p style={{ color: css.textGray, fontSize: 14, marginTop: 4 }}>{done.doctor} · {fmtDate(done.date)} at {fmtTime(done.time)}</p>
        <div style={{ textAlign: "left", marginTop: 18, padding: 16, borderRadius: 14, background: css.subtle, border: `1px solid ${css.border}`, fontSize: 13.5, color: css.text, display: "grid", gap: 6 }}>
          <div><span style={{ color: css.textGray }}>Department: </span>{done.dept}</div>
          <div><span style={{ color: css.textGray }}>Fee to collect: </span><strong>{money(done.fee)}</strong></div>
          {done.isNew && (
            <div style={{ marginTop: 6, paddingTop: 10, borderTop: `1px solid ${css.border}` }}>
              <div style={{ fontWeight: 650, marginBottom: 4 }}>Patient's MyMedCare login</div>
              <div><span style={{ color: css.textGray }}>Email: </span>{done.email}</div>
              <div><span style={{ color: css.textGray }}>Temporary password: </span>patient123</div>
              <div style={{ fontSize: 12, color: css.textGray, marginTop: 4 }}>Give these to the patient so they can see this visit and book online next time. They should change the password after signing in.</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          <Button accent={accent} icon="plus" onClick={reset}>Register another</Button>
          <Button variant="outline" css={css} onClick={() => onNavigate("appointments", "upcoming")}>View appointments</Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="mc-split">
      <div className="mc-stack">
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 12, fontSize: 13, background: isDark ? `${accent}22` : `${accent}10`, border: `1px solid ${accent}35`, color: css.text }}>
          <Icon name="info" size={17} color={accent}/>
          <span>Patients normally book themselves in <strong>MyMedCare</strong>. Use this desk form for walk-ins, phone bookings and patients without a phone or email.</span>
        </div>

        <Card css={css}>
          <SectionTitle css={css} title="1. Patient" right={<Tabs css={css} accent={accent} value={mode} onChange={(m) => { setMode(m); setPatientId(""); }}
            tabs={[{ id: "new", label: "New patient" }, { id: "existing", label: "Existing patient" }]}/>}/>
          {mode === "new" ? (
            <div className="mc-form-grid">
              <Field css={css} label="Full name *"><input value={form.name} onChange={set("name")} style={inputStyle(css)} autoComplete="off"/></Field>
              <Field css={css} label="Phone"><input value={form.phone} onChange={set("phone")} style={inputStyle(css)} placeholder="+91…" autoComplete="off"/></Field>
              <Field css={css} label="Age"><input type="number" min="0" max="120" value={form.age} onChange={set("age")} style={inputStyle(css)}/></Field>
              <Field css={css} label="Gender">
                <select value={form.gender} onChange={set("gender")} style={inputStyle(css)}><option value="">—</option><option>Female</option><option>Male</option><option>Other</option></select>
              </Field>
              <Field css={css} label="Email (optional)" hint="Left blank, a login email is generated"><input type="email" value={form.email} onChange={set("email")} style={inputStyle(css)} autoComplete="off"/></Field>
              <Field css={css} label="Address"><input value={form.address} onChange={set("address")} style={inputStyle(css)} autoComplete="off"/></Field>
            </div>
          ) : existing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, border: `1px solid ${accent}`, background: css.subtle }}>
              <Avatar name={existing.name} size={40} color={accent}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: css.text }}>{existing.name}</div>
                <div style={{ fontSize: 12.5, color: css.textGray }}>{existing.code} · {existing.contact || "no phone"} · {existing.visits} visit{existing.visits === 1 ? "" : "s"}</div>
              </div>
              <Button type="button" size="sm" variant="ghost" css={css} onClick={() => setPatientId("")}>Change</Button>
            </div>
          ) : (
            <div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: css.textGray }}><Icon name="search" size={16}/></span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or patient ID" style={{ ...inputStyle(css), paddingLeft: 34 }} autoFocus/>
              </div>
              <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                {matches.map(p => (
                  <button type="button" key={p.id} onClick={() => setPatientId(p.id)} className="mc-row-hover"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: `1px solid ${css.border}`, background: css.card, color: css.text, cursor: "pointer", textAlign: "left" }}>
                    <Avatar name={p.name} size={30} color={accent}/>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: css.textGray }}>{p.code} · {p.contact || "—"}</span>
                  </button>
                ))}
                {term.length >= 2 && matches.length === 0 && <div style={{ fontSize: 13, color: css.textGray }}>No patient found. Switch to "New patient".</div>}
              </div>
            </div>
          )}
        </Card>

        <Card css={css}>
          <SectionTitle css={css} title="2. Doctor & time"/>
          <div className="mc-form-grid" style={{ marginBottom: 16 }}>
            <Field css={css} label="Department">
              <select value={deptName} onChange={e => { setDeptName(e.target.value); setDoctorId(""); setSlot({ date: "", time: "" }); }} style={inputStyle(css)}>
                <option value="">Choose…</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name} ({money(d.fee)})</option>)}
              </select>
            </Field>
            <Field css={css} label="Doctor">
              <select value={doctorId} onChange={e => { setDoctorId(e.target.value); setSlot({ date: "", time: "" }); }} style={inputStyle(css)} disabled={!deptName}>
                <option value="">{deptName ? "Choose…" : "Pick a department first"}</option>
                {deptDoctors.map(d => <option key={d.id} value={d.id} disabled={d.status === "On Leave"}>{d.name}{d.status !== "Available" ? ` (${d.status})` : ""}</option>)}
              </select>
            </Field>
          </div>
          {slotDoctor
            ? <SlotPicker css={css} accent={accent} doctor={slotDoctor} date={slot.date} time={slot.time} onChange={setSlot}/>
            : <div style={{ fontSize: 13, color: css.textGray }}>Choose a doctor to see free slots.</div>}
        </Card>

        <Card css={css}>
          <SectionTitle css={css} title="3. Reason for visit"/>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {QUICK.map(r => (
              <button type="button" key={r} onClick={() => setReason(r)}
                style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
                  border: `1px solid ${reason === r ? accent : css.border}`, background: reason === r ? `${accent}15` : "transparent", color: reason === r ? accent : css.textGray }}>{r}</button>
            ))}
          </div>
          <input value={reason} onChange={e => setReason(e.target.value)} maxLength={300} placeholder="What the patient says is wrong (in their words)" style={inputStyle(css)}/>
        </Card>
      </div>

      <Card css={css} style={{ position: "sticky", top: 0 }}>
        <SectionTitle css={css} title="Summary"/>
        {[["user", "Patient", who], ["building", "Department", deptName], ["stethoscope", "Doctor", doctor?.name],
          ["calendar", "Date", slot.date ? fmtDate(slot.date) : ""], ["clock", "Time", slot.time ? fmtTime(slot.time) : ""], ["clipboard", "Reason", reason]].map(([icon, k, v]) => (
          <div key={k} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${css.border}`, fontSize: 13 }}>
            <span style={{ color: v ? accent : css.textGray }}><Icon name={icon} size={16}/></span>
            <span style={{ color: css.textGray, width: 84 }}>{k}</span>
            <span style={{ flex: 1, textAlign: "right", color: v ? css.text : css.textGray, fontWeight: v ? 600 : 400, wordBreak: "break-word" }}>{v || "—"}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0" }}>
          <span style={{ fontSize: 13, color: css.textGray }}>Fee to collect</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: css.text }}>{money(dept?.fee)}</span>
        </div>
        <Button type="submit" accent={accent} icon="check" disabled={!ready || busy} style={{ width: "100%" }} size="lg">{busy ? "Booking…" : "Register & book"}</Button>
      </Card>
    </form>
  );
}
