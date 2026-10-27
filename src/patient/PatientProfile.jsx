/* ============================================================
   PatientProfile.jsx — edit own personal + medical details
   (PUT /api/patients/me), account info, password.
   ============================================================ */
import { useState } from "react";
import { Card, SectionTitle, Field, Button, Avatar, InfoRow } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import ChangePasswordCard from "../ui/ChangePasswordCard";
import { BLOOD_GROUPS, PROFILE_FIELDS } from "../ui/records";

const pick = (p) => ({ name: p.name || "", age: p.age ?? "", gender: p.gender || "", contact: p.contact || "", address: p.address || "",
  bloodGroup: p.bloodGroup || "", allergies: p.allergies || "", emergencyContact: p.emergencyContact || "" });

export default function PatientProfile({ css, accent, user, profile, missing, onSave, showToast }) {
  const [f, setF] = useState(() => pick(profile));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const dirty = JSON.stringify(f) !== JSON.stringify(pick(profile));
  const done = PROFILE_FIELDS.length - missing.length;

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return showToast("Name is required", "warning");
    const age = f.age === "" ? "" : Number(f.age);
    if (age !== "" && (!Number.isInteger(age) || age < 0 || age > 120)) return showToast("Age must be a whole number from 0 to 120", "warning");
    setBusy(true);
    const ok = await onSave({ ...f, name: f.name.trim(), age });
    setBusy(false);
    if (!ok) setF(pick(profile));
  }

  const input = inputStyle(css);
  return (
    <div className="mc-split">
      <Card>
        <form onSubmit={submit}>
          <SectionTitle title="Personal details"/>
          <div className="mc-form-grid" style={{ marginBottom: 28 }}>
            <Field label="Full name"><input value={f.name} onChange={set("name")} style={input} autoComplete="name" required/></Field>
            <Field label="Age"><input type="number" inputMode="numeric" min="0" max="120" value={f.age} onChange={set("age")} style={input}/></Field>
            <Field label="Gender">
              <select value={f.gender} onChange={set("gender")} style={input}>
                <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option>
              </select>
            </Field>
            <Field label="Phone"><input type="tel" value={f.contact} onChange={set("contact")} style={input} autoComplete="tel" placeholder="+91 98765 43210"/></Field>
            <Field label="Address" style={{ gridColumn: "1 / -1" }}><input value={f.address} onChange={set("address")} style={input} autoComplete="street-address"/></Field>
          </div>

          <SectionTitle title="Medical information" subtitle="Shared only with doctors you book an appointment with"/>
          <div className="mc-form-grid">
            <Field label="Blood group">
              <select value={f.bloodGroup} onChange={set("bloodGroup")} style={input}>
                <option value="">Not known</option>{BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Emergency contact" hint="Name, relation and phone number"><input value={f.emergencyContact} onChange={set("emergencyContact")} maxLength={120} style={input} placeholder="Ravi (brother) +91 98765 43210"/></Field>
            <Field label="Allergies" style={{ gridColumn: "1 / -1" }} hint="Medicines, food or anything else your doctor should know">
              <textarea value={f.allergies} onChange={set("allergies")} maxLength={300} rows={2} style={{ ...input, resize: "vertical", lineHeight: 1.5 }} placeholder="Penicillin, peanuts"/>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--rule)", flexWrap: "wrap", alignItems: "center" }}>
            <Button type="submit" icon="check" disabled={!dirty || busy}>{busy ? "Saving" : "Save changes"}</Button>
            {dirty && <Button type="button" variant="ghost" onClick={() => setF(pick(profile))}>Discard</Button>}
            {dirty && <span style={{ fontSize: 13, color: "var(--muted)" }}>You have unsaved changes</span>}
          </div>
        </form>
      </Card>

      <div className="mc-stack">
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <Avatar name={profile.name} src={user.avatar} size={52}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 16, overflowWrap: "anywhere" }}>{profile.name}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Patient ID <span className="mono">P-{String(profile._id).slice(-6).toUpperCase()}</span></div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
            <span style={{ color: "var(--muted)" }}>Profile details</span><span style={{ fontWeight: 500 }}>{done} of {PROFILE_FIELDS.length}</span>
          </div>
          <div role="progressbar" aria-label="Profile completeness" aria-valuemin={0} aria-valuemax={PROFILE_FIELDS.length} aria-valuenow={done}
            style={{ height: 6, borderRadius: 3, background: "var(--active)", overflow: "hidden" }}>
            <div style={{ width: `${done / PROFILE_FIELDS.length * 100}%`, height: "100%", background: missing.length ? "var(--accent)" : "var(--positive)", transition: "width 300ms var(--ease-out)" }}/>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{missing.length ? `Still missing: ${missing.map(([, l]) => l.toLowerCase()).join(", ")}.` : "Everything a doctor needs is filled in."}</p>
          <div style={{ marginTop: 12 }}>
            <InfoRow icon="mail" label="Email" value={user.email}/>
            <InfoRow icon="shield" label="Sign-in method" value={user.authProvider === "google" ? "Google account" : "Email and password"}/>
          </div>
        </Card>
        <ChangePasswordCard css={css} accent={accent} showToast={showToast} isGoogle={user.authProvider === "google"}/>
        <p style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--muted)", padding: "0 4px" }}>
          <Icon name="lock" size={16} style={{ marginTop: 2 }}/>
          <span>Your record is private. Doctors see it only after you book with them, and other patients never can.</span>
        </p>
      </div>
    </div>
  );
}
