/* ============================================================
   NotifPanel.jsx — the admin's notification list (informational
   messages kept in the browser). Anchored under the bell in the top bar.
   ============================================================ */
import { useState } from "react";
import Icon from "../ui/Icon";
import { Tabs, Button } from "../ui/kit";

const ICON = { alert: "alert", warning: "alert", success: "checkCircle", info: "info" };

export default function NotifPanel({ notifications, onMarkAll, onDismiss, onNav, onClearAll }) {
  const [tab, setTab] = useState("all");
  const filtered = notifications.filter(n => tab === "unread" ? !n.read : true);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="mc-notif-panel mc-popover" style={{ width: 380, top: 40, right: -8 }} role="dialog" aria-label="Notifications">
      <div style={{ padding: "12px 16px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <strong style={{ fontSize: 14 }}>Notifications</strong>
          <div style={{ display: "flex", gap: 2 }}>
            <Button variant="ghost" size="sm" onClick={onMarkAll} disabled={unread === 0}>Mark all read</Button>
            <Button variant="ghost" size="sm" onClick={onClearAll} disabled={notifications.length === 0}>Clear</Button>
          </div>
        </div>
        <Tabs value={tab} onChange={setTab} tabs={[{ id: "all", label: "All", count: notifications.length }, { id: "unread", label: "Unread", count: unread }]}/>
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ padding: 28, textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
            {tab === "unread" ? "Nothing unread." : "No notifications."}
          </div>
        )}
        {filtered.map(n => (
          <div key={n.id} style={{ padding: "12px 14px 12px 16px", borderBottom: "1px solid var(--rule)", display: "flex", gap: 10 }}>
            <Icon name={ICON[n.type] || "info"} size={17} color={n.type === "warning" || n.type === "alert" ? "var(--warning)" : "var(--muted)"} style={{ marginTop: 2 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: n.read ? 500 : 600 }}>
                {n.title}{!n.read && <span className="sr-only"> (unread)</span>}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45, marginTop: 1 }}>{n.body}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                <span>{n.time}</span>
                {n.nav && <button onClick={() => onNav(n.nav)} style={{ border: 0, background: "none", color: "var(--accent-ink)", fontWeight: 500, fontSize: 12.5, cursor: "pointer", padding: 0 }}>Open</button>}
              </div>
            </div>
            {!n.read && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", marginTop: 6, flexShrink: 0 }}/>}
            <button onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }} aria-label="Dismiss" className="mc-iconbtn" style={{ width: 28, height: 28, alignSelf: "flex-start" }}><Icon name="x" size={15}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
