/* ============================================================
   Toast.jsx
   Place this file at: src/components/Toast.jsx
   ============================================================ */

export default function Toast({ toast }) {
  const colors = { success:"#22c55e", warning:"#f59e0b", info:"#4361ee", error:"#ef4444" };
  const icons  = { success:"✓", warning:"⚠", info:"ℹ", error:"✕" };
  return (
    <div style={{background:"white",padding:"14px 20px",borderRadius:10,marginBottom:10,boxShadow:"0 6px 18px rgba(0,0,0,.15)",borderLeft:`5px solid ${colors[toast.type]||colors.info}`,display:"flex",alignItems:"center",gap:12,animation:"slideIn .3s ease",minWidth:300,pointerEvents:"auto",color:"#1e2535"}}>
      <span style={{fontSize:16,color:colors[toast.type]||colors.info}}>{icons[toast.type]||"ℹ"}</span>
      <span style={{fontSize:13}}>{toast.msg}</span>
    </div>
  );
}
