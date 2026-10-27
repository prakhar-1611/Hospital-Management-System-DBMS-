/* ============================================================
   PatientModal.jsx (doctor) — a patient's profile and their visit
   history WITH THIS DOCTOR. GET /api/patients/:id (server limits the
   history to the logged-in doctor's appointments).
   ============================================================ */
import { useEffect, useState } from "react";
import * as api from "../api";
import { Modal, Badge, Avatar, InfoRow, Skeleton, SkeletonRows, EmptyState, Notice } from "../ui/kit";
import { toAppt } from "../ui/records";
import { fmtDate, fmtTime } from "../ui/dates";

export default function PatientModal({ patientId, onClose, onOpenAppt, subtitle = "Only your consultations with this patient are shown", showDoctor = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPatient(patientId).then(setData).catch(e => setError(e.message));
  }, [patientId]);

  const p = data?.patient;
  const history = (data?.history || []).map(toAppt);

  return (
    <Modal width={680} onClose={onClose} title="Patient record" subtitle={subtitle}>
      {error && <Notice tone="negative"><strong>Could not load this record.</strong> {error}</Notice>}
      {!data && !error && (
        <div aria-busy="true" aria-label="Loading patient record">
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
            <Skeleton w={52} h={52} r={26}/>
            <div style={{ flex: 1, display: "grid", gap: 8 }}><Skeleton w="40%" h={16}/><Skeleton w="25%" h={12}/></div>
          </div>
          <SkeletonRows rows={4} h={36}/>
        </div>
      )}
      {p && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <Avatar name={p.name} size={52}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 600, overflowWrap: "anywhere" }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Patient ID <span className="mono">P-{String(p._id).slice(-6).toUpperCase()}</span></div>
            </div>
          </div>
          {p.allergies && <Notice tone="negative" style={{ marginBottom: 12 }}><strong>Allergies:</strong> {p.allergies}</Notice>}
          <div className="mc-grid-2" style={{ gap: "0 24px", marginBottom: 22 }}>
            <div>
              <InfoRow icon="user" label="Age" value={p.age != null ? `${p.age} years` : ""}/>
              <InfoRow icon="users" label="Gender" value={p.gender}/>
              <InfoRow icon="droplet" label="Blood group" value={p.bloodGroup}/>
            </div>
            <div>
              <InfoRow icon="phone" label="Contact" value={p.contact}/>
              <InfoRow icon="alert" label="Emergency" value={p.emergencyContact}/>
              <InfoRow icon="mapPin" label="Address" value={p.address}/>
            </div>
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Consultation history <span style={{ fontWeight: 400, color: "var(--muted)" }}>{history.length}</span></h4>
          {history.length === 0 ? <EmptyState icon="calendar" title="No consultations yet"/> : (
            <div style={{ borderTop: "1px solid var(--rule)" }}>
              {history.map(h => (
                <button key={h.id} onClick={() => onOpenAppt(h.id)} className="mc-row-hover"
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 8px", border: 0, borderBottom: "1px solid var(--rule)", background: "transparent", cursor: "pointer", color: "var(--ink)", font: "inherit" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 500 }}>{fmtDate(h.date)}, {fmtTime(h.time)}</div>
                    <Badge status={h.status}/>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 2 }}>{h.reason}{showDoctor && `, ${h.doctorName} (${h.deptName})`}</div>
                  {h.notes && <p style={{ fontSize: 13.5, marginTop: 6, whiteSpace: "pre-wrap", maxWidth: "70ch" }}>{h.notes}</p>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
