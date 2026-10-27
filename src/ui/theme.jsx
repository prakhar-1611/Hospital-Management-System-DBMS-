/* ============================================================
   theme.jsx — portal identities, the theme hook, CSS variables for
   the shell, toasts and shared style helpers (kept apart from kit.jsx
   so that file only exports components, which React fast refresh needs).

   Direction: "framed sheet". A tinted frame (sidebar + top bar) holds a
   white work sheet; surfaces are flat, separated by a tone step or a 1px
   line, never a shadow. Colour budget is small: the portal accent sits on
   the logo mark, the primary action, the active tab underline and the main
   data series. Everything else is ink and grey.
   ============================================================ */
import { useState, useRef, useCallback, useEffect } from "react";
import { light, dark } from "../constants";
import Toast from "../components/Toast";

// one name, accent and frame tint per portal
export const PORTALS = {
  admin:   { name: "MedCare Admin Console", short: "Admin Console",  accent: "#4361ee", tint: "#eef2ff", frame: "#f2f4fa" },
  doctor:  { name: "MedCare Clinician Hub", short: "Clinician Hub",  accent: "#0f766e", tint: "#ccfbf1", frame: "#eef5f4" },
  patient: { name: "MyMedCare",             short: "Patient Portal", accent: "#7c3aed", tint: "#ede9fe", frame: "#f5f3fa" },
};

// semantic colours (status pills, signals) for each theme
const SEMANTIC = {
  light: {
    positive: "#1e7b4f", negative: "#c4242a", warning: "#92400e",
    pill: { positive: ["#dcfae5", "#0b4a22"], negative: ["#ffedea", "#831c1e"], warning: ["#fff3d1", "#7a3a05"], info: ["#e4edff", "#1e3a8a"], neutral: ["#ebedee", "#353736"] },
  },
  dark: {
    positive: "#4ade80", negative: "#f87171", warning: "#fbbf24",
    pill: { positive: ["#12301f", "#86efac"], negative: ["#3a1618", "#fca5a5"], warning: ["#33270c", "#fcd34d"], info: ["#16253f", "#93b4ff"], neutral: ["#232b36", "#c3cad3"] },
  },
};

/* ---------- theme (remembered per portal in this browser) ---------- */
export function useTheme(key) {
  const storageKey = `mc-theme-${key}`;
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem(storageKey) === "dark"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, isDark ? "dark" : "light"); } catch { /* storage blocked */ }
  }, [isDark, storageKey]);
  const base = isDark ? dark : light;
  const css = { ...base, bg: isDark ? base.bg : (PORTALS[key]?.frame || base.bg) };
  return { isDark, setIsDark, css };
}

// the CSS custom properties the stylesheet and the components read
export function themeVars(css, accent, isDark) {
  const sem = SEMANTIC[isDark ? "dark" : "light"];
  const v = {
    "--frame": css.bg, "--sheet": css.card, "--raised": css.subtle, "--active": css.active,
    "--border": css.border, "--rule": css.rule, "--control": css.control,
    "--ink": css.text, "--muted": css.textGray,
    "--accent": accent, "--accent-ink": isDark ? `color-mix(in srgb, ${accent} 55%, #fff)` : accent, "--accent-soft": `color-mix(in srgb, ${accent} ${isDark ? 22 : 10}%, transparent)`,
    "--positive": sem.positive, "--negative": sem.negative, "--warning": sem.warning,
    "--scrim": isDark ? "rgba(0,0,0,.6)" : "rgba(15,23,42,.45)",
    colorScheme: isDark ? "dark" : "light",
  };
  for (const [k, [bg, fg]] of Object.entries(sem.pill)) { v[`--pill-${k}-bg`] = bg; v[`--pill-${k}-fg`] = fg; }
  return v;
}

/* ---------- toasts ---------- */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);
  const showToast = useCallback((msg, type = "info") => {
    const n = ++id.current;
    setToasts(t => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== n)), 4200);
  }, []);
  const layer = <div className="mc-toasts" role="status" aria-live="polite">{toasts.map(t => <Toast key={t.id} toast={t}/>)}</div>;
  return { showToast, toastLayer: layer };
}

/* ---------- status colours (pills read CSS variables, so they follow the theme) ---------- */
const STATUS = {
  Scheduled:  { kind: "info",     label: "Scheduled" },
  Completed:  { kind: "positive", label: "Completed" },
  Cancelled:  { kind: "negative", label: "Cancelled" },
  Available:  { kind: "positive", label: "Available" },
  Busy:       { kind: "warning",  label: "Busy" },
  "On Leave": { kind: "negative", label: "On leave" },
};
export const statusColor = (s) => {
  const m = STATUS[s] || { kind: "neutral", label: s };
  return { bg: `var(--pill-${m.kind}-bg)`, fg: `var(--pill-${m.kind}-fg)`, label: m.label };
};

/* ---------- forms ---------- */
export const inputStyle = (css) => ({ width: "100%", minHeight: 34, padding: "7px 10px", border: `1px solid ${css.control}`, borderRadius: 6,
  background: css.inputBg, color: css.text, fontSize: 14, outline: "none", fontFamily: "inherit" });

// one stable pale tint per person or thing: identity, not data
export function identityTint(name = "") {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return { bg: `light-dark(hsl(${h} 55% 91%), hsl(${h} 30% 24%))`, fg: `light-dark(hsl(${h} 45% 26%), hsl(${h} 70% 82%))` };
}
