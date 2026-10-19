/* ============================================================
   kit.jsx — shared components for the doctor and patient portals:
   cards, badges, buttons, form fields, modal, tabs.
   Colours come from the theme tokens (useTheme in theme.jsx) plus
   one accent colour per portal (PORTALS in theme.jsx).
   ============================================================ */
import { useEffect } from "react";
import Icon from "./Icon";
import { statusColor } from "./theme";

/* ---------- status badge ---------- */
export function Badge({ status, children, bg, fg }) {
  const s = statusColor(status);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, background: bg || s.bg, color: fg || s.fg, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: fg || s.fg }}/>
      {children || s.label}
    </span>
  );
}

/* ---------- surfaces ---------- */
export function Card({ css, children, style, pad = 22, ...rest }) {
  return (
    <div {...rest} style={{ background: css.card, border: `1px solid ${css.border}`, borderRadius: 16, padding: pad,
      boxShadow: `0 1px 2px ${css.ring}, 0 4px 16px ${css.ring}`, minWidth: 0, ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ css, title, subtitle, right, style }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14, ...style }}>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: css.text }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12.5, color: css.textGray, marginTop: 3 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({ css, icon, label, value, hint, color = "#4361ee", tint = "#eef2ff", onClick }) {
  return (
    <Card css={css} pad={18} onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 14, cursor: onClick ? "pointer" : "default" }}
      className={onClick ? "mc-lift" : undefined}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: tint, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={22}/>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: css.textGray, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: css.text, lineHeight: 1.2 }}>{value}</div>
        {hint && <div style={{ fontSize: 11.5, color: css.textGray, marginTop: 2 }}>{hint}</div>}
      </div>
    </Card>
  );
}

export function EmptyState({ css, icon = "inbox", title, body, action }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 16px", color: css.textGray }}>
      <div style={{ width: 54, height: 54, borderRadius: 16, background: css.subtle, border: `1px solid ${css.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icon name={icon} size={24}/>
      </div>
      <div style={{ fontWeight: 600, color: css.text, fontSize: 14 }}>{title}</div>
      {body && <p style={{ fontSize: 13, marginTop: 4, maxWidth: 360, marginInline: "auto" }}>{body}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function Avatar({ name = "", src, size = 38, color = "#4361ee" }) {
  const letters = name.replace(/^Dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}/>;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "white", display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0, letterSpacing: .3 }}>{letters}</div>
  );
}

/* ---------- buttons ---------- */
export function Button({ variant = "primary", accent = "#4361ee", css, icon, size = "md", children, style, disabled, ...rest }) {
  const pad = size === "sm" ? "6px 12px" : size === "lg" ? "12px 22px" : "9px 16px";
  const fs = size === "sm" ? 12 : size === "lg" ? 14.5 : 13;
  const v = {
    primary: { background: accent, color: "white", border: `1px solid ${accent}` },
    outline: { background: "transparent", color: css?.text || "#1e2535", border: `1px solid ${css?.border || "#e5e7eb"}` },
    soft:    { background: `${accent}18`, color: accent, border: `1px solid ${accent}30` },
    danger:  { background: "transparent", color: "#dc2626", border: "1px solid #fecaca" },
    success: { background: "#16a34a", color: "white", border: "1px solid #16a34a" },
    ghost:   { background: "transparent", color: css?.textGray || "#6b7280", border: "1px solid transparent" },
  }[variant];
  return (
    <button {...rest} disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: pad, fontSize: fs, fontWeight: 600,
        borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .55 : 1, transition: "filter .15s, background .15s",
        whiteSpace: "nowrap", ...v, ...style }} className="mc-btn">
      {icon && <Icon name={icon} size={fs + 3}/>}
      {children}
    </button>
  );
}

/* ---------- forms ---------- */
export function Field({ css, label, hint, children, style }) {
  return (
    <label style={{ display: "block", minWidth: 0, ...style }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: css.textGray, marginBottom: 6 }}>{label}</span>
      {children}
      {hint && <span style={{ display: "block", fontSize: 11.5, color: css.textGray, marginTop: 5 }}>{hint}</span>}
    </label>
  );
}

/* ---------- tabs ---------- */
export function Tabs({ css, tabs, value, onChange, accent }) {
  return (
    <div className="mc-tabs" style={{ display: "flex", gap: 4, padding: 4, background: css.subtle, border: `1px solid ${css.border}`, borderRadius: 12, overflowX: "auto" }}>
      {tabs.map(t => {
        const on = t.id === value;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "none", cursor: "pointer",
              background: on ? css.card : "transparent", color: on ? accent : css.textGray, fontWeight: on ? 700 : 500, fontSize: 13,
              boxShadow: on ? `0 1px 3px ${css.ring}` : "none", whiteSpace: "nowrap" }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 999, background: on ? `${accent}18` : css.border, color: on ? accent : css.textGray }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- modal ---------- */
export function Modal({ css, title, subtitle, onClose, children, footer, width = 560 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 19999, backdropFilter: "blur(3px)" }}/>
      <div role="dialog" aria-modal="true" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: css.card,
        width: `min(${width}px, calc(100vw - 24px))`, maxHeight: "88vh", display: "flex", flexDirection: "column", borderRadius: 18, zIndex: 20000,
        boxShadow: "0 25px 60px rgba(0,0,0,.3)", animation: "slideUp .25s ease", border: `1px solid ${css.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "18px 22px", borderBottom: `1px solid ${css.border}` }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 17, color: css.text }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 12.5, color: css.textGray, marginTop: 3 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: css.textGray, padding: 4 }}>
            <Icon name="x" size={20}/>
          </button>
        </div>
        <div style={{ padding: 22, overflowY: "auto" }}>{children}</div>
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", padding: "14px 22px", borderTop: `1px solid ${css.border}` }}>{footer}</div>}
      </div>
    </>
  );
}

export function Spinner({ size = 18, color = "currentColor" }) {
  return <span style={{ width: size, height: size, border: `2px solid ${color}`, borderRightColor: "transparent", borderRadius: "50%",
    display: "inline-block", animation: "spin .7s linear infinite" }}/>;
}

// label / value row used in detail panels
export function InfoRow({ css, label, value, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${css.border}`, fontSize: 13 }}>
      {icon && <span style={{ color: css.textGray }}><Icon name={icon} size={16}/></span>}
      <span style={{ color: css.textGray, minWidth: 110 }}>{label}</span>
      <span style={{ color: css.text, fontWeight: 500, marginLeft: "auto", textAlign: "right", wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );
}
