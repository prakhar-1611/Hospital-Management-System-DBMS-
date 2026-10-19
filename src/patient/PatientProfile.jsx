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
  const pct = Math.round((PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length * 100);

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

  return (
    <div className="mc-split">
      <Card css={css}>
        <form onSubmit={submit}>
          <SectionTitle css={css} title="Personal details"/>
          <div className="mc-form-grid" style={{ marginBottom: 22 }}>
            <Field css={css} label="Full name"><input value={f.name} onChange={set("name")} style={inputStyle(css)} autoComplete="name"/></Field>
            <Field css={css} label="Age"><input type="number" min="0" max="120" value={f.age} onChange={set("age")} style={inputStyle(css)}/></Field>
            <Field css={css} label="Gender">
              <select value={f.gender} onChange={set("gender")} style={inputStyle(css)}>
                <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option>
              </select>
            </Field>
            <Field css={css} label="Phone"><input value={f.contact} onChange={set("contact")} style={inputStyle(css)} autoComplete="tel" placeholder="+91…"/></Field>
            <Field css={css} label="Address" style={{ gridColumn: "1 / -1" }}><input value={f.address} onChange={set("address")} style={inputStyle(css)} autoComplete="street-address"/></Field>
          </div>

          <SectionTitle css={css} title="Medical information" subtitle="Shared only with doctors you book an appointment with"/>
          <div className="mc-form-grid">
            <Field css={css} label="Blood group">
              <select value={f.bloodGroup} onChange={set("bloodGroup")} style={inputStyle(css)}>
                <option value="">Not known</option>{BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field css={css} label="Emergency contact" hint="Name and phone number"><input value={f.emergencyContact} onChange={set("emergencyContact")} maxLength={120} style={inputStyle(css)} placeholder="e.g. Ravi (brother) +91…"/></Field>
            <Field css={css} label="Allergies" style={{ gridColumn: "1 / -1" }} hint="Medicines, food or anything else your doctor should know">
              <textarea value={f.allergies} onChange={set("allergies")} maxLength={300} rows={2} style={{ ...inputStyle(css), resize: "vertical", fontFamily: "inherit" }} placeholder="e.g. Penicillin, peanuts"/>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Button type="submit" accent={accent} icon="check" disabled={!dirty || busy}>{busy ? "Saving…" : "Save changes"}</Button>
            {dirty && <Button type="button" variant="ghost" css={css} onClick={() => setF(pick(profile))}>Discard</Button>}
          </div>
        </form>
      </Card>

      <div className="mc-stack">
        <Card css={css}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <Avatar name={user.name} src={user.avatar} size={56} color={accent}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 750, fontSize: 16, color: css.text }}>{profile.name}</div>
              <div style={{ fontSize: 12.5, color: css.textGray }}>Patient ID P-{String(profile._id).slice(-6).toUpperCase()}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: css.textGray, marginBottom: 6 }}>
            <span>Profile completeness</span><strong style={{ color: css.text }}>{pct}%</strong>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: css.subtle, border: `1px solid ${css.border}`, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#16a34a" : accent, transition: "width .4s" }}/>
          </div>
          {missing.length > 0 && <div style={{ fontSize: 12, color: css.textGray, marginTop: 8 }}>Still missing: {missing.map(([, l]) => l).join(", ")}</div>}
          <div style={{ marginTop: 14 }}>
            <InfoRow css={css} icon="mail" label="Email" value={user.email}/>
            <InfoRow css={css} icon="shield" label="Sign-in method" value={user.authProvider === "google" ? "Google account" : "Email & password"}/>
          </div>
        </Card>
        <ChangePasswordCard css={css} accent={accent} showToast={showToast} isGoogle={user.authProvider === "google"}/>
        <Card css={css} style={{ display: "flex", gap: 10, fontSize: 12.5, color: css.textGray }}>
          <Icon name="lock" size={18} color={accent}/>
          <span>Your record is private. Doctors see your details only after you book with them, and other patients never can.</span>
        </Card>
      </div>
    </div>
  );
}
