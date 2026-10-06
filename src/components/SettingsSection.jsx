/* ============================================================
   SettingsSection.jsx
   Place this file at: src/components/SettingsSection.jsx
   ============================================================ */
import { useState } from "react";
import { btnStyle, btnOutlineStyle } from "../constants";

export default function SettingsSection({ darkMode, setDarkMode, css, showToast, onExport }) {
  const [hospName,    setHospName]    = useState("MedCare Nexus");
  const [adminEmail,  setAdminEmail]  = useState("admin@medcare.com");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts,   setSmsAlerts]   = useState(true);

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{background:css.card,padding:28,borderRadius:14,border:`1px solid ${css.border}`,maxWidth:600}}>
        <h3 style={{color:css.text,marginBottom:24}}>System Configuration</h3>

        {/* Appearance */}
        <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${css.border}`}}>
          <h4 style={{color:css.text,marginBottom:14,fontSize:15}}>Appearance</h4>
          <label style={{fontSize:12,color:css.textGray,display:"block",marginBottom:5}}>Interface Theme</label>
          <select value={darkMode?"dark":"light"} onChange={e => setDarkMode(e.target.value === "dark")}
            style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13}}>
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>

        {/* Hospital profile */}
        <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${css.border}`}}>
          <h4 style={{color:css.text,marginBottom:14,fontSize:15}}>Hospital Profile</h4>
          {[["Institution Name", hospName, setHospName], ["Admin Email", adminEmail, setAdminEmail]].map(([label, val, set]) => (
            <div key={label} style={{marginBottom:14}}>
              <label style={{fontSize:12,color:css.textGray,display:"block",marginBottom:5}}>{label}</label>
              <input value={val} onChange={e => set(e.target.value)}
                style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13,outline:"none"}}/>
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${css.border}`}}>
          <h4 style={{color:css.text,marginBottom:14,fontSize:15}}>Notifications</h4>
          {[[emailAlerts, setEmailAlerts, "Email Alerts"], [smsAlerts, setSmsAlerts, "SMS Alerts"]].map(([val, set, label]) => (
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:13,color:css.text}}>{label}</span>
              <div onClick={() => set(v => !v)}
                style={{width:42,height:22,borderRadius:20,background:val?"#4361ee":"#d1d5db",position:"relative",cursor:"pointer",transition:"background .25s"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:2,left:val?22:2,transition:"left .25s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
              </div>
            </div>
          ))}
        </div>

        {/* Data management */}
        <div style={{marginBottom:24}}>
          <h4 style={{color:css.text,marginBottom:14,fontSize:15}}>Data Management</h4>
          <button onClick={onExport}
            style={{...btnOutlineStyle(css),width:"100%",padding:12,fontSize:13,borderRadius:8,borderColor:"#4361ee",color:"#4361ee"}}>
            🗄 Export Database (JSON)
          </button>
        </div>

        <button onClick={() => showToast("Settings saved","success")}
          style={{...btnStyle,width:"100%",padding:13,fontSize:14}}>
          Save All Changes
        </button>
      </div>
    </div>
  );
}
