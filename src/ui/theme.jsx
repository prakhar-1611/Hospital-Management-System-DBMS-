/* ============================================================
   theme.jsx — portal names / accent colours, theme + toast hooks and
   shared style helpers (kept apart from kit.jsx so that file only
   exports components, which React fast refresh needs).
   ============================================================ */
import { useState, useRef, useCallback, useEffect } from "react";
import { light, dark } from "../constants";
import Toast from "../components/Toast";

// one name + accent colour per portal
export const PORTALS = {
  admin:   { name: "MedCare Admin Console", short: "Admin Console",  accent: "#4361ee", tint: "#eef2ff" },
  doctor:  { name: "MedCare Clinician Hub", short: "Clinician Hub",  accent: "#0f766e", tint: "#ccfbf1" },
  patient: { name: "MyMedCare",             short: "Patient Portal", accent: "#7c3aed", tint: "#ede9fe" },
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
  const css = isDark ? { ...dark, subtle: "#162032", ring: "rgba(255,255,255,.08)" }
                     : { ...light, subtle: "#f8fafc", ring: "rgba(15,23,42,.06)" };
  return { isDark, setIsDark, css };
}

/* ---------- toasts ---------- */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);
  const showToast = useCallback((msg, type = "info") => {
    const n = ++id.current;
    setToasts(t => [...t, { id: n, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== n)), 4000);
  }, []);
  const layer = <div className="mc-toasts">{toasts.map(t => <Toast key={t.id} toast={t}/>)}</div>;
  return { showToast, toastLayer: layer };
}

/* ---------- status colours ---------- */
const STATUS = {
  Scheduled:  { bg: "#dbeafe", fg: "#1e40af", label: "Scheduled" },
  Completed:  { bg: "#dcfce7", fg: "#166534", label: "Completed" },
  Cancelled:  { bg: "#fee2e2", fg: "#991b1b", label: "Cancelled" },
  Available:  { bg: "#dcfce7", fg: "#166534", label: "Available" },
  Busy:       { bg: "#fef3c7", fg: "#92400e", label: "Busy" },
  "On Leave": { bg: "#fee2e2", fg: "#991b1b", label: "On Leave" },
};
export const statusColor = (s) => STATUS[s] || { bg: "#e5e7eb", fg: "#374151", label: s };

/* ---------- forms ---------- */
export const inputStyle = (css) => ({ width: "100%", padding: "10px 12px", border: `1px solid ${css.border}`, borderRadius: 10,
  background: css.inputBg, color: css.text, fontSize: 13.5, outline: "none" });
