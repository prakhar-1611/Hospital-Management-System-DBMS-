/* ============================================================
   ChangePasswordCard.jsx — PUT /api/auth/password for the logged-in
   account (doctor and patient portals). Google accounts have no password.
   ============================================================ */
import { useState } from "react";
import * as api from "../api";
import { Card, SectionTitle, Field, Button } from "./kit";
import { inputStyle } from "./theme";
import Icon from "./Icon";

export default function ChangePasswordCard({ css, accent, showToast, isGoogle }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (f.next.length < 6) return showToast("New password must be at least 6 characters", "warning");
    if (f.next !== f.confirm) return showToast("The new passwords do not match", "warning");
    setBusy(true);
    try {
      await api.changePassword(f.current, f.next);
      setF({ current: "", next: "", confirm: "" });
      showToast("Password updated", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card css={css}>
      <SectionTitle css={css} title="Security" subtitle="Password for signing in with email"/>
      {isGoogle ? (
        <div style={{ display: "flex", gap: 10, padding: 14, borderRadius: 12, background: css.subtle, border: `1px solid ${css.border}`, fontSize: 13, color: css.text }}>
          <Icon name="shield" size={18} color={accent}/>
          <span>You sign in with Google, so there is no MedCare password to manage. Your Google account's security settings apply.</span>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <Field css={css} label="Current password">
            <input type="password" autoComplete="current-password" value={f.current} onChange={set("current")} style={inputStyle(css)}/>
          </Field>
          <div className="mc-form-grid">
            <Field css={css} label="New password">
              <input type="password" autoComplete="new-password" value={f.next} onChange={set("next")} style={inputStyle(css)}/>
            </Field>
            <Field css={css} label="Confirm new password">
              <input type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} style={inputStyle(css)}/>
            </Field>
          </div>
          <div><Button type="submit" accent={accent} icon="lock" disabled={busy || !f.current || !f.next}>{busy ? "Updating…" : "Update password"}</Button></div>
        </form>
      )}
    </Card>
  );
}
