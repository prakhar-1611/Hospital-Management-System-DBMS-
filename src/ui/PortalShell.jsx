/* ============================================================
   PortalShell.jsx — the "framed sheet" layout shared by all three
   portals. A tinted frame holds the sidebar and a 48px top bar; the
   page sits on a white sheet inset from the window edge. On phones the
   sidebar becomes a drawer and the sheet fills the screen.
   Layout rules live in App.css (.mc-*).
   ============================================================ */
import { useState, useEffect } from "react";
import Icon from "./Icon";
import { Avatar } from "./kit";
import { themeVars } from "./theme";

export default function PortalShell({
  portal, nav, section, onNavigate, title, subtitle, titleActions, user, roleLabel,
  css, isDark, setIsDark, onLogout, sidebarExtra, headerRight, profileSection = "profile", children,
}) {
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const go = (id) => { onNavigate(id); setDrawer(false); setMenu(false); };

  // keep the browser's status bar in step with the frame colour
  useEffect(() => {
    const m = document.querySelector('meta[name="theme-color"]:not([media])') || document.head.appendChild(Object.assign(document.createElement("meta"), { name: "theme-color" }));
    m.content = css.bg;
  }, [css.bg]);
  useEffect(() => { document.title = `${title} · ${portal.short}`; }, [title, portal.short]);
  // close the menus on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setMenu(false); setDrawer(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mc-shell" style={themeVars(css, portal.accent, isDark)}>
      <a href="#mc-main" className="mc-skip">Skip to content</a>
      {drawer && <div className="mc-backdrop" onClick={() => setDrawer(false)}/>}

      <aside className={`mc-sidebar${drawer ? " open" : ""}`} aria-label="Main navigation">
        <div className="mc-brand">
          <span className="mc-mark" aria-hidden="true"><Icon name="hospital" size={17}/></span>
          <div style={{ minWidth: 0 }}>
            <div className="mc-brand-name">{portal.name}</div>
            <div className="mc-brand-sub">{portal.short}</div>
          </div>
          <button className="mc-iconbtn mc-drawer-close" aria-label="Close menu" onClick={() => setDrawer(false)}><Icon name="x" size={18}/></button>
        </div>

        <nav>
          {nav.map(item => {
            const on = section === item.id;
            return (
              <button key={item.id} onClick={() => go(item.id)} className={on ? "mc-nav mc-nav--on" : "mc-nav"} aria-current={on ? "page" : undefined}>
                <Icon name={item.icon} size={17}/>
                <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                {item.badge ? <span className="mc-nav-badge">{item.badge}</span> : null}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }}/>
        {sidebarExtra}
        <div className="mc-account">
          <Avatar name={user.name} src={user.avatar} size={30}/>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="mc-account-name">{user.name}</div>
            <div className="mc-account-role">{roleLabel}</div>
          </div>
          <button onClick={onLogout} title="Sign out" aria-label="Sign out" className="mc-iconbtn"><Icon name="logout" size={16}/></button>
        </div>
      </aside>

      <main className="mc-main">
        <header className="mc-topbar">
          <button className="mc-hamburger mc-iconbtn" aria-label="Open menu" onClick={() => setDrawer(true)}><Icon name="menu" size={20}/></button>
          <span className="mc-topbar-title">{portal.short}</span>
          <div className="mc-topbar-actions">
            {headerRight}
            <button onClick={() => setIsDark(d => !d)} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Light mode" : "Dark mode"} className="mc-iconbtn">
              <Icon name={isDark ? "sun" : "moon"} size={17}/>
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setMenu(m => !m)} aria-label="Account menu" aria-expanded={menu} className="mc-avatarbtn"><Avatar name={user.name} src={user.avatar} size={30}/></button>
              {menu && (
                <>
                  <div onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 999 }}/>
                  <div className="mc-popover" role="menu">
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{user.name}</div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)", wordBreak: "break-all" }}>{user.email}</div>
                    </div>
                    <button role="menuitem" onClick={() => go(profileSection)} className="mc-menuitem"><Icon name="user" size={16}/> {profileSection === "settings" ? "Settings" : "My profile"}</button>
                    <button role="menuitem" onClick={onLogout} className="mc-menuitem" style={{ color: "var(--negative)" }}><Icon name="logout" size={16}/> Sign out</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="mc-sheet" id="mc-main" tabIndex={-1}>
          <div className="mc-sheet-inner">
            <div className="mc-titlerow">
              <div style={{ minWidth: 0 }}>
                <h1 className="mc-h1">{title}</h1>
                {subtitle && <p className="mc-finding">{subtitle}</p>}
              </div>
              {titleActions && <div className="mc-titleactions">{titleActions}</div>}
            </div>
            <div key={section}>{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
