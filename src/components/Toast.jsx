/* ============================================================
   Toast.jsx — one short message, top right. Dark in both themes so it
   always stands out from the sheet. State is shown by an icon and the
   words, never by colour alone.
   ============================================================ */
import Icon from "../ui/Icon";

const KIND = {
  success: { icon: "checkCircle", color: "#4ade80" },
  warning: { icon: "alert",       color: "#fbbf24" },
  error:   { icon: "xCircle",     color: "#f87171" },
  info:    { icon: "info",        color: "#93b4ff" },
};

export default function Toast({ toast }) {
  const k = KIND[toast.type] || KIND.info;
  return (
    <div style={{ background: "#1a1d21", color: "#f3f4f6", padding: "11px 14px", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.28)",
      display: "flex", alignItems: "flex-start", gap: 10, animation: "toast 220ms cubic-bezier(0.23,1,0.32,1)", minWidth: 0, maxWidth: 380, pointerEvents: "auto", fontSize: 13.5, lineHeight: 1.4 }}>
      <Icon name={k.icon} size={17} color={k.color} style={{ marginTop: 1 }}/>
      <span>{toast.msg}</span>
    </div>
  );
}
