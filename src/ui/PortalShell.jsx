/* ============================================================
   PortalShell.jsx — sidebar + header layout shared by the doctor and
   patient portals. Uses the responsive .mc-* layout classes in App.css
   (fixed sidebar on desktop, drawer under 900px).
   ============================================================ */
import { useState } from "react";
import Icon from "./Icon";
import { Avatar } from "./kit";

export default function PortalShell({
  portal, nav, section, onNavigate, title, subtitle, user, roleLabel,
  css, isDark, setIsDark, onLogout, sidebarExtra, headerRight, profileSection = "profile", children,
}) {
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const go = (id) => { onNavigate(id); setDrawer(false); setMenu(false); };
  const accent = portal.accent;

  return (
    <div className="mc-shell" style={{ background: css.bg, color: css.text }}>
      {drawer && <div className="mc-backdrop" onClick={() => setDrawer(false)}/>}
      <aside className={`mc-sidebar${drawer ? " open" : ""}`} style={{ background: css.card, borderRight: `1px solid ${css.border}` }}>
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 16px ${accent}55` }}>
            <Icon name="hospital" size={22}/>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15.5, color: css.text, lineHeight: 1.15 }}>{portal.name}</div>
            <div style={{ fontSize: 11.5, color: css.textGray, marginTop: 2 }}>{portal.short}</div>
          </div>
          <button className="mc-drawer-close" aria-label="Close menu" onClick={() => setDrawer(false)} style={{ color: css.textGray }}>
            <Icon name="x" size={18}/>
          </button>
        </div>

        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: css.textGray, textTransform: "uppercase", margin: "0 0 8px 12px" }}>Menu</div>
        <nav>
          {nav.map(item => {
            const on = section === item.id;
            return (
              <button key={item.id} onClick={() => go(item.id)} className="mc-nav-item"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", marginBottom: 3, borderRadius: 10,
                  border: "none", cursor: "pointer", textAlign: "left", fontSize: 13.5,
                  background: on ? (isDark ? `${accent}30` : portal.tint) : "transparent",
                  color: on ? (isDark ? "white" : accent) : css.textGray, fontWeight: on ? 650 : 500 }}>
                <Icon name={item.icon} size={18}/>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? (
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: accent, color: "white" }}>{item.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }}/>
        {sidebarExtra}

        {/* account */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, background: css.subtle, border: `1px solid ${css.border}`, marginTop: 14 }}>
          <Avatar name={user.name} src={user.avatar} size={36} color={accent}/>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 650, color: css.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: css.textGray }}>{roleLabel}</div>
          </div>
          <button onClick={onLogout} title="Sign out" aria-label="Sign out"
            style={{ background: "none", border: "none", cursor: "pointer", color: css.textGray, padding: 6, borderRadius: 8 }}>
            <Icon name="logout" size={17}/>
          </button>
        </div>
      </aside>

      <main className="mc-main">
        <header className="mc-header" style={{ background: css.card, borderBottom: `1px solid ${css.border}` }}>
          <button className="mc-hamburger" aria-label="Open menu" onClick={() => setDrawer(true)} style={{ color: css.text, border: `1px solid ${css.border}` }}>
            <Icon name="menu" size={18}/>
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 className="mc-title" style={{ fontSize: 19, fontWeight: 750, color: css.text }}>{title}</h2>
            {subtitle && <div className="mc-subtitle" style={{ fontSize: 12, color: css.textGray, marginTop: 1 }}>{subtitle}</div>}
          </div>
          <div className="mc-header-actions">
            {headerRight}
            <button onClick={() => setIsDark(d => !d)} aria-label="Toggle dark mode" title={isDark ? "Light mode" : "Dark mode"}
              style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${css.border}`, background: "transparent", color: css.textGray, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={isDark ? "sun" : "moon"} size={18}/>
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setMenu(m => !m)} aria-label="Account menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, borderRadius: "50%" }}>
                <Avatar name={user.name} src={user.avatar} size={38} color={accent}/>
              </button>
              {menu && (
                <>
                  <div onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 999 }}/>
                  <div style={{ position: "absolute", top: 48, right: 0, width: 240, background: css.card, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,.18)",
                    border: `1px solid ${css.border}`, zIndex: 1000, overflow: "hidden", animation: "menuSlide .18s ease" }}>
                    <div style={{ padding: 14, borderBottom: `1px solid ${css.border}`, background: css.subtle }}>
                      <div style={{ fontWeight: 650, fontSize: 13, color: css.text }}>{user.name}</div>
                      <div style={{ fontSize: 11.5, color: css.textGray, wordBreak: "break-all" }}>{user.email}</div>
                    </div>
                    <button onClick={() => go(profileSection)} className="mc-menu-item" style={{ color: css.text }}>
                      <Icon name="user" size={16}/> My profile
                    </button>
                    <button onClick={onLogout} className="mc-menu-item" style={{ color: "#dc2626", borderTop: `1px solid ${css.border}` }}>
                      <Icon name="logout" size={16}/> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="mc-content">
          <div style={{ maxWidth: 1280, margin: "0 auto", animation: "fadeIn .35s ease" }} key={section}>{children}</div>
        </div>
      </main>
    </div>
  );
}
