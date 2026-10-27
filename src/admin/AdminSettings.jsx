/* ============================================================
   AdminSettings.jsx — appearance, system status, data export and the
   admin's own password.
   ============================================================ */
import { Card, SectionTitle, Button, InfoRow, Avatar, Segmented, Notice } from "../ui/kit";
import ChangePasswordCard from "../ui/ChangePasswordCard";

export default function AdminSettings({ isDark, setIsDark, user, counts, dbStatus, onExport, showToast }) {
  return (
    <div className="mc-grid-2" style={{ alignItems: "start" }}>
      <div className="mc-stack">
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={user.name} size={48}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{user.name}</div>
              <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{user.email}, Administrator</div>
            </div>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Appearance" subtitle="Remembered in this browser"/>
          <Segmented label="Theme" value={isDark ? "dark" : "light"} onChange={(v) => setIsDark(v === "dark")} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}/>
        </Card>
        <ChangePasswordCard showToast={showToast} isGoogle={false}/>
      </div>
      <div className="mc-stack">
        <Card>
          <SectionTitle title="System"/>
          <InfoRow icon="activity" label="Database" value={dbStatus}/>
          <InfoRow icon="building" label="Departments" value={counts.departments}/>
          <InfoRow icon="stethoscope" label="Doctors" value={counts.doctors}/>
          <InfoRow icon="users" label="Patients" value={counts.patients}/>
          <InfoRow icon="calendar" label="Appointments" value={counts.appointments}/>
        </Card>
        <Card>
          <SectionTitle title="Data" subtitle="Download what is loaded right now as one JSON file"/>
          <Button variant="outline" icon="download" onClick={onExport}>Export data</Button>
        </Card>
        <Notice tone="info">Access is enforced by the server. Doctors see only their own patients and appointments, patients only their own records, and reports are for administrators.</Notice>
      </div>
    </div>
  );
}
