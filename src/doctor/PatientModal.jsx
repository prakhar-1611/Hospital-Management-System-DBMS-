/* ============================================================
   PatientModal.jsx (doctor) — a patient's profile and their visit
   history WITH THIS DOCTOR. GET /api/patients/:id (server limits the
   history to the logged-in doctor's appointments).
   ============================================================ */
import { useEffect, useState } from "react";
import * as api from "../api";
import { Modal, Badge, Avatar, InfoRow, Spinner, EmptyState } from "../ui/kit";
import Icon from "../ui/Icon";
import { toAppt } from "../ui/records";
import { fmtDate, fmtTime } from "../ui/dates";

export default function PatientModal({ css, accent, patientId, onClose, onOpenAppt, subtitle = "Only your consultations with this patient are shown", showDoctor = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPatient(patientId).then(setData).catch(e => setError(e.message));
  }, [patientId]);

  const p = data?.patient;
  const history = (data?.history || []).map(toAppt);

  return (
    <Modal css={css} width={680} onClose={onClose} title="Patient record" subtitle={subtitle}>
      {error && <div style={{ color: "#991b1b", fontSize: 13 }}>{error}</div>}
      {!data && !error && <div style={{ display: "flex", gap: 10, color: css.textGray }}><Spinner color={accent}/> Loading…</div>}
      {p && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <Avatar name={p.name} size={54} color={accent}/>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: css.text }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: css.textGray }}>Patient ID P-{String(p._id).slice(-6).toUpperCase()}</div>
            </div>
          </div>
          {p.allergies && (
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
              <Icon name="alert" size={16}/> <span><strong>Allergies:</strong> {p.allergies}</span>
            </div>
          )}
          <div className="mc-grid-2" style={{ gap: "0 24px", marginBottom: 20 }}>
            <div>
              <InfoRow css={css} icon="user" label="Age" value={p.age !== undefined && p.age !== null ? `${p.age} years` : ""}/>
              <InfoRow css={css} icon="users" label="Gender" value={p.gender}/>
              <InfoRow css={css} icon="droplet" label="Blood group" value={p.bloodGroup}/>
            </div>
            <div>
              <InfoRow css={css} icon="phone" label="Contact" value={p.contact}/>
              <InfoRow css={css} icon="alert" label="Emergency" value={p.emergencyContact}/>
              <InfoRow css={css} icon="mapPin" label="Address" value={p.address}/>
            </div>
          </div>

          <h4 style={{ fontSize: 14, color: css.text, marginBottom: 10 }}>Consultation history ({history.length})</h4>
          {history.length === 0 ? <EmptyState css={css} icon="calendar" title="No consultations yet"/> : (
            <div style={{ display: "grid", gap: 10 }}>
              {history.map(h => (
                <button key={h.id} onClick={() => onOpenAppt(h.id)} className="mc-row-hover"
                  style={{ textAlign: "left", padding: 14, borderRadius: 12, border: `1px solid ${css.border}`, background: css.subtle, cursor: "pointer", color: css.text }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 650, fontSize: 13.5 }}>{fmtDate(h.date)} · {fmtTime(h.time)}</div>
                    <Badge status={h.status}/>
                  </div>
                  <div style={{ fontSize: 13, color: css.textGray, marginTop: 4 }}>{h.reason}{showDoctor && ` · ${h.doctorName} (${h.deptName})`}</div>
                  {h.notes && <div style={{ fontSize: 12.5, marginTop: 8, padding: "8px 10px", borderRadius: 8, background: css.card, border: `1px solid ${css.border}`, whiteSpace: "pre-wrap" }}>{h.notes}</div>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
