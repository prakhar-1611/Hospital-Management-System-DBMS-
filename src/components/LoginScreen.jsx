/* ============================================================
   LoginScreen.jsx — email + password, checked by POST /api/auth/login.
   onLogin(email, password) resolves to an error message or null.
   ============================================================ */
import { useState } from "react";
import { btnStyle } from "../constants";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email || !pass) { setError("Enter your email and password"); return; }
    setBusy(true); setError("");
    const msg = await onLogin(email.trim(), pass);
    setBusy(false);
    if (msg) setError(msg);
  }

  const input = { width:"100%",padding:13,border:"2px solid #e0e0e0",borderRadius:10,marginBottom:12,fontSize:14,outline:"none",color:"#1e2535",background:"white" };
  return (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#4361ee,#4cc9f0)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50000,padding:16,overflowY:"auto"}}>
      <form onSubmit={submit} style={{background:"rgba(255,255,255,.96)",padding:"clamp(24px, 6vw, 44px)",borderRadius:20,width:"min(400px, 100%)",textAlign:"center",boxShadow:"0 20px 40px rgba(0,0,0,.2)"}}>
        <div style={{fontSize:52,marginBottom:16}}>🏥</div>
        <h2 style={{marginBottom:6,color:"#1e2535"}}>MedCare OS</h2>
        <p style={{color:"#666",marginBottom:28,fontSize:14}}>Hospital Admin Portal</p>
        <input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}
          placeholder="admin@medcare.com" style={input}/>
        <input type="password" autoComplete="current-password" value={pass} onChange={e=>setPass(e.target.value)}
          placeholder="admin123" style={{...input,marginBottom:18}}/>
        {error && (
          <div role="alert" style={{marginBottom:14,padding:"10px 12px",background:"#fee2e2",color:"#991b1b",borderRadius:8,fontSize:13,textAlign:"left"}}>
            {error}
          </div>
        )}
        <button type="submit" disabled={busy}
          style={{...btnStyle,width:"100%",padding:13,fontSize:15,opacity:busy?0.7:1,cursor:busy?"wait":"pointer"}}>
          {busy ? "Signing in..." : "Access System"}
        </button>
        <p style={{marginTop:18,fontSize:12,color:"#888"}}>Admin accounts only. Seeded login: admin@medcare.com / admin123</p>
      </form>
    </div>
  );
}
