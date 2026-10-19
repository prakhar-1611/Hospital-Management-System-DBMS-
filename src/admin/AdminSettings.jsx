/* ============================================================
   AdminSettings.jsx — appearance, system status, data export and the
   admin's own password.
   ============================================================ */
import { Card, SectionTitle, Button, InfoRow, Avatar } from "../ui/kit";
import Icon from "../ui/Icon";
import ChangePasswordCard from "../ui/ChangePasswordCard";

export default function AdminSettings({ css, accent, isDark, setIsDark, user, counts, dbStatus, onExport, showToast }) {
  return (
    <div className="mc-grid-2" style={{ alignItems: "start" }}>
      <div className="mc-stack">
        <Card css={css}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={user.name} size={54} color={accent}/>
            <div>
              <div style={{ fontWeight: 750, fontSize: 16, color: css.text }}>{user.name}</div>
              <div style={{ fontSize: 12.5, color: css.textGray }}>{user.email} · Administrator</div>
            </div>
          </div>
        </Card>
        <Card css={css}>
          <SectionTitle css={css} title="Appearance" subtitle="Remembered in this browser"/>
          <div style={{ display: "flex", gap: 10 }}>
            {[[false, "sun", "Light"], [true, "moon", "Dark"]].map(([val, icon, label]) => (
              <button key={label} onClick={() => setIsDark(val)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, cursor: "pointer", fontWeight: 650, fontSize: 13,
                  border: `${isDark === val ? 2 : 1}px solid ${isDark === val ? accent : css.border}`, background: css.card, color: isDark === val ? accent : css.text }}>
                <Icon name={icon} size={17}/>{label}
              </button>
            ))}
          </div>
        </Card>
        <ChangePasswordCard css={css} accent={accent} showToast={showToast} isGoogle={false}/>
      </div>
      <div className="mc-stack">
        <Card css={css}>
          <SectionTitle css={css} title="System"/>
          <InfoRow css={css} icon="activity" label="Database" value={dbStatus}/>
          <InfoRow css={css} icon="building" label="Departments" value={counts.departments}/>
          <InfoRow css={css} icon="stethoscope" label="Doctors" value={counts.doctors}/>
          <InfoRow css={css} icon="users" label="Patients" value={counts.patients}/>
          <InfoRow css={css} icon="calendar" label="Appointments" value={counts.appointments}/>
        </Card>
        <Card css={css}>
          <SectionTitle css={css} title="Data" subtitle="Download what is loaded right now as JSON (MongoDB data + front-end invoices)"/>
          <Button variant="soft" accent={accent} icon="download" onClick={onExport}>Export data</Button>
        </Card>
        <Card css={css} style={{ display: "flex", gap: 10, fontSize: 12.5, color: css.textGray }}>
          <Icon name="shield" size={18} color={accent}/>
          <span>Role access is enforced by the API: doctors see only their own patients and appointments, patients only their own records. Reports are admin-only.</span>
        </Card>
      </div>
    </div>
  );
}
