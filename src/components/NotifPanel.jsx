/* ============================================================
   NotifPanel.jsx
   Place this file at: src/components/NotifPanel.jsx
   ============================================================ */
import { useState } from "react";

export default function NotifPanel({ notifications, css, onMarkAll, onDismiss, onNav, onClearAll }) {
  const [tab, setTab] = useState("all");
  const typeIcon  = { alert:"🚨", success:"✅", info:"ℹ️", warning:"⚠️" };
  const typeColor = { alert:"#fee2e2", success:"#dcfce7", info:"#dbeafe", warning:"#fef9c3" };
  const typeText  = { alert:"#991b1b", success:"#166534", info:"#1e40af", warning:"#854d0e" };
  const typeLabel = { alert:"Alert", success:"Success", info:"Info", warning:"Warning" };

  const filtered = notifications.filter(n => {
    if (tab === "unread") return !n.read;
    if (tab === "alerts") return n.type === "alert" || n.type === "warning";
    return true;
  });
  const unread = notifications.filter(n => !n.read).length;
  const alerts = notifications.filter(n => n.type === "alert" || n.type === "warning").length;
  const tabs = [
    { id:"all",    label:"All",    count:notifications.length },
    { id:"unread", label:"Unread", count:unread },
    { id:"alerts", label:"Alerts", count:alerts },
  ];

  return (
    <div style={{position:"absolute",top:48,right:-10,width:380,background:css.card,borderRadius:14,boxShadow:"0 12px 36px rgba(0,0,0,.22)",border:`1px solid ${css.border}`,zIndex:1000,overflow:"hidden",animation:"menuSlide .2s ease"}}>
      <div style={{padding:"14px 16px 0",background:css.bg,borderBottom:`1px solid ${css.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <strong style={{fontSize:14,color:css.text}}>🔔 Notifications</strong>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onMarkAll} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#4361ee",fontWeight:600}}>Mark all read</button>
            <span style={{color:css.border}}>|</span>
            <button onClick={onClearAll} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#ef4444",fontWeight:600}}>Clear all</button>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{padding:"6px 12px",border:"none",background:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?"#4361ee":css.textGray,borderBottom:tab===t.id?"2px solid #4361ee":"2px solid transparent",transition:"all .15s"}}>
              {t.label}{t.count > 0 && <span style={{marginLeft:5,padding:"1px 6px",borderRadius:20,fontSize:10,background:tab===t.id?"#4361ee":"#e5e7eb",color:tab===t.id?"white":css.textGray}}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{maxHeight:400,overflowY:"auto"}}>
        {filtered.length === 0 && (
          <div style={{padding:32,textAlign:"center",color:css.textGray,fontSize:13}}>
            <div style={{fontSize:28,marginBottom:8}}>🎉</div>
            {tab === "unread" ? "All caught up!" : "No notifications"}
          </div>
        )}
        {filtered.map(n => (
          <div key={n.id} style={{padding:"12px 14px",borderBottom:`1px solid ${css.border}`,display:"flex",gap:10,background:n.read?"transparent":(css.bg+"cc")}}>
            <div style={{width:36,height:36,borderRadius:10,background:typeColor[n.type]||typeColor.info,color:typeText[n.type]||typeText.info,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{typeIcon[n.type]||"ℹ️"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                {!n.read && <span style={{width:7,height:7,borderRadius:"50%",background:"#4361ee",display:"inline-block",flexShrink:0}}/>}
                <span style={{fontSize:12,fontWeight:700,color:css.text}}>{n.title}</span>
                <span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:typeColor[n.type]||typeColor.info,color:typeText[n.type]||typeText.info,marginLeft:"auto",whiteSpace:"nowrap"}}>{typeLabel[n.type]||"Info"}</span>
              </div>
              <div style={{fontSize:11,color:css.textGray,lineHeight:1.5,marginBottom:4}}>{n.body}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:10,color:css.textGray}}>🕐 {n.time}</span>
                {n.nav && (
                  <button onClick={() => onNav(n.nav)}
                    style={{fontSize:11,fontWeight:600,color:"#4361ee",background:"#eef2ff",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>
                    Go → {n.nav.charAt(0).toUpperCase()+n.nav.slice(1)}
                  </button>
                )}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); onDismiss(n.id); }}
              style={{background:"none",border:"none",cursor:"pointer",color:css.textGray,fontSize:14,alignSelf:"flex-start",padding:"2px 4px"}}>✕</button>
          </div>
        ))}
      </div>
      {notifications.length > 0 && (
        <div style={{padding:"10px 16px",background:css.bg,borderTop:`1px solid ${css.border}`,textAlign:"center"}}>
          <span style={{fontSize:11,color:css.textGray}}>{notifications.length} total · {unread} unread</span>
        </div>
      )}
    </div>
  );
}
