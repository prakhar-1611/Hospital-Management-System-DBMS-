/* ============================================================
   BookAppointment.jsx — 4-step booking: department -> doctor ->
   date & time -> reason & confirm. POST /api/appointments
   (the server takes the patient from the login token).
   ============================================================ */
import { useState, useEffect } from "react";
import * as api from "../api";
import { Card, SectionTitle, Button, Avatar, Badge, Segmented, Notice } from "../ui/kit";
import { inputStyle } from "../ui/theme";
import Icon from "../ui/Icon";
import SlotPicker from "./SlotPicker";
import BodyMap from "./BodyMap";
import { DAY_NAMES, DAY_FULL } from "../constants";
import { fmtDate, fmtTime, relativeDay } from "../ui/dates";
import { money } from "../ui/records";

const STEPS = ["Department", "Doctor", "Date and time", "Reason"];
const REASONS = ["General check-up", "Follow-up visit", "Fever or cold", "Chest pain", "Back or joint pain", "Skin problem", "Headache", "Test results review"];

// one doctor: who, when they work, what it costs. Clickable (booking) or static with an action (directory).
export function DoctorCard({ doc, selected, onClick, action }) {
  const off = doc.status === "On Leave";
  const body = (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center", width: "100%" }}>
        <Avatar name={doc.name} size={44}/>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{doc.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={doc.specialization}>{[doc.departmentId?.name, doc.specialization].filter(Boolean).join(", ")}</div>
        </div>
        {selected ? <Icon name="checkCircle" size={20} color="var(--accent-ink)"/> : <Badge status={doc.status}/>}
      </div>
      <div style={{ display: "flex", gap: 3 }} aria-label={`Works ${doc.workingDays.map(d => DAY_FULL[d]).join(", ")}`} role="img">
        {DAY_NAMES.map((n, d) => {
          const on = doc.workingDays.includes(d);
          return <span key={n} style={{ flex: 1, textAlign: "center", fontSize: 12, padding: "2px 0", borderRadius: 4, background: on ? "var(--active)" : "transparent", color: on ? "var(--ink)" : "var(--muted)", fontWeight: on ? 500 : 400 }}>{n.slice(0, 2)}</span>;
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, gap: 8, width: "100%" }}>
        <span style={{ color: "var(--muted)" }}>{fmtTime(doc.workingHours.start)} to {fmtTime(doc.workingHours.end)}</span>
        <span style={{ fontWeight: 600 }}>{money(doc.departmentId?.consultationFee)}</span>
      </div>
      {action}
    </>
  );
  if (!onClick) return <div className="mc-choice" style={{ cursor: "auto" }}>{body}</div>;
  return (
    <button type="button" onClick={off ? undefined : onClick} aria-disabled={off} aria-pressed={!!selected}
      className={selected ? "mc-choice mc-choice--on" : "mc-choice"}>
      {body}
      {off && <span style={{ fontSize: 13, color: "var(--muted)" }}>On leave, not taking bookings</span>}
    </button>
  );
}

export default function BookAppointment({ css, departments, doctors, prefill, showToast, onBooked, onNavigate }) {
  const preDoc = prefill?.doctorId ? doctors.find(d => d._id === prefill.doctorId) : null;
  const [step, setStep] = useState(preDoc ? 2 : 0);
  const [deptId, setDeptId] = useState(preDoc?.departmentId?._id || "");
  const [doctorId, setDoctorId] = useState(preDoc?._id || "");
  const [slot, setSlot] = useState({ date: "", time: "" });
  const [reason, setReason] = useState("");
  const [finder, setFinder] = useState("map");          // body map first, department list on request
  const [suggested, setSuggested] = useState(null);     // { dept, text } picked on the body map
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(null);

  // each step starts at the top of the sheet
  useEffect(() => { document.querySelector(".mc-sheet")?.scrollTo({ top: 0, behavior: "smooth" }); }, [step, booked]);

  const dept = departments.find(d => d._id === deptId);
  const doctor = doctors.find(d => d._id === doctorId);
  const deptDoctors = doctors.filter(d => d.departmentId?._id === deptId);
  const canNext = [!!deptId, !!doctorId && doctor?.status !== "On Leave", !!slot.date && !!slot.time, reason.trim().length > 0][step];
  const pickDept = (id) => { setDeptId(id); setDoctorId(""); setSlot({ date: "", time: "" }); };

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
      <Card style={{ maxWidth: 560 }} pad={28}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--pill-positive-bg)", color: "var(--pill-positive-fg)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="check" size={22} stroke={2.5}/>
          </span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Appointment booked</h2>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{relativeDay(booked.date)}, {fmtDate(booked.date)} at {fmtTime(booked.time)}</p>
          </div>
        </div>
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 18px", fontSize: 14, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
          <dt style={{ color: "var(--muted)" }}>Doctor</dt><dd style={{ fontWeight: 500 }}>{booked.doctor.name}</dd>
          <dt style={{ color: "var(--muted)" }}>Department</dt><dd>{booked.dept?.name}</dd>
          <dt style={{ color: "var(--muted)" }}>Reason</dt><dd style={{ overflowWrap: "anywhere" }}>{booked.reason}</dd>
          <dt style={{ color: "var(--muted)" }}>Fee</dt><dd>{money(booked.dept?.consultationFee)}, paid at the reception desk</dd>
        </dl>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 16 }}>Please arrive 15 minutes early with a photo ID and any previous reports.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <Button icon="calendar" onClick={() => onNavigate("appointments")}>View my appointments</Button>
          <Button variant="outline" onClick={() => { setBooked(null); setStep(0); pickDept(""); setReason(""); setSuggested(null); }}>Book another</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mc-stack">
      <ol aria-label="Booking steps" style={{ display: "flex", gap: 6, listStyle: "none", overflowX: "auto", scrollbarWidth: "none" }}>
        {STEPS.map((s, i) => {
          const done = i < step, on = i === step;
          return (
            <li key={s} style={{ flex: "1 1 0", minWidth: 120 }}>
              <button onClick={() => done && setStep(i)} disabled={!done} aria-current={on ? "step" : undefined}
                style={{ width: "100%", textAlign: "left", background: "none", border: 0, padding: "0 0 8px", font: "inherit", cursor: done ? "pointer" : "default",
                  borderBottom: `2px solid ${done || on ? "var(--accent)" : "var(--border)"}`, color: on ? "var(--ink)" : "var(--muted)" }}>
                <span style={{ display: "block", fontSize: 12 }}>{done ? "Done" : `Step ${i + 1}`}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: on ? 600 : 500, color: done || on ? "var(--ink)" : "var(--muted)" }}>
                  {done && <Icon name="check" size={14} stroke={2.5}/>}{s}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mc-split">
        <div style={{ minWidth: 0 }}>
          {step === 0 && (
            <>
              <SectionTitle title="Which department do you need?"
                subtitle={finder === "map" ? "Show us where it hurts and we will suggest the department." : "Know the department? Pick it here."}
                right={<Segmented label="How to choose" value={finder} onChange={setFinder}
                  options={[{ value: "map", label: "Help me choose" }, { value: "list", label: "All departments" }]}/>}/>
              {finder === "map" ? (
                <BodyMap departments={departments}
                  onPick={(d, text) => { pickDept(d._id); setReason(text); setSuggested({ dept: d.name, text }); setStep(1); }}/>
              ) : (
                <div className="mc-grid-cards">
                  {departments.map(d => {
                    const n = doctors.filter(x => x.departmentId?._id === d._id && x.status !== "On Leave").length;
                    const on = d._id === deptId;
                    return (
                      <button key={d._id} type="button" onClick={() => pickDept(d._id)} aria-pressed={on} className={on ? "mc-choice mc-choice--on" : "mc-choice"} style={{ gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, width: "100%" }}>
                          <span style={{ fontWeight: 600 }}>{d.name}</span>
                          {on && <Icon name="checkCircle" size={18} color="var(--accent-ink)"/>}
                        </div>
                        <span style={{ fontSize: 13, color: "var(--muted)", minHeight: 38 }}>{d.description || ""}</span>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, width: "100%", marginTop: 4 }}>
                          <span style={{ color: n ? "var(--muted)" : "var(--negative)" }}>{n ? `${n} doctor${n === 1 ? "" : "s"} available` : "No doctor available"}</span>
                          <span style={{ fontWeight: 600 }}>{money(d.consultationFee)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {step === 1 && (
            <>
              {suggested && suggested.dept === dept?.name && (
                <Notice tone="info" style={{ marginBottom: 16 }} action={<Button size="sm" variant="ghost" onClick={() => setStep(0)}>Change</Button>}>
                  For <strong>{suggested.text.toLowerCase()}</strong> we suggest <strong>{suggested.dept}</strong>.
                </Notice>
              )}
              <SectionTitle title={`Choose a doctor in ${dept?.name}`} subtitle="Doctors on leave cannot be booked right now."/>
              {deptDoctors.length === 0 ? (
                <Notice tone="warning">No doctors are listed in this department yet. Choose another department or call the helpdesk.</Notice>
              ) : (
                <div className="mc-grid-cards">
                  {deptDoctors.map(d => (
                    <DoctorCard key={d._id} doc={d} selected={d._id === doctorId} onClick={() => { setDoctorId(d._id); setSlot({ date: "", time: "" }); }}/>
                  ))}
                </div>
              )}
            </>
          )}
          {step === 2 && doctor && (
            <>
              <SectionTitle title="Pick a date and time" subtitle={`${doctor.name} sees patients ${fmtTime(doctor.workingHours.start)} to ${fmtTime(doctor.workingHours.end)}`}/>
              <SlotPicker doctor={doctor} date={slot.date} time={slot.time} onChange={setSlot}/>
            </>
          )}
          {step === 3 && (
            <>
              <SectionTitle title="What is the visit for?" subtitle="A few words help the doctor prepare."/>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {REASONS.map(r => (
                  <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)} className={reason === r ? "mc-chip mc-chip--on" : "mc-chip"}>
                    {reason === r && <Icon name="check" size={14} stroke={2.5}/>}{r}
                  </button>
                ))}
              </div>
              <label htmlFor="visit-reason" className="sr-only">Reason for the visit</label>
              <textarea id="visit-reason" value={reason} onChange={e => setReason(e.target.value)} rows={4} maxLength={300}
                placeholder="Describe your symptoms or the reason for the visit"
                style={{ ...inputStyle(css), resize: "vertical", lineHeight: 1.5 }}/>
              <div style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "right", marginTop: 4 }}>{reason.length} / 300</div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 10, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
            <Button variant="outline" icon="chevronLeft" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Back</Button>
            {step < 3
              ? <Button disabled={!canNext} onClick={() => setStep(s => s + 1)}>Continue <Icon name="chevronRight" size={16}/></Button>
              : <Button icon="check" disabled={!canNext || busy} onClick={confirm}>{busy ? "Booking" : "Confirm booking"}</Button>}
          </div>
        </div>

        <Card style={{ position: "sticky", top: 0 }}>
          <SectionTitle title="Your booking"/>
          {[
            ["Department", dept?.name],
            ["Doctor", doctor?.name],
            ["Date", slot.date ? fmtDate(slot.date) : ""],
            ["Time", slot.time ? fmtTime(slot.time) : ""],
            ["Reason", step === 3 ? reason : ""],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--rule)", fontSize: 14 }}>
              <span style={{ color: "var(--muted)", width: 84, flexShrink: 0 }}>{k}</span>
              <span style={{ color: v ? "var(--ink)" : "var(--muted)", fontWeight: v ? 500 : 400, flex: 1, textAlign: "right", overflowWrap: "anywhere" }}>{v || "Not chosen"}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 14 }}>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>Consultation fee</span>
            <span style={{ fontSize: 22, fontWeight: 600 }}>{money(dept?.consultationFee)}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>Paid at the reception desk. Reschedule or cancel any time before the visit.</p>
        </Card>
      </div>
    </div>
  );
}
