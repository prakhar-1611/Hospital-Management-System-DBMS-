/* ============================================================
   kit.jsx — shared components for all three portals:
   cards, badges, buttons, form fields, modal, tabs, skeletons.
   Colours come from CSS variables set by PortalShell (see theme.jsx
   themeVars) so every component follows the portal accent and the
   light / dark theme. Hover, press and focus live in App.css, where
   they can be gated by (hover: hover) and respect reduced motion.
   ============================================================ */
import { useEffect } from "react";
import Icon from "./Icon";
import { statusColor, identityTint } from "./theme";

/* ---------- status pill ---------- */
export function Badge({ status, children, bg, fg }) {
  const s = statusColor(status);
  return (
    <span className="mc-pill" style={{ background: bg || s.bg, color: fg || s.fg }}>
      {children || s.label}
    </span>
  );
}

/* ---------- surfaces (flat: a 1px line and a tone step, never a shadow) ---------- */
export function Card({ children, style, pad = 20, css, accent, ...rest }) { // eslint-disable-line no-unused-vars
  return (
    <div {...rest} style={{ background: "var(--sheet)", border: "1px solid var(--border)", borderRadius: 8, padding: pad, minWidth: 0, ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, right, style }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14, ...style }}>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.005em" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// a key figure set as type: label, value, one line of context. No icon, no tint.
export function StatCard({ label, value, hint, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={onClick ? "mc-stat mc-stat--click" : "mc-stat"}>
      <span className="mc-stat-label">{label}</span>
      <span className="mc-stat-value">{value}</span>
      {hint && <span className="mc-stat-hint">{hint}</span>}
    </Tag>
  );
}

export function EmptyState({ icon = "inbox", title, body, action }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>
      <Icon name={icon} size={22} style={{ margin: "0 auto 10px" }}/>
      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{title}</div>
      {body && <p style={{ fontSize: 13, marginTop: 4, maxWidth: 380, marginInline: "auto", lineHeight: 1.5 }}>{body}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

// a person: initials on a pale tint that is stable for that name
export function Avatar({ name = "", src, size = 36 }) {
  const letters = name.replace(/^Dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}/>;
  const t = identityTint(name);
  return (
    <div aria-hidden="true" style={{ width: size, height: size, borderRadius: "50%", background: t.bg, color: t.fg, display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 600, fontSize: Math.round(size * 0.38), flexShrink: 0 }}>{letters}</div>
  );
}

/* ---------- buttons ---------- */
export function Button({ variant = "primary", icon, size = "md", children, style, className = "", css, accent, ...rest }) { // eslint-disable-line no-unused-vars
  const fs = size === "sm" ? 12.5 : 13.5;
  return (
    <button {...rest} className={`mc-btn mc-btn--${variant} mc-btn--${size} ${className}`} style={style}>
      {icon && <Icon name={icon} size={fs + 2}/>}
      {children}
    </button>
  );
}

/* ---------- forms ---------- */
export function Field({ label, hint, children, style }) {
  return (
    <label style={{ display: "block", minWidth: 0, ...style }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 5 }}>{label}</span>
      {children}
      {hint && <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{hint}</span>}
    </label>
  );
}

/* ---------- tabs: neutral row, 2px underline on the active one ---------- */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="mc-tabs">
      {tabs.map(t => {
        const on = t.id === value;
        return (
          <button key={t.id} role="tab" aria-selected={on} onClick={() => onChange(t.id)} className={on ? "mc-tab mc-tab--on" : "mc-tab"}>
            {t.label}
            {t.count !== undefined && <span className="mc-tab-count">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// small mutually exclusive switch (e.g. availability)
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="mc-seg">
      {options.map(o => (
        <button key={o.value} role="radio" aria-checked={o.value === value} onClick={() => o.value !== value && onChange(o.value)}
          className={o.value === value ? "mc-seg-opt mc-seg-opt--on" : "mc-seg-opt"}>
          {o.dot && <span className="mc-seg-dot" style={{ background: o.dot }}/>}{o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- modal (centred; Esc and the scrim close it) ---------- */
export function Modal({ title, subtitle, onClose, children, footer, width = 560 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="mc-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="mc-dialog" style={{ width: `min(${width}px, 100%)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="mc-iconbtn"><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>{footer}</div>}
      </div>
    </div>
  );
}

// an inline message: tone is info, warning, negative or positive. Colour follows the theme; the icon and words carry the meaning too.
const NOTICE_ICON = { info: "info", warning: "alert", negative: "alert", positive: "checkCircle" };
export function Notice({ tone = "info", children, action, style }) {
  return (
    <div role={tone === "negative" ? "alert" : undefined} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 8, fontSize: 13.5, lineHeight: 1.45,
      background: `var(--pill-${tone}-bg)`, color: `var(--pill-${tone}-fg)`, ...style }}>
      <Icon name={NOTICE_ICON[tone]} size={16} style={{ marginTop: 2 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {action}
    </div>
  );
}

export function Spinner({ size = 16, color = "currentColor" }) {
  return <span className="mc-spin" style={{ width: size, height: size, border: `2px solid ${color}`, borderRightColor: "transparent" }}/>;
}

// placeholder block while data loads (keeps the layout from jumping)
export function Skeleton({ w = "100%", h = 14, r = 4, style }) {
  return <span className="mc-skel" style={{ width: w, height: h, borderRadius: r, ...style }}/>;
}

// a block of rows, used while a screen's first data loads
export function SkeletonRows({ rows = 5, h = 40 }) {
  return (
    <div style={{ display: "grid", gap: 10 }} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={h} r={6}/>)}
    </div>
  );
}

// label / value row used in detail panels
export function InfoRow({ label, value, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--rule)", fontSize: 13.5 }}>
      {icon && <span style={{ color: "var(--muted)" }}><Icon name={icon} size={16}/></span>}
      <span style={{ color: "var(--muted)", minWidth: 110 }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 500, marginLeft: "auto", textAlign: "right", wordBreak: "break-word", minWidth: 0 }}>{value || "—"}</span>
    </div>
  );
}
