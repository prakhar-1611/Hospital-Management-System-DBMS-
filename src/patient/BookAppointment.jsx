/* ============================================================
   BookAppointment.jsx — 4-step booking: department -> doctor ->
   date & time -> reason & confirm. POST /api/appointments
   (the server takes the patient from the login token).
   ============================================================ */
import { useState, useEffect } from "react";
import * as api from "../api";
import { Card, SectionTitle, Button, Avatar, Badge, Tabs } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import SlotPicker from "./SlotPicker";
import BodyMap from "./BodyMap";
import { DAY_NAMES } from "../constants";
import { fmtDate, fmtTime, relativeDay } from "../ui/dates";
import { money } from "../ui/records";

const STEPS = ["Department", "Doctor", "Date & time", "Confirm"];
const REASONS = ["General check-up", "Follow-up visit", "Fever / cold", "Chest pain", "Back / joint pain", "Skin problem", "Headache", "Test results review"];

export function DoctorCard({ css, accent, doc, selected, onClick, action }) {
  const off = doc.status === "On Leave";
  return (
    <div onClick={off ? undefined : onClick} role={onClick ? "button" : undefined} tabIndex={onClick && !off ? 0 : undefined}
      onKeyDown={e => onClick && !off && e.key === "Enter" && onClick()} className={onClick && !off ? "mc-lift" : undefined}
      style={{ padding: 16, borderRadius: 14, border: `${selected ? 2 : 1}px solid ${selected ? accent : css.border}`, background: css.card,
        cursor: onClick && !off ? "pointer" : "default", opacity: off ? .6 : 1, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar name={doc.name} size={46} color={accent}/>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: css.text }}>{doc.name}</div>
          <div style={{ fontSize: 12.5, color: css.textGray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.specialization || doc.departmentId?.name}</div>
        </div>
        <Badge status={doc.status}/>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {DAY_NAMES.map((n, d) => (
          <span key={n} style={{ fontSize: 10.5, fontWeight: 650, padding: "3px 6px", borderRadius: 6,
            background: doc.workingDays.includes(d) ? `${accent}18` : "transparent", color: doc.workingDays.includes(d) ? accent : css.textGray,
            border: `1px solid ${doc.workingDays.includes(d) ? `${accent}30` : css.border}` }}>{n}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: css.textGray, gap: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="clock" size={14}/>{fmtTime(doc.workingHours.start)} – {fmtTime(doc.workingHours.end)}</span>
        <span style={{ fontWeight: 700, color: css.text }}>{money(doc.departmentId?.consultationFee)}</span>
      </div>
      {action}
    </div>
  );
}

export default function BookAppointment({ css, accent, isDark, departments, doctors, prefill, showToast, onBooked, onNavigate }) {
  const preDoc = prefill?.doctorId ? doctors.find(d => d._id === prefill.doctorId) : null;
  const [step, setStep] = useState(preDoc ? 2 : 0);
  const [deptId, setDeptId] = useState(preDoc?.departmentId?._id || "");
  const [doctorId, setDoctorId] = useState(preDoc?._id || "");
  const [slot, setSlot] = useState({ date: "", time: "" });
  const [reason, setReason] = useState("");
  const [finder, setFinder] = useState(true);          // body map first, department list on request
  const [suggested, setSuggested] = useState(null);    // { dept, text } picked on the body map
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(null);

  // each step starts at the top of the page
  useEffect(() => { document.querySelector(".mc-content")?.scrollTo({ top: 0, behavior: "smooth" }); }, [step, booked]);

  const dept = departments.find(d => d._id === deptId);
  const doctor = doctors.find(d => d._id === doctorId);
  const deptDoctors = doctors.filter(d => d.departmentId?._id === deptId);
  const canNext = [!!deptId, !!doctorId && doctor?.status !== "On Leave", !!slot.date && !!slot.time, reason.trim().length > 0][step];

  async function confirm() {
    setBusy(true);
    try {
      await api.bookAppointment({ doctorId, date: slot.date, timeSlot: slot.time, reason: reason.trim() });
      setBooked({ doctor, date: slot.date, time: slot.time, reason: reason.trim(), dept });
      onBooked();
    } catch (e) {
      showToast(e.status === 409 ? `${e.message}. Please pick another time.` : e.message, e.status === 409 ? "warning" : "error");
      if (e.status === 409) { setSlot(s => ({ ...s, time: "" })); setStep(2); }
    } finally {
      setBusy(false);
    }
  }

  if (booked) {
    return (
      <Card css={css} style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <Icon name="check" size={32} stroke={2.5}/>
        </div>
        <h3 style={{ fontSize: 21, color: css.text }}>Appointment booked</h3>
        <p style={{ color: css.textGray, fontSize: 14, marginTop: 6 }}>{relativeDay(booked.date)} · {fmtDate(booked.date)} at {fmtTime(booked.time)}</p>
        <div style={{ textAlign: "left", marginTop: 20, padding: 16, borderRadius: 14, background: css.subtle, border: `1px solid ${css.border}`, display: "grid", gap: 8, fontSize: 13.5, color: css.text }}>
          <div><span style={{ color: css.textGray }}>Doctor: </span><strong>{booked.doctor.name}</strong></div>
          <div><span style={{ color: css.textGray }}>Department: </span>{booked.dept?.name}</div>
          <div><span style={{ color: css.textGray }}>Reason: </span>{booked.reason}</div>
          <div><span style={{ color: css.textGray }}>Consultation fee: </span>{money(booked.dept?.consultationFee)} <span style={{ color: css.textGray }}>(pay at the reception desk)</span></div>
        </div>
        <p style={{ fontSize: 12.5, color: css.textGray, marginTop: 14 }}>Please arrive 15 minutes early with a photo ID and any previous reports.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          <Button accent={accent} icon="calendar" onClick={() => onNavigate("appointments")}>View my appointments</Button>
          <Button variant="outline" css={css} onClick={() => { setBooked(null); setStep(0); setDeptId(""); setDoctorId(""); setSlot({ date: "", time: "" }); setReason(""); }}>Book another</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mc-stack">
      {/* stepper */}
      <Card css={css} pad={16}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", overflowX: "auto" }}>
          {STEPS.map((s, i) => {
            const done = i < step, on = i === step;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < STEPS.length - 1 ? 1 : "0 0 auto", minWidth: 0 }}>
                <button onClick={() => i < step && setStep(i)} disabled={i >= step}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: i < step ? "pointer" : "default", padding: 0, whiteSpace: "nowrap" }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700,
                    background: done || on ? accent : css.subtle, color: done || on ? "white" : css.textGray, border: `1px solid ${done || on ? accent : css.border}` }}>
                    {done ? <Icon name="check" size={14} stroke={3}/> : i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: on ? 700 : 500, color: on ? css.text : css.textGray }}>{s}</span>
                </button>
                {i < STEPS.length - 1 && <span style={{ flex: 1, height: 2, minWidth: 16, background: done ? accent : css.border, borderRadius: 2 }}/>}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mc-split">
        <Card css={css}>
          {step === 0 && (
            <>
              <SectionTitle css={css} title="Which department do you need?"
                subtitle={finder ? "Tell us where it hurts or what's wrong, and we'll pick the department." : "Know the department? Pick it. Not sure? Use the body map."}
                right={<Tabs css={css} accent={accent} value={finder ? "map" : "list"} onChange={(v) => setFinder(v === "map")}
                  tabs={[{ id: "map", label: "Help me choose" }, { id: "list", label: "All departments" }]}/>}/>
              {finder && (
                <BodyMap css={css} accent={accent} isDark={isDark} departments={departments}
                  onPick={(d, text) => { setDeptId(d._id); setDoctorId(""); setSlot({ date: "", time: "" }); setReason(text); setSuggested({ dept: d.name, text }); setStep(1); }}/>
              )}
              {!finder && <div className="mc-grid-cards">
                {departments.map(d => {
                  const n = doctors.filter(x => x.departmentId?._id === d._id && x.status !== "On Leave").length;
                  const on = d._id === deptId;
                  return (
                    <button key={d._id} onClick={() => { setDeptId(d._id); setDoctorId(""); setSlot({ date: "", time: "" }); }} className="mc-lift"
                      style={{ textAlign: "left", padding: 16, borderRadius: 14, cursor: "pointer", background: css.card, color: css.text,
                        border: `${on ? 2 : 1}px solid ${on ? accent : css.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                        {on && <Icon name="checkCircle" size={18} color={accent}/>}
                      </div>
                      <div style={{ fontSize: 12.5, color: css.textGray, marginTop: 4, minHeight: 34 }}>{d.description || ""}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 10, color: css.textGray }}>
                        <span>{n} doctor{n === 1 ? "" : "s"} available</span>
                        <strong style={{ color: css.text }}>{money(d.consultationFee)}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>}
            </>
          )}
          {step === 1 && (
            <>
              {suggested && suggested.dept === dept?.name && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 12px", borderRadius: 10, marginBottom: 14, fontSize: 13,
                  background: isDark ? `${accent}22` : `${accent}10`, border: `1px solid ${accent}40`, color: css.text }}>
                  <Icon name="sparkles" size={16} color={accent}/>
                  <span>For <strong>{suggested.text.toLowerCase()}</strong> we suggest <strong>{suggested.dept}</strong>.</span>
                  <button onClick={() => setStep(0)} style={{ marginLeft: "auto", background: "none", border: "none", color: accent, fontWeight: 650, cursor: "pointer", fontSize: 12.5 }}>Change</button>
                </div>
              )}
              <SectionTitle css={css} title={`Choose a doctor in ${dept?.name}`} subtitle="Doctors on leave cannot be booked right now."/>
              <div className="mc-grid-cards">
                {deptDoctors.map(d => (
                  <DoctorCard key={d._id} css={css} accent={accent} doc={d} selected={d._id === doctorId}
                    onClick={() => { setDoctorId(d._id); setSlot({ date: "", time: "" }); }}/>
                ))}
              </div>
            </>
          )}
          {step === 2 && doctor && (
            <>
              <SectionTitle css={css} title="Pick a date and time" subtitle={`${doctor.name} · ${fmtTime(doctor.workingHours.start)} – ${fmtTime(doctor.workingHours.end)}`}/>
              <SlotPicker css={css} accent={accent} doctor={doctor} date={slot.date} time={slot.time} onChange={setSlot}/>
            </>
          )}
          {step === 3 && (
            <>
              <SectionTitle css={css} title="What is the visit for?" subtitle="This helps the doctor prepare. Keep it short."/>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {REASONS.map(r => (
                  <button key={r} onClick={() => setReason(r)}
                    style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
                      border: `1px solid ${reason === r ? accent : css.border}`, background: reason === r ? `${accent}15` : "transparent", color: reason === r ? accent : css.textGray }}>
                    {r}
                  </button>
                ))}
              </div>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} maxLength={300}
                placeholder="Describe your symptoms or the reason for the visit"
                style={{ ...inputStyle(css), resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}/>
              <div style={{ fontSize: 11.5, color: css.textGray, textAlign: "right", marginTop: 4 }}>{reason.length}/300</div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
            <Button variant="outline" css={css} icon="chevronLeft" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Back</Button>
            {step < 3
              ? <Button accent={accent} disabled={!canNext} onClick={() => setStep(s => s + 1)}>Continue <Icon name="chevronRight" size={16}/></Button>
              : <Button accent={accent} icon="check" disabled={!canNext || busy} onClick={confirm}>{busy ? "Booking…" : "Confirm booking"}</Button>}
          </div>
        </Card>

        {/* summary */}
        <Card css={css} style={{ position: "sticky", top: 0 }}>
          <SectionTitle css={css} title="Your booking"/>
          {[
            ["building", "Department", dept?.name],
            ["stethoscope", "Doctor", doctor?.name],
            ["calendar", "Date", slot.date ? fmtDate(slot.date) : ""],
            ["clock", "Time", slot.time ? fmtTime(slot.time) : ""],
            ["clipboard", "Reason", step === 3 ? reason : ""],
          ].map(([icon, k, v]) => (
            <div key={k} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${css.border}`, fontSize: 13 }}>
              <span style={{ color: v ? accent : css.textGray }}><Icon name={icon} size={16}/></span>
              <span style={{ color: css.textGray, width: 80 }}>{k}</span>
              <span style={{ color: v ? css.text : css.textGray, fontWeight: v ? 600 : 400, flex: 1, textAlign: "right", wordBreak: "break-word" }}>{v || "—"}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <span style={{ fontSize: 13, color: css.textGray }}>Consultation fee</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: css.text }}>{money(dept?.consultationFee)}</span>
          </div>
          <div style={{ fontSize: 12, color: css.textGray, marginTop: 10, padding: "10px 12px", borderRadius: 10, background: isDark ? "transparent" : `${accent}0d`, border: `1px solid ${css.border}` }}>
            Free cancellation and rescheduling any time before the visit.
          </div>
        </Card>
      </div>
    </div>
  );
}
