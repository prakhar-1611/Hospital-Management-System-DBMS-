/* ============================================================
   ChangePasswordCard.jsx — PUT /api/auth/password for the signed-in
   account (all three portals). Google accounts have no password.
   ============================================================ */
import { useState } from "react";
import * as api from "../api";
import { Card, SectionTitle, Field, Button, Notice } from "./kit";

const flat = { width: "100%", minHeight: 34, padding: "7px 10px", border: "1px solid var(--control)", borderRadius: 6, background: "var(--sheet)", color: "var(--ink)", fontSize: 14 };

export default function ChangePasswordCard({ showToast, isGoogle }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const tooShort = f.next.length > 0 && f.next.length < 6;
  const mismatch = f.confirm.length > 0 && f.confirm !== f.next;

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
    <Card>
      <SectionTitle title="Password" subtitle="For signing in with your email"/>
      {isGoogle ? (
        <Notice tone="info">You sign in with Google, so there is no MedCare password to change. Your Google account's security settings apply.</Notice>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <Field label="Current password">
            <input type="password" autoComplete="current-password" value={f.current} onChange={set("current")} style={flat}/>
          </Field>
          <div className="mc-form-grid">
            <Field label="New password" hint={tooShort ? "At least 6 characters" : undefined}>
              <input type="password" autoComplete="new-password" value={f.next} onChange={set("next")} aria-invalid={tooShort} style={flat}/>
            </Field>
            <Field label="Confirm new password" hint={mismatch ? "Does not match yet" : undefined}>
              <input type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} aria-invalid={mismatch} style={flat}/>
            </Field>
          </div>
          <div><Button type="submit" disabled={busy || !f.current || !f.next}>{busy ? "Updating" : "Update password"}</Button></div>
        </form>
      )}
    </Card>
  );
}
